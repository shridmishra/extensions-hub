import type {
  IRDocument,
  IRNode,
  IRFill,
  IRStroke,
  IREffect,
  IRColor
} from "../../types/ir.ts"
import { cleanFontFamilyName, isGenericFontFamily } from "../css/fonts.ts"
import { createRoundedRectPath } from "../clip-path/geometry.ts"

interface SvgBuildContext {
  defs: string[]
  defIdMap: Map<string, string>
  counter: number
  isDarkTheme?: boolean
}

/**
 * Converts an IRDocument into a hierarchical multi-layer SVG document
 */
export function convertIRToSvg(doc: IRDocument): string {
  const width = Math.max(1, doc.viewport.width)
  const height = Math.max(1, doc.viewport.height)

  let isDarkTheme = false
  const rootSolid = doc.rootNode?.fills?.find((f) => f.type === "SOLID")
  if (rootSolid && rootSolid.type === "SOLID") {
    const lum = 0.299 * rootSolid.color.r + 0.587 * rootSolid.color.g + 0.114 * rootSolid.color.b
    isDarkTheme = lum < 0.4
  }

  const ctx: SvgBuildContext = {
    defs: [],
    defIdMap: new Map(),
    counter: 0,
    isDarkTheme
  }

  const fontFamilies = new Set<string>()
  if (doc.fonts) {
    doc.fonts.forEach((f) => {
      const clean = cleanFontFamilyName(f.family)
      if (clean && !isGenericFontFamily(clean)) fontFamilies.add(clean)
    })
  }

  collectFontsFromNode(doc.rootNode, fontFamilies)

  const fontImports: string[] = []
  fontFamilies.forEach((family) => {
    const cleanFam = cleanFontFamilyName(family)
    if (cleanFam && !isGenericFontFamily(cleanFam)) {
      if (cleanFam.toLowerCase() === "satoshi") {
        fontImports.push(
          `@import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap');`
        )
      } else {
        fontImports.push(
          `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFam).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');`
        )
      }
    }
  })

  const allCssRules = [...(doc.fontFaceCss || []), ...fontImports]
  if (allCssRules.length > 0) {
    const fontStyles = Array.from(new Set(allCssRules)).join("\n")
    ctx.defs.push(`<style type="text/css">\n<![CDATA[\n${fontStyles}\n]]>\n</style>`)
  }

  const bodyContent = renderNodeToSvg(doc.rootNode, ctx)

  const defsSection =
    ctx.defs.length > 0
      ? `  <defs>\n${ctx.defs.map((d) => `    ${d}`).join("\n")}\n  </defs>\n`
      : ""

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: transparent;">`,
    defsSection + bodyContent,
    `</svg>`
  ].join("\n")
}

function collectFontsFromNode(node: IRNode, fontSet: Set<string>): void {
  if (!node) return
  if (node.type === "TEXT" && node.textData?.fontFamily) {
    const clean = cleanFontFamilyName(node.textData.fontFamily)
    if (clean && !isGenericFontFamily(clean)) {
      fontSet.add(clean)
    }
  }
  if (node.children && node.children.length > 0) {
    node.children.forEach((c) => collectFontsFromNode(c, fontSet))
  }
}

interface InlineTextSpan {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  fontStyle: string
  letterSpacing: string
  textDecoration: string
  fill: string
  x: number
  y: number
  width: number
  height: number
  hasLeadingSpace?: boolean
  hasTrailingSpace?: boolean
}

function tryExtractInlineTextSpans(node: IRNode, ctx: SvgBuildContext): InlineTextSpan[][] | null {
  if (!node.children || node.children.length < 2) return null

  // 1. Never merge structural containers (navbars, menus, lists, toolbars)
  const nodeTag = (node.metadata?.tagName || "").toUpperCase()
  if (
    nodeTag === "NAV" ||
    nodeTag === "HEADER" ||
    nodeTag === "FOOTER" ||
    nodeTag === "UL" ||
    nodeTag === "OL" ||
    nodeTag === "MENU"
  ) {
    return null
  }

  const nodeNameLower = (node.name || "").toLowerCase()
  if (
    nodeNameLower.includes("nav") ||
    nodeNameLower.includes("menu") ||
    nodeNameLower.includes("tab") ||
    nodeNameLower.includes("header") ||
    nodeNameLower.includes("toolbar")
  ) {
    return null
  }

  // 2. Never merge if any child is an interactive link or button
  const hasInteractiveChildren = node.children.some((c) => {
    const tag = (c.metadata?.tagName || "").toUpperCase()
    return tag === "A" || tag === "BUTTON"
  })
  if (hasInteractiveChildren) {
    return null
  }


  // If this container has non-text visuals, don't merge
  const hasSolidBg = node.fills?.some(
    (f) => f.type === "SOLID" && f.visible && (f.opacity ?? f.color.a ?? 1) > 0.01
  )
  const hasGradBg = node.fills?.some(
    (f) => (f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL") && f.visible
  )
  const isTextClipped = !!node.metadata?.isTextClipped
  if (!isTextClipped && (hasSolidBg || hasGradBg)) return null
  if (node.strokes && node.strokes.length > 0) return null
  if (node.vectorData?.svgPath) return null

  const spans: InlineTextSpan[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === "TEXT" && child.textData) {
      const textData = child.textData
      const chars = textData.characters || ""
      if (!chars.trim()) continue

      let textFill = formatFillToSvg(textData.fills?.[0], ctx, true)
      if (textFill === "none") {
        textFill = ctx.isDarkTheme ? "rgb(243, 244, 246)" : "rgb(17, 24, 39)"
      }

      spans.push({
        text: chars,
        fontFamily: cleanFontFamilyName(textData.fontFamily) || "Inter",
        fontSize: textData.fontSize || 14,
        fontWeight: textData.fontWeight || 400,
        fontStyle: textData.fontStyle === "italic" ? ` font-style="italic"` : "",
        letterSpacing: textData.letterSpacingPx ? ` letter-spacing="${round2(textData.letterSpacingPx)}px"` : "",
        textDecoration: textData.textDecoration === "UNDERLINE" ? ` text-decoration="underline"` : "",
        fill: textFill,
        x: child.box.x,
        y: child.box.y,
        width: child.box.width,
        height: child.box.height,
        hasLeadingSpace: textData.hasLeadingSpace,
        hasTrailingSpace: textData.hasTrailingSpace
      })
    } else if (child.type === "FRAME") {
      const childHasBg = child.fills?.some(
        (f) => f.visible && (f.type === "SOLID" ? (f.opacity ?? f.color.a ?? 1) > 0.01 : true)
      )
      const childIsTextClipped = !!child.metadata?.isTextClipped
      if (!childIsTextClipped && childHasBg) return null
      if (child.strokes && child.strokes.length > 0) return null
      if (child.vectorData?.svgPath) return null

      const textGrandchildren = child.children?.filter((c) => c.type === "TEXT" && c.textData) || []
      if (textGrandchildren.length !== 1 || (child.children && child.children.length !== 1)) {
        return null
      }

      const grandText = textGrandchildren[0]
      const textData = grandText.textData!
      const chars = textData.characters || ""
      if (!chars.trim()) continue

      let textFill = formatFillToSvg(textData.fills?.[0], ctx, true)
      if (textFill === "none" && child.fills && child.fills.length > 0) {
        textFill = formatFillToSvg(child.fills[0], ctx, true)
      }
      if (textFill === "none") {
        textFill = ctx.isDarkTheme ? "rgb(243, 244, 246)" : "rgb(17, 24, 39)"
      }

      spans.push({
        text: chars,
        fontFamily: cleanFontFamilyName(textData.fontFamily) || "Inter",
        fontSize: textData.fontSize || 14,
        fontWeight: textData.fontWeight || 400,
        fontStyle: textData.fontStyle === "italic" ? ` font-style="italic"` : "",
        letterSpacing: textData.letterSpacingPx ? ` letter-spacing="${round2(textData.letterSpacingPx)}px"` : "",
        textDecoration: textData.textDecoration === "UNDERLINE" ? ` text-decoration="underline"` : "",
        fill: textFill,
        x: child.box.x,
        y: child.box.y,
        width: child.box.width,
        height: child.box.height,
        hasLeadingSpace: textData.hasLeadingSpace,
        hasTrailingSpace: textData.hasTrailingSpace
      })
    } else {
      return null
    }
  }

  if (spans.length < 2) return null

  // Group spans into distinct lines by y coordinate
  const lineGroups: InlineTextSpan[][] = []
  for (const span of spans) {
    let placed = false
    for (const line of lineGroups) {
      if (Math.abs(span.y - line[0].y) < Math.max(span.fontSize, line[0].fontSize) * 0.7) {
        line.push(span)
        placed = true
        break
      }
    }
    if (!placed) {
      lineGroups.push([span])
    }
  }

  return lineGroups
}

function renderMergedInlineTextSpans(
  lineGroups: InlineTextSpan[][],
  ctx: SvgBuildContext
): string {
  const lineStrings: string[] = []

  for (const line of lineGroups) {
    line.sort((a, b) => a.x - b.x)

    const firstSpan = line[0]
    const fontSize = firstSpan.fontSize
    const fontFamilyAttr = escapeXml(firstSpan.fontFamily)
    const fontWeight = firstSpan.fontWeight
    const startX = firstSpan.x
    const centerY = firstSpan.y + firstSpan.height / 2
    const baselineY = centerY + fontSize * 0.35

    const tspansMarkup = line
      .map((span, idx) => {
        let content = span.text
        if (span.hasLeadingSpace && !content.startsWith(" ") && idx > 0) {
          content = " " + content
        }
        if (idx < line.length - 1) {
          const nextSpan = line[idx + 1]
          const gap = nextSpan.x - (span.x + span.width)
          const needsSpace =
            gap > 1 || span.hasTrailingSpace || nextSpan.hasLeadingSpace
          if (needsSpace && !content.endsWith(" ")) {
            content += " "
          }
        }
        const fontStyleAttr = span.fontStyle
        const letterSpacingAttr = span.letterSpacing
        const textDecorationAttr = span.textDecoration
        return `<tspan fill="${span.fill}"${fontStyleAttr}${letterSpacingAttr}${textDecorationAttr}>${escapeXml(content)}</tspan>`
      })
      .join("")

    lineStrings.push(
      `    <text x="${round2(startX)}" y="${round2(baselineY)}" text-anchor="start" font-family="${fontFamilyAttr}" font-size="${fontSize}" font-weight="${fontWeight}">${tspansMarkup}</text>`
    )
  }

  return lineStrings.join("\n")
}

function renderNodeToSvg(node: IRNode, ctx: SvgBuildContext): string {
  if (!node) return ""

  const x = node.box.x
  const y = node.box.y
  const width = Math.max(0, node.box.width)
  const height = Math.max(0, node.box.height)
  const opacity = node.opacity !== undefined && node.opacity < 1 ? ` opacity="${node.opacity}"` : ""

  // 1. TEXT NODE
  if (node.type === "TEXT" && node.textData) {
    const textData = node.textData
    let textFill = formatFillToSvg(textData.fills?.[0], ctx, true)
    if (textFill === "none" && textData.fills && textData.fills.length > 1) {
      for (let i = 1; i < textData.fills.length; i++) {
        const candidate = formatFillToSvg(textData.fills[i], ctx, true)
        if (candidate !== "none") {
          textFill = candidate
          break
        }
      }
    }
    if (textFill === "none" && node.fills && node.fills.length > 0) {
      for (const f of node.fills) {
        const candidate = formatFillToSvg(f, ctx, true)
        if (candidate !== "none") {
          textFill = candidate
          break
        }
      }
    }
    if (textFill === "none") {
      textFill = ctx.isDarkTheme ? "rgb(243, 244, 246)" : "rgb(17, 24, 39)"
    }
    const fontSize = textData.fontSize || 14

    const primaryClean = cleanFontFamilyName(textData.fontFamily) || "Inter"
    const fontFamilyAttr = escapeXml(primaryClean)
    const fontWeight = textData.fontWeight || 400
    const fontStyle = textData.fontStyle === "italic" ? ` font-style="italic"` : ""
    const letterSpacing =
      textData.letterSpacingPx !== undefined && textData.letterSpacingPx !== 0
        ? ` letter-spacing="${round2(textData.letterSpacingPx)}px"`
        : ""
    const textDecoration =
      textData.textDecoration === "UNDERLINE"
        ? ` text-decoration="underline"`
        : textData.textDecoration === "STRIKETHROUGH"
        ? ` text-decoration="line-through"`
        : ""

    let textAnchor = "start"
    let textX = x

    if (textData.textAlign === "CENTER") {
      textAnchor = "middle"
      textX = x + width / 2
    } else if (textData.textAlign === "RIGHT") {
      textAnchor = "end"
      textX = x + width
    } else {
      textAnchor = "start"
      textX = x
    }

    let chars = textData.characters || ""
    if (textData.textCase === "UPPER") chars = chars.toUpperCase()
    else if (textData.textCase === "LOWER") chars = chars.toLowerCase()

    if (chars.includes("\n")) {
      const lines = chars.split("\n")
      const lineHeight = textData.lineHeightPx || fontSize * 1.3
      const startBaselineY = y + fontSize * 0.85
      const tspans = lines
        .map((line, idx) => {
          const dyAttr = idx === 0 ? "" : ` dy="${round2(lineHeight)}"`
          return `<tspan x="${round2(textX)}"${dyAttr}>${escapeXml(line)}</tspan>`
        })
        .join("")
      return `  <text x="${round2(textX)}" y="${round2(startBaselineY)}" text-anchor="${textAnchor}" font-family="${fontFamilyAttr}" font-size="${fontSize}" font-weight="${fontWeight}"${fontStyle}${letterSpacing}${textDecoration} fill="${textFill}"${opacity}>${tspans}</text>`
    }

    const centerY = y + height / 2
    const baselineY = centerY + fontSize * 0.35

    return `  <text x="${round2(textX)}" y="${round2(baselineY)}" text-anchor="${textAnchor}" font-family="${fontFamilyAttr}" font-size="${fontSize}" font-weight="${fontWeight}"${fontStyle}${letterSpacing}${textDecoration} fill="${textFill}"${opacity}>${escapeXml(chars)}</text>`
  }

  // 2. VECTOR NODE
  if (node.type === "VECTOR" && node.vectorData?.svgPath) {
    const vectorFill =
      node.fills?.find((f) => (f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL") && f.visible) ||
      node.fills?.find((f) => f.visible)
    let fillAttr = formatFillToSvg(vectorFill, ctx)
    if (fillAttr === "none" && node.effects && node.effects.length > 0) {
      fillAttr = "rgb(255, 255, 255)"
    }
    const strokeAttr = formatStrokeToSvg(node.strokes?.[0])
    const filterAttr = formatEffectsToFilter(node.effects, ctx)
    const transformAttr = x !== 0 || y !== 0 ? ` transform="translate(${round2(x)}, ${round2(y)})"` : ""

    return `  <path d="${node.vectorData.svgPath}"${transformAttr} fill="${fillAttr}"${strokeAttr}${filterAttr}${opacity} data-name="${escapeXml(node.name)}" />`
  }

  // 3. SVG NODE
  if (node.type === "SVG" && node.svgContent) {
    const transformAttr = x !== 0 || y !== 0 ? ` transform="translate(${round2(x)}, ${round2(y)})"` : ""
    const unwrapped = unwrapSvgToGroup(node.svgContent, width, height, ctx)
    return `  <g${transformAttr}${opacity} data-name="${escapeXml(node.name)}">\n    ${unwrapped}\n  </g>`
  }

  // 4. IMAGE NODE
  if (node.type === "IMAGE") {
    return renderImageNodeToSvg(node, ctx)
  }

  // 5. FRAME NODE
  const solidFill = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false)
  const gradientFill = node.fills?.find(
    (f) => (f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL") && f.visible !== false
  )
  const imgFill = node.fills?.find((f) => f.type === "IMAGE" && f.visible !== false) as any

  const solidFillAttr = solidFill ? formatFillToSvg(solidFill, ctx) : "none"
  const gradFillAttr = gradientFill ? formatFillToSvg(gradientFill, ctx) : "none"
  const filterAttr = formatEffectsToFilter(node.effects, ctx)

  const hasSolidBg = !!(solidFill && solidFillAttr !== "none")
  const hasGradBg = !!(gradientFill && gradFillAttr !== "none")
  const hasImgBg = !!(imgFill && (imgFill.dataUrl || imgFill.url))
  const hasBackground = hasSolidBg || hasGradBg || hasImgBg
  const hasStroke = node.strokes && node.strokes.length > 0
  const hasEffects = node.effects && node.effects.some((e) => e.type === "DROP_SHADOW" && e.visible)
  const stroke = node.strokes?.[0]

  const isClipped = !!(node.metadata?.isClipped && node.vectorData?.svgPath)
  const hasCornerRadius =
    typeof node.cornerRadius === "number"
      ? node.cornerRadius > 0
      : Array.isArray(node.cornerRadius) && node.cornerRadius.some((r) => r > 0)
  const hasNonTextChildren = node.children && node.children.some((c) => c.type !== "TEXT")
  const hasOverflowClip = !!(
    node.clipsContent &&
    width > 0 &&
    height > 0 &&
    (hasCornerRadius || isClipped || hasNonTextChildren)
  )

  let childrenClipId: string | null = null
  if (isClipped && node.vectorData?.svgPath) {
    childrenClipId = `clip_${++ctx.counter}`
    ctx.defs.push(`<clipPath id="${childrenClipId}"><path d="${node.vectorData.svgPath}" /></clipPath>`)
  } else if (hasOverflowClip) {
    childrenClipId = `clip_${++ctx.counter}`
    if (Array.isArray(node.cornerRadius) && !isAllCornersEqual(node.cornerRadius)) {
      const [tl, tr, br, bl] = node.cornerRadius
      const pathD = createRoundedRectPath(0, 0, width, height, tl, tr, br, bl)
      ctx.defs.push(`<clipPath id="${childrenClipId}"><path d="${pathD}" /></clipPath>`)
    } else {
      const radiusAttr = formatCornerRadiusAttr(node.cornerRadius, width, height)
      ctx.defs.push(`<clipPath id="${childrenClipId}"><rect x="0" y="0" width="${round2(width + 1)}" height="${round2(height + 1)}"${radiusAttr} /></clipPath>`)
    }
  }

  const isUniformStroke =
    !stroke ||
    (stroke.top === stroke.right &&
      stroke.right === stroke.bottom &&
      stroke.bottom === stroke.left)

  let bgMarkup = ""
  const isTextClipped = !!node.metadata?.isTextClipped

  if (!isTextClipped && (hasBackground || hasStroke || hasEffects) && width > 0 && height > 0) {
    const strokeAttr = isUniformStroke ? formatStrokeToSvg(stroke) : ""
    const radiusAttr = formatCornerRadiusAttr(node.cornerRadius, width, height)

    if (hasSolidBg || hasStroke || (!hasGradBg && !hasImgBg && hasEffects)) {
      const effectiveSolid = hasSolidBg ? solidFillAttr : "none"
      const applyFilter = !hasGradBg ? filterAttr : ""
      const applyStroke = !hasGradBg ? strokeAttr : ""

      if (isClipped && node.vectorData?.svgPath) {
        bgMarkup += `    <path d="${node.vectorData.svgPath}" fill="${effectiveSolid}"${applyStroke}${applyFilter} />\n`
      } else if (Array.isArray(node.cornerRadius) && !isAllCornersEqual(node.cornerRadius)) {
        const [tl, tr, br, bl] = node.cornerRadius
        const pathD = createRoundedRectPath(0, 0, width, height, tl, tr, br, bl)
        bgMarkup += `    <path d="${pathD}" fill="${effectiveSolid}"${applyStroke}${applyFilter} />\n`
      } else {
        bgMarkup += `    <rect x="0" y="0" width="${round2(width)}" height="${round2(height)}" fill="${effectiveSolid}"${applyStroke}${radiusAttr}${applyFilter} />\n`
      }
    }

    if (hasGradBg) {
      if (isClipped && node.vectorData?.svgPath) {
        bgMarkup += `    <path d="${node.vectorData.svgPath}" fill="${gradFillAttr}"${strokeAttr}${filterAttr} />\n`
      } else if (Array.isArray(node.cornerRadius) && !isAllCornersEqual(node.cornerRadius)) {
        const [tl, tr, br, bl] = node.cornerRadius
        const pathD = createRoundedRectPath(0, 0, width, height, tl, tr, br, bl)
        bgMarkup += `    <path d="${pathD}" fill="${gradFillAttr}"${strokeAttr}${filterAttr} />\n`
      } else {
        bgMarkup += `    <rect x="0" y="0" width="${round2(width)}" height="${round2(height)}" fill="${gradFillAttr}"${strokeAttr}${radiusAttr}${filterAttr} />\n`
      }
    }

    if (hasImgBg) {
      const bgImgUrl = imgFill.dataUrl || imgFill.url
      const imgClip = childrenClipId ? ` clip-path="url(#${childrenClipId})"` : ""
      const isDataUrl = (bgImgUrl || "").startsWith("data:")
      const bgAspect = isDataUrl
        ? "none"
        : getPreserveAspectRatio(
            imgFill?.scaleMode,
            imgFill?.objectPosition || node.metadata?.objectPosition
          )
      bgMarkup += `    <image href="${escapeXml(bgImgUrl)}" xlink:href="${escapeXml(bgImgUrl)}" x="0" y="0" width="${round2(width)}" height="${round2(height)}"${radiusAttr}${imgClip} preserveAspectRatio="${bgAspect}" />\n`
    }

    if (
      !isUniformStroke &&
      stroke &&
      stroke.visible &&
      stroke.width > 0 &&
      stroke.color &&
      (stroke.color.a === undefined || stroke.color.a > 0.01) &&
      !isClipped
    ) {
      const strokeColor = formatRgba(stroke.color)
      if (stroke.top && stroke.top > 0) {
        bgMarkup += `    <line x1="0" y1="${round2(stroke.top / 2)}" x2="${round2(width)}" y2="${round2(stroke.top / 2)}" stroke="${strokeColor}" stroke-width="${stroke.top}" />\n`
      }
      if (stroke.bottom && stroke.bottom > 0) {
        bgMarkup += `    <line x1="0" y1="${round2(height - stroke.bottom / 2)}" x2="${round2(width)}" y2="${round2(height - stroke.bottom / 2)}" stroke="${strokeColor}" stroke-width="${stroke.bottom}" />\n`
      }
      if (stroke.left && stroke.left > 0) {
        bgMarkup += `    <line x1="${round2(stroke.left / 2)}" y1="0" x2="${round2(stroke.left / 2)}" y2="${round2(height)}" stroke="${strokeColor}" stroke-width="${stroke.left}" />\n`
      }
      if (stroke.right && stroke.right > 0) {
        bgMarkup += `    <line x1="${round2(width - stroke.right / 2)}" y1="0" x2="${round2(width - stroke.right / 2)}" y2="${round2(height)}" stroke="${strokeColor}" stroke-width="${stroke.right}" />\n`
      }
    }
  }

  let childrenSvg = ""
  if (node.children && node.children.length > 0) {
    const inlineLines = tryExtractInlineTextSpans(node, ctx)
    if (inlineLines && inlineLines.length > 0) {
      childrenSvg = renderMergedInlineTextSpans(inlineLines, ctx) + "\n"
    } else {
      const rendered = node.children
        .map((child) => renderNodeToSvg(child, ctx))
        .filter(Boolean)
        .join("\n")

      if (rendered) {
        if (childrenClipId) {
          childrenSvg = `    <g clip-path="url(#${childrenClipId})">\n${rendered}\n    </g>\n`
        } else {
          childrenSvg = `${rendered}\n`
        }
      }
    }
  }

  const transformAttr = x !== 0 || y !== 0 ? ` transform="translate(${round2(x)}, ${round2(y)})"` : ""

  return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${opacity}>\n${bgMarkup}${childrenSvg}  </g>`
}

function getPreserveAspectRatio(scaleMode?: string, objectPosition?: string): string {
  const objectPos = (objectPosition || "").toLowerCase().trim()
  const posParts = objectPos.split(/\s+/)
  let alignY = "YMid"
  if (objectPos.includes("bottom") || posParts[1] === "100%") {
    alignY = "YMax"
  } else if (objectPos.includes("top") || posParts[1] === "0%" || posParts[1] === "0") {
    alignY = "YMin"
  }

  let alignX = "xMid"
  if (objectPos.includes("left") || posParts[0] === "0%" || posParts[0] === "0") {
    alignX = "xMin"
  } else if (objectPos.includes("right") || posParts[0] === "100%") {
    alignX = "xMax"
  }

  return scaleMode === "FIT" ? `${alignX}${alignY} meet` : `${alignX}${alignY} slice`
}

function renderImageNodeToSvg(node: IRNode, ctx: SvgBuildContext): string {
  const x = node.box.x
  const y = node.box.y
  const width = Math.max(1, node.box.width)
  const height = Math.max(1, node.box.height)
  const opacity = node.opacity !== undefined && node.opacity < 1 ? ` opacity="${node.opacity}"` : ""

  const imgFill = node.fills?.find((f) => f.type === "IMAGE") as any
  const url = imgFill?.dataUrl || imgFill?.url || ""
  const filterAttr = formatEffectsToFilter(node.effects, ctx)
  const radiusAttr = formatCornerRadiusAttr(node.cornerRadius, width, height)
  const strokeAttr = formatStrokeToSvg(node.strokes?.[0])
  const transformAttr = x !== 0 || y !== 0 ? ` transform="translate(${round2(x)}, ${round2(y)})"` : ""

  const isCircle = isCircularNode(node.cornerRadius, width, height)

  if (url) {
    let clipAttr = ""
    if (isCircle) {
      const clipId = `clip_img_${++ctx.counter}`
      const r = round2(Math.min(width, height) / 2)
      const cx = round2(width / 2)
      const cy = round2(height / 2)
      ctx.defs.push(`<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>`)
      clipAttr = ` clip-path="url(#${clipId})"`
    } else if (node.cornerRadius) {
      const clipId = `clip_img_${++ctx.counter}`
      if (Array.isArray(node.cornerRadius) && !isAllCornersEqual(node.cornerRadius)) {
        const [tl, tr, br, bl] = node.cornerRadius
        const pathD = createRoundedRectPath(0, 0, width, height, tl, tr, br, bl)
        ctx.defs.push(`<clipPath id="${clipId}"><path d="${pathD}" /></clipPath>`)
      } else {
        ctx.defs.push(`<clipPath id="${clipId}"><rect x="0" y="0" width="${round2(width)}" height="${round2(height)}"${radiusAttr} /></clipPath>`)
      }
      clipAttr = ` clip-path="url(#${clipId})"`
    }

    const strokeMarkup = strokeAttr
      ? isCircle
        ? `    <circle cx="${round2(width / 2)}" cy="${round2(height / 2)}" r="${round2(Math.min(width, height) / 2)}" fill="none"${strokeAttr} />\n`
        : `    <rect x="0" y="0" width="${round2(width)}" height="${round2(height)}" fill="none"${strokeAttr}${radiusAttr} />\n`
      : ""

    const isDataUrl = (url || "").startsWith("data:")
    const preserveAspect = isDataUrl
      ? "none"
      : getPreserveAspectRatio(
          imgFill?.scaleMode,
          imgFill?.objectPosition || node.metadata?.objectPosition
        )

    return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${filterAttr}${opacity}>\n    <image href="${escapeXml(url)}" xlink:href="${escapeXml(url)}" x="0" y="0" width="${round2(width)}" height="${round2(height)}"${clipAttr} preserveAspectRatio="${preserveAspect}" />\n${strokeMarkup}  </g>`
  }

  if (isCircle) {
    const avatarBg = "rgb(226, 232, 240)"
    const avatarIconColor = "rgb(148, 163, 184)"
    const r = round2(Math.min(width, height) / 2)
    const cx = round2(width / 2)
    const cy = round2(height / 2)
    const iconDim = Math.max(10, Math.min(width, height) * 0.55)
    const iconScale = iconDim / 24
    const iconX = round2((width - iconDim) / 2)
    const iconY = round2((height - iconDim) / 2)

    return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${filterAttr}${opacity}>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${avatarBg}"${strokeAttr} />
    <g transform="translate(${iconX}, ${iconY}) scale(${round2(iconScale)})" fill="${avatarIconColor}">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </g>
  </g>`
  }

  const placeholderBg = "rgb(241, 245, 249)"
  const placeholderBorder = "rgb(203, 213, 225)"
  const placeholderIconColor = "rgb(148, 163, 184)"

  const iconDim = Math.min(32, Math.max(12, Math.min(width, height) * 0.35))
  const iconScale = iconDim / 24
  const iconX = round2((width - iconDim) / 2)
  const iconY = round2((height - iconDim) / 2)

  const photoIcon =
    width >= 24 && height >= 24
      ? `    <g transform="translate(${iconX}, ${iconY}) scale(${round2(iconScale)})" stroke="${placeholderIconColor}" fill="${placeholderIconColor}">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke-width="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>\n`
      : ""

  return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${filterAttr}${opacity}>
    <rect x="0" y="0" width="${round2(width)}" height="${round2(height)}" fill="${placeholderBg}" stroke="${placeholderBorder}" stroke-width="1"${radiusAttr} />
${photoIcon}  </g>`
}

function isCircularNode(
  radius: number | [number, number, number, number] | undefined,
  width: number,
  height: number
): boolean {
  const minDim = Math.min(width, height)
  if (Math.abs(width - height) > 6) return false
  if (typeof radius === "number" && radius >= minDim / 2 - 2) return true
  if (Array.isArray(radius) && radius[0] >= minDim / 2 - 2) return true
  return false
}

function isAllCornersEqual(r: [number, number, number, number]): boolean {
  return Math.abs(r[0] - r[1]) < 0.1 && Math.abs(r[1] - r[2]) < 0.1 && Math.abs(r[2] - r[3]) < 0.1
}

function formatCornerRadiusAttr(
  radius: number | [number, number, number, number] | undefined,
  width: number,
  height: number
): string {
  const maxR = Math.min(width / 2, height / 2)
  if (typeof radius === "number" && radius > 0) {
    const clamped = Math.min(radius, maxR)
    return ` rx="${round2(clamped)}" ry="${round2(clamped)}"`
  }
  if (Array.isArray(radius)) {
    const r = Math.min(radius[0], maxR)
    if (r > 0) {
      return ` rx="${round2(r)}" ry="${round2(r)}"`
    }
  }
  return ""
}

function getRepresentativeGradientColor(fill: IRFill): string {
  if (
    (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL") &&
    fill.gradientStops &&
    fill.gradientStops.length > 0
  ) {
    const stops = fill.gradientStops
    let bestColor = stops[0].color
    let maxSat = -1

    for (const stop of stops) {
      const { r, g, b } = stop.color
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      if (sat > maxSat) {
        maxSat = sat
        bestColor = stop.color
      }
    }

    if (maxSat <= 0.08 && stops.length >= 2) {
      const avgR = stops.reduce((sum, s) => sum + s.color.r, 0) / stops.length
      const avgG = stops.reduce((sum, s) => sum + s.color.g, 0) / stops.length
      const avgB = stops.reduce((sum, s) => sum + s.color.b, 0) / stops.length
      const avgA = stops.reduce((sum, s) => sum + (s.color.a ?? 1), 0) / stops.length
      return formatRgba({ r: avgR, g: avgG, b: avgB, a: avgA }, fill.opacity)
    }

    return formatRgba(bestColor, fill.opacity)
  }
  return "rgb(17, 24, 39)"
}

function formatFillToSvg(fill: IRFill | undefined, ctx: SvgBuildContext, isText: boolean = false): string {
  if (!fill || !fill.visible) {
    return "none"
  }

  if (fill.type === "SOLID") {
    const effectiveAlpha =
      fill.opacity !== undefined ? fill.opacity : fill.color.a !== undefined ? fill.color.a : 1
    if (effectiveAlpha <= 0.01) {
      return "none"
    }
    return formatRgba(fill.color, fill.opacity)
  }

  if (fill.type === "GRADIENT_LINEAR") {
    if (isText) {
      // Figma SVG importer does not support url(#grad_linear) on <text> elements
      // and falls back to black (#000000). Use representative gradient color.
      return getRepresentativeGradientColor(fill)
    }

    const id = `grad_linear_${++ctx.counter}`
    const [a, b, c, d, tx, ty] = fill.gradientTransform

    let x1 = Math.round(tx * 100)
    let y1 = Math.round(ty * 100)
    let x2 = Math.round((tx + a) * 100)
    let y2 = Math.round((ty + b) * 100)

    if (x1 === x2 && y1 === y2) {
      x1 = 0
      y1 = 0
      x2 = 0
      y2 = 100
    }

    const stopsXml = fill.gradientStops
      .map((s) => {
        const offset = Math.round(s.position * 100)
        const r = Math.round((s.color?.r ?? 0) * 255)
        const g = Math.round((s.color?.g ?? 0) * 255)
        const b = Math.round((s.color?.b ?? 0) * 255)
        const stopColor = `rgb(${r}, ${g}, ${b})`
        const a = s.color?.a !== undefined ? s.color.a : 1
        const stopOpacity = a < 0.99 ? ` stop-opacity="${round2(a)}"` : ""
        return `      <stop offset="${offset}%" stop-color="${stopColor}"${stopOpacity} />`
      })
      .join("\n")

    const gradXml = `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n${stopsXml}\n    </linearGradient>`
    ctx.defs.push(gradXml)
    return `url(#${id})`
  }

  if (fill.type === "GRADIENT_RADIAL") {
    if (isText) {
      return getRepresentativeGradientColor(fill)
    }

    const id = `grad_radial_${++ctx.counter}`
    const [a, b, c, d, tx, ty] = fill.gradientTransform || [0.5, 0, 0, 0.5, 0.5, 0.5]
    const cx = Math.round((typeof tx === "number" ? tx : 0.5) * 100)
    const cy = Math.round((typeof ty === "number" ? ty : 0.5) * 100)

    const stopsXml = fill.gradientStops
      .map((s) => {
        const offset = Math.round(s.position * 100)
        const r = Math.round((s.color?.r ?? 0) * 255)
        const g = Math.round((s.color?.g ?? 0) * 255)
        const b = Math.round((s.color?.b ?? 0) * 255)
        const stopColor = `rgb(${r}, ${g}, ${b})`
        const a = s.color?.a !== undefined ? s.color.a : 1
        const stopOpacity = a < 0.99 ? ` stop-opacity="${round2(a)}"` : ""
        return `      <stop offset="${offset}%" stop-color="${stopColor}"${stopOpacity} />`
      })
      .join("\n")

    const gradXml = `<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="50%" fx="${cx}%" fy="${cy}%">\n${stopsXml}\n    </radialGradient>`
    ctx.defs.push(gradXml)
    return `url(#${id})`
  }

  return "none"
}

function formatStrokeToSvg(stroke: IRStroke | undefined): string {
  if (
    !stroke ||
    !stroke.visible ||
    stroke.width <= 0 ||
    (stroke.color && stroke.color.a !== undefined && stroke.color.a <= 0.01)
  ) {
    return ""
  }
  const color = formatRgba(stroke.color)
  return ` stroke="${color}" stroke-width="${stroke.width}"`
}

function formatEffectsToFilter(effects: IREffect[] | undefined, ctx: SvgBuildContext): string {
  if (!effects || effects.length === 0) return ""

  const visibleShadows = effects.filter((e) => e.type === "DROP_SHADOW" && e.visible)
  // Only LAYER_BLUR (CSS filter: blur) is an element blur; NEVER apply BACKGROUND_BLUR (backdrop-filter)
  // to the SVG element's filter as it blurs the element itself and destroys borders and fills in Figma!
  const visibleLayerBlurs = effects.filter((e) => e.type === "LAYER_BLUR" && e.visible && e.radius > 0)

  if (visibleShadows.length === 0 && visibleLayerBlurs.length === 0) return ""

  const id = `filter_${++ctx.counter}`
  const filterElements: string[] = []

  for (const blur of visibleLayerBlurs) {
    const stdDev = Math.max(0.5, round2(blur.radius / 2))
    filterElements.push(`      <feGaussianBlur stdDeviation="${stdDev}" />`)
  }

  // Emit the primary dominant drop shadow for 100% Figma clipboard compatibility
  if (visibleShadows.length > 0) {
    const primary = [...visibleShadows].sort(
      (a, b) => (b.radius + (b.spread || 0)) - (a.radius + (a.spread || 0))
    )[0]
    const dx = primary.offset?.x || 0
    const dy = primary.offset?.y !== undefined ? primary.offset.y : 4
    const stdDev = Math.max(0.5, round2((primary.radius || 4) / 2))
    const r = Math.round((primary.color?.r ?? 0) * 255)
    const g = Math.round((primary.color?.g ?? 0) * 255)
    const b = Math.round((primary.color?.b ?? 0) * 255)
    const floodColor = `rgb(${r}, ${g}, ${b})`
    const opacity = primary.color?.a !== undefined ? round2(primary.color.a) : 0.15

    filterElements.push(
      `      <feDropShadow dx="${round2(dx)}" dy="${round2(dy)}" stdDeviation="${stdDev}" flood-color="${floodColor}" flood-opacity="${opacity}" />`
    )
  }

  const filterXml = `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">\n${filterElements.join("\n")}\n    </filter>`
  ctx.defs.push(filterXml)
  return ` filter="url(#${id})"`
}

function formatRgba(color: IRColor, overrideOpacity?: number): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  const a = overrideOpacity !== undefined ? overrideOpacity : color.a !== undefined ? color.a : 1

  if (a >= 0.99) {
    return `rgb(${r}, ${g}, ${b})`
  }
  return `rgba(${r}, ${g}, ${b}, ${round2(a)})`
}

function unwrapSvgToGroup(
  svgContent: string,
  boxWidth: number,
  boxHeight: number,
  ctx: SvgBuildContext
): string {
  if (!svgContent || !svgContent.includes("<svg")) return svgContent

  // Extract viewBox if present
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
  let scaleX = 1
  let scaleY = 1
  let translateX = 0
  let translateY = 0

  if (viewBoxMatch && viewBoxMatch[1]) {
    const vbParts = viewBoxMatch[1].trim().split(/[\s,]+/).map(parseFloat)
    if (vbParts.length === 4 && vbParts[2] > 0 && vbParts[3] > 0) {
      const [vx, vy, vw, vh] = vbParts
      const targetW = boxWidth > 0 ? boxWidth : vw
      const targetH = boxHeight > 0 ? boxHeight : vh

      const isNone = /preserveAspectRatio=["']none["']/i.test(svgContent)
      if (isNone) {
        scaleX = targetW / vw
        scaleY = targetH / vh
        translateX = -vx * scaleX
        translateY = -vy * scaleY
      } else {
        const uniformScale = Math.min(targetW / vw, targetH / vh)
        scaleX = uniformScale
        scaleY = uniformScale
        translateX = -vx * uniformScale + (targetW - vw * uniformScale) / 2
        translateY = -vy * uniformScale + (targetH - vh * uniformScale) / 2
      }
    }
  }

  // Extract <defs>...</defs> if any, and hoist to root ctx.defs
  let cleanContent = svgContent
  const defsRegex = /<defs[\s\S]*?<\/defs>/gi
  let defsMatch: RegExpExecArray | null
  while ((defsMatch = defsRegex.exec(svgContent)) !== null) {
    const innerDefs = defsMatch[0].replace(/^<defs[^>]*>/i, "").replace(/<\/defs>$/i, "").trim()
    if (innerDefs) {
      ctx.defs.push(innerDefs)
    }
  }
  cleanContent = cleanContent.replace(defsRegex, "")

  // Extract inner contents of <svg>...</svg>
  const innerMatch = cleanContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  const innerElements = innerMatch ? innerMatch[1].trim() : cleanContent

  const hasScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001
  const hasTrans = Math.abs(translateX) > 0.01 || Math.abs(translateY) > 0.01

  let innerTransform = ""
  if (hasTrans && hasScale) {
    innerTransform = ` transform="translate(${round2(translateX)}, ${round2(translateY)}) scale(${round2(scaleX)}, ${round2(scaleY)})"`
  } else if (hasScale) {
    innerTransform = ` transform="scale(${round2(scaleX)}, ${round2(scaleY)})"`
  } else if (hasTrans) {
    innerTransform = ` transform="translate(${round2(translateX)}, ${round2(translateY)})"`
  }

  if (innerTransform) {
    return `    <g${innerTransform}>\n    ${innerElements}\n    </g>`
  }

  return innerElements
}

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function round2(val: number): number {
  return Math.round(val * 100) / 100
}
