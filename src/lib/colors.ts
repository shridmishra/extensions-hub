import type { RgbColor, HslColor } from "../types/colors"

/**
 * Normalizes a 3-character or 6-character hex code with leading '#'
 */
export function normalizeHex(hex: string): string {
  let c = hex.replace("#", "").trim()
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("")
  }
  return `#${c.toUpperCase()}`
}

/**
 * Converts a hex color string to an RGB string `rgb(r, g, b)`
 */
export function hexToRgb(hex: string): string {
  const { r, g, b } = hexToRgbObject(hex)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Converts a hex color string to `{ r, g, b }` object (0-255)
 */
export function hexToRgbObject(hex: string): RgbColor {
  let c = hex.replace("#", "").trim()
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("")
  }
  const num = parseInt(c, 16) || 0
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

/**
 * Converts a hex color string to an HSL string `hsl(h, s%, l%)`
 */
export function hexToHsl(hex: string): string {
  const { h, s, l } = hexToHslObject(hex)
  return `hsl(${h}, ${s}%, ${l}%)`
}

/**
 * Converts a hex color string to `{ h, s, l }` object
 */
export function hexToHslObject(hex: string): HslColor {
  const { r: r255, g: g255, b: b255 } = hexToRgbObject(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Converts RGB numbers (0-255) to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, "0").toUpperCase()
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
