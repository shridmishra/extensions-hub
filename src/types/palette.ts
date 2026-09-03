export type ColorRole = "bg" | "text" | "border" | "cta"

export interface ExtractedColorItem {
  hex: string
  name: string
  rgb: string
  hsl: string
  luminance: number // 0 (black) to 1 (white)
  hue: number // 0 to 360
  totalCount: number
  roles: ColorRole[]
  roleCounts: {
    bg: number
    text: number
    border: number
    cta: number
  }
  elementTags: string[]
}

export interface PagePaletteSummary {
  allColors: ExtractedColorItem[]
  bgColors: ExtractedColorItem[]
  textColors: ExtractedColorItem[]
  borderColors: ExtractedColorItem[]
  ctaColors: ExtractedColorItem[]
  totalUniqueColors: number
  totalUsages: number
  primaryBg?: string
  primaryText?: string
}

export type PaletteSortBy = "frequency" | "luminance" | "hue"
export type PaletteExportFormat = "hex" | "tailwind" | "css" | "json"
