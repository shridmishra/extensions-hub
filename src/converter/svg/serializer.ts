import type {
  IRDocument,
  IRNode,
  IRFill,
  IRStroke,
  IREffect,
  IRColor
} from "../../types/ir"
import { cleanFontFamilyName, isGenericFontFamily } from "../css/fonts"
import { createRoundedRectPath } from "../clip-path/geometry"

interface SvgBuildContext {
  defs: string[]
  defIdMap: Map<string, string>
  counter: number
}

/**
 * Converts an IRDocument into a hierarchical multi-layer SVG document
 */
export function convertIRToSvg(doc: IRDocument): string {
  const width = Math.max(1, doc.viewport.width)
  const height = Math.max(1, doc.viewport.height)

  const ctx: SvgBuildContext = {
    defs: [],
    defIdMap: new Map(),
    counter: 0
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
      fontImports.push(
        `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFam).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');`
      )
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
    let textFill = formatFillToSvg(textData.fills?.[0], ctx)
    if (textFill === "none") {
      textFill = formatFillToSvg(node.fills?.[0], ctx)
    }
    if (textFill === "none") {
      textFill = "rgb(250, 250, 250)"
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
      const lineHeight = textData.lineHeightPx || fontSize * 1.25
      const startBaselineY = y + fontSize * 0.85
      const tspans = lines
        .map((line, idx) => {
          const dy = idx === 0 ? 0 : round2(lineHeight)
          return `<tspan x="${round2(textX)}" dy="${dy}">${escapeXml(line)}</tspan>`
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
    return `  <g${transformAttr}${opacity} data-name="${escapeXml(node.name)}">\n    ${node.svgContent}\n  </g>`
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

  if ((hasBackground || hasStroke || hasEffects) && width > 0 && height > 0) {
    const strokeAttr = isUniformStroke ? formatStrokeToSvg(stroke) : ""
    const radiusAttr = formatCornerRadiusAttr(node.cornerRadius, width, height)

    if (hasSolidBg || (!hasGradBg && !hasImgBg && hasEffects)) {
      const effectiveSolid = hasSolidBg ? solidFillAttr : "rgb(255, 255, 255)"
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
      bgMarkup += `    <image href="${escapeXml(bgImgUrl)}" x="0" y="0" width="${round2(width)}" height="${round2(height)}"${radiusAttr}${imgClip} preserveAspectRatio="xMidYMid slice" />\n`
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

  const transformAttr = x !== 0 || y !== 0 ? ` transform="translate(${round2(x)}, ${round2(y)})"` : ""

  return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${opacity}>\n${bgMarkup}${childrenSvg}  </g>`
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

    return `  <g id="${escapeXml(node.id)}" data-name="${escapeXml(node.name)}"${transformAttr}${filterAttr}${opacity}>\n    <image href="${escapeXml(url)}" x="0" y="0" width="${round2(width)}" height="${round2(height)}"${clipAttr} preserveAspectRatio="xMidYMid slice" />\n${strokeMarkup}  </g>`
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

function formatFillToSvg(fill: IRFill | undefined, ctx: SvgBuildContext): string {
  if (!fill || !fill.visible) {
    return "none"
  }

  if (fill.type === "SOLID") {
    return formatRgba(fill.color, fill.opacity)
  }

  if (fill.type === "GRADIENT_LINEAR") {
    const id = `grad_linear_${++ctx.counter}`
    const [a, b, c, d, tx, ty] = fill.gradientTransform

    const x1 = Math.round(tx * 100)
    const y1 = Math.round(ty * 100)
    const x2 = Math.round((tx + a) * 100)
    const y2 = Math.round((ty + b) * 100)

    const stopsXml = fill.gradientStops
      .map((s) => {
        const offset = Math.round(s.position * 100)
        const color = formatRgba(s.color)
        const stopOpacity = s.color.a < 1 ? ` stop-opacity="${s.color.a}"` : ""
        return `      <stop offset="${offset}%" stop-color="${color}"${stopOpacity} />`
      })
      .join("\n")

    const gradXml = `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n${stopsXml}\n    </linearGradient>`
    ctx.defs.push(gradXml)
    return `url(#${id})`
  }

  if (fill.type === "GRADIENT_RADIAL") {
    const id = `grad_radial_${++ctx.counter}`
    const [a, b, c, d, tx, ty] = fill.gradientTransform || [0.5, 0, 0, 0.5, 0.5, 0.5]
    const cx = Math.round((typeof tx === "number" ? tx : 0.5) * 100)
    const cy = Math.round((typeof ty === "number" ? ty : 0.5) * 100)

    const stopsXml = fill.gradientStops
      .map((s) => {
        const offset = Math.round(s.position * 100)
        const color = formatRgba(s.color)
        const stopOpacity = s.color.a !== undefined && s.color.a < 1 ? ` stop-opacity="${round2(s.color.a)}"` : ""
        return `      <stop offset="${offset}%" stop-color="${color}"${stopOpacity} />`
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
  if (visibleShadows.length === 0) return ""

  const id = `shadow_${++ctx.counter}`

  const feShadows = visibleShadows
    .map((shadow) => {
      const dx = shadow.offset?.x || 0
      const dy = shadow.offset?.y !== undefined ? shadow.offset.y : 4
      const stdDev = Math.max(0.5, round2((shadow.radius || 4) / 2))
      const r = Math.round((shadow.color?.r ?? 0) * 255)
      const g = Math.round((shadow.color?.g ?? 0) * 255)
      const b = Math.round((shadow.color?.b ?? 0) * 255)
      const floodColor = `rgb(${r}, ${g}, ${b})`
      const opacity = shadow.color?.a !== undefined ? round2(shadow.color.a) : 0.15

      return `      <feDropShadow dx="${round2(dx)}" dy="${round2(dy)}" stdDeviation="${stdDev}" flood-color="${floodColor}" flood-opacity="${opacity}" />`
    })
    .join("\n")

  const filterXml = `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">\n${feShadows}\n    </filter>`
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
