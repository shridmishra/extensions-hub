import type {
  IRNode,
  IRBox,
  IRFill,
  IRStroke
} from "../../types/ir"
import { IGNORED_TAGS } from "../../constants/defaults"
import { parseCssColor } from "../css/color"
import { parseCssGradient } from "../css/gradients"
import { parseCssBoxShadow, parseCssTextShadow, parseCssFilterDropShadow } from "../css/shadows"
import { parseBorders } from "../css/borders"
import { parseTypography } from "../css/typography"
import { parseCssTransform } from "../css/transforms"
import { parseLayout } from "./layout"
import { handleCutoutContainer } from "../clip-path/container"
import { cleanAndNormalizeSvg } from "../svg/cleaner"
import { generateId } from "../../lib/utils"

export interface TraversalContext {
  rootRect: DOMRect | { left: number; top: number; width: number; height: number }
  computedStyleCache: Map<Element, CSSStyleDeclaration>
  stats: {
    totalNodes: number
    textNodes: number
    vectorNodes: number
    cutoutNodes: number
    imageNodes: number
    warnings: string[]
  }
}

/**
 * Traverses an element and converts it into an IRNode tree
 */
export function convertElementToIRNode(
  element: Element,
  ctx: TraversalContext,
  parentBox?: IRBox
): IRNode | null {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return null
  }

  const tagName = element.tagName.toUpperCase()
  if (IGNORED_TAGS.has(tagName)) {
    return null
  }

  const computed = getCachedComputedStyle(element, ctx)
  if (!computed) return null

  const display = computed.display
  const visibility = computed.visibility
  const opacity = parseFloat(computed.opacity) || 1

  if (display === "none" || visibility === "hidden" || opacity <= 0) {
    return null
  }

  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 && rect.height <= 0) {
    if (element.children.length === 0 && !element.textContent?.trim()) {
      return null
    }
  }

  const absBox: IRBox = {
    x: Math.round(rect.left - ctx.rootRect.left),
    y: Math.round(rect.top - ctx.rootRect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }

  const relBox: IRBox = parentBox
    ? {
        x: absBox.x - parentBox.x,
        y: absBox.y - parentBox.y,
        width: absBox.width,
        height: absBox.height
      }
    : { x: 0, y: 0, width: absBox.width, height: absBox.height }

  ctx.stats.totalNodes++

  const className = element.className && typeof element.className === "string" ? element.className : ""
  const name = formatNodeName(tagName.toLowerCase(), className, element.id)

  // 1. Handle SVG element
  if (tagName === "SVG") {
    ctx.stats.vectorNodes++
    const svgHtml = cleanAndNormalizeSvg(
      element as SVGElement,
      computed,
      absBox.width,
      absBox.height
    )
    return {
      id: generateId("svg"),
      name,
      type: "SVG",
      box: relBox,
      absoluteBox: absBox,
      opacity,
      fills: [],
      strokes: [],
      effects: parseCssBoxShadow(computed.boxShadow),
      svgContent: svgHtml,
      children: [],
      metadata: {
        tagName,
        className,
        id: element.id
      }
    }
  }

  // 2. Handle Image element (<img>)
  if (tagName === "IMG") {
    ctx.stats.imageNodes++
    const imgEl = element as HTMLImageElement
    const fills: IRFill[] = []
    const src = imgEl.currentSrc || imgEl.src

    let dataUrl: string | undefined = undefined
    if (typeof document !== "undefined" && imgEl.complete && imgEl.naturalWidth > 0) {
      try {
        const canvas = document.createElement("canvas")
        const maxDim = 1200
        const scale = Math.min(1, maxDim / Math.max(imgEl.naturalWidth, imgEl.naturalHeight))
        canvas.width = Math.round(imgEl.naturalWidth * scale)
        canvas.height = Math.round(imgEl.naturalHeight * scale)
        const drawCtx = canvas.getContext("2d")
        if (drawCtx) {
          drawCtx.drawImage(imgEl, 0, 0, canvas.width, canvas.height)
          dataUrl = canvas.toDataURL("image/png")
        }
      } catch {}
    }

    if (src || dataUrl) {
      fills.push({
        type: "IMAGE",
        scaleMode: computed.objectFit === "contain" ? "FIT" : "FILL",
        url: src,
        dataUrl,
        visible: true
      })
    }

    const { strokes, cornerRadius } = parseBorders(computed, absBox.width, absBox.height)
    const effects = parseCssBoxShadow(computed.boxShadow)

    return {
      id: generateId("img"),
      name,
      type: "IMAGE",
      box: relBox,
      absoluteBox: absBox,
      opacity,
      fills,
      strokes,
      cornerRadius,
      effects,
      children: [],
      metadata: {
        tagName,
        className,
        id: element.id
      }
    }
  }

  // 3. Fills extraction
  const fills: IRFill[] = []

  const bgColor = parseCssColor(computed.backgroundColor)
  if (bgColor && bgColor.a > 0) {
    fills.push({
      type: "SOLID",
      color: bgColor,
      opacity: bgColor.a,
      visible: true
    })
  }

  const bgImage = computed.backgroundImage
  if (bgImage && bgImage !== "none") {
    if (bgImage.includes("gradient")) {
      const gradient = parseCssGradient(bgImage)
      if (gradient) fills.push(gradient)
    } else if (bgImage.includes("url(")) {
      const match = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/)
      if (match && match[1]) {
        fills.push({
          type: "IMAGE",
          scaleMode: computed.backgroundSize === "contain" ? "FIT" : "FILL",
          url: match[1],
          visible: true
        })
      }
    }
  }

  const { strokes, cornerRadius } = parseBorders(computed, absBox.width, absBox.height)
  const boxShadowEffects = parseCssBoxShadow(computed.boxShadow)
  const filterEffects = parseCssFilterDropShadow(computed.filter || (computed as any).webkitFilter)
  const effects = [...boxShadowEffects, ...filterEffects]

  if (effects.length === 0 && typeof window !== "undefined") {
    try {
      const afterComp = window.getComputedStyle(element, "::after")
      const afterShadows = parseCssBoxShadow(afterComp.boxShadow)
      const afterFilters = parseCssFilterDropShadow(afterComp.filter)
      if (afterShadows.length > 0 || afterFilters.length > 0) {
        effects.push(...afterShadows, ...afterFilters)
      }
    } catch {}
  }
  const transformInfo = parseCssTransform(computed.transform)
  const layout = parseLayout(computed)
  const overflowX = computed.overflowX
  const overflowY = computed.overflowY
  const clipsContent =
    (overflowX === "hidden" || overflowX === "clip") &&
    (overflowY === "hidden" || overflowY === "clip")

  // 4. Handle clip-path Cutouts
  const clipPathValue = computed.clipPath || (computed as any).webkitClipPath
  const cutoutResult = handleCutoutContainer(
    clipPathValue,
    absBox.width,
    absBox.height,
    fills,
    strokes,
    effects,
    name
  )

  const isCutout = cutoutResult.hasCutout
  if (isCutout) {
    ctx.stats.cutoutNodes++
  }

  const children: IRNode[] = []

  // 5. Handle ::before pseudo-element
  const beforeNode = extractPseudoElement(element, "::before", ctx, absBox)
  if (beforeNode) children.push(beforeNode)

  // 6. Traverse Child Nodes
  const childNodes = Array.from(element.childNodes)

  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ""
      if (text.trim()) {
        const textNode = extractTextNode(child as Text, element, computed, ctx, absBox)
        if (textNode) children.push(textNode)
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childIR = convertElementToIRNode(child as Element, ctx, absBox)
      if (childIR) children.push(childIR)
    }
  }

  // 7. Handle ::after pseudo-element
  const afterNode = extractPseudoElement(element, "::after", ctx, absBox)
  if (afterNode) children.push(afterNode)

  return {
    id: generateId("frame"),
    name,
    type: "FRAME",
    box: relBox,
    absoluteBox: absBox,
    opacity,
    transform: transformInfo.matrix,
    rotation: transformInfo.rotation,
    cornerRadius: isCutout ? undefined : cornerRadius,
    fills,
    strokes,
    effects,
    layout,
    clipsContent,
    vectorData: isCutout && cutoutResult.geometry && cutoutResult.geometry.type !== "none" ? {
      svgPath: cutoutResult.geometry.svgPath,
      viewBox: { width: absBox.width, height: absBox.height },
      isCutoutBackground: true,
      cutoutType: cutoutResult.geometry.type
    } : undefined,
    children,
    metadata: {
      tagName,
      className,
      id: element.id,
      isClipped: isCutout,
      originalClipPath: clipPathValue || undefined
    }
  }
}

function extractTextNode(
  textNode: Text,
  parentElement: Element,
  parentComputed: CSSStyleDeclaration,
  ctx: TraversalContext,
  parentBox: IRBox
): IRNode | null {
  const rawText = textNode.textContent || ""
  const characters = rawText.trim()
  if (!characters) return null

  let rect: DOMRect
  try {
    const range = document.createRange()
    const startOffset = rawText.indexOf(characters)
    if (startOffset >= 0) {
      range.setStart(textNode, startOffset)
      range.setEnd(textNode, startOffset + characters.length)
    } else {
      range.selectNodeContents(textNode)
    }
    rect = range.getBoundingClientRect()
  } catch {
    rect = parentElement.getBoundingClientRect()
  }

  if (rect.width <= 0 && rect.height <= 0) return null

  ctx.stats.textNodes++

  const absBox: IRBox = {
    x: Math.round(rect.left - ctx.rootRect.left),
    y: Math.round(rect.top - ctx.rootRect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }

  const relBox: IRBox = {
    x: absBox.x - parentBox.x,
    y: absBox.y - parentBox.y,
    width: absBox.width,
    height: absBox.height
  }

  const typography = parseTypography(parentComputed, characters)

  const parentDisplay = parentComputed.display || ""
  const isParentJustifyCenter =
    (parentDisplay.includes("flex") || parentDisplay.includes("grid")) &&
    parentComputed.justifyContent.includes("center")
  const isExplicitTextAlignCenter =
    parentComputed.textAlign && parentComputed.textAlign.includes("center")

  const isCompactContainer = parentBox.width > 0 && parentBox.width <= 120
  const leftSpace = relBox.x
  const rightSpace = parentBox.width - (relBox.x + relBox.width)
  const isVisuallyCenteredX = isCompactContainer && Math.abs(leftSpace - rightSpace) <= 4

  if (isExplicitTextAlignCenter || isParentJustifyCenter || isVisuallyCenteredX) {
    typography.textAlign = "CENTER"
  } else if (parentComputed.textAlign && (parentComputed.textAlign.includes("right") || parentComputed.textAlign.includes("end"))) {
    typography.textAlign = "RIGHT"
  } else {
    typography.textAlign = "LEFT"
  }

  const textShadowEffects = parseCssTextShadow(parentComputed.textShadow)

  return {
    id: generateId("text"),
    name: characters.length > 20 ? `"${characters.slice(0, 20)}…"` : `"${characters}"`,
    type: "TEXT",
    box: relBox,
    absoluteBox: absBox,
    opacity: 1,
    fills: typography.fills || [],
    strokes: [],
    effects: textShadowEffects,
    textData: typography,
    children: [],
    metadata: {
      tagName: "#text"
    }
  }
}

function extractPseudoElement(
  element: Element,
  pseudo: "::before" | "::after",
  ctx: TraversalContext,
  parentBox: IRBox
): IRNode | null {
  try {
    const pseudoStyle = window.getComputedStyle(element, pseudo)
    if (!pseudoStyle) return null

    const rawContent = (pseudoStyle.content || "").trim()
    const display = pseudoStyle.display

    if (display === "none") {
      return null
    }

    if (
      !rawContent ||
      rawContent === "none" ||
      rawContent === "normal" ||
      rawContent === '"none"' ||
      rawContent === '"normal"' ||
      rawContent === "'none'" ||
      rawContent === "'normal'"
    ) {
      return null
    }

    const cleanContent = rawContent.replace(/^['"]|['"]$/g, "").trim()
    if (cleanContent === "none" || cleanContent === "normal") {
      return null
    }

    const hasVisibleStyle =
      (pseudoStyle.backgroundImage && pseudoStyle.backgroundImage !== "none") ||
      (pseudoStyle.backgroundColor &&
        pseudoStyle.backgroundColor !== "transparent" &&
        pseudoStyle.backgroundColor !== "rgba(0, 0, 0, 0)") ||
      (pseudoStyle.boxShadow && pseudoStyle.boxShadow !== "none") ||
      (parseFloat(pseudoStyle.borderTopWidth) > 0 && pseudoStyle.borderTopStyle !== "none")

    if (!cleanContent && !hasVisibleStyle) {
      return null
    }

    const parentComputed = getCachedComputedStyle(element, ctx) || window.getComputedStyle(element)

    let width = parseFloat(pseudoStyle.width)
    if (isNaN(width) || width <= 0) {
      const left = parseFloat(pseudoStyle.left) || 0
      const right = parseFloat(pseudoStyle.right) || 0
      if (pseudoStyle.position === "absolute" && parentBox.width > 0) {
        width = Math.max(0, parentBox.width - left - right)
      } else {
        width = cleanContent ? 0 : parentBox.width || 16
      }
    }

    let height = parseFloat(pseudoStyle.height)
    if (isNaN(height) || height <= 0) {
      const top = parseFloat(pseudoStyle.top) || 0
      const bottom = parseFloat(pseudoStyle.bottom) || 0
      if (pseudoStyle.position === "absolute" && parentBox.height > 0) {
        height = Math.max(0, parentBox.height - top - bottom)
      } else {
        height = cleanContent ? 0 : parentBox.height || 16
      }
    }

    if (!cleanContent && width <= 0 && height <= 0) {
      if (parentBox.width > 0 && parentBox.height > 0) {
        width = parentBox.width
        height = parentBox.height
      } else {
        return null
      }
    }

    const fills: IRFill[] = []

    const bgImage = pseudoStyle.backgroundImage
    if (bgImage && bgImage !== "none") {
      if (bgImage.includes("gradient")) {
        const gradient = parseCssGradient(bgImage)
        if (gradient) fills.push(gradient)
      }
    }

    const bgColor = parseCssColor(pseudoStyle.backgroundColor)
    if (bgColor && bgColor.a > 0) {
      fills.push({ type: "SOLID", color: bgColor, opacity: bgColor.a, visible: true })
    }

    const { strokes, cornerRadius } = parseBorders(pseudoStyle, width, height)
    const effects = parseCssBoxShadow(pseudoStyle.boxShadow)

    let pseudoX = 0
    let pseudoY = 0

    if (pseudoStyle.position === "absolute") {
      if (pseudoStyle.left && pseudoStyle.left !== "auto") {
        pseudoX = parseFloat(pseudoStyle.left) || 0
      } else if (pseudoStyle.right && pseudoStyle.right !== "auto") {
        pseudoX = Math.max(0, parentBox.width - width - (parseFloat(pseudoStyle.right) || 0))
      }

      if (pseudoStyle.top && pseudoStyle.top !== "auto") {
        pseudoY = parseFloat(pseudoStyle.top) || 0
      } else if (pseudoStyle.bottom && pseudoStyle.bottom !== "auto") {
        pseudoY = Math.max(0, parentBox.height - height - (parseFloat(pseudoStyle.bottom) || 0))
      }
    } else {
      if (pseudo === "::before") {
        pseudoX = parseFloat(parentComputed.paddingLeft) || 0
        pseudoY = parseFloat(parentComputed.paddingTop) || 0
      } else {
        pseudoX = Math.max(0, parentBox.width - width - (parseFloat(parentComputed.paddingRight) || 0))
        pseudoY = parseFloat(parentComputed.paddingTop) || 0
      }
    }

    ctx.stats.totalNodes++

    const clipPath = pseudoStyle.clipPath || (pseudoStyle as any).webkitClipPath
    const cutout = handleCutoutContainer(
      clipPath,
      width,
      height,
      fills,
      strokes,
      effects,
      `${pseudo}`
    )

    const relBox: IRBox = {
      x: Math.round(pseudoX),
      y: Math.round(pseudoY),
      width: Math.round(width),
      height: Math.round(height)
    }

    const absBox: IRBox = {
      x: Math.round(parentBox.x + pseudoX),
      y: Math.round(parentBox.y + pseudoY),
      width: Math.round(width),
      height: Math.round(height)
    }

    if (cleanContent && cleanContent !== "none" && cleanContent !== "normal") {
      const typography = parseTypography(pseudoStyle, cleanContent)
      return {
        id: generateId("pseudo_text"),
        name: `${element.tagName.toLowerCase()}${pseudo}`,
        type: "TEXT",
        box: relBox,
        absoluteBox: absBox,
        opacity: parseFloat(pseudoStyle.opacity) || 1,
        fills: typography.fills || [],
        strokes: [],
        effects,
        textData: typography,
        children: [],
        metadata: {
          tagName: pseudo,
          isPseudoElement: pseudo === "::before" ? "before" : "after"
        }
      }
    }

    return {
      id: generateId("pseudo"),
      name: `${element.tagName.toLowerCase()}${pseudo}`,
      type: cutout.hasCutout ? "VECTOR" : "FRAME",
      box: relBox,
      absoluteBox: absBox,
      opacity: parseFloat(pseudoStyle.opacity) || 1,
      fills,
      strokes,
      cornerRadius,
      effects,
      vectorData: cutout.geometry
        ? {
            svgPath: cutout.geometry.svgPath,
            viewBox: { width, height },
            isCutoutBackground: true
          }
        : undefined,
      children: [],
      metadata: {
        tagName: pseudo,
        isPseudoElement: pseudo === "::before" ? "before" : "after"
      }
    }
  } catch {
    return null
  }
}

function getCachedComputedStyle(element: Element, ctx: TraversalContext): CSSStyleDeclaration | null {
  if (ctx.computedStyleCache.has(element)) {
    return ctx.computedStyleCache.get(element)!
  }
  try {
    const style = window.getComputedStyle(element)
    ctx.computedStyleCache.set(element, style)
    return style
  } catch {
    return null
  }
}

function formatNodeName(tag: string, className: string, id: string): string {
  let name = tag
  if (id) name += `#${id}`
  if (className) {
    const firstClass = className.trim().split(/\s+/)[0]
    if (firstClass) name += `.${firstClass}`
  }
  return name
}
