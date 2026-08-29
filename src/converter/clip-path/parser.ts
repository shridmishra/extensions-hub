/**
 * CSS clip-path Parser
 * Robust parsing for polygon(), inset(), circle(), ellipse(), and path()
 */

export interface ParsedClipPath {
  type: "polygon" | "inset" | "circle" | "ellipse" | "path" | "none"
  raw: string
  polygonPoints?: Array<{ x: ParsedUnit; y: ParsedUnit }>
  inset?: {
    top: ParsedUnit
    right: ParsedUnit
    bottom: ParsedUnit
    left: ParsedUnit
    borderRadius?: [ParsedUnit, ParsedUnit, ParsedUnit, ParsedUnit] // TL, TR, BR, BL
  }
  circle?: {
    radius: ParsedUnit | "closest-side" | "farthest-side"
    cx: ParsedUnit
    cy: ParsedUnit
  }
  ellipse?: {
    rx: ParsedUnit | "closest-side" | "farthest-side"
    ry: ParsedUnit | "closest-side" | "farthest-side"
    cx: ParsedUnit
    cy: ParsedUnit
  }
  pathString?: string
}

export interface ParsedUnit {
  value: number
  unit: "px" | "%" | "em" | "rem" | "calc"
  calcExpr?: string
}

/**
 * Parses a single length token, e.g. "15px", "20%", "2rem", "calc(100% - 15px)"
 */
export function parseLengthToken(token: string): ParsedUnit {
  const trimmed = token.trim()

  // Handle calc(...)
  if (trimmed.startsWith("calc(") && trimmed.endsWith(")")) {
    const expr = trimmed.slice(5, -1).trim()
    return {
      value: 0,
      unit: "calc",
      calcExpr: expr
    }
  }

  // Handle %
  if (trimmed.endsWith("%")) {
    const val = parseFloat(trimmed)
    return { value: isNaN(val) ? 0 : val, unit: "%" }
  }

  // Handle px
  if (trimmed.endsWith("px")) {
    const val = parseFloat(trimmed)
    return { value: isNaN(val) ? 0 : val, unit: "px" }
  }

  // Handle rem
  if (trimmed.endsWith("rem")) {
    const val = parseFloat(trimmed)
    return { value: isNaN(val) ? 0 : val * 16, unit: "px" }
  }

  // Handle em
  if (trimmed.endsWith("em")) {
    const val = parseFloat(trimmed)
    return { value: isNaN(val) ? 0 : val * 16, unit: "px" }
  }

  // Handle unitless (treated as px or number)
  const num = parseFloat(trimmed)
  if (!isNaN(num)) {
    return { value: num, unit: "px" }
  }

  return { value: 0, unit: "px" }
}

/**
 * Resolves a ParsedUnit against a container dimension (width or height in px)
 */
export function resolveLength(unit: ParsedUnit, containerSize: number): number {
  if (unit.unit === "px") {
    return unit.value
  }
  if (unit.unit === "%") {
    return (unit.value / 100) * containerSize
  }
  if (unit.unit === "calc" && unit.calcExpr) {
    return evaluateCalc(unit.calcExpr, containerSize)
  }
  return unit.value
}

/**
 * Safe, zero-eval arithmetic expression evaluator for calc(...)
 * Supports +, -, *, /, parentheses, percentages, px, rem, em without CSP restrictions
 */
export function evaluateCalc(expr: string, containerSize: number): number {
  if (!expr) return 0
  try {
    // 1. Replace percentages with container-relative pixel values
    const sanitized = expr
      .replace(/([\d.]+)%/g, (_, p1) => String((parseFloat(p1) / 100) * containerSize))
      .replace(/([\d.]+)px/g, "$1")
      .replace(/([\d.]+)rem/g, (_, p1) => String(parseFloat(p1) * 16))
      .replace(/([\d.]+)em/g, (_, p1) => String(parseFloat(p1) * 16))

    const tokens = tokenizeMath(sanitized)
    if (tokens.length === 0) return 0

    let index = 0

    function parseExpr(): number {
      let value = parseTerm()
      while (index < tokens.length) {
        const op = tokens[index]
        if (op === "+" || op === "-") {
          index++
          const nextTerm = parseTerm()
          if (op === "+") value += nextTerm
          else value -= nextTerm
        } else {
          break
        }
      }
      return value
    }

    function parseTerm(): number {
      let value = parseFactor()
      while (index < tokens.length) {
        const op = tokens[index]
        if (op === "*" || op === "/") {
          index++
          const nextFactor = parseFactor()
          if (op === "*") value *= nextFactor
          else if (nextFactor !== 0) value /= nextFactor
        } else {
          break
        }
      }
      return value
    }

    function parseFactor(): number {
      if (index >= tokens.length) return 0
      const token = tokens[index++]

      // Unary plus/minus
      if (token === "+") {
        return parseFactor()
      }
      if (token === "-") {
        return -parseFactor()
      }

      if (token === "(") {
        const val = parseExpr()
        if (index < tokens.length && tokens[index] === ")") {
          index++
        }
        return val
      }

      const num = parseFloat(token)
      return isNaN(num) ? 0 : num
    }

    const result = parseExpr()
    return typeof result === "number" && !isNaN(result) ? result : 0
  } catch (e) {
    console.warn("Failed to evaluate calc expression:", expr, e)
    return 0
  }
}

function tokenizeMath(str: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < str.length) {
    const c = str[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "(" || c === ")") {
      tokens.push(c)
      i++
      continue
    }
    if (/[\d.]/.test(c)) {
      let numStr = ""
      while (i < str.length && /[\d.]/.test(str[i])) {
        numStr += str[i]
        i++
      }
      tokens.push(numStr)
      continue
    }
    i++
  }
  return tokens
}

/**
 * Main clip-path string parser
 */
export function parseClipPath(clipPathValue: string | null | undefined): ParsedClipPath {
  if (!clipPathValue || clipPathValue === "none" || clipPathValue === "initial" || clipPathValue === "inherit") {
    return { type: "none", raw: "" }
  }

  const raw = clipPathValue.trim()

  // 1. polygon(...)
  if (raw.startsWith("polygon(") && raw.endsWith(")")) {
    return parsePolygon(raw)
  }

  // 2. inset(...)
  if (raw.startsWith("inset(") && raw.endsWith(")")) {
    return parseInset(raw)
  }

  // 3. circle(...)
  if (raw.startsWith("circle(") && raw.endsWith(")")) {
    return parseCircle(raw)
  }

  // 4. ellipse(...)
  if (raw.startsWith("ellipse(") && raw.endsWith(")")) {
    return parseEllipse(raw)
  }

  // 5. path(...)
  if (raw.startsWith("path(") && raw.endsWith(")")) {
    const inside = raw.slice(5, -1).trim().replace(/^['"]|['"]$/g, "")
    return {
      type: "path",
      raw,
      pathString: inside
    }
  }

  return { type: "none", raw }
}

/**
 * Parses polygon(x1 y1, x2 y2, ...)
 */
function parsePolygon(raw: string): ParsedClipPath {
  const content = raw.slice(8, -1).trim()
  let pointsStr = content
  if (content.startsWith("nonzero,") || content.startsWith("evenodd,")) {
    pointsStr = content.substring(content.indexOf(",") + 1).trim()
  }

  const coordinatePairs: string[] = []
  let depth = 0
  let current = ""

  for (let i = 0; i < pointsStr.length; i++) {
    const char = pointsStr[i]
    if (char === "(") depth++
    else if (char === ")") depth--

    if (char === "," && depth === 0) {
      if (current.trim()) coordinatePairs.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  if (current.trim()) coordinatePairs.push(current.trim())

  const points: Array<{ x: ParsedUnit; y: ParsedUnit }> = []

  for (const pair of coordinatePairs) {
    let splitIndex = -1
    let pDepth = 0
    for (let j = 0; j < pair.length; j++) {
      const c = pair[j]
      if (c === "(") pDepth++
      else if (c === ")") pDepth--
      else if (/\s/.test(c) && pDepth === 0) {
        splitIndex = j
        break
      }
    }

    if (splitIndex !== -1) {
      const xStr = pair.substring(0, splitIndex).trim()
      const yStr = pair.substring(splitIndex).trim()
      points.push({
        x: parseLengthToken(xStr),
        y: parseLengthToken(yStr)
      })
    }
  }

  return {
    type: "polygon",
    raw,
    polygonPoints: points
  }
}

/**
 * Parses inset(top [right bottom left] [round radius])
 */
function parseInset(raw: string): ParsedClipPath {
  const content = raw.slice(6, -1).trim()
  const [offsetsPart, roundPart] = content.split(/\bround\b/i).map((s) => s.trim())

  const offsetTokens = splitByWhitespaceIgnoringParens(offsetsPart)
  let top = parseLengthToken(offsetTokens[0] || "0")
  let right = parseLengthToken(offsetTokens[1] || offsetTokens[0] || "0")
  let bottom = parseLengthToken(offsetTokens[2] || offsetTokens[0] || "0")
  let left = parseLengthToken(offsetTokens[3] || offsetTokens[1] || offsetTokens[0] || "0")

  let borderRadius: [ParsedUnit, ParsedUnit, ParsedUnit, ParsedUnit] | undefined = undefined

  if (roundPart) {
    const roundTokens = splitByWhitespaceIgnoringParens(roundPart)
    const r1 = parseLengthToken(roundTokens[0] || "0")
    const r2 = parseLengthToken(roundTokens[1] || roundTokens[0] || "0")
    const r3 = parseLengthToken(roundTokens[2] || roundTokens[0] || "0")
    const r4 = parseLengthToken(roundTokens[3] || roundTokens[1] || roundTokens[0] || "0")
    borderRadius = [r1, r2, r3, r4]
  }

  return {
    type: "inset",
    raw,
    inset: {
      top,
      right,
      bottom,
      left,
      borderRadius
    }
  }
}

/**
 * Parses circle(radius at cx cy)
 */
function parseCircle(raw: string): ParsedClipPath {
  const content = raw.slice(7, -1).trim()
  const [radiusPart, positionPart] = content.split(/\bat\b/i).map((s) => s?.trim())

  let radius: ParsedUnit | "closest-side" | "farthest-side" = { value: 50, unit: "%" }
  if (radiusPart) {
    if (radiusPart === "closest-side" || radiusPart === "farthest-side") {
      radius = radiusPart
    } else {
      radius = parseLengthToken(radiusPart)
    }
  }

  let cx: ParsedUnit = { value: 50, unit: "%" }
  let cy: ParsedUnit = { value: 50, unit: "%" }

  if (positionPart) {
    const posTokens = splitByWhitespaceIgnoringParens(positionPart)
    if (posTokens[0]) cx = parsePositionToken(posTokens[0], true)
    if (posTokens[1]) cy = parsePositionToken(posTokens[1], false)
  }

  return {
    type: "circle",
    raw,
    circle: { radius, cx, cy }
  }
}

/**
 * Parses ellipse(rx ry at cx cy)
 */
function parseEllipse(raw: string): ParsedClipPath {
  const content = raw.slice(8, -1).trim()
  const [radiiPart, positionPart] = content.split(/\bat\b/i).map((s) => s?.trim())

  let rx: ParsedUnit | "closest-side" | "farthest-side" = { value: 50, unit: "%" }
  let ry: ParsedUnit | "closest-side" | "farthest-side" = { value: 50, unit: "%" }

  if (radiiPart) {
    const tokens = splitByWhitespaceIgnoringParens(radiiPart)
    if (tokens[0]) rx = tokens[0] === "closest-side" || tokens[0] === "farthest-side" ? tokens[0] : parseLengthToken(tokens[0])
    if (tokens[1]) ry = tokens[1] === "closest-side" || tokens[1] === "farthest-side" ? tokens[1] : parseLengthToken(tokens[1])
  }

  let cx: ParsedUnit = { value: 50, unit: "%" }
  let cy: ParsedUnit = { value: 50, unit: "%" }

  if (positionPart) {
    const posTokens = splitByWhitespaceIgnoringParens(positionPart)
    if (posTokens[0]) cx = parsePositionToken(posTokens[0], true)
    if (posTokens[1]) cy = parsePositionToken(posTokens[1], false)
  }

  return {
    type: "ellipse",
    raw,
    ellipse: { rx, ry, cx, cy }
  }
}

function parsePositionToken(token: string, isX: boolean): ParsedUnit {
  const lower = token.toLowerCase()
  if (lower === "left") return { value: 0, unit: "%" }
  if (lower === "right") return { value: 100, unit: "%" }
  if (lower === "top") return { value: 0, unit: "%" }
  if (lower === "bottom") return { value: 100, unit: "%" }
  if (lower === "center") return { value: 50, unit: "%" }
  return parseLengthToken(token)
}

function splitByWhitespaceIgnoringParens(str: string): string[] {
  const tokens: string[] = []
  let depth = 0
  let current = ""

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === "(") depth++
    else if (c === ")") depth--

    if (/\s/.test(c) && depth === 0) {
      if (current.trim()) tokens.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  if (current.trim()) tokens.push(current.trim())
  return tokens
}
