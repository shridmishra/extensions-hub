#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")
const SRC_DIR = path.resolve(ROOT_DIR, "src")
const TEMPLATES_DIR = path.resolve(ROOT_DIR, "templates")

/**
 * @typedef {Object} TypographyViolation
 * @property {string} file
 * @property {number} line
 * @property {string} rule
 * @property {string} message
 * @property {string} snippet
 */

/**
 * Validates text sizing rules:
 * 1. Minimum text size is 10px (cannot go below 10px).
 * 2. Follows even increments: 10px, 12px, 14px, 16px, 18px, 20px, etc.
 * 3. Odd numbers and fractional pixel sizes are forbidden.
 * @param {number|string} size
 * @returns {boolean}
 */
export function isAllowedTextSize(size) {
  const num = typeof size === "number" ? size : parseFloat(String(size).replace(/px/i, "").trim())
  if (isNaN(num)) return false
  if (num < 10) return false
  if (!Number.isInteger(num)) return false
  if (num % 2 !== 0) return false
  return true
}

/**
 * Checks if a text fragment or expression represents purely numeric values, metrics, dimensions, hex codes, or counts.
 * Allowed in font-mono:
 *  - Numbers: "123", "42", "01", "#01"
 *  - Dimensions / units: "1200 × 800", "1920x1080", "100%", "14px", "0.5rem", "20px"
 *  - Weights / stats: "w700", "w400", "700"
 *  - Hex color values: "#FFFFFF", "#121215", "rgba(0,0,0,0.5)"
 *  - Numeric variable bindings: e.g. {metrics.fontSize}, {settings.brightness}%, {stats.totalNodes}, {styles.dimensions.width}, {hoverDimensions}, {hoverSize}, {hoverWeight}
 * @param {string} text
 * @returns {boolean}
 */
export function isAllowedNumericOrMetric(text) {
  const trimmed = text.trim()
  if (!trimmed) return true

  // Pure digits or prefixed #digits or with units
  if (/^#?\d+(\.\d+)?(%|px|rem|em|vh|vw|ms|s)?$/i.test(trimmed)) return true

  // Dimension formats like "1200 × 800", "1200x800", "1200 * 800"
  if (/^\d+(\.\d+)?\s*(×|x|\*)\s*\d+(\.\d+)?(px)?$/i.test(trimmed)) return true

  // Weight formats like "w400", "w700", "w900"
  if (/^w?\d{3}$/i.test(trimmed)) return true

  // Hex color codes: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return true

  // Pure numeric JSX expressions (e.g. {count}, {fontSize}, {stats.totalNodes}, {totalShapes}, {settings.brightness}%, {hoverSize}, {hoverWeight}, {hoverDimensions}, {progress.current})
  if (/^\{[a-zA-Z0-9_.]*(count|size|width|height|weight|nodes|shapes|total|current|progress|brightness|contrast|sepia|hex|color|timestamp|number|totalNodes|totalShapes|fontSize|lineHeight|fontWeight|dimensions|viewport)[a-zA-Z0-9_.]*\}\s*(%|px|rem|em|w)?$/i.test(trimmed)) {
    return true
  }

  // Fraction/ratio combinations like `{progress.current}/{progress.total}` or `{current} / {total}`
  if (/^\{[a-zA-Z0-9_.]*(current|count|progress|idx|index)[a-zA-Z0-9_.]*\}\s*(\/|of)\s*\{[a-zA-Z0-9_.]*(total|count|length|max)[a-zA-Z0-9_.]*\}$/i.test(trimmed)) {
    return true
  }

  // Dimension combinations like `{styles.dimensions.width} × {styles.dimensions.height}`
  if (/^\{[a-zA-Z0-9_.]*(dimensions|size|width|viewport)[a-zA-Z0-9_.]*\}\s*(×|x|\*)\s*\{[a-zA-Z0-9_.]*(dimensions|size|height|viewport)[a-zA-Z0-9_.]*\}\s*(px)?$/i.test(trimmed)) {
    return true
  }

  // Common number padded expression #{String(extension.number).padStart(2, "0")}
  if (/^#\{[^{}]*number[^{}]*\}$/i.test(trimmed)) return true

  return false
}

/**
 * Scan a single file for typography violations.
 * @param {string} filePath
 * @returns {TypographyViolation[]}
 */
export function lintFileTypography(filePath) {
  const violations = /** @type {TypographyViolation[]} */ ([])
  const relativePath = path.relative(ROOT_DIR, filePath)
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  // Rule 1: Disallow `uppercase` class / CSS text-transform: uppercase in UI components
  const uppercaseClassRegex = /(className=["'`][^"'`]*\b)uppercase(\b[^"'`]*["'`])/
  const textTransformUppercaseRegex = /(textTransform:\s*["']uppercase["']|text-transform:\s*uppercase)/i

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    // Ignore comment lines
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return
    }

    // Check uppercase class in JSX
    if (uppercaseClassRegex.test(line)) {
      violations.push({
        file: relativePath,
        line: lineNum,
        rule: "NO_UPPERCASE_FONT",
        message: "Forbidden 'uppercase' class detected. Avoid uppercase typography in UI; use natural case with Satoshi/sans-serif.",
        snippet: line.trim()
      })
    }

    // Check textTransform: "uppercase" inline or in CSS
    if (textTransformUppercaseRegex.test(line)) {
      // Allow preview state toggles in font-finder if explicit inspector mode, but not general styling
      if (!filePath.includes("FontFinderModal.tsx") || !line.includes("previewTransform")) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: "NO_UPPERCASE_TRANSFORM",
          message: "Forbidden text-transform uppercase styling detected.",
          snippet: line.trim()
        })
      }
    }
  })

  // Rule 2: Disallow `font-mono` on alphabetic text / labels / words
  // Scan JSX elements where font-mono is present
  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return
    }

    // Check if line introduces or contains font-mono
    if (/\bfont-mono\b/.test(line)) {
      // Exclude pre/code blocks used specifically for code snippet exports (e.g. raw CSS/Tailwind export)
      if (line.includes("<pre") || line.includes("<code") || line.includes("<code>") || line.includes("hub-scrollbar select-text")) {
        return
      }

      // Extract the immediate inner text of the tag with font-mono on this line
      const monoTagMatches = line.matchAll(/<([a-zA-Z0-9]+)[^>]*\bfont-mono\b[^>]*>(.*?)(<\/\1>|$)/g)
      let foundTagMatch = false

      for (const tagMatch of monoTagMatches) {
        foundTagMatch = true
        const innerContent = tagMatch[2].trim()
        
        // Strip any nested tags inside this element
        const textOnly = innerContent.replace(/<[^>]+>/g, "").trim()

        if (textOnly && !isAllowedNumericOrMetric(textOnly)) {
          violations.push({
            file: relativePath,
            line: lineNum,
            rule: "NO_MONO_ON_LETTERS",
            message: `Forbidden 'font-mono' used on alphabetic text '${textOnly}'. Monospace is restricted to numbers/metrics.`,
            snippet: line.trim()
          })
        }

        // Check for alphabetic variables directly inside font-mono tag
        const varMatch = innerContent.match(/\{([^}]+(tagName|fontFamily|name|url|convertedUrl|activeTab|selectorText|extension\.id)[^}]*)\}/i)
        if (varMatch) {
          violations.push({
            file: relativePath,
            line: lineNum,
            rule: "NO_MONO_ON_LETTERS",
            message: `Forbidden 'font-mono' used on alphabetic variable '{${varMatch[1].trim()}}'. Use font-sans for text/labels.`,
            snippet: line.trim()
          })
        }
      }

      // If font-mono is on an opening tag that spans multiple lines or is a container
      if (!foundTagMatch) {
        const openingTagMatch = line.match(/<([a-zA-Z0-9]+)[^>]*\bfont-mono\b[^>]*>(.*)$/)
        if (openingTagMatch) {
          const inlineRemainder = openingTagMatch[2].trim()
          if (inlineRemainder && !isAllowedNumericOrMetric(inlineRemainder)) {
            violations.push({
              file: relativePath,
              line: lineNum,
              rule: "NO_MONO_ON_LETTERS",
              message: `Forbidden 'font-mono' used on element containing alphabetic text '${inlineRemainder}'.`,
              snippet: line.trim()
            })
          } else {
            for (let offset = 1; offset <= 3 && idx + offset < lines.length; offset++) {
              const nextLine = lines[idx + offset]
              if (nextLine.includes("</")) {
                const nextTextMatch = nextLine.match(/^\s*([^<>{}]*[a-zA-Z]{3,}[^<>{}]*)</)
                if (nextTextMatch && !isAllowedNumericOrMetric(nextTextMatch[1])) {
                  violations.push({
                    file: relativePath,
                    line: lineNum,
                    rule: "NO_MONO_ON_LETTERS",
                    message: `Forbidden 'font-mono' container wrapping alphabetic text '${nextTextMatch[1].trim()}'.`,
                    snippet: line.trim()
                  })
                }
                break
              }
            }
          }
        }
      }
    }
  })

  // Rule 3: Text Sizing Constraints (Min 10px, Even increments only: 10px, 12px, 14px, 16px, etc.)
  // Scan Tailwind classes text-[...px], inline fontSize, and CSS font-size in UI source code
  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return
    }

    // Skip SVG icon glyphs (like CssIcon) and converter serializers that generate SVG files
    if (filePath.includes("components/icons/") || filePath.includes("converter/")) {
      return
    }

    // Check Tailwind arbitrary font size classes: text-[...px]
    const tailwindTextSizeMatches = line.matchAll(/text-\[(\d+(\.\d+)?)px\]/g)
    for (const match of tailwindTextSizeMatches) {
      const sizeVal = parseFloat(match[1])
      if (sizeVal < 10) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: "TEXT_SIZE_TOO_SMALL",
          message: `Text size '${match[0]}' is below the minimum allowed size of 10px. The lowest text size allowed is 10px.`,
          snippet: line.trim()
        })
      } else if (!Number.isInteger(sizeVal) || sizeVal % 2 !== 0) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: "TEXT_SIZE_EVEN_INCREMENTS_ONLY",
          message: `Text size '${match[0]}' is an odd/fractional increment. Text size must follow even increments (10px, 12px, 14px, 16px, etc.).`,
          snippet: line.trim()
        })
      }
    }

    // Check CSS or inline style font-size: ...px
    const inlineSizeMatch = line.match(/font-?size:\s*["']?(\d+(\.\d+)?)px["']?/i)
    if (inlineSizeMatch) {
      const sizeVal = parseFloat(inlineSizeMatch[1])
      if (sizeVal < 10) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: "TEXT_SIZE_TOO_SMALL",
          message: `font-size '${inlineSizeMatch[0]}' is below the minimum allowed size of 10px.`,
          snippet: line.trim()
        })
      } else if (!Number.isInteger(sizeVal) || sizeVal % 2 !== 0) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: "TEXT_SIZE_EVEN_INCREMENTS_ONLY",
          message: `font-size '${inlineSizeMatch[0]}' is an odd/fractional increment. Use even increments >= 10px.`,
          snippet: line.trim()
        })
      }
    }
  })

  return violations
}

/**
 * Recursively find all source files (.tsx, .ts, .jsx, .js, .css).
 * @param {string} dir
 * @param {string[]} fileList
 * @returns {string[]}
 */
export function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "build" && file !== ".git") {
        getSourceFiles(fullPath, fileList)
      }
    } else if (
      file.endsWith(".tsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".js") ||
      file.endsWith(".css")
    ) {
      if (!file.endsWith(".test.ts") && !file.endsWith(".test.js")) {
        fileList.push(fullPath)
      }
    }
  }
  return fileList
}

/**
 * Validate all source files.
 * @param {string[]} [targetDirs]
 * @returns {TypographyViolation[]}
 */
export function validateTypography(targetDirs = [SRC_DIR, TEMPLATES_DIR]) {
  const allFiles = []
  for (const dir of targetDirs) {
    getSourceFiles(dir, allFiles)
  }

  const allViolations = []
  for (const file of allFiles) {
    const violations = lintFileTypography(file)
    if (violations.length > 0) {
      allViolations.push(...violations)
    }
  }
  return allViolations
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("\x1b[1m\x1b[34m%s\x1b[0m", "🔍 Running Typography & Text Sizing Linter (Minimum 10px, Even increments only, No uppercase, No mono on letters)...")
  
  const violations = validateTypography()

  if (violations.length === 0) {
    console.log("\x1b[32m%s\x1b[0m", "✔ Typography and text sizing checks passed! All sizes follow even increments >= 10px.")
    process.exit(0)
  } else {
    console.error("\x1b[31m%s\x1b[0m", `✖ Found ${violations.length} typography/text size violation(s):\n`)
    violations.forEach((v, i) => {
      console.error(
        `\x1b[33m[${i + 1}] ${v.file}:${v.line}\x1b[0m \x1b[31m(${v.rule})\x1b[0m\n` +
        `    ${v.message}\n` +
        `    \x1b[90mSnippet: ${v.snippet}\x1b[0m\n`
      )
    })
    process.exit(1)
  }
}
