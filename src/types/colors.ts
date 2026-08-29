export interface ParsedRgba {
  r: number // 0 - 255
  g: number // 0 - 255
  b: number // 0 - 255
  a: number // 0 - 1
}

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface HslColor {
  h: number
  s: number
  l: number
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
