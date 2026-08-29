/**
 * Color Detector & Validator
 * 
 * Enforces strict color constraints: ONLY pure black and pure white are valid.
 * Any other colors (red, green, UI pop-up background/accent colors, grays, blues, etc.)
 * are detected and rejected.
 */

export interface ParsedRgba {
  r: number // 0 - 255
  g: number // 0 - 255
  b: number // 0 - 255
  a: number // 0 - 1
}

export interface ColorValidationResult {
  isValid: boolean
  isBlack: boolean
  isWhite: boolean
  color: string
  normalizedHex?: string
  reason?: string
}

export interface BatchValidationResult {
  passed: boolean
  totalChecked: number
  validCount: number
  failedCount: number
  offendingColors: string[]
  validColors: string[]
}

/**
 * Standard CSS color names mapped to hex for quick lookup
 */
const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  lime: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  purple: "#800080",
  teal: "#008080",
  navy: "#000080",
  orange: "#ffa500",
  pink: "#ffc0cb"
}

/**
 * Parses a color string (hex, rgb, rgba, hsl, hsla, or named color) into RGBA values.
 */
export function parseColorToRgba(input: string): ParsedRgba | null {
  if (!input || typeof input !== "string") return null
  const trimmed = input.trim().toLowerCase()

  // 1. Named colors
  if (NAMED_COLORS[trimmed]) {
    return parseHexToRgba(NAMED_COLORS[trimmed])
  }

  // 2. Hex formats: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (trimmed.startsWith("#")) {
    return parseHexToRgba(trimmed)
  }

  // 3. rgb / rgba formats
  if (trimmed.startsWith("rgb")) {
    return parseRgbString(trimmed)
  }

  // 4. hsl / hsla formats
  if (trimmed.startsWith("hsl")) {
    return parseHslString(trimmed)
  }

  return null
}

function parseHexToRgba(hex: string): ParsedRgba | null {
  const clean = hex.replace("#", "")
  let r = 0
  let g = 0
  let b = 0
  let a = 1

  if (clean.length === 3) {
    // #RGB
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
  } else if (clean.length === 4) {
    // #RGBA
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
    a = Math.round((parseInt(clean[3] + clean[3], 16) / 255) * 1000) / 1000
  } else if (clean.length === 6) {
    // #RRGGBB
    r = parseInt(clean.substring(0, 2), 16)
    g = parseInt(clean.substring(2, 4), 16)
    b = parseInt(clean.substring(4, 6), 16)
  } else if (clean.length === 8) {
    // #RRGGBBAA
    r = parseInt(clean.substring(0, 2), 16)
    g = parseInt(clean.substring(2, 4), 16)
    b = parseInt(clean.substring(4, 6), 16)
    a = Math.round((parseInt(clean.substring(6, 8), 16) / 255) * 1000) / 1000
  } else {
    return null
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null

  return { r, g, b, a }
}

function parseRgbString(str: string): ParsedRgba | null {
  const match = str.match(/^rgba?\(\s*([^\)]+)\s*\)$/i)
  if (!match) return null

  const parts = match[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  const parseChannel = (val: string) => {
    if (val.endsWith("%")) {
      return Math.round((parseFloat(val) / 100) * 255)
    }
    return Math.round(parseFloat(val))
  }

  const parseAlpha = (val: string) => {
    if (val.endsWith("%")) {
      return parseFloat(val) / 100
    }
    return parseFloat(val)
  }

  const r = parseChannel(parts[0])
  const g = parseChannel(parts[1])
  const b = parseChannel(parts[2])
  const a = parts.length >= 4 ? parseAlpha(parts[3]) : 1

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
    a: Math.max(0, Math.min(1, a))
  }
}

function parseHslString(str: string): ParsedRgba | null {
  const match = str.match(/^hsla?\(\s*([^\)]+)\s*\)$/i)
  if (!match) return null

  const parts = match[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  let h = parseFloat(parts[0])
  let s = parseFloat(parts[1].replace("%", "")) / 100
  let l = parseFloat(parts[2].replace("%", "")) / 100
  let a = parts.length >= 4 ? parseFloat(parts[3].replace("%", "")) / (parts[3].endsWith("%") ? 100 : 1) : 1

  if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) return null

  // Convert HSL to RGB
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r1 = 0, g1 = 0, b1 = 0
  if (h < 60) {
    r1 = c; g1 = x; b1 = 0
  } else if (h < 120) {
    r1 = x; g1 = c; b1 = 0
  } else if (h < 180) {
    r1 = 0; g1 = c; b1 = x
  } else if (h < 240) {
    r1 = 0; g1 = x; b1 = c
  } else if (h < 300) {
    r1 = x; g1 = 0; b1 = c
  } else {
    r1 = c; g1 = 0; b1 = x
  }

  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
    a: Math.max(0, Math.min(1, a))
  }
}

/**
 * Validates whether a color is strictly pure black or pure white.
 * Returns a detailed ColorValidationResult.
 */
export function validateColor(colorInput: string): ColorValidationResult {
  const parsed = parseColorToRgba(colorInput)

  if (!parsed) {
    return {
      isValid: false,
      isBlack: false,
      isWhite: false,
      color: colorInput,
      reason: `Invalid or unrecognized color format: "${colorInput}"`
    }
  }

  const { r, g, b, a } = parsed

  // Check pure black: r=0, g=0, b=0, full opacity a=1
  const isPureBlack = r === 0 && g === 0 && b === 0 && a === 1

  // Check pure white: r=255, g=255, b=255, full opacity a=1
  const isPureWhite = r === 255 && g === 255 && b === 255 && a === 1

  if (isPureBlack) {
    return {
      isValid: true,
      isBlack: true,
      isWhite: false,
      color: colorInput,
      normalizedHex: "#000000"
    }
  }

  if (isPureWhite) {
    return {
      isValid: true,
      isBlack: false,
      isWhite: true,
      color: colorInput,
      normalizedHex: "#ffffff"
    }
  }

  // If here, it is NOT pure black and NOT pure white
  const hexR = r.toString(16).padStart(2, "0")
  const hexG = g.toString(16).padStart(2, "0")
  const hexB = b.toString(16).padStart(2, "0")
  const actualHex = `#${hexR}${hexG}${hexB}`

  return {
    isValid: false,
    isBlack: false,
    isWhite: false,
    color: colorInput,
    normalizedHex: actualHex,
    reason: `Color "${colorInput}" (evaluated as RGB(${r}, ${g}, ${b}, ${a}) / ${actualHex}) is not black (#000000) or white (#ffffff).`
  }
}

/**
 * Returns true if the color is strictly pure black or pure white, false otherwise.
 */
export function isBlackOrWhite(colorInput: string): boolean {
  return validateColor(colorInput).isValid
}

/**
 * Asserts that a color is strictly black or white.
 * Throws an Error with detailed information if any other color (red, green, UI pop-up color, etc.) is detected.
 */
export function assertOnlyBlackAndWhite(colorInput: string, label?: string): void {
  const result = validateColor(colorInput)
  if (!result.isValid) {
    const prefix = label ? `[${label}] ` : ""
    throw new Error(`${prefix}Color detection test failed! ${result.reason}`)
  }
}

/**
 * Validates a list of colors and returns an aggregated result.
 */
export function validateColorList(colors: string[]): BatchValidationResult {
  const offendingColors: string[] = []
  const validColors: string[] = []

  for (const color of colors) {
    const result = validateColor(color)
    if (result.isValid) {
      validColors.push(color)
    } else {
      offendingColors.push(color)
    }
  }

  return {
    passed: offendingColors.length === 0,
    totalChecked: colors.length,
    validCount: validColors.length,
    failedCount: offendingColors.length,
    offendingColors,
    validColors
  }
}

/**
 * Scans a block of text/CSS for color codes and verifies that every detected color is black or white.
 */
export function scanAndDetectColors(text: string): BatchValidationResult {
  // Regex to extract hex colors, rgb/rgba, hsl/hsla, and named colors
  const colorPattern = /(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(?:black|white|red|green|blue|yellow|orange|purple|pink|cyan|gray|grey)\b)/gi

  const matches = text.match(colorPattern) || []
  const uniqueColors = Array.from(new Set(matches))

  return validateColorList(uniqueColors)
}
