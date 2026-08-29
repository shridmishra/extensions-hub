import type { IRStroke } from "../../types/ir"
import { parseCssColor } from "./color"

export interface ParsedBorder {
  strokes: IRStroke[]
  cornerRadius?: number | [number, number, number, number] // TL, TR, BR, BL
}

/**
 * Extracts borders and corner radii from computed styles.
 */
export function parseBorders(
  computed: CSSStyleDeclaration | Record<string, string>,
  containerWidth?: number,
  containerHeight?: number
): ParsedBorder {
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

  const borderTopWidth = parseFloat(getVal("border-top-width")) || 0
  const borderRightWidth = parseFloat(getVal("border-right-width")) || 0
  const borderBottomWidth = parseFloat(getVal("border-bottom-width")) || 0
  const borderLeftWidth = parseFloat(getVal("border-left-width")) || 0

  const borderTopStyle = getVal("border-top-style")
  const borderRightStyle = getVal("border-right-style")
  const borderBottomStyle = getVal("border-bottom-style")
  const borderLeftStyle = getVal("border-left-style")

  const borderTopColor = getVal("border-top-color")
  const borderRightColor = getVal("border-right-color")
  const borderBottomColor = getVal("border-bottom-color")
  const borderLeftColor = getVal("border-left-color")

  const isTopActive = borderTopWidth > 0 && borderTopStyle !== "none" && borderTopStyle !== "hidden"
  const isRightActive = borderRightWidth > 0 && borderRightStyle !== "none" && borderRightStyle !== "hidden"
  const isBottomActive = borderBottomWidth > 0 && borderBottomStyle !== "none" && borderBottomStyle !== "hidden"
  const isLeftActive = borderLeftWidth > 0 && borderLeftStyle !== "none" && borderLeftStyle !== "hidden"

  const strokes: IRStroke[] = []

  if (isTopActive || isRightActive || isBottomActive || isLeftActive) {
    const activeColorStr =
      (isTopActive && borderTopColor) ||
      (isBottomActive && borderBottomColor) ||
      (isLeftActive && borderLeftColor) ||
      (isRightActive && borderRightColor) ||
      borderTopColor ||
      "rgb(0, 0, 0)"

    const color = parseCssColor(activeColorStr) || { r: 0, g: 0, b: 0, a: 1 }

    if (color.a > 0.01) {
      const maxWidth = Math.max(
        isTopActive ? borderTopWidth : 0,
        isRightActive ? borderRightWidth : 0,
        isBottomActive ? borderBottomWidth : 0,
        isLeftActive ? borderLeftWidth : 0
      )

      strokes.push({
        color,
        width: maxWidth,
        top: isTopActive ? borderTopWidth : 0,
        right: isRightActive ? borderRightWidth : 0,
        bottom: isBottomActive ? borderBottomWidth : 0,
        left: isLeftActive ? borderLeftWidth : 0,
        align: "INSIDE",
        visible: true
      })
    }
  }

  // Border radius parsing: TL, TR, BR, BL
  const w = containerWidth !== undefined && containerWidth > 0 ? containerWidth : 100
  const h = containerHeight !== undefined && containerHeight > 0 ? containerHeight : 100
  const minDim = Math.min(w, h)

  const parseRadiusVal = (valStr: string, axisLen: number): number => {
    if (!valStr || valStr === "0" || valStr === "0px") return 0
    if (valStr.includes("%")) {
      const pct = parseFloat(valStr) || 0
      return (pct / 100) * axisLen
    }
    const px = parseFloat(valStr) || 0
    return px
  }

  const rTLRaw = parseRadiusVal(getVal("border-top-left-radius"), minDim)
  const rTRRaw = parseRadiusVal(getVal("border-top-right-radius"), minDim)
  const rBRRaw = parseRadiusVal(getVal("border-bottom-right-radius"), minDim)
  const rBLRaw = parseRadiusVal(getVal("border-bottom-left-radius"), minDim)

  const maxCornerRadius = minDim / 2

  const rTL = Math.min(rTLRaw, maxCornerRadius)
  const rTR = Math.min(rTRRaw, maxCornerRadius)
  const rBR = Math.min(rBRRaw, maxCornerRadius)
  const rBL = Math.min(rBLRaw, maxCornerRadius)

  let cornerRadius: number | [number, number, number, number] | undefined = undefined

  if (rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0) {
    if (Math.abs(rTL - rTR) < 0.1 && Math.abs(rTR - rBR) < 0.1 && Math.abs(rBR - rBL) < 0.1) {
      cornerRadius = Math.round(rTL * 100) / 100
    } else {
      cornerRadius = [
        Math.round(rTL * 100) / 100,
        Math.round(rTR * 100) / 100,
        Math.round(rBR * 100) / 100,
        Math.round(rBL * 100) / 100
      ]
    }
  }

  return { strokes, cornerRadius }
}
