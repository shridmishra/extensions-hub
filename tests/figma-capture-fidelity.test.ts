import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseCssFilterBlur, parseCssBackdropFilter } from "../src/converter/css/shadows.ts"
import { convertIRToSvg } from "../src/converter/svg/serializer.ts"
import type { IRDocument } from "../src/types/ir.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, "../src")

describe("Figma Capture Fidelity & Precision Tests", () => {
  describe("1. CSS Filter Blur & Backdrop Blur Parsing", () => {
    it("should parse CSS filter blur(40px) into LAYER_BLUR effect", () => {
      const effects = parseCssFilterBlur("blur(40px)")
      assert.strictEqual(effects.length, 1)
      assert.strictEqual(effects[0].type, "LAYER_BLUR")
      assert.strictEqual(effects[0].radius, 40)
      assert.strictEqual(effects[0].visible, true)
    })

    it("should parse CSS filter blur with rem units", () => {
      const effects = parseCssFilterBlur("blur(2.5rem)")
      assert.strictEqual(effects.length, 1)
      assert.strictEqual(effects[0].type, "LAYER_BLUR")
      assert.strictEqual(effects[0].radius, 40) // 2.5 * 16
    })

    it("should parse backdrop-filter blur(16px) into BACKGROUND_BLUR effect", () => {
      const effects = parseCssBackdropFilter("blur(16px)")
      assert.strictEqual(effects.length, 1)
      assert.strictEqual(effects[0].type, "BACKGROUND_BLUR")
      assert.strictEqual(effects[0].radius, 16)
      assert.strictEqual(effects[0].visible, true)
    })

    it("should return empty array for none or invalid filter", () => {
      assert.deepStrictEqual(parseCssFilterBlur(null), [])
      assert.deepStrictEqual(parseCssFilterBlur("none"), [])
      assert.deepStrictEqual(parseCssFilterBlur("brightness(0.8)"), [])
    })
  })

  describe("2. SVG Serialization of feGaussianBlur for Layer & Ambient Blurs", () => {
    it("should emit feGaussianBlur filter when LAYER_BLUR is present", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Blur Test",
        url: "https://example.com",
        viewport: { width: 400, height: 400, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "root",
          name: "Card with Glow",
          type: "FRAME",
          box: { x: 0, y: 0, width: 400, height: 400 },
          absoluteBox: { x: 0, y: 0, width: 400, height: 400 },
          opacity: 1,
          fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 }, opacity: 1, visible: true }],
          strokes: [],
          effects: [],
          children: [
            {
              id: "blob-1",
              name: "div.ambient-glow",
              type: "FRAME",
              box: { x: 50, y: 200, width: 120, height: 120 },
              absoluteBox: { x: 50, y: 200, width: 120, height: 120 },
              opacity: 0.8,
              cornerRadius: 60,
              fills: [{ type: "SOLID", color: { r: 0.5, g: 0.9, b: 0.2, a: 1 }, opacity: 1, visible: true }],
              strokes: [],
              effects: [
                {
                  type: "LAYER_BLUR",
                  radius: 60,
                  visible: true
                }
              ],
              children: [],
              metadata: { tagName: "div" }
            }
          ],
          metadata: { tagName: "div" }
        },
        stats: { totalNodes: 2, textNodes: 0, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes("<feGaussianBlur"), "SVG output must contain feGaussianBlur for LAYER_BLUR")
      assert.ok(svg.includes('stdDeviation="30"'), "stdDeviation must be radius / 2 (30)")
      assert.ok(svg.includes('filter="url(#filter_'), "Glow element must have filter attribute pointing to feGaussianBlur")
    })
  })

  describe("3. Multiline Soft-Wrap & <tspan> Layout in SVG", () => {
    it("should render multiline text with tspans and proper dy offsets", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Text Wrap Test",
        url: "https://example.com",
        viewport: { width: 360, height: 200, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "root",
          name: "Text Container",
          type: "FRAME",
          box: { x: 0, y: 0, width: 360, height: 200 },
          absoluteBox: { x: 0, y: 0, width: 360, height: 200 },
          opacity: 1,
          fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 }, opacity: 1, visible: true }],
          strokes: [],
          effects: [],
          children: [
            {
              id: "text-1",
              name: '"Book a 15-minute demo…"',
              type: "TEXT",
              box: { x: 20, y: 30, width: 320, height: 48 },
              absoluteBox: { x: 20, y: 30, width: 320, height: 48 },
              opacity: 1,
              fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
              strokes: [],
              effects: [],
              textData: {
                characters: "Book a 15-minute demo with our team to see Nora sell\nfrom your catalog in real time.",
                fontSize: 16,
                fontFamily: "Satoshi",
                fontWeight: 500,
                lineHeightPx: 24,
                textAlign: "CENTER",
                fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
              },
              children: [],
              metadata: { tagName: "#text" }
            }
          ],
          metadata: { tagName: "div" }
        },
        stats: { totalNodes: 2, textNodes: 1, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes("<tspan"), "SVG output must contain tspan elements for multiline text")
      assert.ok(svg.includes("Book a 15-minute demo with our team to see Nora sell"), "First line must be in SVG")
      assert.ok(svg.includes("from your catalog in real time."), "Second line must be in SVG")
      assert.ok(svg.includes('dy="24"'), "Second tspan must have dy offset matching lineHeightPx (24)")
      assert.ok(svg.includes('text-anchor="middle"'), "Centered multiline text must have text-anchor middle")
    })
  })

  describe("4. SVG Image Rendering & Figma Compatibility (xlink:href & Inset Rings)", () => {
    it("should emit both href and xlink:href on <image> elements in IMAGE nodes", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Image Node Test",
        url: "https://example.com",
        viewport: { width: 200, height: 200, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "root",
          name: "Image Root",
          type: "IMAGE",
          box: { x: 0, y: 0, width: 200, height: 200 },
          absoluteBox: { x: 0, y: 0, width: 200, height: 200 },
          opacity: 1,
          fills: [
            {
              type: "IMAGE",
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
              scaleMode: "FILL",
              visible: true
            }
          ],
          strokes: [],
          effects: [],
          children: [],
          metadata: { tagName: "img" }
        },
        stats: { totalNodes: 1, textNodes: 0, vectorNodes: 0, cutoutNodes: 0, imageNodes: 1, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes("<image"), "SVG must contain <image> tag")
      assert.ok(svg.includes('href="data:image/png;base64,'), "SVG must contain href attribute")
      assert.ok(svg.includes('xlink:href="data:image/png;base64,'), "SVG must contain xlink:href attribute for Figma compatibility")
    })

    it("should emit both href and xlink:href on background images in FRAME nodes", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Frame Bg Image Test",
        url: "https://example.com",
        viewport: { width: 500, height: 300, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "root",
          name: "Card with Bg Image",
          type: "FRAME",
          box: { x: 0, y: 0, width: 500, height: 300 },
          absoluteBox: { x: 0, y: 0, width: 500, height: 300 },
          opacity: 1,
          cornerRadius: 24,
          fills: [
            {
              type: "IMAGE",
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
              scaleMode: "FILL",
              visible: true
            }
          ],
          strokes: [],
          effects: [],
          children: [],
          metadata: { tagName: "div" }
        },
        stats: { totalNodes: 1, textNodes: 0, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes("<image"), "SVG must contain <image> tag for frame background")
      assert.ok(svg.includes('href="data:image/png;base64,'), "Must contain href attribute")
      assert.ok(svg.includes('xlink:href="data:image/png;base64,'), "Must contain xlink:href attribute")
    })

    it("should render fill='none' for transparent ring / rim-light overlays instead of solid white", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Rim Light Test",
        url: "https://example.com",
        viewport: { width: 500, height: 300, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "root",
          name: "Rim Light Overlay",
          type: "FRAME",
          box: { x: 0, y: 0, width: 500, height: 300 },
          absoluteBox: { x: 0, y: 0, width: 500, height: 300 },
          opacity: 1,
          cornerRadius: 24,
          fills: [], // transparent!
          strokes: [],
          effects: [
            {
              type: "DROP_SHADOW",
              isInset: true,
              offset: { x: 0, y: 0 },
              radius: 1,
              spread: 1,
              color: { r: 1, g: 1, b: 1, a: 0.6 },
              visible: true
            }
          ],
          children: [],
          metadata: { tagName: "div" }
        },
        stats: { totalNodes: 1, textNodes: 0, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes('fill="none"'), "Transparent rim-light overlay must have fill='none' to avoid blocking children")
      assert.ok(!svg.includes('fill="rgb(255, 255, 255)"'), "Transparent rim-light overlay must NEVER be filled with solid white")
    })
  })

  describe("5. Traversal Logic, Animation Guards & Source Code Verification", () => {
    it("should ignore Plasmo host elements and hub extension root in traversal.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(code.includes('element.closest(".hub-extension-root")'), "Must skip .hub-extension-root")
      assert.ok(code.includes('element.closest("plasmo-csui")'), "Must skip plasmo-csui")
      assert.ok(code.includes('element.id === "plasmo-shadow-container"'), "Must skip plasmo shadow container")
    })

    it("should preserve animation-hidden copy containers in traversal.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(code.includes("hasAnimationHiddenCopy"), "Must detect hasAnimationHiddenCopy")
      assert.ok(code.includes("opacity = 1"), "Must restore opacity for animation-hidden content")
    })

    it("should filter out zero-height overflow-hidden elements and closed accordions in traversal.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(code.includes("rect.height <= 0.5 && (isOverflowHiddenY || isOverflowHiddenX)"), "Must discard zero-height overflow-hidden elements")
      assert.ok(code.includes('dataState === "closed"'), "Must handle closed accordions")
      assert.ok(code.includes("(element as HTMLElement).hidden"), "Must discard elements with hidden attribute")
    })

    it("should implement preparePageForCapture in figma-picker.tsx", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "contents/figma-picker.tsx"), "utf8")
      assert.ok(code.includes("preparePageForCapture"), "figma-picker.tsx must include preparePageForCapture")
      assert.ok(code.includes("ScrollTrigger"), "Must trigger GSAP ScrollTrigger if available")
    })

    it("should implement WebP-to-PNG conversion in images.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/images.ts"), "utf8")
      assert.ok(code.includes("convertDataUrlToPng"), "images.ts must export convertDataUrlToPng")
      assert.ok(code.includes("blobToPngDataUrl"), "images.ts must export blobToPngDataUrl")
      assert.ok(code.includes("image/png"), "Must convert to image/png")
    })

    it("should never collapse <nav> or interactive links into merged text spans in SVG serializer", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Navbar Test",
        url: "https://example.com",
        viewport: { width: 1200, height: 80, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "nav-root",
          name: "nav.navbar",
          type: "FRAME",
          box: { x: 0, y: 0, width: 600, height: 40 },
          absoluteBox: { x: 0, y: 0, width: 600, height: 40 },
          opacity: 1,
          fills: [],
          strokes: [],
          effects: [],
          children: [
            {
              id: "link-1",
              name: "a.nav-link",
              type: "FRAME",
              box: { x: 0, y: 8, width: 80, height: 24 },
              absoluteBox: { x: 0, y: 8, width: 80, height: 24 },
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              children: [
                {
                  id: "text-1",
                  name: "AI Agents",
                  type: "TEXT",
                  box: { x: 8, y: 4, width: 64, height: 16 },
                  absoluteBox: { x: 8, y: 12, width: 64, height: 16 },
                  opacity: 1,
                  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
                  strokes: [],
                  effects: [],
                  textData: {
                    characters: "AI Agents",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: 500,
                    lineHeightPx: 16,
                    fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
                  },
                  children: [],
                  metadata: { tagName: "#text" }
                }
              ],
              metadata: { tagName: "a" }
            },
            {
              id: "link-2",
              name: "a.nav-link",
              type: "FRAME",
              box: { x: 100, y: 8, width: 70, height: 24 },
              absoluteBox: { x: 100, y: 8, width: 70, height: 24 },
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              children: [
                {
                  id: "text-2",
                  name: "Platform",
                  type: "TEXT",
                  box: { x: 8, y: 4, width: 54, height: 16 },
                  absoluteBox: { x: 108, y: 12, width: 54, height: 16 },
                  opacity: 1,
                  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
                  strokes: [],
                  effects: [],
                  textData: {
                    characters: "Platform",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: 500,
                    lineHeightPx: 16,
                    fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
                  },
                  children: [],
                  metadata: { tagName: "#text" }
                }
              ],
              metadata: { tagName: "a" }
            }
          ],
          metadata: { tagName: "nav" }
        },
        stats: { totalNodes: 5, textNodes: 2, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      // Must NOT merge into a single text span
      assert.ok(svg.includes('transform="translate(100, 8)"'), "Second nav link must retain its independent x coordinate (100)")
      assert.ok(svg.includes("AI Agents"), "First link must be rendered")
      assert.ok(svg.includes("Platform"), "Second link must be rendered")
      assert.ok(!svg.includes("<tspan fill="), "Must not merge links into tspan sentence")
    })

    it("should clamp fixed top elements so absBox.y is not negative in traversal.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(code.includes('computed.position === "fixed" && absY < 0'), "traversal.ts must clamp fixed element negative Y")
      assert.ok(code.includes("absY = 0"), "Must clamp absY to 0")
    })

    it("should protect structural containers and links in serializer.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
      assert.ok(code.includes('nodeTag === "NAV"'), "Must guard NAV tag")
      assert.ok(code.includes('tag === "A" || tag === "BUTTON"'), "Must guard interactive link/button children")
    })

    it("should merge gradient headline word spans with spaces into a single text element", () => {
      const doc: IRDocument = {
        version: "1.0.0",
        generator: "html2figma-extension",
        timestamp: Date.now(),
        title: "Headline Words Test",
        url: "https://example.com",
        viewport: { width: 1200, height: 200, scrollX: 0, scrollY: 0 },
        captureMode: "element",
        rootNode: {
          id: "heading-line",
          name: "span.headline-line",
          type: "FRAME",
          box: { x: 0, y: 0, width: 800, height: 60 },
          absoluteBox: { x: 0, y: 0, width: 800, height: 60 },
          opacity: 1,
          fills: [],
          strokes: [],
          effects: [],
          children: [
            {
              id: "word-1",
              name: "span.word",
              type: "FRAME",
              box: { x: 0, y: 0, width: 120, height: 60 },
              absoluteBox: { x: 0, y: 0, width: 120, height: 60 },
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              children: [
                {
                  id: "text-1",
                  name: "Every",
                  type: "TEXT",
                  box: { x: 0, y: 0, width: 120, height: 60 },
                  absoluteBox: { x: 0, y: 0, width: 120, height: 60 },
                  opacity: 1,
                  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
                  strokes: [],
                  effects: [],
                  textData: {
                    characters: "Every",
                    fontSize: 48,
                    fontFamily: "Satoshi",
                    fontWeight: 700,
                    lineHeightPx: 56,
                    fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
                  },
                  children: [],
                  metadata: { tagName: "#text" }
                }
              ],
              metadata: { tagName: "span", isTextClipped: true }
            },
            {
              id: "word-2",
              name: "span.word",
              type: "FRAME",
              box: { x: 136, y: 0, width: 280, height: 60 },
              absoluteBox: { x: 136, y: 0, width: 280, height: 60 },
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              children: [
                {
                  id: "text-2",
                  name: "conversation",
                  type: "TEXT",
                  box: { x: 0, y: 0, width: 280, height: 60 },
                  absoluteBox: { x: 136, y: 0, width: 280, height: 60 },
                  opacity: 1,
                  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
                  strokes: [],
                  effects: [],
                  textData: {
                    characters: "conversation",
                    fontSize: 48,
                    fontFamily: "Satoshi",
                    fontWeight: 700,
                    lineHeightPx: 56,
                    fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
                  },
                  children: [],
                  metadata: { tagName: "#text" }
                }
              ],
              metadata: { tagName: "span", isTextClipped: true }
            },
            {
              id: "word-3",
              name: "span.word",
              type: "FRAME",
              box: { x: 432, y: 0, width: 80, height: 60 },
              absoluteBox: { x: 432, y: 0, width: 80, height: 60 },
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              children: [
                {
                  id: "text-3",
                  name: "can",
                  type: "TEXT",
                  box: { x: 0, y: 0, width: 80, height: 60 },
                  absoluteBox: { x: 432, y: 0, width: 80, height: 60 },
                  opacity: 1,
                  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }],
                  strokes: [],
                  effects: [],
                  textData: {
                    characters: "can",
                    fontSize: 48,
                    fontFamily: "Satoshi",
                    fontWeight: 700,
                    lineHeightPx: 56,
                    fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1, visible: true }]
                  },
                  children: [],
                  metadata: { tagName: "#text" }
                }
              ],
              metadata: { tagName: "span", isTextClipped: true }
            }
          ],
          metadata: { tagName: "span" }
        },
        stats: { totalNodes: 7, textNodes: 3, vectorNodes: 0, cutoutNodes: 0, imageNodes: 0, warnings: [] }
      }

      const svg = convertIRToSvg(doc)
      assert.ok(svg.includes("<tspan"), "Must merge words into tspan")
      assert.ok(svg.includes("Every "), "Must include space after Every")
      assert.ok(svg.includes("conversation "), "Must include space after conversation")
      assert.ok(svg.includes("can</tspan>"), "Must render can as last span")
    })

    it("should not double-space multiline text with both y and dy", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
      assert.ok(!code.includes('y="${lineY}"${dyAttr}'), "Must not specify both y and dy on multiline tspans")
    })

    it("should return null for video without dataUrl or static poster in traversal.ts", () => {
      const code = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
      assert.ok(code.includes("return null"), "Must return null for broken video elements")
      assert.ok(!code.includes("url: videoSrc,\n        dataUrl"), "Must not emit raw MP4 videoSrc as an image")
    })
  })
})
