import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UI_DIR = path.resolve(__dirname, "../src/components/ui")

describe("Tooltip UI Component & Z-Index / Overflow Verification", () => {
  it("should have Tooltip.tsx present in src/components/ui", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    assert.ok(fs.existsSync(filePath), "Tooltip.tsx should exist in src/components/ui")
  })

  it("should export Tooltip component, TooltipProps, and TooltipPosition", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("export default Tooltip"), "Should export Tooltip default component")
    assert.ok(content.includes("export interface TooltipProps"), "Should export TooltipProps interface")
    assert.ok(content.includes("export type TooltipPosition"), "Should export TooltipPosition type")
  })

  it("should be exported in src/components/ui/index.ts", () => {
    const indexPath = path.join(UI_DIR, "index.ts")
    const content = fs.readFileSync(indexPath, "utf8")
    assert.ok(content.includes("Tooltip"), "Tooltip should be exported in ui/index.ts")
    assert.ok(content.includes("TooltipProps"), "TooltipProps should be exported in ui/index.ts")
    assert.ok(content.includes("TooltipPosition"), "TooltipPosition should be exported in ui/index.ts")
  })

  it("should utilize React Portals to render outside scroll/overflow containers", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("createPortal"), "Tooltip should use createPortal to escape parent overflow-hidden/auto clipping")
    assert.ok(content.includes("portalTarget"), "Tooltip should resolve a valid portal mount target")
  })

  it("should use maximum z-index 2147483647 to stay above all modals, sub-cards, and overlays", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("2147483647"), "Tooltip should use z-index 2147483647")
  })

  it("should implement fixed floating positioning and viewport collision clamping", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("getBoundingClientRect()"), "Tooltip should calculate trigger coordinates dynamically")
    assert.ok(content.includes("clampedLeft"), "Tooltip should clamp horizontal coordinates within viewport")
    assert.ok(content.includes("clampedTop"), "Tooltip should clamp vertical coordinates within viewport")
  })

  it("should implement vertical auto-flipping when near screen boundaries", () => {
    const filePath = path.join(UI_DIR, "Tooltip.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("targetPlacement.startsWith(\"top\")") || content.includes("targetPlacement.startsWith('top')"), "Tooltip should check top boundary")
    assert.ok(content.includes("targetPlacement.startsWith(\"bottom\")") || content.includes("targetPlacement.startsWith('bottom')"), "Tooltip should check bottom boundary")
  })

  it("should ensure IconButton and Button leverage Tooltip component", () => {
    const iconButtonPath = path.join(UI_DIR, "IconButton.tsx")
    const iconButtonContent = fs.readFileSync(iconButtonPath, "utf8")
    assert.ok(iconButtonContent.includes("<Tooltip"), "IconButton should render Tooltip when title is present")

    const buttonPath = path.join(UI_DIR, "Button.tsx")
    const buttonContent = fs.readFileSync(buttonPath, "utf8")
    assert.ok(buttonContent.includes("<Tooltip"), "Button should support tooltip rendering via Tooltip component")
  })
})
