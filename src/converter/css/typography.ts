import type { IRTextStyle, IRFill } from "../../types/ir"
import { parseCssColor } from "./color"
import { parseFontFamilyStack, normalizeFontWeight } from "./fonts"

/**
 * Parses typography from computed styles and text content with deep font inspection
 */
export function parseTypography(
  computed: CSSStyleDeclaration | Record<string, string>,
  characters: string
): IRTextStyle {
  const getVal = (prop: string) => {
    let val = ""
    if (typeof (computed as CSSStyleDeclaration).getPropertyValue === "function") {
      val = (computed as CSSStyleDeclaration).getPropertyValue(prop)
    }
    if (!val) {
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      val = (computed as any)[camel] || (computed as any)[prop] || ""
    }
    return val || ""
  }

  const fontFamilyRaw = getVal("font-family")
  const fontSizeRaw = getVal("font-size")
  const fontWeightRaw = getVal("font-weight")
  const fontStyleRaw = getVal("font-style")
  const lineHeightRaw = getVal("line-height")
  const letterSpacingRaw = getVal("letter-spacing")
  const textAlignRaw = getVal("text-align")
  const textTransformRaw = getVal("text-transform")
  const textDecorationRaw = getVal("text-decoration-line") || getVal("text-decoration")
  const fontVariantNumericRaw = getVal("font-variant-numeric")
  const colorRaw = getVal("color")

  const fontSize = parseFloat(fontSizeRaw) || 14

  // 1. Font Family & Fallbacks
  const { primary: fontFamily, fallbacks: fontFallbacks } = parseFontFamilyStack(fontFamilyRaw)

  // 2. Font Weight
  const fontWeight = normalizeFontWeight(fontWeightRaw)

  // 3. Font Style
  const fontStyle = fontStyleRaw.includes("italic") ? "italic" : "normal"

  // 4. Line Height
  let lineHeightPx: number | undefined = undefined
  if (lineHeightRaw && lineHeightRaw !== "normal") {
    if (lineHeightRaw.endsWith("px")) {
      lineHeightPx = parseFloat(lineHeightRaw)
    } else if (lineHeightRaw.endsWith("%")) {
      lineHeightPx = (parseFloat(lineHeightRaw) / 100) * fontSize
    } else {
      const multiplier = parseFloat(lineHeightRaw)
      if (!isNaN(multiplier)) {
        lineHeightPx = multiplier * fontSize
      }
    }
  }

  // 5. Letter Spacing
  let letterSpacingPx: number | undefined = undefined
  if (letterSpacingRaw && letterSpacingRaw !== "normal") {
    if (letterSpacingRaw.endsWith("px")) {
      letterSpacingPx = parseFloat(letterSpacingRaw)
    } else if (letterSpacingRaw.endsWith("em") || letterSpacingRaw.endsWith("rem")) {
      letterSpacingPx = parseFloat(letterSpacingRaw) * fontSize
    } else {
      const val = parseFloat(letterSpacingRaw)
      if (!isNaN(val)) letterSpacingPx = val
    }
  }

  // 6. Text Alignment
  const displayRaw = getVal("display")
  const justifyContentRaw = getVal("justify-content")

  let textAlign: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED" = "LEFT"
  if (
    textAlignRaw.includes("center") ||
    ((displayRaw.includes("flex") || displayRaw.includes("grid")) &&
      justifyContentRaw.includes("center"))
  ) {
    textAlign = "CENTER"
  } else if (textAlignRaw.includes("right") || textAlignRaw.includes("end")) {
    textAlign = "RIGHT"
  } else if (textAlignRaw.includes("justify")) {
    textAlign = "JUSTIFIED"
  }

  // 7. Text Case / Transform
  let textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" = "ORIGINAL"
  if (textTransformRaw.includes("uppercase")) textCase = "UPPER"
  else if (textTransformRaw.includes("lowercase")) textCase = "LOWER"
  else if (textTransformRaw.includes("capitalize")) textCase = "TITLE"

  // 8. Text Decoration
  let textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH" = "NONE"
  if (textDecorationRaw.includes("underline")) textDecoration = "UNDERLINE"
  else if (textDecorationRaw.includes("line-through")) textDecoration = "STRIKETHROUGH"

  // 9. Text Color Fill
  const textColor = parseCssColor(colorRaw) || { r: 0, g: 0, b: 0, a: 1 }
  const textFills: IRFill[] = [
    {
      type: "SOLID",
      color: textColor,
      opacity: textColor.a,
      visible: true
    }
  ]

  return {
    characters,
    fontSize,
    fontFamily,
    fontFallbacks,
    fontWeight,
    fontStyle,
    lineHeightPx,
    letterSpacingPx,
    textAlign,
    textDecoration,
    textCase,
    fontVariantNumeric: fontVariantNumericRaw || undefined,
    fills: textFills
  }
}
