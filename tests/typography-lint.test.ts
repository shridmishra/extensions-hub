import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  isAllowedNumericOrMetric,
  lintFileTypography,
  validateTypography
} from "../scripts/check-typography.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")
const SRC_DIR = path.resolve(ROOT_DIR, "src")

describe("Typography Linter & Quality Rule Tests", () => {
  describe("isAllowedNumericOrMetric helper", () => {
    it("should allow pure numbers and counts", () => {
      assert.strictEqual(isAllowedNumericOrMetric("42"), true)
      assert.strictEqual(isAllowedNumericOrMetric("01"), true)
      assert.strictEqual(isAllowedNumericOrMetric("#01"), true)
      assert.strictEqual(isAllowedNumericOrMetric("100%"), true)
      assert.strictEqual(isAllowedNumericOrMetric("14px"), true)
      assert.strictEqual(isAllowedNumericOrMetric("0.5rem"), true)
    })

    it("should allow dimensions and pixel measurements", () => {
      assert.strictEqual(isAllowedNumericOrMetric("1200 × 800"), true)
      assert.strictEqual(isAllowedNumericOrMetric("1920x1080"), true)
      assert.strictEqual(isAllowedNumericOrMetric("360 * 520"), true)
    })

    it("should allow font weights and hex color codes", () => {
      assert.strictEqual(isAllowedNumericOrMetric("w400"), true)
      assert.strictEqual(isAllowedNumericOrMetric("w700"), true)
      assert.strictEqual(isAllowedNumericOrMetric("#fff"), true)
      assert.strictEqual(isAllowedNumericOrMetric("#FFFFFF"), true)
      assert.strictEqual(isAllowedNumericOrMetric("#09090b"), true)
    })

    it("should allow numeric variable expressions", () => {
      assert.strictEqual(isAllowedNumericOrMetric("{stats.totalNodes}"), true)
      assert.strictEqual(isAllowedNumericOrMetric("{metrics.fontSize}"), true)
      assert.strictEqual(isAllowedNumericOrMetric("{settings.brightness}%"), true)
      assert.strictEqual(isAllowedNumericOrMetric("{styles.dimensions.width} × {styles.dimensions.height}"), true)
    })

    it("should reject words, labels, and text containing letters", () => {
      assert.strictEqual(isAllowedNumericOrMetric("Nodes"), false)
      assert.strictEqual(isAllowedNumericOrMetric("Raw CSS"), false)
      assert.strictEqual(isAllowedNumericOrMetric("Primary Font"), false)
      assert.strictEqual(isAllowedNumericOrMetric("Click to Copy"), false)
      assert.strictEqual(isAllowedNumericOrMetric("Shift + M"), false)
    })
  })

  describe("Synthetic Violation Detection", () => {
    const tempFile = path.resolve(__dirname, "temp-typography-fixture.tsx")

    it("should detect 'uppercase' class violations", () => {
      const code = `
        export const TestComponent = () => (
          <span className="text-xs uppercase font-bold text-neutral-500">Section Title</span>
        )
      `
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.ok(violations.length >= 1, "Should catch uppercase violation")
        assert.strictEqual(violations[0].rule, "NO_UPPERCASE_FONT")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })

    it("should detect 'font-mono' on words / letters", () => {
      const code = `
        export const TestComponent = () => (
          <span className="font-mono text-xs font-bold">Hello World</span>
        )
      `
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.ok(violations.length >= 1, "Should catch mono-on-letters violation")
        assert.strictEqual(violations[0].rule, "NO_MONO_ON_LETTERS")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })

    it("should allow font-mono on numeric metrics and stats", () => {
      const code = `
        export const TestComponent = () => (
          <div>
            <span className="font-mono text-xs font-bold">1200 × 800</span>
            <span className="font-mono text-xs">{settings.brightness}%</span>
            <span className="font-mono text-xs">#FFFFFF</span>
          </div>
        )
      `
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.strictEqual(violations.length, 0, "Numeric metrics should not trigger violations")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })
  })

  describe("Repository Source Code Compliance", () => {
    it("should have zero uppercase and mono-letter violations in src/ and templates/", () => {
      const violations = validateTypography()
      if (violations.length > 0) {
        const details = violations.map((v) => `  - ${v.file}:${v.line} (${v.rule}): ${v.message} [Snippet: ${v.snippet}]`).join("\n")
        assert.fail(`Found ${violations.length} typography violation(s) in codebase:\n${details}`)
      }
      assert.strictEqual(violations.length, 0)
    })
  })
})
