import type {
  IRGradientLinearFill,
  IRGradientRadialFill,
  IRGradientStop
} from "../../types/ir"
import { parseCssColor } from "./color"

/**
 * Resolves all CSS var(...) references in a string using document/body computed styles
 */
export function resolveCssVariablesInString(str: string): string {
  if (!str || !str.includes("var(") || typeof document === "undefined") return str
  return str.replace(/var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g, (_, varName, fallback) => {
    try {
      const docEl = document.documentElement
      const val =
        window.getComputedStyle(docEl).getPropertyValue(varName)?.trim() ||
        (document.body ? window.getComputedStyle(document.body).getPropertyValue(varName)?.trim() : "")
      if (val) return val
    } catch {}
    return fallback ? fallback.trim() : ""
  })
}

/**
 * Parses any CSS linear-gradient(...) or radial-gradient(...) string into an IR gradient fill.
 */
export function parseCssGradient(
  gradientStr: string
): IRGradientLinearFill | IRGradientRadialFill | null {
  if (!gradientStr) return null
  let str = gradientStr.trim()
  if (str.includes("var(")) {
    str = resolveCssVariablesInString(str)
  }

  const allGradients = extractGradientStrings(str)
  if (allGradients.length > 0) {
    for (const g of allGradients) {
      const parsed = parseSingleGradient(g)
      if (parsed) return parsed
    }
  }

  return parseSingleGradient(str)
}

/**
 * Extracts all individual gradient function calls from a CSS background-image string
 */
export function extractGradientStrings(cssString: string): string[] {
  const gradients: string[] = []
  const regex = /(?:-webkit-)?(?:repeating-)?(?:linear|radial|conic)-gradient\(/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(cssString)) !== null) {
    const startIdx = match.index
    let depth = 0
    let endIdx = -1

    for (let i = startIdx; i < cssString.length; i++) {
      if (cssString[i] === "(") depth++
      else if (cssString[i] === ")") {
        depth--
        if (depth === 0) {
          endIdx = i + 1
          break
        }
      }
    }

    if (endIdx !== -1) {
      gradients.push(cssString.substring(startIdx, endIdx).trim())
      regex.lastIndex = endIdx
    } else {
      break
    }
  }

  return gradients
}

function parseSingleGradient(
  raw: string
): IRGradientLinearFill | IRGradientRadialFill | null {
  let str = raw.trim()
  if (str.includes("var(")) {
    str = resolveCssVariablesInString(str)
  }

  if (str.includes("linear-gradient(")) {
    return parseLinearGradient(str)
  }

  if (str.includes("radial-gradient(")) {
    return parseRadialGradient(str)
  }

  if (str.includes("conic-gradient(")) {
    return parseConicGradient(str)
  }

  return null
}

function parseLinearGradient(raw: string): IRGradientLinearFill | null {
  const openParen = raw.indexOf("(")
  const closeParen = raw.lastIndexOf(")")
  if (openParen === -1 || closeParen <= openParen) return null

  const content = raw.substring(openParen + 1, closeParen).trim()
  const parts = splitGradientParts(content)
  if (parts.length < 1) return null

  let angleDeg = 180 // Default CSS linear gradient is top-to-bottom (180deg)
  let stopStartIndex = 0

  const firstPart = parts[0].trim()
  if (isAngleOrDirection(firstPart)) {
    angleDeg = parseAngle(firstPart)
    stopStartIndex = 1
  }

  const stops = parseStops(parts.slice(stopStartIndex))
  if (stops.length < 2) {
    if (stops.length === 1) {
      stops.push({ position: 1, color: stops[0].color })
    } else {
      return null
    }
  }

  const transform = calculateLinearGradientTransform(angleDeg)

  return {
    type: "GRADIENT_LINEAR",
    gradientStops: stops,
    gradientTransform: transform,
    visible: true
  }
}

function parseRadialGradient(raw: string): IRGradientRadialFill | null {
  const openParen = raw.indexOf("(")
  const closeParen = raw.lastIndexOf(")")
  if (openParen === -1 || closeParen <= openParen) return null

  const content = raw.substring(openParen + 1, closeParen).trim()
  const parts = splitGradientParts(content)
  if (parts.length < 1) return null

  let stopStartIndex = 0
  let cx = 0.5
  let cy = 0.5

  const firstPart = parts[0].trim()
  if (isRadialDescriptor(firstPart)) {
    stopStartIndex = 1
    if (firstPart.includes("at ")) {
      const atPart = firstPart.split("at ")[1]?.trim()
      const posTokens = atPart ? atPart.split(/\s+/) : []
      const pos = parseRadialPosition(posTokens)
      cx = pos.cx
      cy = pos.cy
    }
  }

  const stops = parseStops(parts.slice(stopStartIndex))
  if (stops.length < 2) {
    if (stops.length === 1) {
      stops.push({ position: 1, color: stops[0].color })
    } else {
      return null
    }
  }

  const transform: [number, number, number, number, number, number] = [
    0.5, 0, 0, 0.5, cx, cy
  ]

  return {
    type: "GRADIENT_RADIAL",
    gradientStops: stops,
    gradientTransform: transform,
    visible: true
  }
}

function parseConicGradient(raw: string): IRGradientLinearFill | IRGradientRadialFill | null {
  const openParen = raw.indexOf("(")
  const closeParen = raw.lastIndexOf(")")
  if (openParen === -1 || closeParen <= openParen) return null

  const content = raw.substring(openParen + 1, closeParen).trim()
  const parts = splitGradientParts(content)
  if (parts.length < 1) return null

  let stopStartIndex = 0
  let cx = 0.5
  let cy = 0.5

  const firstPart = parts[0].trim()
  if (firstPart.includes("from ") || firstPart.includes("at ")) {
    stopStartIndex = 1
    if (firstPart.includes("at ")) {
      const atPart = firstPart.split("at ")[1]?.trim()
      const posTokens = atPart ? atPart.split(/\s+/) : []
      const pos = parseRadialPosition(posTokens)
      cx = pos.cx
      cy = pos.cy
    }
  }

  const stops = parseStops(parts.slice(stopStartIndex))
  if (stops.length < 2) {
    if (stops.length === 1) {
      stops.push({ position: 1, color: stops[0].color })
    } else {
      return null
    }
  }

  // Detect symmetrical / multi-lobe conic gradients (e.g. radar hub)
  // where stops at ~0 and ~0.5 (180deg) have prominent primary colors.
  const hasOppositeLobe = stops.some((s) => Math.abs(s.position - 0.5) < 0.08)
  if (hasOppositeLobe && stops.length >= 4) {
    // Map the 0..0.5 half-circle sweep to a clean 0..1 top-to-bottom linear gradient
    const firstHalfStops = stops.filter((s) => s.position <= 0.55)
    if (firstHalfStops.length >= 2) {
      const linearStops: IRGradientStop[] = firstHalfStops.map((s) => ({
        position: Math.min(1, Math.max(0, Math.round(s.position * 2 * 1000) / 1000)),
        color: s.color
      }))
      if (linearStops[0].position > 0) {
        linearStops.unshift({ position: 0, color: linearStops[0].color })
      }
      if (linearStops[linearStops.length - 1].position < 1) {
        const lastColor = stops.find((s) => Math.abs(s.position - 0.5) < 0.08)?.color || linearStops[linearStops.length - 1].color
        linearStops.push({ position: 1, color: lastColor })
      }
      return {
        type: "GRADIENT_LINEAR",
        gradientStops: linearStops,
        gradientTransform: [0, 1, 0, 0, 0, 0], // x1=0%, y1=0%, x2=0%, y2=100% (top to bottom)
        visible: true
      }
    }
  }

  return {
    type: "GRADIENT_RADIAL",
    gradientStops: stops,
    gradientTransform: [0.5, 0, 0, 0.5, cx, cy],
    visible: true
  }
}

function isRadialDescriptor(firstPart: string): boolean {
  const s = firstPart.trim().toLowerCase()
  if (
    s.includes("at ") ||
    s.includes("circle") ||
    s.includes("ellipse") ||
    s.includes("closest-side") ||
    s.includes("farthest-side") ||
    s.includes("closest-corner") ||
    s.includes("farthest-corner") ||
    s.startsWith("in ")
  ) {
    return true
  }

  const cleanFirst = s.replace(/\s+(-?\d+(?:\.\d+)?%|-?\d+(?:\.\d+)?px).*/, "").trim()
  const color = parseCssColor(cleanFirst)
  return color === null
}

function parseRadialPosition(tokens: string[]): { cx: number; cy: number } {
  if (tokens.length === 0) return { cx: 0.5, cy: 0.5 }

  let cx = 0.5
  let cy = 0.5

  if (tokens.length === 1) {
    const t = tokens[0].toLowerCase()
    if (t === "top") { cx = 0.5; cy = 0 }
    else if (t === "bottom") { cx = 0.5; cy = 1 }
    else if (t === "left") { cx = 0.5; cy = 0.5 }
    else if (t === "right") { cx = 1; cy = 0.5 }
    else if (t === "center") { cx = 0.5; cy = 0.5 }
    else if (t.endsWith("%")) { cx = parseFloat(t) / 100; cy = 0.5 }
    return { cx, cy }
  }

  const t0 = tokens[0].toLowerCase()
  const t1 = tokens[1].toLowerCase()

  const isYKeyword = (k: string) => k === "top" || k === "bottom"
  const isXKeyword = (k: string) => k === "left" || k === "right"

  if (isYKeyword(t0) && (isXKeyword(t1) || t1 === "center")) {
    cy = t0 === "top" ? 0 : 1
    cx = t1 === "left" ? 0 : t1 === "right" ? 1 : 0.5
  } else if (isXKeyword(t0) && (isYKeyword(t1) || t1 === "center")) {
    cx = t0 === "left" ? 0 : 1
    cy = t1 === "top" ? 0 : t1 === "bottom" ? 1 : 0.5
  } else {
    cx = parseCoord(t0, 0.5)
    cy = parseCoord(t1, 0.5)
  }

  return { cx, cy }
}

function parseCoord(token: string, defaultVal: number): number {
  if (token === "left" || token === "top") return 0
  if (token === "right" || token === "bottom") return 1
  if (token === "center") return 0.5
  if (token.endsWith("%")) return parseFloat(token) / 100
  if (token.endsWith("px")) return parseFloat(token) / 100
  const num = parseFloat(token)
  return isNaN(num) ? defaultVal : num
}

function parseStopPosition(posStr: string | undefined): number | undefined {
  if (!posStr) return undefined
  const s = posStr.trim().toLowerCase()
  if (s.endsWith("%")) {
    const val = parseFloat(s)
    return isNaN(val) ? undefined : Math.min(1, Math.max(0, val / 100))
  }
  if (s.endsWith("deg")) {
    const deg = parseFloat(s)
    if (isNaN(deg)) return undefined
    return Math.min(1, Math.max(0, deg / 360))
  }
  if (s.endsWith("turn")) {
    const turn = parseFloat(s)
    if (isNaN(turn)) return undefined
    return Math.min(1, Math.max(0, turn))
  }
  if (s.endsWith("rad")) {
    const rad = parseFloat(s)
    if (isNaN(rad)) return undefined
    return Math.min(1, Math.max(0, (rad * 180 / Math.PI) / 360))
  }
  if (s.endsWith("grad")) {
    const grad = parseFloat(s)
    if (isNaN(grad)) return undefined
    return Math.min(1, Math.max(0, grad / 400))
  }
  return undefined
}

function parseStops(stopStrings: string[]): IRGradientStop[] {
  const validStopStrings = stopStrings.filter((s) => {
    const t = s.trim().toLowerCase()
    if (t.startsWith("in ") || t === "oklab" || t === "oklch" || t === "srgb") return false
    if (/^-?\d+(?:\.\d+)?(%|px|deg|turn|rad|grad)$/i.test(t)) return false
    return true
  })

  const rawStops: Array<{ colorStr: string; pos?: number }> = []

  for (const s of validStopStrings) {
    const trimmed = s.trim()
    if (!trimmed) continue

    const posMatch = trimmed.match(
      /\s+(-?\d+(?:\.\d+)?(?:%|px|deg|turn|rad|grad))(?:\s+(-?\d+(?:\.\d+)?(?:%|px|deg|turn|rad|grad)))?$/i
    )

    if (posMatch && posMatch.index !== undefined) {
      const colorPart = trimmed.slice(0, posMatch.index).trim()
      const pos1Str = posMatch[1]
      const pos2Str = posMatch[2]

      const pos1 = parseStopPosition(pos1Str)
      rawStops.push({ colorStr: colorPart, pos: pos1 })

      if (pos2Str) {
        const pos2 = parseStopPosition(pos2Str)
        rawStops.push({ colorStr: colorPart, pos: pos2 })
      }
    } else {
      rawStops.push({ colorStr: trimmed })
    }
  }

  if (rawStops.length === 0) return []

  const result: IRGradientStop[] = []
  const n = rawStops.length

  for (let i = 0; i < n; i++) {
    const item = rawStops[i]
    const color = parseCssColor(item.colorStr) || { r: 0, g: 0, b: 0, a: 1 }
    let position = item.pos

    if (position === undefined) {
      if (i === 0) position = 0
      else if (i === n - 1) position = 1
      else {
        let prevPos = 0
        let prevIdx = 0
        for (let p = i - 1; p >= 0; p--) {
          if (rawStops[p].pos !== undefined) {
            prevPos = rawStops[p].pos!
            prevIdx = p
            break
          }
        }
        let nextPos = 1
        let nextIdx = n - 1
        for (let next = i + 1; next < n; next++) {
          if (rawStops[next].pos !== undefined) {
            nextPos = rawStops[next].pos!
            nextIdx = next
            break
          }
        }
        position =
          prevPos +
          ((nextPos - prevPos) * (i - prevIdx)) / Math.max(1, nextIdx - prevIdx)
      }
    }

    result.push({
      position: Math.min(1, Math.max(0, Math.round(position * 1000) / 1000)),
      color
    })
  }

  return result
}

function isAngleOrDirection(str: string): boolean {
  const s = str.trim().toLowerCase()
  return (
    s.includes("deg") ||
    s.includes("rad") ||
    s.includes("turn") ||
    s.includes("grad") ||
    s.startsWith("to ") ||
    s.includes("in oklch") ||
    s.includes("in oklab") ||
    s.includes("in srgb") ||
    s === "top" ||
    s === "bottom" ||
    s === "left" ||
    s === "right" ||
    s === "top left" ||
    s === "left top" ||
    s === "top right" ||
    s === "right top" ||
    s === "bottom left" ||
    s === "left bottom" ||
    s === "bottom right" ||
    s === "right bottom"
  )
}

function parseAngle(str: string): number {
  const s = str.trim().toLowerCase()

  const degMatch = s.match(/(-?\d+(?:\.\d+)?)\s*deg/)
  if (degMatch) {
    const val = parseFloat(degMatch[1])
    return ((val % 360) + 360) % 360
  }

  const radMatch = s.match(/(-?\d+(?:\.\d+)?)\s*rad/)
  if (radMatch) {
    const val = (parseFloat(radMatch[1]) * 180) / Math.PI
    return ((val % 360) + 360) % 360
  }

  const turnMatch = s.match(/(-?\d+(?:\.\d+)?)\s*turn/)
  if (turnMatch) {
    const val = parseFloat(turnMatch[1]) * 360
    return ((val % 360) + 360) % 360
  }

  if (s.includes("to ")) {
    const cleanDir = s.split("to ")[1]?.split(" in ")[0]?.trim() || ""
    switch (cleanDir) {
      case "top":
        return 0
      case "right top":
      case "top right":
        return 45
      case "right":
        return 90
      case "right bottom":
      case "bottom right":
        return 135
      case "bottom":
        return 180
      case "left bottom":
      case "bottom left":
        return 225
      case "left":
        return 270
      case "left top":
      case "top left":
        return 315
    }
  }

  if (s === "left") return 90
  if (s === "right") return 270
  if (s === "top") return 180
  if (s === "bottom") return 0

  return 180
}

function calculateLinearGradientTransform(
  angleDeg: number
): [number, number, number, number, number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const startX = 0.5 - 0.5 * cos
  const startY = 0.5 - 0.5 * sin

  const a = Math.round(cos * 1000) / 1000
  const b = Math.round(sin * 1000) / 1000
  const c = Math.round(-sin * 1000) / 1000
  const d = Math.round(cos * 1000) / 1000
  const tx = Math.round(startX * 1000) / 1000
  const ty = Math.round(startY * 1000) / 1000

  return [a, b, c, d, tx, ty]
}

function splitGradientParts(content: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""

  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (c === "(") depth++
    else if (c === ")") depth--

    if (c === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}
