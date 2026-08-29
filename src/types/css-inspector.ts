import type { IRDocument } from "./ir"

export interface CSSProperty {
  name: string
  value: string
  category: string
}

export interface BoxModelData {
  margin: { top: string; right: string; bottom: string; left: string }
  border: { top: string; right: string; bottom: string; left: string }
  padding: { top: string; right: string; bottom: string; left: string }
  width: string
  height: string
}

export interface ExtractedStyles {
  tagName: string
  className: string
  id: string
  dimensions: { width: string; height: string }
  categories: Record<string, CSSProperty[]>
  boxModel: BoxModelData
  rawCSS: string
  tailwindClasses: string
}

export interface FontMetrics {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  color: string
  backgroundColor: string
  textAlign: string
  textTransform: string
  fontStyle?: string
  textDecoration?: string
  sampleText?: string
  elementTag?: string
  googleFontUrl?: string
  isGoogleFont?: boolean
}

export type ToolbarMode = "figma-element" | "figma-fullpage" | "inspect-css"

export interface CapturedItem {
  id: string
  title: string
  doc: IRDocument
}
