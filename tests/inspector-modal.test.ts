import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UI_DIR = path.resolve(__dirname, "../src/components/ui")
const EXTENSIONS_DIR = path.resolve(__dirname, "../src/components/extensions")

describe("InspectorModal UI Component & Extension Modals Verification", () => {
  it("should have InspectorModal.tsx present in src/components/ui", () => {
    const filePath = path.join(UI_DIR, "InspectorModal.tsx")
    assert.ok(fs.existsSync(filePath), "InspectorModal.tsx should exist in src/components/ui")
  })

  it("should export InspectorModal component and InspectorModalProps", () => {
    const filePath = path.join(UI_DIR, "InspectorModal.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("export const InspectorModal"), "Should export InspectorModal named component")
    assert.ok(content.includes("export default InspectorModal"), "Should export InspectorModal default component")
    assert.ok(content.includes("export interface InspectorModalProps"), "Should export InspectorModalProps interface")
  })

  it("should be exported in src/components/ui/index.ts", () => {
    const indexPath = path.join(UI_DIR, "index.ts")
    const content = fs.readFileSync(indexPath, "utf8")
    assert.ok(content.includes("InspectorModal"), "InspectorModal should be exported in ui/index.ts")
  })

  it("should ensure CssInspectorModal uses InspectorModal and has no redundant footer text", () => {
    const filePath = path.join(EXTENSIONS_DIR, "CssInspectorModal.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("<InspectorModal"), "CssInspectorModal should use InspectorModal")
    assert.ok(!content.includes("Click element to inspect"), "CssInspectorModal should not contain redundant footer instruction")
    assert.ok(!content.includes("Esc to close"), "CssInspectorModal should not contain redundant footer text")
  })

  it("should ensure FigmaPickerModal uses InspectorModal and has no redundant footer text", () => {
    const filePath = path.join(EXTENSIONS_DIR, "FigmaPickerModal.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("<InspectorModal"), "FigmaPickerModal should use InspectorModal")
    assert.ok(!content.includes("Paste in Figma"), "FigmaPickerModal should not contain redundant footer text")
    assert.ok(!content.includes("Esc to close"), "FigmaPickerModal should not contain redundant footer text")
  })
})
