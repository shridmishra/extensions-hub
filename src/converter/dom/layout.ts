import type { IRLayout } from "../../types/ir"

/**
 * Infers AutoLayout (Horizontal, Vertical, None) and padding/gap from computed styles
 */
export function parseLayout(computed: CSSStyleDeclaration | Record<string, string>): IRLayout | undefined {
  const getVal = (prop: string) => {
    if (typeof (computed as CSSStyleDeclaration).getPropertyValue === "function") {
      return (computed as CSSStyleDeclaration).getPropertyValue(prop)
    }
    return (computed as Record<string, string>)[prop] || ""
  }

  const display = getVal("display")
  const isFlex = display === "flex" || display === "inline-flex"
  const isGrid = display === "grid" || display === "inline-grid"

  const paddingTop = parseFloat(getVal("padding-top")) || 0
  const paddingRight = parseFloat(getVal("padding-right")) || 0
  const paddingBottom = parseFloat(getVal("padding-bottom")) || 0
  const paddingLeft = parseFloat(getVal("padding-left")) || 0

  const gap = parseFloat(getVal("gap")) || parseFloat(getVal("grid-gap")) || 0

  if (!isFlex && !isGrid) {
    if (paddingTop > 0 || paddingRight > 0 || paddingBottom > 0 || paddingLeft > 0) {
      return {
        mode: "NONE",
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        gap: 0
      }
    }
    return undefined
  }

  const flexDirection = getVal("flex-direction")
  const mode: "HORIZONTAL" | "VERTICAL" =
    flexDirection === "column" || flexDirection === "column-reverse" || isGrid
      ? "VERTICAL"
      : "HORIZONTAL"

  const justifyContent = getVal("justify-content")
  let primaryAxisAlign: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" = "MIN"
  if (justifyContent.includes("center")) primaryAxisAlign = "CENTER"
  else if (justifyContent.includes("flex-end") || justifyContent.includes("end")) primaryAxisAlign = "MAX"
  else if (justifyContent.includes("space-between") || justifyContent.includes("space-around"))
    primaryAxisAlign = "SPACE_BETWEEN"

  const alignItems = getVal("align-items")
  let counterAxisAlign: "MIN" | "CENTER" | "MAX" | "BASELINE" = "MIN"
  if (alignItems.includes("center")) counterAxisAlign = "CENTER"
  else if (alignItems.includes("flex-end") || alignItems.includes("end")) counterAxisAlign = "MAX"
  else if (alignItems.includes("baseline")) counterAxisAlign = "BASELINE"

  const flexWrap = getVal("flex-wrap")
  const layoutWrap = flexWrap === "wrap" || flexWrap === "wrap-reverse"

  return {
    mode,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    gap,
    primaryAxisAlign,
    counterAxisAlign,
    layoutWrap
  }
}
