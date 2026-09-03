import {
  type ParsedClipPath,
  resolveLength
} from "./parser.ts"

export interface ResolvedGeometry {
  svgPath: string
  points?: Array<{ x: number; y: number }>
  viewBox: { width: number; height: number }
  type: "polygon" | "inset" | "circle" | "ellipse" | "path" | "none"
}

/**
 * Resolves a ParsedClipPath against container dimensions (width and height)
 * and returns standard SVG path data string.
 */
export function resolveClipPathGeometry(
  parsed: ParsedClipPath,
  width: number,
  height: number
): ResolvedGeometry | null {
  if (parsed.type === "none" || width <= 0 || height <= 0) {
    return null
  }

  // 1. Polygon
  if (parsed.type === "polygon" && parsed.polygonPoints && parsed.polygonPoints.length > 0) {
    const resolvedPoints = parsed.polygonPoints.map((pt) => {
      const x = resolveLength(pt.x, width)
      const y = resolveLength(pt.y, height)
      return { x: round2(x), y: round2(y) }
    })

    const pathParts = resolvedPoints.map((pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`
    })
    pathParts.push("Z")

    return {
      type: "polygon",
      svgPath: pathParts.join(" "),
      points: resolvedPoints,
      viewBox: { width, height }
    }
  }

  // 2. Inset
  if (parsed.type === "inset" && parsed.inset) {
    const top = resolveLength(parsed.inset.top, height)
    const right = resolveLength(parsed.inset.right, width)
    const bottom = resolveLength(parsed.inset.bottom, height)
    const left = resolveLength(parsed.inset.left, width)

    const x = left
    const y = top
    const w = Math.max(0, width - left - right)
    const h = Math.max(0, height - top - bottom)

    if (parsed.inset.borderRadius) {
      const [tlR, trR, brR, blR] = parsed.inset.borderRadius.map((r) =>
        resolveLength(r, Math.min(w, h))
      )
      const svgPath = createRoundedRectPath(x, y, w, h, tlR, trR, brR, blR)
      return {
        type: "inset",
        svgPath,
        viewBox: { width, height }
      }
    }

    const svgPath = `M ${round2(x)} ${round2(y)} L ${round2(x + w)} ${round2(y)} L ${round2(x + w)} ${round2(y + h)} L ${round2(x)} ${round2(y + h)} Z`
    return {
      type: "inset",
      svgPath,
      viewBox: { width, height }
    }
  }

  // 3. Circle
  if (parsed.type === "circle" && parsed.circle) {
    const cx = resolveLength(parsed.circle.cx, width)
    const cy = resolveLength(parsed.circle.cy, height)

    let r = 0
    if (parsed.circle.radius === "closest-side") {
      r = Math.min(cx, width - cx, cy, height - cy)
    } else if (parsed.circle.radius === "farthest-side") {
      r = Math.max(cx, width - cx, cy, height - cy)
    } else {
      r = resolveLength(parsed.circle.radius, Math.min(width, height))
    }

    r = Math.max(0, r)
    const svgPath = `M ${round2(cx - r)} ${round2(cy)} A ${round2(r)} ${round2(r)} 0 1 0 ${round2(cx + r)} ${round2(cy)} A ${round2(r)} ${round2(r)} 0 1 0 ${round2(cx - r)} ${round2(cy)} Z`

    return {
      type: "circle",
      svgPath,
      viewBox: { width, height }
    }
  }

  // 4. Ellipse
  if (parsed.type === "ellipse" && parsed.ellipse) {
    const cx = resolveLength(parsed.ellipse.cx, width)
    const cy = resolveLength(parsed.ellipse.cy, height)

    let rx = 0
    if (parsed.ellipse.rx === "closest-side") {
      rx = Math.min(cx, width - cx)
    } else if (parsed.ellipse.rx === "farthest-side") {
      rx = Math.max(cx, width - cx)
    } else {
      rx = resolveLength(parsed.ellipse.rx, width)
    }

    let ry = 0
    if (parsed.ellipse.ry === "closest-side") {
      ry = Math.min(cy, height - cy)
    } else if (parsed.ellipse.ry === "farthest-side") {
      ry = Math.max(cy, height - cy)
    } else {
      ry = resolveLength(parsed.ellipse.ry, height)
    }

    rx = Math.max(0, rx)
    ry = Math.max(0, ry)

    const svgPath = `M ${round2(cx - rx)} ${round2(cy)} A ${round2(rx)} ${round2(ry)} 0 1 0 ${round2(cx + rx)} ${round2(cy)} A ${round2(rx)} ${round2(ry)} 0 1 0 ${round2(cx - rx)} ${round2(cy)} Z`

    return {
      type: "ellipse",
      svgPath,
      viewBox: { width, height }
    }
  }

  // 5. Path
  if (parsed.type === "path" && parsed.pathString) {
    return {
      type: "path",
      svgPath: parsed.pathString,
      viewBox: { width, height }
    }
  }

  return null
}

export function createRoundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number
): string {
  const maxR = Math.min(w / 2, h / 2)
  const rTL = Math.min(tl, maxR)
  const rTR = Math.min(tr, maxR)
  const rBR = Math.min(br, maxR)
  const rBL = Math.min(bl, maxR)

  return [
    `M ${round2(x + rTL)} ${round2(y)}`,
    `L ${round2(x + w - rTR)} ${round2(y)}`,
    `A ${round2(rTR)} ${round2(rTR)} 0 0 1 ${round2(x + w)} ${round2(y + rTR)}`,
    `L ${round2(x + w)} ${round2(y + h - rBR)}`,
    `A ${round2(rBR)} ${round2(rBR)} 0 0 1 ${round2(x + w - rBR)} ${round2(y + h)}`,
    `L ${round2(x + rBL)} ${round2(y + h)}`,
    `A ${round2(rBL)} ${round2(rBL)} 0 0 1 ${round2(x)} ${round2(y + h - rBL)}`,
    `L ${round2(x)} ${round2(y + rTL)}`,
    `A ${round2(rTL)} ${round2(rTL)} 0 0 1 ${round2(x + rTL)} ${round2(y)}`,
    `Z`
  ].join(" ")
}

function round2(num: number): number {
  return Math.round(num * 100) / 100
}
