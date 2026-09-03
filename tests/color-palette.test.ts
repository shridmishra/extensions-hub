import { describe, it } from "node:test"
import assert from "node:assert"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"
import { INTERACTIVE_TOOLS } from "../src/lib/storage.ts"
import { TOOL_MESSAGE_MAP } from "../src/lib/tool-launcher.ts"
import {
  parseCssColor,
  getRelativeLuminance,
  isCtaElement,
  sortPaletteColors,
  formatPaletteAsHexList,
  formatPaletteAsTailwind,
  formatPaletteAsCssVariables,
  formatPaletteAsJson
} from "../src/lib/palette-extractor.ts"
import type { ExtractedColorItem, PagePaletteSummary } from "../src/types/palette.ts"

describe("Page Color Palette Inspector (#10)", () => {
  describe("Registry & Launch Configuration", () => {
    it("should be registered in EXTENSION_REGISTRY with valid schema", () => {
      const ext = EXTENSION_REGISTRY.find((e) => e.id === "color-palette")
      assert.ok(ext, "color-palette must exist in EXTENSION_REGISTRY")
      assert.strictEqual(ext.name, "Page Color Palette Inspector")
      assert.strictEqual(ext.shortName, "Color Palette")
      assert.strictEqual(ext.type, "interactive")
      assert.strictEqual(ext.category, "Color & Design")
      assert.strictEqual(ext.icon, "Palette")
      assert.strictEqual(ext.isImplemented, true)
      assert.ok(ext.tags.includes("palette"))
      assert.ok(ext.tags.includes("color"))
      assert.ok(ext.tags.includes("cta"))
    })

    it("should be registered in INTERACTIVE_TOOLS for mutual exclusion", () => {
      assert.strictEqual(INTERACTIVE_TOOLS["color-palette"], "color_palette_active")
    })

    it("should have a mapped action message in TOOL_MESSAGE_MAP", () => {
      assert.strictEqual(TOOL_MESSAGE_MAP["color-palette"], "START_COLOR_PALETTE")
    })
  })

  describe("Color Parsing & Luminance Engine", () => {
    it("should parse 6-digit and 3-digit hex strings", () => {
      const parsed1 = parseCssColor("#3b82f6")
      assert.ok(parsed1)
      assert.strictEqual(parsed1.hex, "#3B82F6")
      assert.strictEqual(parsed1.rgb, "rgb(59, 130, 246)")

      const parsed2 = parseCssColor("#fff")
      assert.ok(parsed2)
      assert.strictEqual(parsed2.hex, "#FFFFFF")
      assert.strictEqual(parsed2.rgb, "rgb(255, 255, 255)")
    })

    it("should parse rgb and rgba color strings", () => {
      const parsedRgb = parseCssColor("rgb(34, 197, 94)")
      assert.ok(parsedRgb)
      assert.strictEqual(parsedRgb.hex, "#22C55E")

      const parsedRgba = parseCssColor("rgba(239, 68, 68, 0.9)")
      assert.ok(parsedRgba)
      assert.strictEqual(parsedRgba.hex, "#EF4444")
      assert.strictEqual(parsedRgba.alpha, 0.9)
    })

    it("should parse hsl color strings", () => {
      const parsedHsl = parseCssColor("hsl(217, 91%, 60%)")
      assert.ok(parsedHsl)
      assert.strictEqual(parsedHsl.hex, "#3C83F6")
    })

    it("should filter out transparent and invalid colors", () => {
      assert.strictEqual(parseCssColor("transparent"), null)
      assert.strictEqual(parseCssColor("rgba(0, 0, 0, 0)"), null)
      assert.strictEqual(parseCssColor("inherit"), null)
      assert.strictEqual(parseCssColor(""), null)
    })

    it("should compute relative luminance accurately", () => {
      assert.strictEqual(getRelativeLuminance(0, 0, 0), 0) // Black
      assert.strictEqual(getRelativeLuminance(255, 255, 255), 1) // White
      const mid = getRelativeLuminance(59, 130, 246)
      assert.ok(mid > 0 && mid < 1)
    })
  })

  describe("Sorting & Formatting Utilities", () => {
    const mockColors: ExtractedColorItem[] = [
      {
        hex: "#FFFFFF",
        name: "Pure White",
        rgb: "rgb(255, 255, 255)",
        hsl: "hsl(0, 0%, 100%)",
        luminance: 1,
        hue: 0,
        totalCount: 40,
        roles: ["bg", "border"],
        roleCounts: { bg: 30, text: 0, border: 10, cta: 0 },
        elementTags: ["div", "body"]
      },
      {
        hex: "#3B82F6",
        name: "Blue",
        rgb: "rgb(59, 130, 246)",
        hsl: "hsl(217, 91%, 60%)",
        luminance: 0.24,
        hue: 217,
        totalCount: 15,
        roles: ["bg", "cta"],
        roleCounts: { bg: 5, text: 0, border: 0, cta: 10 },
        elementTags: ["button", "a"]
      },
      {
        hex: "#09090B",
        name: "Onyx Black",
        rgb: "rgb(9, 9, 11)",
        hsl: "hsl(240, 10%, 4%)",
        luminance: 0.002,
        hue: 240,
        totalCount: 65,
        roles: ["text"],
        roleCounts: { bg: 0, text: 65, border: 0, cta: 0 },
        elementTags: ["p", "h1", "span"]
      }
    ]

    it("should sort colors by frequency, luminance, and hue", () => {
      const byFreq = sortPaletteColors(mockColors, "frequency")
      assert.strictEqual(byFreq[0].hex, "#09090B") // 65 usages
      assert.strictEqual(byFreq[1].hex, "#FFFFFF") // 40 usages
      assert.strictEqual(byFreq[2].hex, "#3B82F6") // 15 usages

      const byLum = sortPaletteColors(mockColors, "luminance")
      assert.strictEqual(byLum[0].hex, "#FFFFFF") // lum 1
      assert.strictEqual(byLum[2].hex, "#09090B") // lum ~0

      const byHue = sortPaletteColors(mockColors, "hue")
      assert.strictEqual(byHue[0].hex, "#FFFFFF") // hue 0
      assert.strictEqual(byHue[1].hex, "#3B82F6") // hue 217
      assert.strictEqual(byHue[2].hex, "#09090B") // hue 240
    })

    it("should format palette as HEX list", () => {
      const output = formatPaletteAsHexList(mockColors)
      assert.ok(output.includes("#FFFFFF"))
      assert.ok(output.includes("#3B82F6"))
      assert.ok(output.includes("#09090B"))
    })

    it("should format palette as Tailwind Theme configuration", () => {
      const output = formatPaletteAsTailwind(mockColors)
      assert.ok(output.includes("module.exports"))
      assert.ok(output.includes("theme"))
      assert.ok(output.includes("colors"))
      assert.ok(output.includes('"#3B82F6"'))
    })

    it("should format palette as CSS Variables", () => {
      const output = formatPaletteAsCssVariables(mockColors)
      assert.ok(output.includes(":root {"))
      assert.ok(output.includes("--color-"))
      assert.ok(output.includes("#3B82F6;"))
    })

    it("should format palette as structured JSON", () => {
      const summary: PagePaletteSummary = {
        allColors: mockColors,
        bgColors: [mockColors[0], mockColors[1]],
        textColors: [mockColors[2]],
        borderColors: [mockColors[0]],
        ctaColors: [mockColors[1]],
        totalUniqueColors: 3,
        totalUsages: 120,
        primaryBg: "#FFFFFF",
        primaryText: "#09090B"
      }

      const jsonStr = formatPaletteAsJson(summary)
      const parsed = JSON.parse(jsonStr)
      assert.strictEqual(parsed.totalUniqueColors, 3)
      assert.strictEqual(parsed.totalUsages, 120)
      assert.strictEqual(parsed.primaryBackground, "#FFFFFF")
      assert.strictEqual(parsed.primaryText, "#09090B")
      assert.strictEqual(parsed.colors.length, 3)
    })
  })
})
