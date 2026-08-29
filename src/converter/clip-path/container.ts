import type { IRFill, IRStroke, IREffect } from "../../types/ir"
import { parseClipPath } from "./parser"
import { resolveClipPathGeometry, type ResolvedGeometry } from "./geometry"

export interface CutoutTransformResult {
  hasCutout: boolean
  geometry: ResolvedGeometry | null
}

/**
 * Checks if an element has a clip-path and resolves its geometry.
 */
export function handleCutoutContainer(
  clipPathCss: string | null | undefined,
  width: number,
  height: number,
  _fills: IRFill[],
  _strokes: IRStroke[],
  _effects: IREffect[],
  _elementName: string
): CutoutTransformResult {
  if (!clipPathCss || clipPathCss === "none") {
    return { hasCutout: false, geometry: null }
  }

  const parsed = parseClipPath(clipPathCss)
  const geometry = resolveClipPathGeometry(parsed, width, height)

  if (!geometry) {
    return { hasCutout: false, geometry: null }
  }

  return {
    hasCutout: true,
    geometry
  }
}
