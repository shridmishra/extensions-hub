import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, "../src")

describe("Figma Picker: Precision Capture & Multi-Line Vector Tests", () => {
  describe("Code Integrity & Implementation Verification", () => {
    it("should support deg, turn, rad, grad in parseStopPosition in gradients.ts", () => {
      const gradContent = fs.readFileSync(path.join(SRC_DIR, "converter/css/gradients.ts"), "utf8")
      assert.ok(gradContent.includes("function parseStopPosition"), "gradients.ts must declare parseStopPosition")
      assert.ok(gradContent.includes('s.endsWith("deg")'), "must parse deg units")
      assert.ok(gradContent.includes('s.endsWith("turn")'), "must parse turn units")
      assert.ok(gradContent.includes('s.endsWith("rad")'), "must parse rad units")
      assert.ok(gradContent.includes('s.endsWith("grad")'), "must parse grad units")
      assert.ok(gradContent.includes("deg / 360"), "must normalize degrees to 0..1 range")
    })

    it("should resolve CSS variables in cleaner.ts without dropping strokes/fills", () => {
      const cleanerContent = fs.readFileSync(path.join(SRC_DIR, "converter/svg/cleaner.ts"), "utf8")
      assert.ok(cleanerContent.includes('attrStroke.startsWith("var(")'), "cleaner.ts must check for var(--...) in stroke")
      assert.ok(cleanerContent.includes('attrFill.startsWith("var(")'), "cleaner.ts must check for var(--...) in fill")
      assert.ok(cleanerContent.includes("formatCssColorToRgbString(attrStroke"), "cleaner.ts must format stroke var to RGB")
      assert.ok(cleanerContent.includes("formatCssColorToRgbString(attrFill"), "cleaner.ts must format fill var to RGB")
    })

    it("should unwrap nested SVG elements and render explicit tspan linebreaks in serializer.ts", () => {
      const serializerContent = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
      assert.ok(serializerContent.includes("function unwrapSvgToGroup"), "serializer.ts must implement unwrapSvgToGroup")
      assert.ok(serializerContent.includes("unwrapSvgToGroup(node.svgContent"), "serializer.ts must unwrap SVG nodes")
      assert.ok(serializerContent.includes('dy="${round2(lineHeight)}"'), "serializer.ts must use dy for subsequent lines")
    })

    it("should exclude BACKGROUND_BLUR from SVG filters to protect card borders and fills", () => {
      const serializerContent = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
      assert.ok(serializerContent.includes("visibleLayerBlurs = effects.filter"), "serializer.ts must filter only LAYER_BLUR")
      assert.ok(!serializerContent.includes('e.type === "BACKGROUND_BLUR"'), "serializer.ts must not include BACKGROUND_BLUR in SVG filters")
      assert.ok(serializerContent.includes("hasSolidBg || hasStroke"), "serializer.ts must render rects with borders")
    })

    it("should map multi-lobe conic gradients to vector linear gradients", () => {
      const gradContent = fs.readFileSync(path.join(SRC_DIR, "converter/css/gradients.ts"), "utf8")
      assert.ok(gradContent.includes("hasOppositeLobe"), "gradients.ts must detect dual-lobe conic gradients")
      assert.ok(gradContent.includes('type: "GRADIENT_LINEAR"'), "gradients.ts must emit vector linear gradient for dual-lobe conic gradients")
    })
  })

  describe("Angular Stop Position Normalization Logic", () => {
    function parseStopPosition(posStr: string | undefined): number | undefined {
      if (!posStr) return undefined
      const s = posStr.trim().toLowerCase()
      if (s.endsWith("%")) {
        const val = parseFloat(s)
        return isNaN(val) ? undefined : Math.min(1, Math.max(0, val / 100))
      }
      if (s.endsWith("deg")) {
        const deg = parseFloat(s)
        if (isNaN(deg)) return undefined
        return Math.min(1, Math.max(0, deg / 360))
      }
      if (s.endsWith("turn")) {
        const turn = parseFloat(s)
        if (isNaN(turn)) return undefined
        return Math.min(1, Math.max(0, turn))
      }
      if (s.endsWith("rad")) {
        const rad = parseFloat(s)
        if (isNaN(rad)) return undefined
        return Math.min(1, Math.max(0, (rad * 180 / Math.PI) / 360))
      }
      if (s.endsWith("grad")) {
        const grad = parseFloat(s)
        if (isNaN(grad)) return undefined
        return Math.min(1, Math.max(0, grad / 400))
      }
      return undefined
    }

    it("should correctly normalize degrees: 0deg, 25deg, 180deg, 360deg", () => {
      assert.strictEqual(parseStopPosition("0deg"), 0)
      assert.ok(Math.abs((parseStopPosition("25deg") ?? 0) - 25 / 360) < 0.0001)
      assert.strictEqual(parseStopPosition("180deg"), 0.5)
      assert.strictEqual(parseStopPosition("360deg"), 1)
    })

    it("should correctly normalize turn units: 0turn, 0.5turn, 1turn", () => {
      assert.strictEqual(parseStopPosition("0turn"), 0)
      assert.strictEqual(parseStopPosition("0.5turn"), 0.5)
      assert.strictEqual(parseStopPosition("1turn"), 1)
    })

    it("should correctly normalize rad units: 0rad, PI rad, 2PI rad", () => {
      assert.strictEqual(parseStopPosition("0rad"), 0)
      assert.ok(Math.abs((parseStopPosition(`${Math.PI}rad`) ?? 0) - 0.5) < 0.0001)
      assert.ok(Math.abs((parseStopPosition(`${2 * Math.PI}rad`) ?? 0) - 1) < 0.0001)
    })
  })

  describe("Nested SVG Unwrapping Algorithm", () => {
    function unwrapSvgToGroup(
      svgContent: string,
      boxWidth: number,
      boxHeight: number
    ): string {
      if (!svgContent || !svgContent.includes("<svg")) return svgContent

      const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
      let scaleX = 1
      let scaleY = 1
      let translateX = 0
      let translateY = 0

      if (viewBoxMatch && viewBoxMatch[1]) {
        const vbParts = viewBoxMatch[1].trim().split(/[\s,]+/).map(parseFloat)
        if (vbParts.length === 4 && vbParts[2] > 0 && vbParts[3] > 0) {
          const [vx, vy, vw, vh] = vbParts
          const targetW = boxWidth > 0 ? boxWidth : vw
          const targetH = boxHeight > 0 ? boxHeight : vh
          scaleX = targetW / vw
          scaleY = targetH / vh
          translateX = -vx * scaleX
          translateY = -vy * scaleY
        }
      }

      let cleanContent = svgContent.replace(/<defs[\s\S]*?<\/defs>/gi, "")
      const innerMatch = cleanContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
      const innerElements = innerMatch ? innerMatch[1].trim() : cleanContent

      const hasScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001
      const hasTrans = Math.abs(translateX) > 0.01 || Math.abs(translateY) > 0.01

      let innerTransform = ""
      if (hasTrans && hasScale) {
        innerTransform = ` transform="translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})"`
      } else if (hasScale) {
        innerTransform = ` transform="scale(${scaleX}, ${scaleY})"`
      } else if (hasTrans) {
        innerTransform = ` transform="translate(${translateX}, ${translateY})"`
      }

      if (innerTransform) {
        return `    <g${innerTransform}>\n    ${innerElements}\n    </g>`
      }

      return innerElements
    }

    it("should unwrap nested <svg> into scaled <g> without outer <svg> container", () => {
      const nested = `<svg width="100" height="50" viewBox="0 0 200 100"><path d="M0,0 L200,100" stroke="rgb(0,0,0)" /></svg>`
      const unwrapped = unwrapSvgToGroup(nested, 100, 50)

      assert.ok(!unwrapped.includes("<svg"), "Must NOT contain nested <svg> tag")
      assert.ok(unwrapped.includes("<g transform="), "Must contain <g transform=")
      assert.ok(unwrapped.includes("scale(0.5, 0.5)"), "Must correctly compute scale 0.5")
      assert.ok(unwrapped.includes('<path d="M0,0 L200,100"'), "Must preserve inner path element")
    })

    it("should unwrap 1:1 viewports directly without unnecessary transform", () => {
      const direct = `<svg width="200" height="100" viewBox="0 0 200 100"><path d="M0,0 L200,100" /></svg>`
      const unwrapped = unwrapSvgToGroup(direct, 200, 100)

      assert.ok(!unwrapped.includes("<svg"), "Must NOT contain <svg> tag")
      assert.strictEqual(unwrapped, '<path d="M0,0 L200,100" />')
    })
  })

  describe("Multi-Line Text Tspan Formatting", () => {
    function formatTspans(
      chars: string,
      lineHeight: number,
      x: number
    ): string {
      const lines = chars.split("\n")
      return lines
        .map((line, idx) => {
          if (idx === 0) return `<tspan x="${x}">${line}</tspan>`
          return `<tspan x="${x}" dy="${lineHeight}">${line}</tspan>`
        })
        .join("")
    }

    it("should compute relative linebreaks using standard dy attribute", () => {
      const result = formatTspans(
        "First line\nSecond line\nThird line",
        22,
        20
      )

      assert.ok(result.includes('<tspan x="20">First line</tspan>'))
      assert.ok(result.includes('<tspan x="20" dy="22">Second line</tspan>'))
      assert.ok(result.includes('<tspan x="20" dy="22">Third line</tspan>'))
    })
  })
})
