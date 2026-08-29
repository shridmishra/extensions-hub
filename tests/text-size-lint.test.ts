import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  isAllowedTextSize,
  lintFileTypography,
  validateTypography
} from "../scripts/check-typography.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("Text Sizing Enforcement Tests (Min 10px, Even Increments Only)", () => {
  describe("isAllowedTextSize validator", () => {
    it("should allow valid even sizes >= 10px", () => {
      assert.strictEqual(isAllowedTextSize(10), true)
      assert.strictEqual(isAllowedTextSize(12), true)
      assert.strictEqual(isAllowedTextSize(14), true)
      assert.strictEqual(isAllowedTextSize(16), true)
      assert.strictEqual(isAllowedTextSize(18), true)
      assert.strictEqual(isAllowedTextSize(20), true)
      assert.strictEqual(isAllowedTextSize(24), true)
      assert.strictEqual(isAllowedTextSize("10px"), true)
      assert.strictEqual(isAllowedTextSize("12px"), true)
      assert.strictEqual(isAllowedTextSize("14px"), true)
    })

    it("should reject text sizes below 10px (e.g. 9px, 9.5px, 8px)", () => {
      assert.strictEqual(isAllowedTextSize(9), false)
      assert.strictEqual(isAllowedTextSize(9.5), false)
      assert.strictEqual(isAllowedTextSize(8), false)
      assert.strictEqual(isAllowedTextSize(6), false)
      assert.strictEqual(isAllowedTextSize("9px"), false)
      assert.strictEqual(isAllowedTextSize("9.5px"), false)
      assert.strictEqual(isAllowedTextSize("8px"), false)
    })

    it("should reject odd numbered text sizes (e.g. 11px, 13px, 15px)", () => {
      assert.strictEqual(isAllowedTextSize(11), false)
      assert.strictEqual(isAllowedTextSize(13), false)
      assert.strictEqual(isAllowedTextSize(15), false)
      assert.strictEqual(isAllowedTextSize(17), false)
      assert.strictEqual(isAllowedTextSize("11px"), false)
      assert.strictEqual(isAllowedTextSize("13px"), false)
      assert.strictEqual(isAllowedTextSize("15px"), false)
      assert.strictEqual(isAllowedTextSize("10.5px"), false)
    })
  })

  describe("Synthetic Detection of Text Size Violations", () => {
    const tempFile = path.resolve(__dirname, "temp-text-size-fixture.tsx")

    it("should catch sub-10px text sizes (e.g. text-[9px])", () => {
      const code = `<span className="text-[9px] font-bold">Small text</span>`
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.ok(violations.length >= 1, "Should catch text-[9px] violation")
        assert.strictEqual(violations[0].rule, "TEXT_SIZE_TOO_SMALL")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })

    it("should catch odd text sizes (e.g. text-[11px], text-[13px], text-[15px])", () => {
      const code = `<span className="text-[13px] font-bold">Odd text</span>`
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.ok(violations.length >= 1, "Should catch text-[13px] violation")
        assert.strictEqual(violations[0].rule, "TEXT_SIZE_EVEN_INCREMENTS_ONLY")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })

    it("should pass for compliant even text sizes >= 10px (e.g. text-[10px], text-xs, text-sm)", () => {
      const code = `
        <div>
          <span className="text-[10px] font-bold">10px text</span>
          <span className="text-xs font-semibold">12px text</span>
          <span className="text-[14px] font-bold">14px text</span>
          <span className="text-base font-normal">16px text</span>
        </div>
      `
      fs.writeFileSync(tempFile, code, "utf8")
      try {
        const violations = lintFileTypography(tempFile)
        assert.strictEqual(violations.length, 0, "Compliant even text sizes should pass")
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })
  })

  describe("Repository Codebase Text Sizing Compliance", () => {
    it("should have zero text size violations (no sizes < 10px and no odd increments) in src/ and templates/", () => {
      const violations = validateTypography().filter(
        (v) => v.rule === "TEXT_SIZE_TOO_SMALL" || v.rule === "TEXT_SIZE_EVEN_INCREMENTS_ONLY"
      )
      if (violations.length > 0) {
        const details = violations
          .map((v) => `  - ${v.file}:${v.line} (${v.rule}): ${v.message} [Snippet: ${v.snippet}]`)
          .join("\n")
        assert.fail(`Found ${violations.length} text size violation(s) in codebase:\n${details}`)
      }
      assert.strictEqual(violations.length, 0)
    })
  })
})
