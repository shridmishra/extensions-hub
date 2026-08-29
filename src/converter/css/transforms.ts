/**
 * CSS Transform Parser
 * Parses matrix(a, b, c, d, tx, ty) and matrix3d(...) into 2D affine transforms and rotation
 */

export interface ParsedTransform {
  matrix?: [number, number, number, number, number, number] // [a, b, c, d, tx, ty]
  rotation?: number // in degrees
  scaleX?: number
  scaleY?: number
}

export function parseCssTransform(transformStr: string | null | undefined): ParsedTransform {
  if (!transformStr || transformStr === "none") {
    return {}
  }

  const str = transformStr.trim()

  // 1. matrix(a, b, c, d, tx, ty)
  if (str.startsWith("matrix(")) {
    const values = str
      .slice(7, -1)
      .split(/[\s,]+/)
      .map(parseFloat)

    if (values.length === 6 && values.every((v) => !isNaN(v))) {
      const [a, b, c, d, tx, ty] = values
      const rotation = Math.round((Math.atan2(b, a) * 180) / Math.PI)
      const scaleX = Math.sqrt(a * a + b * b)
      const scaleY = Math.sqrt(c * c + d * d)

      return {
        matrix: [a, b, c, d, tx, ty],
        rotation,
        scaleX,
        scaleY
      }
    }
  }

  // 2. matrix3d(...)
  if (str.startsWith("matrix3d(")) {
    const values = str
      .slice(9, -1)
      .split(/[\s,]+/)
      .map(parseFloat)

    if (values.length === 16 && values.every((v) => !isNaN(v))) {
      const a = values[0]
      const b = values[1]
      const c = values[4]
      const d = values[5]
      const tx = values[12]
      const ty = values[13]

      const rotation = Math.round((Math.atan2(b, a) * 180) / Math.PI)
      const scaleX = Math.sqrt(a * a + b * b)
      const scaleY = Math.sqrt(c * c + d * d)

      return {
        matrix: [a, b, c, d, tx, ty],
        rotation,
        scaleX,
        scaleY
      }
    }
  }

  return {}
}
