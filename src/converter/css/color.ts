import type { IRColor } from "../../types/ir"

const NAMED_COLORS: Record<string, [number, number, number, number]> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  red: [1, 0, 0, 1],
  green: [0, 0.5, 0, 1],
  blue: [0, 0, 1, 1],
  yellow: [1, 1, 0, 1],
  cyan: [0, 1, 1, 1],
  magenta: [1, 0, 1, 1],
  gray: [0.5, 0.5, 0.5, 1],
  grey: [0.5, 0.5, 0.5, 1],
  silver: [0.75, 0.75, 0.75, 1],
  maroon: [0.5, 0, 0, 1],
  olive: [0.5, 0.5, 0.5, 1],
  purple: [0.5, 0, 0.5, 1],
  teal: [0, 0.5, 0.5, 1],
  navy: [0, 0, 0.5, 1],
  orange: [1, 0.65, 0, 1]
}

/**
 * Parses any CSS color string into an IRColor { r, g, b, a } (values 0..1)
 */
export function parseCssColor(colorStr: string | null | undefined): IRColor | null {
  if (!colorStr) return null
  const str = colorStr.trim().toLowerCase()

  if (str === "none" || str === "transparent" || str === "rgba(0, 0, 0, 0)") {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  // Named color
  if (NAMED_COLORS[str]) {
    const [r, g, b, a] = NAMED_COLORS[str]
    return { r, g, b, a }
  }

  // Hex color: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (str.startsWith("#")) {
    return parseHexColor(str)
  }

  // rgb / rgba
  if (str.startsWith("rgb")) {
    return parseRgbColor(str)
  }

  // hsl / hsla
  if (str.startsWith("hsl")) {
    return parseHslColor(str)
  }

  // oklch(...) — standard in modern Tailwind CSS
  if (str.startsWith("oklch(")) {
    return parseOklchColor(str)
  }

  // oklab(...)
  if (str.startsWith("oklab(")) {
    return parseOklabColor(str)
  }

  // lch(...)
  if (str.startsWith("lch(")) {
    return parseLchColor(str)
  }

  // lab(...)
  if (str.startsWith("lab(")) {
    return parseLabColor(str)
  }

  // color(srgb ...) or color(display-p3 ...)
  if (str.startsWith("color(")) {
    return parseColorFn(str)
  }

  // CSS Variable resolution fallback
  if (str.includes("var(")) {
    const varResolved = resolveCssVariableInDom(colorStr)
    if (varResolved && varResolved !== colorStr) {
      const parsed = parseCssColor(varResolved)
      if (parsed) return parsed
    }
  }

  // Browser DOM normalization fallback for color-mix and complex CSS functions
  const domNormalized = resolveColorViaDom(colorStr)
  if (domNormalized && domNormalized !== colorStr && domNormalized !== str) {
    return parseCssColor(domNormalized)
  }

  // Browser canvas normalization fallback for complex color expressions
  const browserNormalized = normalizeColorViaBrowser(colorStr)
  if (browserNormalized && browserNormalized !== colorStr && browserNormalized !== str) {
    return parseCssColor(browserNormalized)
  }

  return null
}

let _canvasCtx: CanvasRenderingContext2D | null = null
let _dummyColorEl: HTMLElement | null = null

/**
 * Resolves any valid CSS variable expression in DOM context
 */
export function resolveCssVariableInDom(varExpr: string): string {
  if (typeof document === "undefined") return varExpr
  const match = varExpr.match(/var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/)
  if (match) {
    const varName = match[1]
    const fallback = match[2] ? match[2].trim() : ""
    try {
      const docEl = document.documentElement
      const val =
        window.getComputedStyle(docEl).getPropertyValue(varName)?.trim() ||
        (document.body ? window.getComputedStyle(document.body).getPropertyValue(varName)?.trim() : "")
      if (val) return val
    } catch {}
    if (fallback) return fallback
  }
  return varExpr
}

/**
 * Resolves complex CSS color expressions (color-mix, CSS variables, light-dark, relative colors)
 * via native DOM computed style engine.
 */
export function resolveColorViaDom(colorStr: string): string | null {
  if (typeof document === "undefined" || !document.body) return null
  try {
    if (!_dummyColorEl) {
      _dummyColorEl = document.createElement("div")
      _dummyColorEl.style.display = "none"
      _dummyColorEl.style.position = "fixed"
      _dummyColorEl.style.pointerEvents = "none"
      _dummyColorEl.setAttribute("aria-hidden", "true")
      document.body.appendChild(_dummyColorEl)
    }
    _dummyColorEl.style.color = ""
    _dummyColorEl.style.color = colorStr
    const computed = window.getComputedStyle(_dummyColorEl).color
    if (computed && computed !== "" && computed !== "rgba(0, 0, 0, 0)") {
      return computed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Normalizes any valid CSS color string to hex or rgba using browser's native canvas engine
 */
export function normalizeColorViaBrowser(colorStr: string): string | null {
  if (typeof document === "undefined") return null
  try {
    if (!_canvasCtx) {
      const c = document.createElement("canvas")
      c.width = 1
      c.height = 1
      _canvasCtx = c.getContext("2d", { willReadFrequently: true })
    }
    if (!_canvasCtx) return null
    _canvasCtx.fillStyle = "#00000000"
    _canvasCtx.fillStyle = colorStr
    const res = _canvasCtx.fillStyle
    if (!res || res === "#00000000" || res === "rgba(0, 0, 0, 0)") {
      return null
    }
    return res
  } catch {
    return null
  }
}

/**
 * Formats any CSS color string into a clean rgb/rgba string suitable for SVG and Figma
 */
export function formatCssColorToRgbString(colorStr: string | null | undefined, defaultColor = "none"): string {
  if (!colorStr || colorStr === "none" || colorStr === "transparent") return defaultColor
  const parsed = parseCssColor(colorStr)
  if (!parsed) return defaultColor
  const r = Math.round(parsed.r * 255)
  const g = Math.round(parsed.g * 255)
  const b = Math.round(parsed.b * 255)
  const a = parsed.a !== undefined ? parsed.a : 1
  if (a >= 0.99) return `rgb(${r}, ${g}, ${b})`
  if (a <= 0.01) return "none"
  return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
}

function parseHexColor(hex: string): IRColor | null {
  const clean = hex.slice(1)
  let r = 0, g = 0, b = 0, a = 1

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255
    g = parseInt(clean[1] + clean[1], 16) / 255
    b = parseInt(clean[2] + clean[2], 16) / 255
  } else if (clean.length === 4) {
    r = parseInt(clean[0] + clean[0], 16) / 255
    g = parseInt(clean[1] + clean[1], 16) / 255
    b = parseInt(clean[2] + clean[2], 16) / 255
    a = parseInt(clean[3] + clean[3], 16) / 255
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255
    g = parseInt(clean.substring(2, 4), 16) / 255
    b = parseInt(clean.substring(4, 6), 16) / 255
  } else if (clean.length === 8) {
    r = parseInt(clean.substring(0, 2), 16) / 255
    g = parseInt(clean.substring(2, 4), 16) / 255
    b = parseInt(clean.substring(4, 6), 16) / 255
    a = parseInt(clean.substring(6, 8), 16) / 255
  } else {
    return null
  }

  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseRgbColor(str: string): IRColor | null {
  const inside = str.replace(/^rgba?\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  const r = parseColorChannel(parts[0])
  const g = parseColorChannel(parts[1])
  const b = parseColorChannel(parts[2])
  let a = 1

  if (parts.length >= 4) {
    a = parseAlphaChannel(parts[3])
  }

  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseHslColor(str: string): IRColor | null {
  const inside = str.replace(/^hsla?\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  const h = parseFloat(parts[0]) % 360
  const s = parseFloat(parts[1]) / (parts[1].endsWith("%") ? 100 : 1)
  const l = parseFloat(parts[2]) / (parts[2].endsWith("%") ? 100 : 1)
  let a = 1

  if (parts.length >= 4) {
    a = parseAlphaChannel(parts[3])
  }

  const [r, g, b] = hslToRgb(h, s, l)
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseOklchColor(str: string): IRColor | null {
  const inside = str.replace(/^oklch\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  let L = parseFloat(parts[0])
  if (parts[0].endsWith("%")) L /= 100

  let C = parseFloat(parts[1])
  if (parts[1].endsWith("%")) C = (C / 100) * 0.4

  let H = parseFloat(parts[2].replace(/deg$/i, ""))
  if (parts[2].endsWith("rad")) H = (parseFloat(parts[2]) * 180) / Math.PI
  if (parts[2].endsWith("turn")) H = parseFloat(parts[2]) * 360
  if (isNaN(H)) H = 0

  let a = 1
  if (parts.length >= 4) {
    a = parseAlphaChannel(parts[3])
  }

  const hRad = (H * Math.PI) / 180
  const okA = C * Math.cos(hRad)
  const okB = C * Math.sin(hRad)

  const [r, g, b] = oklabToSrgb(L, okA, okB)
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseOklabColor(str: string): IRColor | null {
  const inside = str.replace(/^oklab\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  let L = parseFloat(parts[0])
  if (parts[0].endsWith("%")) L /= 100

  let a = parseFloat(parts[1])
  if (parts[1].endsWith("%")) a = (a / 100) * 0.4

  let b = parseFloat(parts[2])
  if (parts[2].endsWith("%")) b = (b / 100) * 0.4

  let alpha = 1
  if (parts.length >= 4) {
    alpha = parseAlphaChannel(parts[3])
  }

  const [r, g, bVal] = oklabToSrgb(L, a, b)
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(bVal),
    a: clamp01(alpha)
  }
}

function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  return [
    linearToSrgb(rLinear),
    linearToSrgb(gLinear),
    linearToSrgb(bLinear)
  ]
}

function parseLchColor(str: string): IRColor | null {
  const inside = str.replace(/^lch\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  let L = parseFloat(parts[0])
  let C = parseFloat(parts[1])
  let H = parseFloat(parts[2].replace(/deg$/i, ""))
  if (isNaN(H)) H = 0

  let a = 1
  if (parts.length >= 4) {
    a = parseAlphaChannel(parts[3])
  }

  const hRad = (H * Math.PI) / 180
  const labA = C * Math.cos(hRad)
  const labB = C * Math.sin(hRad)

  const [r, g, b] = labToSrgb(L, labA, labB)
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseLabColor(str: string): IRColor | null {
  const inside = str.replace(/^lab\(|\)$/g, "").trim()
  const parts = inside.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null

  const L = parseFloat(parts[0])
  const a = parseFloat(parts[1])
  const b = parseFloat(parts[2])

  let alpha = 1
  if (parts.length >= 4) {
    alpha = parseAlphaChannel(parts[3])
  }

  const [r, g, bVal] = labToSrgb(L, a, b)
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(bVal),
    a: clamp01(alpha)
  }
}

function labToSrgb(L: number, a: number, b: number): [number, number, number] {
  const y = (L + 16) / 116
  const x = a / 500 + y
  const z = y - b / 200

  const fInv = (t: number) => (t > 0.2068965517 ? t * t * t : (t - 16 / 116) * 3 * 0.0428061858)

  const X = 0.95047 * fInv(x)
  const Y = 1.00000 * fInv(y)
  const Z = 1.08883 * fInv(z)

  const rLinear = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
  const gLinear = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
  const bLinear = 0.0557 * X - 0.2040 * Y + 1.0570 * Z

  return [
    linearToSrgb(rLinear),
    linearToSrgb(gLinear),
    linearToSrgb(bLinear)
  ]
}

function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c
  }
  return 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055
}

function parseColorFn(str: string): IRColor | null {
  const inside = str.replace(/^color\(|\)$/g, "").trim()
  const parts = inside.split(/[\s/]+/).filter(Boolean)
  if (parts.length < 4) return null

  const r = parseFloat(parts[1])
  const g = parseFloat(parts[2])
  const b = parseFloat(parts[3])
  let a = 1
  if (parts.length >= 5) {
    a = parseFloat(parts[4])
  }

  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(a)
  }
}

function parseColorChannel(val: string): number {
  if (val.endsWith("%")) {
    return parseFloat(val) / 100
  }
  return parseFloat(val) / 255
}

function parseAlphaChannel(val: string): number {
  if (val.endsWith("%")) {
    return parseFloat(val) / 100
  }
  return parseFloat(val)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

  return [r1 + m, g1 + m, b1 + m]
}

function clamp01(val: number): number {
  if (isNaN(val)) return 0
  return Math.min(1, Math.max(0, Math.round(val * 1000) / 1000))
}
