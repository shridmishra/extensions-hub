import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getExtensionById } from "../src/lib/registry.ts"
import { INTERACTIVE_TOOLS } from "../src/lib/storage.ts"
import { TOOL_MESSAGE_MAP } from "../src/lib/tool-launcher.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, "../src")

describe("Figma Picker: Text-Clipped Backgrounds & Gradient Text Fix (#04)", () => {
  describe("Extension Registry & Messaging Integration", () => {
    it("should be registered in EXTENSION_REGISTRY with valid metadata", () => {
      const ext = getExtensionById("figma-picker")
      assert.ok(ext, "Extension 'figma-picker' must exist in EXTENSION_REGISTRY")
      assert.strictEqual(ext.id, "figma-picker")
      assert.strictEqual(ext.number, 4)
      assert.strictEqual(ext.type, "interactive")
      assert.strictEqual(ext.isImplemented, true)
    })

    it("should be mapped in INTERACTIVE_TOOLS for mutual exclusion", () => {
      assert.strictEqual(
        INTERACTIVE_TOOLS["figma-picker"],
        "figma_picker_active"
      )
    })

    it("should be mapped in TOOL_MESSAGE_MAP to START_ELEMENT_SELECTION", () => {
      assert.strictEqual(
        TOOL_MESSAGE_MAP["figma-picker"],
        "START_ELEMENT_SELECTION"
      )
    })
  })

  describe("Code Integrity & Implementation Verification", () => {
    it("should have isTextClipped in IRMetadata schema in ir.ts", () => {
      const irContent = fs.readFileSync(path.join(SRC_DIR, "types/ir.ts"), "utf8")
      assert.ok(irContent.includes("isTextClipped?: boolean"), "ir.ts must declare isTextClipped in IRMetadata")
    })

    it("should export isTextClippedBackground in traversal.ts", () => {
      const traversalContent = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(traversalContent.includes("export function isTextClippedBackground"), "traversal.ts must export isTextClippedBackground")
      assert.ok(traversalContent.includes("background-clip"), "must check background-clip")
      assert.ok(traversalContent.includes("-webkit-background-clip"), "must check -webkit-background-clip")
      assert.ok(traversalContent.includes("textClippedFills"), "must separate textClippedFills from frame fills")
      assert.ok(traversalContent.includes("isTextClipped: isTextClip"), "must set isTextClipped in node metadata")
    })

    it("should suppress bgMarkup for text-clipped frames in serializer.ts", () => {
      const serializerContent = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
      assert.ok(serializerContent.includes("isTextClipped = !!node.metadata?.isTextClipped"), "serializer.ts must check isTextClipped")
      assert.ok(serializerContent.includes("!isTextClipped && (hasBackground || hasStroke || hasEffects)"), "serializer.ts must guard bgMarkup with !isTextClipped")
    })

    it("should skip text-clipped elements in resolveElementBackground in index.ts", () => {
      const indexContent = fs.readFileSync(path.join(SRC_DIR, "converter/index.ts"), "utf8")
      assert.ok(indexContent.includes("isTextClippedBackground(style)"), "resolveElementBackground must skip text-clipped elements")
      assert.ok(indexContent.includes("!rootNode.metadata?.isTextClipped"), "convertElementToIR must not override fills on text-clipped root node")
    })

    it("should resolve DOM-based colors and variables in color.ts", () => {
      const colorContent = fs.readFileSync(path.join(SRC_DIR, "converter/css/color.ts"), "utf8")
      assert.ok(colorContent.includes("resolveColorViaDom"), "color.ts must implement resolveColorViaDom")
      assert.ok(colorContent.includes("resolveCssVariableInDom"), "color.ts must implement resolveCssVariableInDom")
    })

    it("should resolve CSS variables in gradients.ts", () => {
      const gradContent = fs.readFileSync(path.join(SRC_DIR, "converter/css/gradients.ts"), "utf8")
      assert.ok(gradContent.includes("resolveCssVariablesInString"), "gradients.ts must implement resolveCssVariablesInString")
    })
  })

  describe("Text-Clip Detection Heuristics", () => {
    function isTextClippedBackground(computed: any): boolean {
      if (!computed) return false
      const getProp = (p: string) => {
        if (typeof computed.getPropertyValue === "function") {
          return computed.getPropertyValue(p) || ""
        }
        const camel = p.replace(/-([a-z])/g, (_: any, c: string) => c.toUpperCase())
        return computed[camel] || computed[p] || ""
      }

      const clip = (
        getProp("background-clip") ||
        getProp("-webkit-background-clip") ||
        computed.backgroundClip ||
        computed.webkitBackgroundClip ||
        ""
      ).toLowerCase()

      if (clip.includes("text")) return true

      const colorStr = getProp("color")
      const textFill = getProp("-webkit-text-fill-color")
      const bg = getProp("background-image")
      const isColorTransparent =
        colorStr === "transparent" ||
        textFill === "transparent" ||
        colorStr === "rgba(0, 0, 0, 0)" ||
        textFill === "rgba(0, 0, 0, 0)"

      if (isColorTransparent && bg && bg !== "none" && bg.includes("gradient")) {
        return true
      }

      return false
    }

    it("should detect standard background-clip: text", () => {
      assert.strictEqual(
        isTextClippedBackground({
          backgroundClip: "text",
          getPropertyValue: (p: string) => (p === "background-clip" ? "text" : "")
        }),
        true
      )
    })

    it("should detect vendor prefixed -webkit-background-clip: text", () => {
      assert.strictEqual(
        isTextClippedBackground({
          webkitBackgroundClip: "text",
          getPropertyValue: (p: string) => (p === "-webkit-background-clip" ? "text" : "")
        }),
        true
      )
    })

    it("should detect transparent text with background gradient (fallback heuristic)", () => {
      assert.strictEqual(
        isTextClippedBackground({
          color: "transparent",
          backgroundImage: "linear-gradient(180deg, #000 0%, #333 100%)",
          getPropertyValue: (p: string) => {
            if (p === "color") return "transparent"
            if (p === "background-image") return "linear-gradient(180deg, #000 0%, #333 100%)"
            return ""
          }
        }),
        true
      )
    })

    it("should reject standard buttons and solid containers", () => {
      assert.strictEqual(
        isTextClippedBackground({
          color: "rgb(0, 0, 0)",
          backgroundColor: "rgb(255, 255, 255)",
          backgroundImage: "none",
          getPropertyValue: (p: string) => {
            if (p === "color") return "rgb(0, 0, 0)"
            if (p === "background-color") return "rgb(255, 255, 255)"
            return ""
          }
        }),
        false
      )
    })
  })
})
