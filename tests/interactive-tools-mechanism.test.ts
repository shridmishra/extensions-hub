import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "fs"
import path from "path"

describe("Interactive Tools HTML-to-Figma Mechanism Unification", () => {
  const rootDir = process.cwd()

  it("should verify Figma Island Toolbar has only Figma actions (no CSS mode)", () => {
    const figmaToolbarPath = path.join(rootDir, "src/components/extensions/FigmaIslandToolbar.tsx")
    const code = fs.readFileSync(figmaToolbarPath, "utf-8")

    assert.ok(code.includes('export type ToolbarMode = "figma-element" | "figma-fullpage"'), "ToolbarMode should only be figma modes")
    assert.ok(!code.includes("inspect-css"), "Should not contain inspect-css mode")
    assert.ok(!code.includes("Copy CSS"), "Should not contain Copy CSS button")
    assert.ok(code.includes("Capture page"), "Should contain Capture page")
    assert.ok(code.includes("Select element"), "Should contain Select element")
  })

  it("should verify figma-picker.tsx is pure Figma and has zero CSS inspector references", () => {
    const figmaPickerPath = path.join(rootDir, "src/contents/figma-picker.tsx")
    const code = fs.readFileSync(figmaPickerPath, "utf-8")

    assert.ok(!code.includes("CssInspectorModal"), "Should not import CssInspectorModal")
    assert.ok(!code.includes("extractStyles"), "Should not import or use extractStyles")
    assert.ok(!code.includes("inspectedCss"), "Should not contain inspectedCss state")
    assert.ok(code.includes("copyDirectToFigmaClipboard"), "Should use direct Figma clipboard")
    assert.ok(code.includes("border-purple-500"), "Should use purple theme for Figma")
  })

  it("should verify CssIslandToolbar is dedicated to CSS & Tailwind", () => {
    const cssToolbarPath = path.join(rootDir, "src/components/extensions/CssIslandToolbar.tsx")
    assert.ok(fs.existsSync(cssToolbarPath), "CssIslandToolbar.tsx must exist")

    const code = fs.readFileSync(cssToolbarPath, "utf-8")
    assert.ok(code.includes("CSS & Tailwind"), "Should display CSS & Tailwind title")
    assert.ok(code.includes("Select element"), "Should contain Select element button")
    assert.ok(!code.includes("Figma"), "Should not contain Figma references")
  })

  it("should verify css-picker.tsx uses CssIslandToolbar and extracts CSS without Figma conversion", () => {
    const cssPickerPath = path.join(rootDir, "src/contents/css-picker.tsx")
    const code = fs.readFileSync(cssPickerPath, "utf-8")

    assert.ok(code.includes("CssIslandToolbar"), "Should use CssIslandToolbar")
    assert.ok(code.includes("extractStyles"), "Should use extractStyles")
    assert.ok(!code.includes("convertElementToIR"), "Should not use convertElementToIR")
    assert.ok(!code.includes("copyDirectToFigmaClipboard"), "Should not use Figma clipboard")
    assert.ok(code.includes("CssInspectorModal"), "Should render CssInspectorModal")
  })

  it("should verify FontFinderIslandToolbar and font-finder.tsx decouple overlay with elementFromPoint", () => {
    const fontToolbarPath = path.join(rootDir, "src/components/extensions/FontFinderIslandToolbar.tsx")
    assert.ok(fs.existsSync(fontToolbarPath), "FontFinderIslandToolbar.tsx must exist")

    const fontFinderPath = path.join(rootDir, "src/contents/font-finder.tsx")
    const code = fs.readFileSync(fontFinderPath, "utf-8")

    assert.ok(code.includes("FontFinderIslandToolbar"), "Should use FontFinderIslandToolbar")
    assert.ok(code.includes("elementFromPoint"), "Should use elementFromPoint hit-testing")
    assert.ok(code.includes("border-emerald-500"), "Should use emerald border tokens instead of hardcoded hex")
    assert.ok(code.includes("FontFinderModal"), "Should render FontFinderModal")
  })

  it("should verify ColorPickerIslandToolbar and color-picker.tsx have live hover bounding box and tag pill", () => {
    const colorToolbarPath = path.join(rootDir, "src/components/extensions/ColorPickerIslandToolbar.tsx")
    assert.ok(fs.existsSync(colorToolbarPath), "ColorPickerIslandToolbar.tsx must exist")

    const colorPickerPath = path.join(rootDir, "src/contents/color-picker.tsx")
    const code = fs.readFileSync(colorPickerPath, "utf-8")

    assert.ok(code.includes("ColorPickerIslandToolbar"), "Should use ColorPickerIslandToolbar")
    assert.ok(code.includes("border-pink-500"), "Should have live hover bounding box")
    assert.ok(code.includes("hoverHex"), "Should display live color hex pill on hover")
  })

  it("should verify PageRulerIslandToolbar and page-ruler.tsx render island toolbar", () => {
    const rulerToolbarPath = path.join(rootDir, "src/components/extensions/PageRulerIslandToolbar.tsx")
    assert.ok(fs.existsSync(rulerToolbarPath), "PageRulerIslandToolbar.tsx must exist")

    const pageRulerPath = path.join(rootDir, "src/contents/page-ruler.tsx")
    const code = fs.readFileSync(pageRulerPath, "utf-8")

    assert.ok(code.includes("PageRulerIslandToolbar"), "Should render PageRulerIslandToolbar")
  })

  it("should verify css-extractor handles background-clip: text and text gradients", () => {
    const extractorPath = path.join(rootDir, "src/lib/css-extractor.ts")
    const code = fs.readFileSync(extractorPath, "utf-8")

    assert.ok(code.includes("background-clip"), "Should track background-clip")
    assert.ok(code.includes("-webkit-background-clip"), "Should track -webkit-background-clip")
    assert.ok(code.includes("-webkit-text-fill-color"), "Should track -webkit-text-fill-color")
    assert.ok(code.includes("bg-clip-text"), "Should output bg-clip-text for Tailwind")
  })

  it("should verify IslandToolbar UI primitive is exported", () => {
    const uiIndexPath = path.join(rootDir, "src/components/ui/index.ts")
    const code = fs.readFileSync(uiIndexPath, "utf-8")

    assert.ok(code.includes("IslandToolbar"), "Should export IslandToolbar in ui/index.ts")
  })
})
