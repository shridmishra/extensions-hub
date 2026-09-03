import type { IRDocument, IRNode, IRFill } from "../types/ir"
import { convertElementToIRNode, isTextClippedBackground, type TraversalContext } from "./dom/traversal"
import { CLIPBOARD_MAGIC_HEADER } from "../constants/defaults"
import { convertIRToSvg } from "./svg/serializer"
import { copyDirectToFigmaClipboard } from "./clipboard/writer"
import { extractDocumentFonts } from "./css/fonts"
import { parseCssColor } from "./css/color"
import { parseCssGradient } from "./css/gradients"
import { embedImagesInIRDocument, resolveImageDataUrl } from "./dom/images"

export { convertIRToSvg, copyDirectToFigmaClipboard, extractDocumentFonts, embedImagesInIRDocument, resolveImageDataUrl }

export interface ConvertOptions {
  captureMode?: "element" | "fullPage"
  includePseudoElements?: boolean
}

/**
 * Resolves the effective background of the full page
 */
export function resolveDocumentBackground(): IRFill[] {
  if (typeof document === "undefined") {
    return [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 }, opacity: 1, visible: true }]
  }

  const docEl = document.documentElement
  const body = document.body

  const bodyStyle = body ? window.getComputedStyle(body) : null
  const docStyle = docEl ? window.getComputedStyle(docEl) : null

  let baseColor: { r: number; g: number; b: number; a: number } | null = null
  let gradientFill: IRFill | null = null

  const bodyColor = bodyStyle ? parseCssColor(bodyStyle.backgroundColor) : null
  if (bodyColor && bodyColor.a > 0.01) {
    baseColor = bodyColor
  }
  if (!baseColor) {
    const docColor = docStyle ? parseCssColor(docStyle.backgroundColor) : null
    if (docColor && docColor.a > 0.01) {
      baseColor = docColor
    }
  }

  const bodyBgImage = bodyStyle && bodyStyle.backgroundImage !== "none" ? bodyStyle.backgroundImage : ""
  const docBgImage = docStyle && docStyle.backgroundImage !== "none" ? docStyle.backgroundImage : ""
  const directBgImage = bodyBgImage || docBgImage

  if (directBgImage && (directBgImage.includes("gradient") || directBgImage.includes("url("))) {
    const grad = parseCssGradient(directBgImage)
    if (grad) gradientFill = grad
  }

  if (!gradientFill && body) {
    for (const pseudo of ["::before", "::after"] as const) {
      try {
        const ps = window.getComputedStyle(body, pseudo)
        if (ps && ps.backgroundImage && ps.backgroundImage !== "none" && ps.backgroundImage.includes("gradient")) {
          const grad = parseCssGradient(ps.backgroundImage)
          if (grad) {
            gradientFill = grad
            break
          }
        }
      } catch {}
    }
  }

  if (body) {
    const layoutCandidates = Array.from(
      body.querySelectorAll(
        "#root, #__next, main, section, [id^='app'], div.min-h-screen, div.h-screen, div.w-screen, div.h-full, div[class*='gradient'], div[class*='bg-'], div[class*='radial'], div[class*='dark'], div[class*='from-'], div.fixed.inset-0, div.absolute.inset-0, body > div, body > div > div"
      )
    ).slice(0, 30)

    for (const el of layoutCandidates) {
      try {
        const style = window.getComputedStyle(el)
        if (!gradientFill && style.backgroundImage && style.backgroundImage !== "none" && style.backgroundImage.includes("gradient")) {
          const grad = parseCssGradient(style.backgroundImage)
          if (grad) gradientFill = grad
        }
        if (!baseColor) {
          const c = parseCssColor(style.backgroundColor)
          if (c && c.a > 0.05) {
            baseColor = c
          }
        }
        if (gradientFill && baseColor) break
      } catch {}
    }
  }

  if (!baseColor) {
    const isExplicitDark =
      docEl?.classList.contains("dark") ||
      body?.classList.contains("dark") ||
      docEl?.getAttribute("data-theme") === "dark" ||
      body?.getAttribute("data-theme") === "dark" ||
      docEl?.getAttribute("data-mode") === "dark" ||
      body?.getAttribute("data-mode") === "dark" ||
      docEl?.getAttribute("data-theme") === "night" ||
      docEl?.getAttribute("data-theme") === "black"

    const colorScheme = docStyle?.colorScheme || bodyStyle?.colorScheme || ""
    const isDark = isExplicitDark || colorScheme.includes("dark")

    baseColor = isDark
      ? { r: 9 / 255, g: 9 / 255, b: 11 / 255, a: 1 }
      : { r: 248 / 255, g: 250 / 255, b: 252 / 255, a: 1 }
  }

  const fills: IRFill[] = []
  if (baseColor && baseColor.a > 0) {
    fills.push({ type: "SOLID", color: baseColor, opacity: baseColor.a, visible: true })
  }
  if (gradientFill) {
    fills.push(gradientFill)
  }

  return fills.length > 0 ? fills : [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 }, opacity: 1, visible: true }]
}

/**
 * Resolves the effective background of an element by walking up ancestor tree if transparent
 */
export function resolveElementBackground(element: Element): IRFill[] {
  let curr: Element | null = element
  let gradientFill: IRFill | null = null
  let baseColor: { r: number; g: number; b: number; a: number } | null = null

  while (curr && curr !== document.documentElement) {
    try {
      const style = window.getComputedStyle(curr)
      if (isTextClippedBackground(style)) {
        curr = curr.parentElement
        continue
      }
      if (!gradientFill && style.backgroundImage && style.backgroundImage !== "none" && style.backgroundImage.includes("gradient")) {
        const grad = parseCssGradient(style.backgroundImage)
        if (grad) gradientFill = grad
      }
      if (!baseColor) {
        const col = parseCssColor(style.backgroundColor)
        if (col && col.a > 0.05) {
          baseColor = col
        }
      }
      if (gradientFill && baseColor) break
    } catch {}
    curr = curr.parentElement
  }

  const fills: IRFill[] = []
  if (baseColor) {
    fills.push({ type: "SOLID", color: baseColor, opacity: baseColor.a, visible: true })
  }
  if (gradientFill) {
    fills.push(gradientFill)
  }

  return fills.length > 0 ? fills : resolveDocumentBackground()
}

/**
 * Converts a selected DOM Element and its subtree into an IRDocument
 */
export function convertElementToIR(
  element: Element,
  options: ConvertOptions = {}
): IRDocument {
  const rect = element.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset || 0
  const scrollY = window.scrollY || window.pageYOffset || 0

  const ctx: TraversalContext = {
    rootRect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    },
    computedStyleCache: new Map(),
    stats: {
      totalNodes: 0,
      textNodes: 0,
      vectorNodes: 0,
      cutoutNodes: 0,
      imageNodes: 0,
      warnings: []
    }
  }

  const rootNode = convertElementToIRNode(element, ctx)
  const { fonts, fontFaceCss } = extractDocumentFonts()

  if (rootNode && rootNode.fills.length === 0 && !rootNode.metadata?.isTextClipped) {
    rootNode.fills = resolveElementBackground(element)
  }

  const fallbackRoot: IRNode = {
    id: "root",
    name: "Captured Element",
    type: "FRAME",
    box: { x: 0, y: 0, width: Math.round(rect.width), height: Math.round(rect.height) },
    absoluteBox: { x: 0, y: 0, width: Math.round(rect.width), height: Math.round(rect.height) },
    opacity: 1,
    fills: resolveElementBackground(element),
    strokes: [],
    effects: [],
    children: [],
    metadata: { tagName: element.tagName.toLowerCase() }
  }

  return {
    version: "1.0.0",
    generator: "html2figma-extension",
    timestamp: Date.now(),
    title: document.title || "Captured Element",
    url: window.location.href,
    viewport: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      scrollX,
      scrollY
    },
    captureMode: options.captureMode || "element",
    rootNode: rootNode || fallbackRoot,
    fonts,
    fontFaceCss,
    stats: ctx.stats
  }
}

/**
 * Converts the entire scrollable webpage document into an IRDocument
 */
export function convertDocumentToIR(
  options: ConvertOptions = {}
): IRDocument {
  const docEl = document.documentElement
  const body = document.body

  const docStyle = docEl ? window.getComputedStyle(docEl) : null
  const bodyStyle = body ? window.getComputedStyle(body) : null
  const isOverflowXHidden =
    docStyle?.overflowX === "hidden" ||
    docStyle?.overflowX === "clip" ||
    bodyStyle?.overflowX === "hidden" ||
    bodyStyle?.overflowX === "clip"

  const clientWidth = docEl.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1440)

  let fullWidth = Math.max(
    body.scrollWidth,
    docEl.scrollWidth,
    body.offsetWidth,
    docEl.offsetWidth,
    docEl.clientWidth
  )

  // Clamp fullWidth to clientWidth if horizontal overflow is forbidden
  if (isOverflowXHidden && clientWidth > 0) {
    fullWidth = clientWidth
  }

  const fullHeight = Math.max(
    body.scrollHeight,
    docEl.scrollHeight,
    body.offsetHeight,
    docEl.offsetHeight,
    docEl.clientHeight
  )

  const scrollX = window.scrollX || window.pageXOffset || 0
  const scrollY = window.scrollY || window.pageYOffset || 0

  const ctx: TraversalContext = {
    rootRect: {
      left: -scrollX,
      top: -scrollY,
      width: fullWidth,
      height: fullHeight
    },
    computedStyleCache: new Map(),
    stats: {
      totalNodes: 0,
      textNodes: 0,
      vectorNodes: 0,
      cutoutNodes: 0,
      imageNodes: 0,
      warnings: []
    }
  }

  const rootNode = convertElementToIRNode(body, ctx)
  const { fonts, fontFaceCss } = extractDocumentFonts()
  const docBgFills = resolveDocumentBackground()

  if (rootNode) {
    rootNode.box = { x: 0, y: 0, width: fullWidth, height: fullHeight }
    rootNode.absoluteBox = { x: 0, y: 0, width: fullWidth, height: fullHeight }
    const hasGradientBg = docBgFills.some((f) => f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL")
    const rootHasGradient = rootNode.fills.some((f) => f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL")
    const isGenericWhite =
      rootNode.fills.length === 1 &&
      rootNode.fills[0].type === "SOLID" &&
      rootNode.fills[0].color.r === 1 &&
      rootNode.fills[0].color.g === 1 &&
      rootNode.fills[0].color.b === 1

    if ((hasGradientBg && !rootHasGradient) || rootNode.fills.length === 0 || isGenericWhite) {
      rootNode.fills = docBgFills
    }
  }

  const fallbackRoot: IRNode = {
    id: "root",
    name: "Full Page",
    type: "FRAME",
    box: { x: 0, y: 0, width: fullWidth, height: fullHeight },
    absoluteBox: { x: 0, y: 0, width: fullWidth, height: fullHeight },
    opacity: 1,
    fills: docBgFills,
    strokes: [],
    effects: [],
    children: [],
    metadata: { tagName: "body" }
  }

  return {
    version: "1.0.0",
    generator: "html2figma-extension",
    timestamp: Date.now(),
    title: document.title || "Full Page Capture",
    url: window.location.href,
    viewport: {
      width: fullWidth,
      height: fullHeight,
      scrollX,
      scrollY
    },
    captureMode: "fullPage",
    rootNode: rootNode || fallbackRoot,
    fonts,
    fontFaceCss,
    stats: ctx.stats
  }
}

export async function convertElementToIRAsync(
  element: Element,
  options: ConvertOptions = {}
): Promise<IRDocument> {
  const doc = convertElementToIR(element, options)
  return embedImagesInIRDocument(doc)
}

export async function convertDocumentToIRAsync(
  options: ConvertOptions = {}
): Promise<IRDocument> {
  const doc = convertDocumentToIR(options)
  return embedImagesInIRDocument(doc)
}

export function serializeIRForClipboard(document: IRDocument): string {
  return JSON.stringify({
    header: CLIPBOARD_MAGIC_HEADER,
    document
  })
}
