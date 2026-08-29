import { formatCssColorToRgbString } from "../css/color"

/**
 * SVG Normalizer & Cleaner
 * Resolves currentColor, inlines sprite-sheet symbols, normalizes dimensions and viewBox.
 */
export function cleanAndNormalizeSvg(
  svgEl: SVGElement | string,
  computed?: CSSStyleDeclaration | Record<string, string> | null,
  renderedWidth?: number,
  renderedHeight?: number
): string {
  if (typeof document !== "undefined" && typeof (svgEl as any)?.cloneNode === "function") {
    const el = svgEl as SVGElement
    const clone = el.cloneNode(true) as SVGElement

    let computedColor = "rgb(0, 0, 0)"
    if (computed) {
      if (typeof (computed as CSSStyleDeclaration).getPropertyValue === "function") {
        computedColor = (computed as CSSStyleDeclaration).getPropertyValue("color") || (computed as any).color || "rgb(0, 0, 0)"
      } else {
        computedColor = (computed as Record<string, string>).color || "rgb(0, 0, 0)"
      }
    }

    const origWidth = parseFloat(el.getAttribute("width") || "") || 0
    const origHeight = parseFloat(el.getAttribute("height") || "") || 0
    const origViewBox = el.getAttribute("viewBox")

    const w = renderedWidth && renderedWidth > 0 ? renderedWidth : (origWidth || 24)
    const h = renderedHeight && renderedHeight > 0 ? renderedHeight : (origHeight || 24)

    clone.setAttribute("width", `${round2(w)}`)
    clone.setAttribute("height", `${round2(h)}`)
    clone.setAttribute("x", "0")
    clone.setAttribute("y", "0")

    if (!origViewBox) {
      if (origWidth > 0 && origHeight > 0) {
        clone.setAttribute("viewBox", `0 0 ${origWidth} ${origHeight}`)
      } else {
        clone.setAttribute("viewBox", `0 0 ${round2(w)} ${round2(h)}`)
      }
    }

    try {
      const useElements = Array.from(clone.querySelectorAll("use"))
      for (const useEl of useElements) {
        const href = useEl.getAttribute("href") || useEl.getAttribute("xlink:href")
        if (href && href.startsWith("#")) {
          const id = href.slice(1)
          const target = document.getElementById(id)
          if (target) {
            const replacement = target.cloneNode(true) as SVGElement
            replacement.removeAttribute("id")
            if (replacement.tagName.toLowerCase() === "symbol") {
              const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
              while (replacement.firstChild) {
                g.appendChild(replacement.firstChild)
              }
              if (useEl.getAttribute("transform")) g.setAttribute("transform", useEl.getAttribute("transform")!)
              useEl.parentNode?.replaceChild(g, useEl)
            } else {
              useEl.parentNode?.replaceChild(replacement, useEl)
            }
          }
        }
      }
    } catch {}

    const origElements = [el, ...Array.from(el.querySelectorAll("*"))]
    const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))]

    for (let i = 0; i < cloneElements.length; i++) {
      const cloneItem = cloneElements[i] as SVGElement
      const origItem = origElements[i] as SVGElement | undefined
      const tag = cloneItem.tagName.toLowerCase()

      let itemComp: CSSStyleDeclaration | null = null
      if (origItem && typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
        try {
          itemComp = window.getComputedStyle(origItem)
        } catch {}
      }

      const itemColor = itemComp?.color ? formatCssColorToRgbString(itemComp.color) : computedColor

      const attrFill = cloneItem.getAttribute("fill")
      if (itemComp) {
        const compFill = itemComp.fill
        if (compFill && compFill !== "none" && compFill !== "rgba(0, 0, 0, 0)") {
          if (!attrFill || attrFill.toLowerCase() === "currentcolor" || attrFill.startsWith("var(") || !attrFill.startsWith("url(")) {
            cloneItem.setAttribute("fill", formatCssColorToRgbString(compFill))
          }
        } else if (compFill === "none" || compFill === "rgba(0, 0, 0, 0)") {
          if (!attrFill?.startsWith("url(")) {
            cloneItem.setAttribute("fill", "none")
          }
        }
      } else {
        if (attrFill && attrFill.toLowerCase() === "currentcolor") {
          cloneItem.setAttribute("fill", itemColor)
        }
      }

      const attrStroke = cloneItem.getAttribute("stroke")
      if (itemComp) {
        const compStroke = itemComp.stroke
        if (compStroke && compStroke !== "none" && compStroke !== "rgba(0, 0, 0, 0)") {
          if (!attrStroke?.startsWith("url(")) {
            cloneItem.setAttribute("stroke", formatCssColorToRgbString(compStroke))
          }
          const sw = itemComp.strokeWidth || cloneItem.getAttribute("stroke-width")
          if (sw && sw !== "0px") cloneItem.setAttribute("stroke-width", sw)

          const sda = itemComp.strokeDasharray || cloneItem.getAttribute("stroke-dasharray")
          if (sda && sda !== "none") cloneItem.setAttribute("stroke-dasharray", sda)

          const slc = itemComp.strokeLinecap || cloneItem.getAttribute("stroke-linecap")
          if (slc && slc !== "butt") cloneItem.setAttribute("stroke-linecap", slc)

          const slj = itemComp.strokeLinejoin || cloneItem.getAttribute("stroke-linejoin")
          if (slj && slj !== "miter") cloneItem.setAttribute("stroke-linejoin", slj)
        } else if (attrStroke && attrStroke.toLowerCase() === "currentcolor") {
          cloneItem.setAttribute("stroke", itemColor)
        }
      } else {
        if (attrStroke && attrStroke.toLowerCase() === "currentcolor") {
          cloneItem.setAttribute("stroke", itemColor)
        }
      }

      if (tag === "stop") {
        const stopColor = itemComp?.stopColor || cloneItem.getAttribute("stop-color") || itemColor
        if (stopColor && stopColor !== "none") {
          cloneItem.setAttribute("stop-color", formatCssColorToRgbString(stopColor))
        }
        const stopOpacity = itemComp?.stopOpacity || cloneItem.getAttribute("stop-opacity")
        if (stopOpacity && stopOpacity !== "1") {
          cloneItem.setAttribute("stop-opacity", stopOpacity)
        }
      }

      const styleAttr = cloneItem.getAttribute("style")
      if (styleAttr) {
        let cleanStyle = styleAttr.replace(/currentcolor/gi, itemColor)
        cloneItem.setAttribute("style", cleanStyle)
      }

      if (tag === "path" || tag === "polygon" || tag === "polyline" || tag === "circle" || tag === "line" || tag === "rect") {
        if (!cloneItem.getAttribute("stroke") && el.getAttribute("stroke")?.toLowerCase() === "currentcolor") {
          cloneItem.setAttribute("stroke", computedColor)
        }
      }

      cloneItem.removeAttribute("class")
    }

    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    }

    const serializer = typeof XMLSerializer !== "undefined" ? new XMLSerializer() : null
    if (serializer) {
      return serializer.serializeToString(clone)
    }
    return clone.outerHTML || ""
  }

  let raw = typeof svgEl === "string" ? svgEl : (svgEl as any)?.outerHTML || ""
  let computedColor = "rgb(0, 0, 0)"
  if (computed) {
    if (typeof (computed as CSSStyleDeclaration).getPropertyValue === "function") {
      computedColor = (computed as CSSStyleDeclaration).getPropertyValue("color") || (computed as any).color || "rgb(0, 0, 0)"
    } else {
      computedColor = (computed as Record<string, string>).color || "rgb(0, 0, 0)"
    }
  }

  if (computedColor) {
    raw = raw.replace(/stroke=["']currentColor["']/gi, `stroke="${computedColor}"`)
    raw = raw.replace(/fill=["']currentColor["']/gi, `fill="${computedColor}"`)
    raw = raw.replace(/currentColor/gi, computedColor)
  }

  if (renderedWidth && renderedHeight && renderedWidth > 0 && renderedHeight > 0) {
    if (raw.includes("width=")) {
      raw = raw.replace(/width=["'][^"']+["']/, `width="${round2(renderedWidth)}"`)
    } else {
      raw = raw.replace("<svg", `<svg width="${round2(renderedWidth)}"`)
    }
    if (raw.includes("height=")) {
      raw = raw.replace(/height=["'][^"']+["']/, `height="${round2(renderedHeight)}"`)
    } else {
      raw = raw.replace("<svg", `<svg height="${round2(renderedHeight)}"`)
    }
  }

  return raw
}

function round2(val: number): number {
  return Math.round(val * 100) / 100
}
