import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, "../src")

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      getAllSourceFiles(fullPath, fileList)
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

describe("Design System & Quality Linting Rules", () => {
  const sourceFiles = getAllSourceFiles(SRC_DIR)

  it("should NOT use forbidden sparkle / generative AI star icons", () => {
    const FORBIDDEN_ICONS = ["Sparkles", "Sparkle", "Stars", "WandSparkles", "AutoAwesome"]
    const violations: { file: string; icon: string }[] = []

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf8")
      for (const icon of FORBIDDEN_ICONS) {
        // Match imports or JSX usage like <Sparkles or { Sparkles }
        const importRegex = new RegExp(`\\b${icon}\\b`, "g")
        if (importRegex.test(content)) {
          // Check if it's not a comment
          const lines = content.split("\n")
          lines.forEach((line, idx) => {
            if (line.includes(icon) && !line.trim().startsWith("//") && !line.trim().startsWith("/*")) {
              violations.push({
                file: path.relative(SRC_DIR, filePath) + `:${idx + 1}`,
                icon
              })
            }
          })
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Forbidden sparkle/AI star icons detected in source files:\n` +
        violations.map((v) => `  - ${v.file}: used '${v.icon}'`).join("\n")
    )
  })

  it("should ensure all UI components in src/components/ui/ export valid React components", () => {
    const uiDir = path.join(SRC_DIR, "components", "ui")
    const uiFiles = fs.readdirSync(uiDir).filter((f) => f.endsWith(".tsx"))

    for (const file of uiFiles) {
      const content = fs.readFileSync(path.join(uiDir, file), "utf8")
      assert.ok(
        content.includes("export default") || content.includes("export const") || content.includes("export function"),
        `UI component '${file}' must have a valid export`
      )
    }
  })
})
