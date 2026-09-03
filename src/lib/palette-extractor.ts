import type {
  ColorRole,
  ExtractedColorItem,
  PagePaletteSummary,
  PaletteSortBy
} from "../types/palette.ts"
import { getColorName } from "./color-names.ts"
import { hexToHslObject, rgbToHex } from "./colors.ts"

/**
 * Standard named colors to hex mapping
 */
const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF0000",
  green: "#008000",
  lime: "#00FF00",
  blue: "#0000FF",
  yellow: "#FFFF00",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  gray: "#808080",
  grey: "#808080",
  silver: "#C0C0C0",
  maroon: "#800000",
  olive: "#808000",
  purple: "#800080",
  teal: "#008080",
  navy: "#000080",
  orange: "#FFA500",
  pink: "#FFC0CB"
}

export interface ParsedColorResult {
  hex: string
  rgb: string
  hsl: string
  luminance: number
  hue: number
  alpha: number
}

/**
 * Computes standard WCAG relative luminance (0 to 1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return Number((0.2126 * rs + 0.7152 * gs + 0.0722 * bs).toFixed(4))
}

/**
 * Normalizes any CSS color string to structured ParsedColorResult
 */
export function parseCssColor(colorStr: string): ParsedColorResult | null {
  if (!colorStr || typeof colorStr !== "string") return null
  const trimmed = colorStr.trim().toLowerCase()

  if (trimmed === "transparent" || trimmed === "inherit" || trimmed === "initial" || trimmed === "unset" || trimmed === "currentcolor") {
    return null
  }

  let r = 0
  let g = 0
  let b = 0
  let alpha = 1

  // 1. Named color
  if (NAMED_COLORS[trimmed]) {
    const hex = NAMED_COLORS[trimmed]
    const rVal = parseInt(hex.slice(1, 3), 16)
    const gVal = parseInt(hex.slice(3, 5), 16)
    const bVal = parseInt(hex.slice(5, 7), 16)
    r = rVal
    g = gVal
    b = bVal
  }
  // 2. Hex
  else if (trimmed.startsWith("#")) {
    const clean = trimmed.replace("#", "")
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16)
      g = parseInt(clean[1] + clean[1], 16)
      b = parseInt(clean[2] + clean[2], 16)
    } else if (clean.length === 4) {
      r = parseInt(clean[0] + clean[0], 16)
      g = parseInt(clean[1] + clean[1], 16)
      b = parseInt(clean[2] + clean[2], 16)
      alpha = parseInt(clean[3] + clean[3], 16) / 255
    } else if (clean.length === 6) {
      r = parseInt(clean.slice(0, 2), 16)
      g = parseInt(clean.slice(2, 4), 16)
      b = parseInt(clean.slice(4, 6), 16)
    } else if (clean.length === 8) {
      r = parseInt(clean.slice(0, 2), 16)
      g = parseInt(clean.slice(2, 4), 16)
      b = parseInt(clean.slice(4, 6), 16)
      alpha = parseInt(clean.slice(6, 8), 16) / 255
    } else {
      return null
    }
  }
  // 3. rgb / rgba
  else if (trimmed.startsWith("rgb")) {
    const match = trimmed.match(/^rgba?\(\s*([^\)]+)\s*\)$/i)
    if (!match) return null
    const parts = match[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null

    const parseCh = (val: string) => (val.endsWith("%") ? Math.round((parseFloat(val) / 100) * 255) : parseFloat(val))
    r = Math.max(0, Math.min(255, parseCh(parts[0])))
    g = Math.max(0, Math.min(255, parseCh(parts[1])))
    b = Math.max(0, Math.min(255, parseCh(parts[2])))
    if (parts.length >= 4) {
      alpha = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
      alpha = Math.max(0, Math.min(1, alpha))
    }
  }
  // 4. hsl / hsla
  else if (trimmed.startsWith("hsl")) {
    const match = trimmed.match(/^hsla?\(\s*([^\)]+)\s*\)$/i)
    if (!match) return null
    const parts = match[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null

    const h = ((parseFloat(parts[0]) % 360) + 360) % 360
    const s = parseFloat(parts[1].replace("%", "")) / 100
    const l = parseFloat(parts[2].replace("%", "")) / 100
    if (parts.length >= 4) {
      alpha = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
      alpha = Math.max(0, Math.min(1, alpha))
    }

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r1 = 0, g1 = 0, b1 = 0
    if (h < 60) { r1 = c; g1 = x; b1 = 0 }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0 }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c }
    else { r1 = c; g1 = 0; b1 = x }

    r = Math.round((r1 + m) * 255)
    g = Math.round((g1 + m) * 255)
    b = Math.round((b1 + m) * 255)
  } else {
    return null
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(alpha)) return null
  if (alpha <= 0.02) return null // Filter out fully transparent colors

  const hex = rgbToHex(r, g, b)
  const rgb = `rgb(${r}, ${g}, ${b})`
  const hslObj = hexToHslObject(hex)
  const hsl = `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`
  const luminance = getRelativeLuminance(r, g, b)

  return {
    hex,
    rgb,
    hsl,
    luminance,
    hue: hslObj.h,
    alpha
  }
}

/**
 * Checks if an element is a CTA / interactive button / primary action
 */
export function isCtaElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase()
  if (tag === "button") return true

  const role = element.getAttribute("role")
  if (role === "button" || role === "tab" || role === "menuitem") return true

  if (tag === "input") {
    const inputType = (element as HTMLInputElement).type?.toLowerCase()
    if (["submit", "button", "reset"].includes(inputType)) return true
  }

  if (tag === "a") {
    const className = String(element.className || "").toLowerCase()
    if (
      className.includes("btn") ||
      className.includes("button") ||
      className.includes("cta") ||
      className.includes("action") ||
      className.includes("primary")
    ) {
      return true
    }
  }

  return false
}

/**
 * Extract gradient colors from background-image
 */
function extractGradientColors(bgImage: string): string[] {
  if (!bgImage || bgImage === "none" || !bgImage.includes("gradient")) return []
  const matches = bgImage.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8})/gi) || []
  return matches
}

/**
 * Checks if element has actual rendered text
 */
function hasTextContent(element: HTMLElement): boolean {
  // If element has direct text nodes or text content
  const text = element.innerText || element.textContent || ""
  if (text.trim().length > 0) return true
  if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "label", "li", "td", "th", "input", "textarea", "code", "b", "strong", "em", "i"].includes(element.tagName.toLowerCase())) {
    return true
  }
  return false
}

/**
 * Scans the active webpage and extracts categorized colors by role
 */
export function scanPagePalette(): PagePaletteSummary {
  if (typeof document === "undefined") {
    return {
      allColors: [],
      bgColors: [],
      textColors: [],
      borderColors: [],
      ctaColors: [],
      totalUniqueColors: 0,
      totalUsages: 0
    }
  }

  const colorMap = new Map<string, {
    parsed: ParsedColorResult
    name: string
    totalCount: number
    roleCounts: { bg: number; text: number; border: number; cta: number }
    roles: Set<ColorRole>
    elementTags: Set<string>
  }>()

  function registerColor(rawColor: string, role: ColorRole, element: HTMLElement) {
    const parsed = parseCssColor(rawColor)
    if (!parsed) return

    const key = parsed.hex.toUpperCase()
    let entry = colorMap.get(key)
    if (!entry) {
      entry = {
        parsed,
        name: getColorName(key),
        totalCount: 0,
        roleCounts: { bg: 0, text: 0, border: 0, cta: 0 },
        roles: new Set<ColorRole>(),
        elementTags: new Set<string>()
      }
      colorMap.set(key, entry)
    }

    entry.totalCount++
    entry.roleCounts[role]++
    entry.roles.add(role)
    if (entry.elementTags.size < 6) {
      entry.elementTags.add(element.tagName.toLowerCase())
    }
  }

  // Scan body and root
  if (document.body) {
    const bodyStyle = window.getComputedStyle(document.body)
    if (bodyStyle.backgroundColor) {
      registerColor(bodyStyle.backgroundColor, "bg", document.body)
    }
    if (bodyStyle.color) {
      registerColor(bodyStyle.color, "text", document.body)
    }
  }

  // Scan all visible DOM elements
  const elements = document.querySelectorAll("body *")
  const maxElements = 1200 // Performance bound
  const len = Math.min(elements.length, maxElements)

  for (let i = 0; i < len; i++) {
    const el = elements[i] as HTMLElement
    if (!el || !(el instanceof HTMLElement)) continue

    // Skip extension hub shadow root or extensions UI
    if (el.closest(".hub-extension-root")) continue

    // Skip hidden or collapsed elements
    if (el.offsetWidth === 0 && el.offsetHeight === 0 && !el.getClientRects().length) {
      continue
    }

    const style = window.getComputedStyle(el)
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      continue
    }

    const isCta = isCtaElement(el)

    // 1. Background Color
    if (style.backgroundColor) {
      registerColor(style.backgroundColor, "bg", el)
      if (isCta) {
        registerColor(style.backgroundColor, "cta", el)
      }
    }

    // Gradient Backgrounds
    if (style.backgroundImage && style.backgroundImage.includes("gradient")) {
      const gradientColors = extractGradientColors(style.backgroundImage)
      for (const gColor of gradientColors) {
        registerColor(gColor, "bg", el)
        if (isCta) {
          registerColor(gColor, "cta", el)
        }
      }
    }

    // 2. Text Color
    if (hasTextContent(el) && style.color) {
      registerColor(style.color, "text", el)
      if (isCta) {
        registerColor(style.color, "cta", el)
      }
    }

    // 3. Border Color
    const topW = parseFloat(style.borderTopWidth || "0")
    const rightW = parseFloat(style.borderRightWidth || "0")
    const bottomW = parseFloat(style.borderBottomWidth || "0")
    const leftW = parseFloat(style.borderLeftWidth || "0")
    const outlineW = parseFloat(style.outlineWidth || "0")

    if (topW > 0 || rightW > 0 || bottomW > 0 || leftW > 0) {
      if (style.borderColor) {
        registerColor(style.borderColor, "border", el)
        if (isCta) {
          registerColor(style.borderColor, "cta", el)
        }
      }
    }

    if (outlineW > 0 && style.outlineColor) {
      registerColor(style.outlineColor, "border", el)
      if (isCta) {
        registerColor(style.outlineColor, "cta", el)
      }
    }

    // Inset or border box-shadow colors
    if (style.boxShadow && style.boxShadow !== "none") {
      const shadowColors = style.boxShadow.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8})/gi) || []
      for (const sColor of shadowColors) {
        registerColor(sColor, "border", el)
      }
    }
  }

  // Convert map to ExtractedColorItem array
  const allList: ExtractedColorItem[] = []
  let totalUsages = 0

  colorMap.forEach((entry) => {
    totalUsages += entry.totalCount
    allList.push({
      hex: entry.parsed.hex,
      name: entry.name,
      rgb: entry.parsed.rgb,
      hsl: entry.parsed.hsl,
      luminance: entry.parsed.luminance,
      hue: entry.parsed.hue,
      totalCount: entry.totalCount,
      roles: Array.from(entry.roles),
      roleCounts: entry.roleCounts,
      elementTags: Array.from(entry.elementTags)
    })
  })

  // Sort overall by frequency count descending
  allList.sort((a, b) => b.totalCount - a.totalCount)

  const bgColors = allList
    .filter((c) => c.roleCounts.bg > 0)
    .sort((a, b) => b.roleCounts.bg - a.roleCounts.bg)

  const textColors = allList
    .filter((c) => c.roleCounts.text > 0)
    .sort((a, b) => b.roleCounts.text - a.roleCounts.text)

  const borderColors = allList
    .filter((c) => c.roleCounts.border > 0)
    .sort((a, b) => b.roleCounts.border - a.roleCounts.border)

  const ctaColors = allList
    .filter((c) => c.roleCounts.cta > 0)
    .sort((a, b) => b.roleCounts.cta - a.roleCounts.cta)

  const primaryBg = bgColors[0]?.hex
  const primaryText = textColors[0]?.hex

  return {
    allColors: allList,
    bgColors,
    textColors,
    borderColors,
    ctaColors,
    totalUniqueColors: allList.length,
    totalUsages,
    primaryBg,
    primaryText
  }
}

/**
 * Sorts color list by frequency, luminance, or hue
 */
export function sortPaletteColors(
  colors: ExtractedColorItem[],
  sortBy: PaletteSortBy
): ExtractedColorItem[] {
  const copy = [...colors]
  if (sortBy === "frequency") {
    return copy.sort((a, b) => b.totalCount - a.totalCount)
  }
  if (sortBy === "luminance") {
    return copy.sort((a, b) => b.luminance - a.luminance)
  }
  if (sortBy === "hue") {
    return copy.sort((a, b) => a.hue - b.hue)
  }
  return copy
}

/**
 * Formats colors as simple HEX list
 */
export function formatPaletteAsHexList(colors: ExtractedColorItem[]): string {
  return colors.map((c) => c.hex).join("\n")
}

/**
 * Formats colors as Tailwind CSS Theme color config
 */
export function formatPaletteAsTailwind(colors: ExtractedColorItem[]): string {
  const sanitizeKey = (name: string, hex: string, idx: number) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return slug ? `${slug}-${idx + 1}` : `color-${hex.replace("#", "").toLowerCase()}`
  }

  const lines = colors.map((c, idx) => `    "${sanitizeKey(c.name, c.hex, idx)}": "${c.hex}",`)
  return `// Tailwind CSS Theme Colors\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join("\n")}\n      }\n    }\n  }\n}`
}

/**
 * Formats colors as standard CSS variables (:root)
 */
export function formatPaletteAsCssVariables(colors: ExtractedColorItem[]): string {
  const sanitizeKey = (name: string, idx: number) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return slug ? `${slug}-${idx + 1}` : `color-${idx + 1}`
  }

  const lines = colors.map((c, idx) => `  --color-${sanitizeKey(c.name, idx)}: ${c.hex}; /* ${c.rgb} - ${c.totalCount} uses */`)
  return `:root {\n${lines.join("\n")}\n}`
}

/**
 * Formats palette summary as JSON
 */
export function formatPaletteAsJson(summary: PagePaletteSummary): string {
  return JSON.stringify(
    {
      totalUniqueColors: summary.totalUniqueColors,
      totalUsages: summary.totalUsages,
      primaryBackground: summary.primaryBg,
      primaryText: summary.primaryText,
      colors: summary.allColors.map((c) => ({
        hex: c.hex,
        name: c.name,
        rgb: c.rgb,
        hsl: c.hsl,
        luminance: c.luminance,
        roles: c.roles,
        usages: c.totalCount,
        roleBreakdown: c.roleCounts,
        elements: c.elementTags
      }))
    },
    null,
    2
  )
}

/**
 * Highlight elements on page matching a specific hex color
 */
export function highlightElementsByHex(hex: string, role?: ColorRole): number {
  if (typeof document === "undefined") return 0
  clearHighlightOverlays()

  const normalizedTargetHex = hex.toUpperCase()
  const elements = document.querySelectorAll("body *")
  let matchedCount = 0

  const container = document.createElement("div")
  container.id = "hub-color-palette-highlight-layer"
  container.style.position = "fixed"
  container.style.top = "0"
  container.style.left = "0"
  container.style.width = "100vw"
  container.style.height = "100vh"
  container.style.pointerEvents = "none"
  container.style.zIndex = "2147483640"
  document.body.appendChild(container)

  let firstElementRect: DOMRect | null = null

  const len = Math.min(elements.length, 800)
  for (let i = 0; i < len; i++) {
    const el = elements[i] as HTMLElement
    if (!el || !(el instanceof HTMLElement)) continue
    if (el.closest(".hub-extension-root") || el.closest("#hub-color-palette-highlight-layer")) continue

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) continue

    const style = window.getComputedStyle(el)
    let isMatch = false

    if (!role || role === "bg" || role === "cta") {
      const parsedBg = parseCssColor(style.backgroundColor)
      if (parsedBg && parsedBg.hex === normalizedTargetHex) isMatch = true
    }

    if (!isMatch && (!role || role === "text" || role === "cta")) {
      const parsedText = parseCssColor(style.color)
      if (parsedText && parsedText.hex === normalizedTargetHex && hasTextContent(el)) isMatch = true
    }

    if (!isMatch && (!role || role === "border" || role === "cta")) {
      const parsedBorder = parseCssColor(style.borderColor)
      if (parsedBorder && parsedBorder.hex === normalizedTargetHex) isMatch = true
    }

    if (isMatch) {
      matchedCount++
      if (!firstElementRect) {
        firstElementRect = rect
      }

      const box = document.createElement("div")
      box.style.position = "fixed"
      box.style.top = `${rect.top}px`
      box.style.left = `${rect.left}px`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`
      box.style.outline = `2px solid ${normalizedTargetHex}`
      box.style.backgroundColor = `${normalizedTargetHex}22`
      box.style.borderRadius = "3px"
      box.style.boxShadow = `0 0 12px ${normalizedTargetHex}88`
      box.style.pointerEvents = "none"
      box.style.transition = "all 0.15s ease-out"
      container.appendChild(box)
    }
  }

  // Scroll into view if first element is outside viewport
  if (firstElementRect) {
    const isVisible =
      firstElementRect.top >= 0 &&
      firstElementRect.bottom <= window.innerHeight &&
      firstElementRect.left >= 0 &&
      firstElementRect.right <= window.innerWidth
    if (!isVisible) {
      window.scrollBy({ top: firstElementRect.top - 120, behavior: "smooth" })
    }
  }

  return matchedCount
}

/**
 * Remove all active highlight overlays from the page
 */
export function clearHighlightOverlays(): void {
  if (typeof document === "undefined") return
  const layer = document.getElementById("hub-color-palette-highlight-layer")
  if (layer) layer.remove()
}
