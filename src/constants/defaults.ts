/**
 * Shared Constants and Fallbacks for HTML-to-Figma Converter
 */

export const FIGMA_SUPPORTED_FALLBACK_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Source Sans Pro",
  "Poppins",
  "Helvetica Neue",
  "Arial",
  "sans-serif"
]

export const CLIPBOARD_MAGIC_HEADER = "HTML_TO_FIGMA_IR_V1"

export const DEFAULT_VIEWPORT = {
  width: 1440,
  height: 900,
  scrollX: 0,
  scrollY: 0
}

export const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "AUDIO",
  "VIDEO",
  "CANVAS",
  "HEAD",
  "META",
  "LINK"
])
