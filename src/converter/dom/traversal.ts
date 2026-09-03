import type {
  IRNode,
  IRBox,
  IRFill,
  IRStroke,
  IRColor
} from "../../types/ir"
import { IGNORED_TAGS } from "../../constants/defaults"
import { parseCssColor } from "../css/color"
import { parseCssGradient } from "../css/gradients"
import { parseCssBoxShadow, parseCssTextShadow, parseCssFilterDropShadow, parseCssFilterBlur, parseCssBackdropFilter } from "../css/shadows"
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
 * Detects whether an element's background is clipped to text (e.g. gradient text)
 */
export function isTextClippedBackground(
  computed: CSSStyleDeclaration | Record<string, string>
): boolean {
  if (!computed) return false
  const getProp = (p: string) => {
    if (typeof (computed as CSSStyleDeclaration).getPropertyValue === "function") {
      return (computed as CSSStyleDeclaration).getPropertyValue(p) || ""
    }
    const camel = p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    return (computed as any)[camel] || (computed as any)[p] || ""
  }

  const clip = (
    getProp("background-clip") ||
    getProp("-webkit-background-clip") ||
    (computed as any).backgroundClip ||
    (computed as any).webkitBackgroundClip ||
    ""
  ).toLowerCase()

  if (clip.includes("text")) return true

  // Fallback heuristic: transparent text paired with a background gradient
  const colorStr = getProp("color")
  const textFill = getProp("-webkit-text-fill-color")
  const bg = getProp("background-image")
  const isColorTransparent =
    colorStr === "transparent" ||
    textFill === "transparent" ||
    colorStr === "rgba(0, 0, 0, 0)" ||
    textFill === "rgba(0, 0, 0, 0)"

  if (isColorTransparent && bg && bg !== "none" && bg.includes("gradient")) {
    return true
  }

  return false
}

/**
 * Traverses an element and converts it into an IRNode tree
 */
export function convertElementToIRNode(
  element: Element,
  ctx: TraversalContext,
  parentBox?: IRBox,
  inheritedTextFills?: IRFill[]
): IRNode | null {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return null
  }

  // 0. Ignore Plasmo CSUI and Extension Hub UI overlays
  if (
    element.closest(".hub-extension-root") ||
    element.closest("plasmo-csui") ||
    element.id === "plasmo-shadow-container" ||
    element.tagName.toLowerCase().startsWith("plasmo-")
  ) {
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
  let opacity = parseFloat(computed.opacity)
  if (isNaN(opacity)) opacity = 1

  if (display === "none" || visibility === "collapse" || (element as HTMLElement).hidden) {
    return null
  }

  const rect = element.getBoundingClientRect()

  // Detect elements waiting for scroll-reveal animations (e.g. GSAP autoAlpha: 0, Framer Motion initial={{ opacity: 0 }})
  // These possess substantial content (headings, paragraphs, buttons, images) and valid dimensions,
  // but are momentarily hidden before user scroll triggers them.
  const hasAnimationHiddenCopy =
    (opacity <= 0.001 || visibility === "hidden") &&
    rect.width > 20 &&
    rect.height > 20 &&
    (element.querySelector("h1, h2, h3, h4, h5, h6, p, button, a, img, svg") !== null ||
      (element.textContent && element.textContent.trim().length > 5))

  if (hasAnimationHiddenCopy) {
    // Preserve content for Figma capture with full opacity
    opacity = 1
  } else if (visibility === "hidden" || opacity <= 0.001) {
    return null
  }

  const overflowX = computed.overflowX
  const overflowY = computed.overflowY
  const isOverflowHiddenX = overflowX === "hidden" || overflowX === "clip"
  const isOverflowHiddenY = overflowY === "hidden" || overflowY === "clip"

  // Skip closed accordions and collapsible panels (Radix, Shadcn, HeadlessUI)
  const dataState = element.getAttribute("data-state")
  if (
    dataState === "closed" &&
    (element.classList.contains("accordion-content") ||
      element.hasAttribute("data-radix-accordion-content") ||
      element.getAttribute("role") === "region")
  ) {
    const rawHeight = parseFloat(computed.height)
    if (isNaN(rawHeight) || rawHeight <= 1 || rect.height <= 1 || isOverflowHiddenY) {
      return null
    }
  }

  // Zero-height or zero-width elements with overflow hidden/clip are completely invisible
  if (rect.height <= 0.5 && (isOverflowHiddenY || isOverflowHiddenX)) {
    return null
  }
  if (rect.width <= 0.5 && (isOverflowHiddenX || isOverflowHiddenY)) {
    return null
  }

  // Visually hidden / screen-reader only elements (e.g. .sr-only: 1px by 1px with overflow hidden or clip: rect(0,0,0,0))
  const clipProp = computed.clip || ""
  const clipPathProp = computed.clipPath || (computed as any).webkitClipPath || ""
  if (
    rect.width <= 1.5 &&
    rect.height <= 1.5 &&
    (isOverflowHiddenX || isOverflowHiddenY || clipProp.includes("rect(0") || clipPathProp === "inset(50%)")
  ) {
    return null
  }

  if (rect.width <= 0 && rect.height <= 0) {
    if (element.children.length === 0 && !element.textContent?.trim()) {
      return null
    }
  }

  let absX = Math.round(rect.left - ctx.rootRect.left)
  let absY = Math.round(rect.top - ctx.rootRect.top)

  // Fixed elements at the top of viewport should never have negative Y (which cuts off nav)
  if (computed.position === "fixed" && absY < 0 && absY + rect.height > 10) {
    absY = 0
  }

  const absBox: IRBox = {
    x: absX,
    y: absY,
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
    if (typeof document !== "undefined" && absBox.width > 0 && absBox.height > 0) {
      const nw = imgEl.naturalWidth || Math.round(absBox.width)
      const nh = imgEl.naturalHeight || Math.round(absBox.height)
      dataUrl = captureMediaToDataUrl(
        imgEl,
        nw,
        nh,
        absBox.width,
        absBox.height,
        computed.objectFit,
        computed.objectPosition
      )
    }

    if (src || dataUrl) {
      fills.push({
        type: "IMAGE",
        scaleMode: computed.objectFit === "contain" ? "FIT" : "FILL",
        objectPosition: computed.objectPosition || "",
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
        id: element.id,
        zIndex: parseInt(computed.zIndex, 10) || 0,
        position: (computed.position as any) || "static",
        objectPosition: computed.objectPosition || ""
      }
    }
  }

  // 2b. Handle <video> elements (capture current video frame to canvas)
  if (tagName === "VIDEO") {
    const videoEl = element as HTMLVideoElement
    const fills: IRFill[] = []
    let dataUrl: string | undefined = undefined

    const vW = videoEl.videoWidth || Math.round(absBox.width)
    const vH = videoEl.videoHeight || Math.round(absBox.height)

    if (typeof document !== "undefined" && (vW > 0 || videoEl.readyState >= 2)) {
      dataUrl = captureMediaToDataUrl(
        videoEl,
        vW,
        vH,
        absBox.width,
        absBox.height,
        computed.objectFit,
        computed.objectPosition
      )
    }

    if (dataUrl) {
      fills.push({
        type: "IMAGE",
        scaleMode: computed.objectFit === "contain" ? "FIT" : "FILL",
        objectPosition: computed.objectPosition || "",
        url: dataUrl,
        dataUrl,
        visible: true
      })
    } else if (videoEl.poster && !videoEl.poster.endsWith(".mp4")) {
      fills.push({
        type: "IMAGE",
        scaleMode: computed.objectFit === "contain" ? "FIT" : "FILL",
        objectPosition: computed.objectPosition || "",
        url: videoEl.poster,
        visible: true
      })
    } else {
      // If video frame cannot be captured and no static poster is available,
      // return null so we don't emit broken MP4 URLs that obscure underlying images
      return null
    }

    const { strokes, cornerRadius } = parseBorders(computed, absBox.width, absBox.height)
    const effects = parseCssBoxShadow(computed.boxShadow)

    return {
      id: generateId("video"),
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
        tagName: "video",
        className,
        id: element.id,
        zIndex: parseInt(computed.zIndex, 10) || 0,
        position: (computed.position as any) || "static",
        objectPosition: computed.objectPosition || ""
      }
    }
  }

  // 3. Fills extraction & text-clipped background handling
  const isTextClip = isTextClippedBackground(computed)
  const fills: IRFill[] = []
  const textClippedFills: IRFill[] = []

  const bgColor = parseCssColor(computed.backgroundColor)
  if (bgColor && bgColor.a > 0) {
    if (isTextClip) {
      textClippedFills.push({
        type: "SOLID",
        color: bgColor,
        opacity: bgColor.a,
        visible: true
      })
    } else {
      fills.push({
        type: "SOLID",
        color: bgColor,
        opacity: bgColor.a,
        visible: true
      })
    }
  }

  const bgImage = computed.backgroundImage
  if (bgImage && bgImage !== "none") {
    if (bgImage.includes("gradient")) {
      const gradient = parseCssGradient(bgImage)
      if (gradient) {
        if (isTextClip) {
          textClippedFills.push(gradient)
        } else {
          fills.push(gradient)
        }
      }
    } else if (bgImage.includes("url(")) {
      const match = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/)
      if (match && match[1]) {
        let bgDataUrl: string | undefined = undefined
        if (typeof document !== "undefined" && absBox.width > 0 && absBox.height > 0) {
          try {
            const tempImg = new Image()
            tempImg.crossOrigin = "anonymous"
            tempImg.src = match[1]
            if (tempImg.complete && tempImg.naturalWidth > 0) {
              bgDataUrl = captureMediaToDataUrl(
                tempImg,
                tempImg.naturalWidth,
                tempImg.naturalHeight,
                absBox.width,
                absBox.height,
                computed.backgroundSize === "contain" ? "contain" : "cover",
                computed.backgroundPosition || "50% 50%"
              )
            }
          } catch {}
        }

        const imgFill: IRFill = {
          type: "IMAGE",
          scaleMode: computed.backgroundSize === "contain" ? "FIT" : "FILL",
          objectPosition: computed.backgroundPosition || "",
          url: match[1],
          dataUrl: bgDataUrl,
          visible: true
        }
        if (isTextClip) {
          textClippedFills.push(imgFill)
        } else {
          fills.push(imgFill)
        }
      }
    }
  }

  // Active text fills to propagate to text nodes and children
  let activeTextFills = textClippedFills.length > 0 ? textClippedFills : inheritedTextFills
  if (!isTextClip && activeTextFills) {
    const explicitTextFill =
      (computed as any).webkitTextFillColor ||
      (typeof computed.getPropertyValue === "function" ? computed.getPropertyValue("-webkit-text-fill-color") : "")
    const explicitColor =
      computed.color ||
      (typeof computed.getPropertyValue === "function" ? computed.getPropertyValue("color") : "")
    const isExplicitlyColored =
      (explicitTextFill && explicitTextFill !== "transparent" && !explicitTextFill.includes("currentcolor")) ||
      (explicitColor && explicitColor !== "transparent" && !explicitColor.includes("rgba(0, 0, 0, 0)"))
    if (isExplicitlyColored && (fills.length > 0 || computed.display === "block" || computed.display === "flex")) {
      activeTextFills = undefined
    }
  }

  const { strokes, cornerRadius } = parseBorders(computed, absBox.width, absBox.height)
  const filterVal = computed.filter || (computed as any).webkitFilter
  const backdropFilterVal = computed.backdropFilter || (computed as any).webkitBackdropFilter
  const boxShadowEffects = parseCssBoxShadow(computed.boxShadow)
  const filterDropShadows = parseCssFilterDropShadow(filterVal)
  const filterBlurs = parseCssFilterBlur(filterVal)
  const backdropBlurs = parseCssBackdropFilter(backdropFilterVal)
  const effects = [...boxShadowEffects, ...filterDropShadows, ...filterBlurs, ...backdropBlurs]

  if (effects.length === 0 && typeof window !== "undefined") {
    try {
      const afterComp = window.getComputedStyle(element, "::after")
      const afterShadows = parseCssBoxShadow(afterComp.boxShadow)
      const afterFilters = parseCssFilterDropShadow(afterComp.filter)
      const afterBlurs = parseCssFilterBlur(afterComp.filter)
      if (afterShadows.length > 0 || afterFilters.length > 0 || afterBlurs.length > 0) {
        effects.push(...afterShadows, ...afterFilters, ...afterBlurs)
      }
    } catch {}
  }
  const transformInfo = parseCssTransform(computed.transform)
  const layout = parseLayout(computed)
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
        const textNode = extractTextNode(
          child as Text,
          element,
          computed,
          ctx,
          absBox,
          activeTextFills
        )
        if (textNode) children.push(textNode)
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childIR = convertElementToIRNode(
        child as Element,
        ctx,
        absBox,
        activeTextFills
      )
      if (childIR) children.push(childIR)
    }
  }

  // 7. Handle ::after pseudo-element
  const afterNode = extractPseudoElement(element, "::after", ctx, absBox)
  if (afterNode) children.push(afterNode)

  // 8. Sort children by CSS stacking context so higher z-index / fixed / sticky elements
  // render AFTER normal flow content, ensuring headers and overlays appear on top in SVG/Figma
  const sortedChildren = children.length > 1 ? sortChildrenByStacking(children) : children

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
    children: sortedChildren,
    metadata: {
      tagName,
      className,
      id: element.id,
      zIndex: parseInt(computed.zIndex, 10) || 0,
      position: (computed.position as any) || "static",
      isClipped: isCutout,
      isTextClipped: isTextClip,
      originalClipPath: clipPathValue || undefined
    }
  }
}

function sortChildrenByStacking(children: IRNode[]): IRNode[] {
  return [...children].sort((a, b) => {
    const aZ = a.metadata?.zIndex ?? 0
    const bZ = b.metadata?.zIndex ?? 0
    const aPos = a.metadata?.position || "static"
    const bPos = b.metadata?.position || "static"

    const aIsPositioned = aPos !== "static"
    const bIsPositioned = bPos !== "static"

    if (aZ !== bZ) {
      return aZ - bZ
    }

    if (aIsPositioned && !bIsPositioned && aZ >= 0) {
      return 1
    }
    if (!aIsPositioned && bIsPositioned && bZ >= 0) {
      return -1
    }

    return 0
  })
}

function extractTextNode(
  textNode: Text,
  parentElement: Element,
  parentComputed: CSSStyleDeclaration,
  ctx: TraversalContext,
  parentBox: IRBox,
  activeTextFills?: IRFill[]
): IRNode | null {
  // If parent element has overflow hidden and height <= 0.5, text is clipped and invisible
  const parentOverflowY = parentComputed.overflowY
  const parentOverflowX = parentComputed.overflowX
  if (
    (parentOverflowY === "hidden" || parentOverflowY === "clip" || parentOverflowX === "hidden" || parentOverflowX === "clip") &&
    (parentBox.height <= 0.5 || parentBox.width <= 0.5)
  ) {
    return null
  }

  const rawText = textNode.textContent || ""
  const characters = rawText.trim()
  if (!characters) return null

  let rect: DOMRect
  let wrappedCharacters = characters
  let measuredLineHeight: number | undefined = undefined
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

    const clientRects = range.getClientRects()
    if (clientRects && clientRects.length > 1) {
      const wrapResult = wrapTextNodeLines(textNode, rawText, characters)
      wrappedCharacters = wrapResult.text
      if (wrapResult.measuredLineHeight && wrapResult.measuredLineHeight > 0) {
        measuredLineHeight = wrapResult.measuredLineHeight
      }
    }
  } catch {
    rect = parentElement.getBoundingClientRect()
  }

  if (rect.width <= 0.5 || rect.height <= 0.5) return null

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

  const typography = parseTypography(parentComputed, wrappedCharacters)
  typography.hasLeadingSpace = /^\s/.test(rawText)
  typography.hasTrailingSpace = /\s$/.test(rawText)
  if (measuredLineHeight && (!typography.lineHeightPx || typography.lineHeightPx < typography.fontSize)) {
    typography.lineHeightPx = measuredLineHeight
  }

  // Apply active text fills (e.g. from background-clip: text)
  if (activeTextFills && activeTextFills.length > 0) {
    typography.fills = activeTextFills
  } else {
    // Check if typography fills is transparent
    const isTransparent =
      !typography.fills ||
      typography.fills.length === 0 ||
      typography.fills.every(
        (f) =>
          !f.visible ||
          (f.type === "SOLID" && (f.opacity === 0 || f.color.a <= 0.01))
      )

    if (isTransparent) {
      const parentBg = parentComputed.backgroundImage
      if (parentBg && parentBg !== "none" && parentBg.includes("gradient")) {
        const grad = parseCssGradient(parentBg)
        if (grad) {
          typography.fills = [grad]
        }
      }

      const stillTransparent =
        !typography.fills ||
        typography.fills.length === 0 ||
        typography.fills.every(
          (f) =>
            !f.visible ||
            (f.type === "SOLID" && (f.opacity === 0 || f.color.a <= 0.01))
        )

      if (stillTransparent) {
        let fallbackColor: IRColor = { r: 17 / 255, g: 24 / 255, b: 39 / 255, a: 1 }
        let curEl: Element | null = parentElement
        while (curEl && curEl !== document.documentElement) {
          try {
            const curStyle = window.getComputedStyle(curEl)
            const c = parseCssColor(curStyle.color)
            if (c && c.a > 0.05) {
              fallbackColor = c
              break
            }
          } catch {}
          curEl = curEl.parentElement
        }
        typography.fills = [
          {
            type: "SOLID",
            color: fallbackColor,
            opacity: fallbackColor.a,
            visible: true
          }
        ]
      }
    }
  }

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

  const cleanName = wrappedCharacters.replace(/\s+/g, " ")
  return {
    id: generateId("text"),
    name: cleanName.length > 20 ? `"${cleanName.slice(0, 20)}…"` : `"${cleanName}"`,
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

export interface WrapTextResult {
  text: string
  measuredLineHeight?: number
}

/**
 * Detects visual soft-wrap line breaks in text nodes and returns the text with '\n' delimiters
 */
export function wrapTextNodeLines(
  textNode: Text,
  rawText: string,
  trimmedCharacters: string
): WrapTextResult {
  if (typeof document === "undefined") return { text: trimmedCharacters }
  try {
    const range = document.createRange()
    range.selectNodeContents(textNode)
    const clientRects = range.getClientRects()
    if (!clientRects || clientRects.length <= 1) return { text: trimmedCharacters }

    const wordsWithOffsets: Array<{ word: string; start: number; end: number }> = []
    const wordRegex = /\S+/g
    let match: RegExpExecArray | null
    while ((match = wordRegex.exec(rawText)) !== null) {
      wordsWithOffsets.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }

    if (wordsWithOffsets.length <= 1) return { text: trimmedCharacters }

    const lines: string[] = []
    let currentLineStart = wordsWithOffsets[0].start
    let currentLineEnd = wordsWithOffsets[0].end
    let currentLineTop: number | null = null
    const lineTops: number[] = []

    const wordRange = document.createRange()

    for (let i = 0; i < wordsWithOffsets.length; i++) {
      const item = wordsWithOffsets[i]
      let wordTop: number | null = null

      try {
        wordRange.setStart(textNode, item.start)
        wordRange.setEnd(textNode, item.end)
        const rects = wordRange.getClientRects()
        if (rects && rects.length > 0) {
          wordTop = rects[0].top
        } else {
          const r = wordRange.getBoundingClientRect()
          if (r.height > 0) wordTop = r.top
        }
      } catch {}

      if (wordTop !== null) {
        if (currentLineTop === null) {
          currentLineTop = wordTop
          lineTops.push(wordTop)
          currentLineStart = item.start
          currentLineEnd = item.end
        } else if (Math.abs(wordTop - currentLineTop) > 5) {
          const lineStr = rawText.substring(currentLineStart, currentLineEnd).trim()
          if (lineStr) lines.push(lineStr)
          currentLineStart = item.start
          currentLineEnd = item.end
          currentLineTop = wordTop
          lineTops.push(wordTop)
        } else {
          currentLineEnd = item.end
        }
      } else {
        currentLineEnd = item.end
      }
    }

    const lastLineStr = rawText.substring(currentLineStart, currentLineEnd).trim()
    if (lastLineStr) lines.push(lastLineStr)

    let measuredLineHeight: number | undefined = undefined
    if (lineTops.length >= 2) {
      const delta = Math.abs(lineTops[1] - lineTops[0])
      if (delta > 4 && delta < 200) {
        measuredLineHeight = Math.round(delta * 100) / 100
      }
    }

    if (lines.length > 1) {
      return { text: lines.join("\n"), measuredLineHeight }
    }

    return { text: trimmedCharacters, measuredLineHeight }
  } catch {
    return { text: trimmedCharacters }
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
    const pseudoFilter = pseudoStyle.filter || (pseudoStyle as any).webkitFilter
    const pseudoBackdrop = pseudoStyle.backdropFilter || (pseudoStyle as any).webkitBackdropFilter
    const effects = [
      ...parseCssBoxShadow(pseudoStyle.boxShadow),
      ...parseCssFilterDropShadow(pseudoFilter),
      ...parseCssFilterBlur(pseudoFilter),
      ...parseCssBackdropFilter(pseudoBackdrop)
    ]

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

function parseObjectPosition(posStr: string): { x: number; y: number } {
  const parts = (posStr || "").trim().toLowerCase().split(/\s+/)
  let x = 0.5
  let y = 0.5

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p === "left") x = 0
    else if (p === "right") x = 1
    else if (p === "center") {
      if (i === 0) x = 0.5
      else y = 0.5
    } else if (p === "top") y = 0
    else if (p === "bottom") y = 1
    else if (p.endsWith("%")) {
      const val = parseFloat(p) / 100
      if (!isNaN(val)) {
        if (i === 0) x = Math.max(0, Math.min(1, val))
        else y = Math.max(0, Math.min(1, val))
      }
    }
  }

  return { x, y }
}

function captureMediaToDataUrl(
  source: HTMLImageElement | HTMLVideoElement,
  naturalWidth: number,
  naturalHeight: number,
  targetWidth: number,
  targetHeight: number,
  objectFit: string = "fill",
  objectPosition: string = "50% 50%"
): string | undefined {
  if (typeof document === "undefined") return undefined
  if (targetWidth <= 0 || targetHeight <= 0) return undefined

  try {
    const canvas = document.createElement("canvas")
    const pixelRatio = typeof window !== "undefined" && window.devicePixelRatio
      ? Math.min(3, Math.max(2, window.devicePixelRatio))
      : 2
    const maxDim = 2048
    const scale = Math.min(pixelRatio, maxDim / Math.max(targetWidth, targetHeight))

    const cW = Math.max(1, Math.round(targetWidth * scale))
    const cH = Math.max(1, Math.round(cW * (targetHeight / targetWidth)))
    canvas.width = cW
    canvas.height = cH

    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const nw = naturalWidth > 0 ? naturalWidth : (source as any).videoWidth || (source as any).width || targetWidth
    const nh = naturalHeight > 0 ? naturalHeight : (source as any).videoHeight || (source as any).height || targetHeight
    const imageRatio = nw / nh
    const targetRatio = cW / cH

    const fit = (objectFit || "fill").toLowerCase().trim()
    const pos = parseObjectPosition(objectPosition)

    let dW = cW
    let dH = cH
    let dx = 0
    let dy = 0

    if (fit === "contain") {
      if (imageRatio > targetRatio) {
        dH = Math.round(cW / imageRatio)
        dy = Math.round((cH - dH) * pos.y)
      } else {
        dW = Math.round(cH * imageRatio)
        dx = Math.round((cW - dW) * pos.x)
      }
    } else if (fit === "cover") {
      if (imageRatio > targetRatio) {
        dW = Math.round(cH * imageRatio)
        dx = Math.round((cW - dW) * pos.x)
      } else {
        dH = Math.round(cW / imageRatio)
        dy = Math.round((cH - dH) * pos.y)
      }
    } else if (fit === "none") {
      dW = nw
      dH = nh
      dx = Math.round((cW - dW) * pos.x)
      dy = Math.round((cH - dH) * pos.y)
    } else if (fit === "scale-down") {
      if (nw <= cW && nh <= cH) {
        dW = nw
        dH = nh
        dx = Math.round((cW - dW) * pos.x)
        dy = Math.round((cH - dH) * pos.y)
      } else {
        if (imageRatio > targetRatio) {
          dH = Math.round(cW / imageRatio)
          dy = Math.round((cH - dH) * pos.y)
        } else {
          dW = Math.round(cH * imageRatio)
          dx = Math.round((cW - dW) * pos.x)
        }
      }
    } else {
      // "fill" or unstyled default
      dW = cW
      dH = cH
      dx = 0
      dy = 0
    }

    ctx.clearRect(0, 0, cW, cH)
    ctx.drawImage(source, dx, dy, dW, dH)

    return canvas.toDataURL("image/png")
  } catch {
    return undefined
  }
}
