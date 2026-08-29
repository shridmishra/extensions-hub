import type { IREffect } from "../../types/ir"
import { parseCssColor } from "./color"

/**
 * Parses CSS box-shadow or text-shadow string into IREffect[]
 */
export function parseCssBoxShadow(shadowStr: string | null | undefined): IREffect[] {
  if (!shadowStr || shadowStr === "none") return []

  const shadows = splitShadowString(shadowStr)
  const effects: IREffect[] = []

  for (const item of shadows) {
    const effect = parseSingleShadow(item)
    if (effect) effects.push(effect)
  }

  return effects
}

export function parseCssTextShadow(shadowStr: string | null | undefined): IREffect[] {
  if (!shadowStr || shadowStr === "none") return []

  const shadows = splitShadowString(shadowStr)
  const effects: IREffect[] = []

  for (const item of shadows) {
    const effect = parseSingleShadow(item, true)
    if (effect) effects.push(effect)
  }

  return effects
}

/**
 * Parses CSS filter drop-shadow(...) expressions
 */
export function parseCssFilterDropShadow(filterStr: string | null | undefined): IREffect[] {
  if (!filterStr || filterStr === "none") return []

  const effects: IREffect[] = []
  const regex = /drop-shadow\(([^)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(filterStr)) !== null) {
    if (match[1]) {
      const effect = parseSingleShadow(match[1])
      if (effect) effects.push(effect)
    }
  }

  return effects
}

function parseSingleShadow(raw: string, isText = false): IREffect | null {
  let str = raw.trim()
  const isInset = !isText && /\binset\b/i.test(str)
  if (isInset) {
    str = str.replace(/\binset\b/i, "").trim()
  }

  let colorStr = "rgba(0, 0, 0, 0.15)"
  let lengthsPart = str

  const funcStartMatch = str.match(/^[a-zA-Z-]+\([^)]+\)/)
  if (funcStartMatch) {
    colorStr = funcStartMatch[0]
    lengthsPart = str.substring(colorStr.length).trim()
  } else if (str.startsWith("#")) {
    const hexMatch = str.match(/^#[a-fA-F0-9]+/)
    if (hexMatch) {
      colorStr = hexMatch[0]
      lengthsPart = str.substring(colorStr.length).trim()
    }
  } else {
    const funcEndMatch = str.match(/[a-zA-Z-]+\([^)]+\)$/)
    if (funcEndMatch) {
      colorStr = funcEndMatch[0]
      lengthsPart = str.substring(0, str.length - colorStr.length).trim()
    } else {
      const hexEndMatch = str.match(/#[a-fA-F0-9]+$/)
      if (hexEndMatch) {
        colorStr = hexEndMatch[0]
        lengthsPart = str.substring(0, str.length - colorStr.length).trim()
      } else {
        const tokens = str.split(/\s+/)
        if (tokens.length >= 3) {
          const firstToken = tokens[0]
          const lastToken = tokens[tokens.length - 1]
          if (/^[a-zA-Z]+$/.test(firstToken) && isNaN(parseFloat(firstToken))) {
            colorStr = firstToken
            lengthsPart = tokens.slice(1).join(" ")
          } else if (/^[a-zA-Z]+$/.test(lastToken) && isNaN(parseFloat(lastToken))) {
            colorStr = lastToken
            lengthsPart = tokens.slice(0, -1).join(" ")
          }
        }
      }
    }
  }

  const lengthTokens = lengthsPart.split(/\s+/).filter(Boolean)
  if (lengthTokens.length < 2) return null

  const x = parseFloat(lengthTokens[0]) || 0
  const y = parseFloat(lengthTokens[1]) || 0
  const blur = lengthTokens[2] ? parseFloat(lengthTokens[2]) || 0 : 0
  const spread = lengthTokens[3] ? parseFloat(lengthTokens[3]) || 0 : 0

  const parsedColor = parseCssColor(colorStr) || { r: 0, g: 0, b: 0, a: 0.15 }

  return {
    type: isInset ? "INNER_SHADOW" : "DROP_SHADOW",
    color: parsedColor,
    offset: { x, y },
    radius: Math.max(0, blur),
    spread: isInset ? undefined : spread,
    visible: true
  }
}

function splitShadowString(str: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ""

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === "(") depth++
    else if (c === ")") depth--

    if (c === "," && depth === 0) {
      if (current.trim()) result.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  if (current.trim()) result.push(current.trim())
  return result
}
