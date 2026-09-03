import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { convertIRToSvg } from "../src/converter/svg/serializer.ts"
import type { IRDocument } from "../src/types/ir.ts"

const SRC_DIR = path.join(process.cwd(), "src")

describe("Image & SVG Aspect Ratio Preservation Tests", () => {
  it("should implement captureMediaToDataUrl and parseObjectPosition in traversal.ts", () => {
    const traversalCode = fs.readFileSync(path.join(SRC_DIR, "converter/dom/traversal.ts"), "utf8")
    assert.ok(traversalCode.includes("function captureMediaToDataUrl"), "traversal.ts must define captureMediaToDataUrl")
    assert.ok(traversalCode.includes("function parseObjectPosition"), "traversal.ts must define parseObjectPosition")
    assert.ok(traversalCode.includes("captureMediaToDataUrl(\n        imgEl,"), "IMG extraction must use captureMediaToDataUrl")
    assert.ok(traversalCode.includes("captureMediaToDataUrl(\n        videoEl,"), "VIDEO extraction must use captureMediaToDataUrl")
  })

  it("should preserve uniform aspect ratio in unwrapSvgToGroup in serializer.ts", () => {
    const serializerCode = fs.readFileSync(path.join(SRC_DIR, "converter/svg/serializer.ts"), "utf8")
    assert.ok(serializerCode.includes("const uniformScale = Math.min(targetW / vw, targetH / vh)"), "unwrapSvgToGroup must use uniform scaling")
    assert.ok(serializerCode.includes("scaleX = uniformScale"), "scaleX must match uniformScale")
    assert.ok(serializerCode.includes("scaleY = uniformScale"), "scaleY must match uniformScale")
  })

  it("should render image node to SVG preserving scaleMode and dataUrl mapping", () => {
    const doc: IRDocument = {
      version: "1.0.0",
      generator: "html2figma-extension",
      timestamp: Date.now(),
      title: "Avatar & Logo Aspect Test",
      url: "https://example.com",
      viewport: { width: 400, height: 400, scrollX: 0, scrollY: 0 },
      captureMode: "element",
      rootNode: {
        id: "root",
        name: "Container",
        type: "FRAME",
        box: { x: 0, y: 0, width: 400, height: 400 },
        absoluteBox: { x: 0, y: 0, width: 400, height: 400 },
        opacity: 1,
        fills: [],
        strokes: [],
        effects: [],
        children: [
          {
            id: "avatar",
            name: "Agent Avatar (dataUrl)",
            type: "IMAGE",
            box: { x: 10, y: 10, width: 40, height: 40 },
            absoluteBox: { x: 10, y: 10, width: 40, height: 40 },
            opacity: 1,
            cornerRadius: 20,
            fills: [
              {
                type: "IMAGE",
                scaleMode: "FILL",
                objectPosition: "50% 50%",
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                visible: true
              }
            ],
            strokes: [],
            effects: [],
            children: [],
            metadata: { tagName: "img" }
          },
          {
            id: "externalLogo",
            name: "Brand Logo (external URL)",
            type: "IMAGE",
            box: { x: 100, y: 10, width: 84, height: 26 },
            absoluteBox: { x: 100, y: 10, width: 84, height: 26 },
            opacity: 1,
            fills: [
              {
                type: "IMAGE",
                scaleMode: "FIT",
                objectPosition: "50% 50%",
                url: "https://example.com/logo.png",
                visible: true
              }
            ],
            strokes: [],
            effects: [],
            children: [],
            metadata: { tagName: "img" }
          }
        ],
        metadata: { tagName: "div" }
      },
      stats: { totalNodes: 3, textNodes: 0, vectorNodes: 0, cutoutNodes: 0, imageNodes: 2, warnings: [] }
    }

    const svg = convertIRToSvg(doc)
    assert.ok(svg.includes('preserveAspectRatio="none"'), "Data URL image must map with none preserveAspectRatio to prevent double-cropping in Figma")
    assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'), "External URL image must preserve meet preserveAspectRatio")
    assert.ok(svg.includes('clip-path="url(#clip_img_'), "Circular avatar must generate clipPath")
  })
})
