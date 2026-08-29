import test, { describe, it } from "node:test"
import assert from "node:assert"
import {
  isBlackOrWhite,
  validateColor,
  assertOnlyBlackAndWhite,
  validateColorList,
  scanAndDetectColors
} from "../src/lib/color-detector.ts"

describe("Color Detection Test - Black & White Only Enforcement", () => {
  describe("Pure Black Colors (MUST PASS)", () => {
    const validBlackColors = [
      { input: "#000000", format: "6-digit hex lowercase" },
      { input: "#000", format: "3-digit hex" },
      { input: "#000000FF", format: "8-digit hex with full alpha" },
      { input: "#000f", format: "4-digit hex with full alpha" },
      { input: "rgb(0, 0, 0)", format: "rgb with spaces" },
      { input: "rgb(0,0,0)", format: "rgb without spaces" },
      { input: "rgba(0, 0, 0, 1)", format: "rgba full opacity" },
      { input: "rgba(0, 0, 0, 1.0)", format: "rgba decimal full opacity" },
      { input: "hsl(0, 0%, 0%)", format: "hsl black" },
      { input: "black", format: "named color black" }
    ]

    for (const { input, format } of validBlackColors) {
      it(`should PASS for pure black: ${input} (${format})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          true,
          `Expected pure black ${input} to pass validation`
        )
        assert.strictEqual(result.isBlack, true)
        assert.strictEqual(result.isWhite, false)
        assert.strictEqual(isBlackOrWhite(input), true)
        assert.doesNotThrow(() => assertOnlyBlackAndWhite(input))
      })
    }
  })

  describe("Pure White Colors (MUST PASS)", () => {
    const validWhiteColors = [
      { input: "#ffffff", format: "6-digit hex lowercase" },
      { input: "#FFFFFF", format: "6-digit hex uppercase" },
      { input: "#fff", format: "3-digit hex lowercase" },
      { input: "#FFF", format: "3-digit hex uppercase" },
      { input: "#ffffffff", format: "8-digit hex with full alpha" },
      { input: "#ffff", format: "4-digit hex with full alpha" },
      { input: "rgb(255, 255, 255)", format: "rgb with spaces" },
      { input: "rgb(255,255,255)", format: "rgb without spaces" },
      { input: "rgba(255, 255, 255, 1)", format: "rgba full opacity" },
      { input: "rgba(255, 255, 255, 1.0)", format: "rgba decimal full opacity" },
      { input: "hsl(0, 0%, 100%)", format: "hsl pure white" },
      { input: "white", format: "named color white" }
    ]

    for (const { input, format } of validWhiteColors) {
      it(`should PASS for pure white: ${input} (${format})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          true,
          `Expected pure white ${input} to pass validation`
        )
        assert.strictEqual(result.isWhite, true)
        assert.strictEqual(result.isBlack, false)
        assert.strictEqual(isBlackOrWhite(input), true)
        assert.doesNotThrow(() => assertOnlyBlackAndWhite(input))
      })
    }
  })

  describe("Red Colors (MUST FAIL)", () => {
    const redColors = [
      { input: "red", label: "named red" },
      { input: "#ff0000", label: "pure hex red" },
      { input: "#FF0000", label: "pure hex red uppercase" },
      { input: "#f00", label: "3-digit hex red" },
      { input: "#ef4444", label: "Tailwind red-500" },
      { input: "#dc2626", label: "Tailwind red-600" },
      { input: "#b91c1c", label: "Tailwind red-700" },
      { input: "#991b1b", label: "Tailwind red-800" },
      { input: "rgb(255, 0, 0)", label: "rgb red" },
      { input: "rgba(239, 68, 68, 1)", label: "rgba red-500" },
      { input: "hsl(0, 100%, 50%)", label: "hsl pure red" }
    ]

    for (const { input, label } of redColors) {
      it(`should FAIL for red color: ${input} (${label})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          false,
          `Expected red color ${input} to fail test`
        )
        assert.strictEqual(isBlackOrWhite(input), false)
        assert.throws(
          () => assertOnlyBlackAndWhite(input),
          /Color detection test failed!/
        )
      })
    }
  })

  describe("Green Colors (MUST FAIL)", () => {
    const greenColors = [
      { input: "green", label: "named green" },
      { input: "lime", label: "named lime" },
      { input: "#00ff00", label: "pure hex green / lime" },
      { input: "#0f0", label: "3-digit hex green" },
      { input: "#22c55e", label: "Tailwind emerald/green-500 (used in UI copied toast)" },
      { input: "#16a34a", label: "Tailwind green-600" },
      { input: "#15803d", label: "Tailwind green-700" },
      { input: "#10b981", label: "Tailwind emerald-500" },
      { input: "rgb(0, 255, 0)", label: "rgb pure green" },
      { input: "rgb(34, 197, 94)", label: "rgb emerald green" },
      { input: "rgba(34, 197, 94, 1)", label: "rgba emerald green" },
      { input: "hsl(120, 100%, 50%)", label: "hsl pure green" }
    ]

    for (const { input, label } of greenColors) {
      it(`should FAIL for green color: ${input} (${label})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          false,
          `Expected green color ${input} to fail test`
        )
        assert.strictEqual(isBlackOrWhite(input), false)
        assert.throws(
          () => assertOnlyBlackAndWhite(input),
          /Color detection test failed!/
        )
      })
    }
  })

  describe("Pop-up UI Colors Used in the Extension (MUST FAIL)", () => {
    const uiPopupColors = [
      { input: "#09090b", label: "UI Popup Dark Background (--bg-primary dark / Onyx Black)" },
      { input: "#121215", label: "UI Popup Secondary Dark Background (--bg-secondary dark)" },
      { input: "#18181b", label: "UI Popup Subtle Border & Surface (--border-subtle dark / Jet Black)" },
      { input: "#27272a", label: "UI Popup Dark Border (--border-color dark / Dark Zinc)" },
      { input: "#1c1c20", label: "UI Popup Tertiary Dark Background (--bg-tertiary dark)" },
      { input: "#0c0c0e", label: "UI Popup Card Background (dark:bg-[#0c0c0e])" },
      { input: "#f4f4f5", label: "UI Popup Light Secondary Background (--bg-secondary light / Zinc White)" },
      { input: "#e4e4e7", label: "UI Popup Light Tertiary Background / Border (--bg-tertiary / Platinum)" },
      { input: "#52525b", label: "UI Popup Charcoal Text (--text-secondary light / Charcoal)" },
      { input: "#a1a1aa", label: "UI Popup Muted Text (--text-muted light, --text-secondary dark / Ash Gray)" },
      { input: "#71717a", label: "UI Popup Zinc Text (--text-muted dark / Zinc)" },
      { input: "#fafafa", label: "UI Popup Off-White Text (--text-primary dark / Snow White)" },
      { input: "#525252", label: "UI Popup Light Accent Color (--accent-color light)" },
      { input: "#a3a3a3", label: "UI Popup Dark Accent Color (--accent-color dark)" }
    ]

    for (const { input, label } of uiPopupColors) {
      it(`should FAIL for UI pop-up color: ${input} (${label})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          false,
          `Expected UI pop-up color ${input} (${label}) to fail black/white color test`
        )
        assert.strictEqual(isBlackOrWhite(input), false)
        assert.throws(
          () => assertOnlyBlackAndWhite(input, label),
          /Color detection test failed!/
        )
      })
    }
  })

  describe("Other Arbitrary & Chromatic Colors (MUST FAIL)", () => {
    const otherColors = [
      { input: "blue", label: "named blue" },
      { input: "#3b82f6", label: "hex blue-500" },
      { input: "yellow", label: "named yellow" },
      { input: "#eab308", label: "hex yellow-500" },
      { input: "purple", label: "named purple" },
      { input: "#a855f7", label: "hex purple-500" },
      { input: "orange", label: "named orange" },
      { input: "#f97316", label: "hex orange-500" },
      { input: "pink", label: "named pink" },
      { input: "#ec4899", label: "hex pink-500" },
      { input: "cyan", label: "named cyan" },
      { input: "#06b6d4", label: "hex cyan-500" },
      { input: "gray", label: "named gray" },
      { input: "#808080", label: "hex 50% gray" },
      { input: "rgba(0, 0, 0, 0.5)", label: "semi-transparent black (a=0.5)" },
      { input: "rgba(255, 255, 255, 0.12)", label: "semi-transparent white (a=0.12)" },
      { input: "invalid-color-value", label: "unrecognized string" }
    ]

    for (const { input, label } of otherColors) {
      it(`should FAIL for color: ${input} (${label})`, () => {
        const result = validateColor(input)
        assert.strictEqual(
          result.isValid,
          false,
          `Expected non-black/white color ${input} to fail validation`
        )
        assert.strictEqual(isBlackOrWhite(input), false)
        assert.throws(
          () => assertOnlyBlackAndWhite(input),
          /Color detection test failed!/
        )
      })
    }
  })

  describe("Batch Color List Validation", () => {
    it("should PASS when list contains strictly black and white colors", () => {
      const pureBlackAndWhiteList = [
        "#000000",
        "#ffffff",
        "#000",
        "#fff",
        "black",
        "white",
        "rgb(0, 0, 0)",
        "rgb(255, 255, 255)"
      ]

      const result = validateColorList(pureBlackAndWhiteList)
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.failedCount, 0)
      assert.strictEqual(result.validCount, pureBlackAndWhiteList.length)
      assert.deepStrictEqual(result.offendingColors, [])
    })

    it("should FAIL when list contains red, green, or UI pop-up colors", () => {
      const mixedList = [
        "#000000",      // valid (black)
        "#ffffff",      // valid (white)
        "#ff0000",      // invalid (red)
        "#22c55e",      // invalid (green)
        "#09090b",      // invalid (UI popup dark bg)
        "#f4f4f5"       // invalid (UI popup light bg)
      ]

      const result = validateColorList(mixedList)
      assert.strictEqual(result.passed, false)
      assert.strictEqual(result.validCount, 2)
      assert.strictEqual(result.failedCount, 4)
      assert.deepStrictEqual(result.offendingColors, [
        "#ff0000",
        "#22c55e",
        "#09090b",
        "#f4f4f5"
      ])
    })
  })

  describe("Text / CSS Color Detection Scanner", () => {
    it("should PASS on CSS snippet using only pure black and white", () => {
      const validCss = `
        .pure-monochrome-card {
          background-color: #000000;
          color: #ffffff;
          border-color: #000;
          fill: white;
          stroke: black;
        }
      `

      const result = scanAndDetectColors(validCss)
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.failedCount, 0)
    })

    it("should FAIL on CSS snippet using red, green, or pop-up colors", () => {
      const invalidCss = `
        .popup-modal {
          background-color: #09090b;
          color: #ffffff;
          border: 1px solid #27272a;
        }
        .toast-success {
          stroke: #22c55e;
        }
        .danger-btn {
          background-color: #ef4444;
        }
      `

      const result = scanAndDetectColors(invalidCss)
      assert.strictEqual(result.passed, false)
      assert.ok(result.offendingColors.includes("#09090b"), "Should flag #09090b (popup bg)")
      assert.ok(result.offendingColors.includes("#27272a"), "Should flag #27272a (popup border)")
      assert.ok(result.offendingColors.includes("#22c55e"), "Should flag #22c55e (green)")
      assert.ok(result.offendingColors.includes("#ef4444"), "Should flag #ef4444 (red)")
    })
  })
})
