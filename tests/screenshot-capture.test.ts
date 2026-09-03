import test, { describe, it } from "node:test"
import assert from "node:assert"
import { EXTENSION_REGISTRY, getExtensionById } from "../src/lib/registry.ts"
import { INTERACTIVE_TOOLS } from "../src/lib/storage.ts"
import { TOOL_MESSAGE_MAP } from "../src/lib/tool-launcher.ts"

describe("Full Page & Area Screenshot Extension (#09)", () => {
  it("should be registered in EXTENSION_REGISTRY with valid metadata", () => {
    const ext = getExtensionById("screenshot-capture")
    assert.ok(ext, "Extension 'screenshot-capture' must exist in EXTENSION_REGISTRY")
    assert.strictEqual(ext.id, "screenshot-capture")
    assert.strictEqual(ext.number, 9)
    assert.strictEqual(ext.name, "Full Page & Area Screenshot")
    assert.strictEqual(ext.shortName, "Page Screenshot")
    assert.strictEqual(ext.type, "interactive")
    assert.strictEqual(ext.category, "Utility")
    assert.strictEqual(ext.icon, "Camera")
    assert.strictEqual(ext.isImplemented, true)
    assert.ok(ext.tags.includes("screenshot"))
    assert.ok(ext.tags.includes("full-page"))
    assert.ok(ext.tags.includes("capture"))
  })

  it("should be mapped in INTERACTIVE_TOOLS for mutual exclusion", () => {
    assert.strictEqual(
      INTERACTIVE_TOOLS["screenshot-capture"],
      "screenshot_capture_active"
    )
  })

  it("should be mapped in TOOL_MESSAGE_MAP to START_SCREENSHOT_CAPTURE", () => {
    assert.strictEqual(
      TOOL_MESSAGE_MAP["screenshot-capture"],
      "START_SCREENSHOT_CAPTURE"
    )
  })

  describe("Full Page Scroll Chunk Slicing Algorithm", () => {
    function computeScrollPositions(fullHeight: number, viewportHeight: number, overlap: number = 20): number[] {
      const positions: number[] = []
      let currentY = 0
      while (currentY < fullHeight) {
        positions.push(currentY)
        if (currentY + viewportHeight >= fullHeight) {
          break
        }
        currentY += viewportHeight - overlap
      }
      return positions.length ? positions : [0]
    }

    it("should compute a single position when page fits in viewport", () => {
      const positions = computeScrollPositions(600, 800)
      assert.deepStrictEqual(positions, [0])
    })

    it("should compute correct multi-step positions with overlap for long pages", () => {
      const positions = computeScrollPositions(2400, 800, 20)
      // step 1: 0
      // step 2: 780
      // step 3: 1560
      // step 4: 2340 (since 2340 + 800 >= 2400, it stops here)
      assert.deepStrictEqual(positions, [0, 780, 1560, 2340])
      assert.strictEqual(positions.length, 4)
    })
  })

  describe("Crop Scale & Coordinate Transformation", () => {
    function calculateCropDimensions(
      cropRect: { x: number; y: number; width: number; height: number },
      displayedDims: { width: number; height: number },
      naturalDims: { width: number; height: number }
    ) {
      const scaleX = naturalDims.width / displayedDims.width
      const scaleY = naturalDims.height / displayedDims.height

      return {
        sourceX: cropRect.x * scaleX,
        sourceY: cropRect.y * scaleY,
        sourceWidth: cropRect.width * scaleX,
        sourceHeight: cropRect.height * scaleY
      }
    }

    it("should scale crop coordinates accurately for high-DPI displays", () => {
      const crop = { x: 50, y: 100, width: 200, height: 150 }
      const displayed = { width: 400, height: 300 }
      const natural = { width: 800, height: 600 } // 2x Retina scale

      const res = calculateCropDimensions(crop, displayed, natural)
      assert.strictEqual(res.sourceX, 100)
      assert.strictEqual(res.sourceY, 200)
      assert.strictEqual(res.sourceWidth, 400)
      assert.strictEqual(res.sourceHeight, 300)
    })
  })
})
