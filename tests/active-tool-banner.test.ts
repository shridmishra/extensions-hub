import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UI_DIR = path.resolve(__dirname, "../src/components/ui")

describe("ActiveToolBanner UI Component Verification", () => {
  it("should have ActiveToolBanner.tsx present in src/components/ui", () => {
    const filePath = path.join(UI_DIR, "ActiveToolBanner.tsx")
    assert.ok(fs.existsSync(filePath), "ActiveToolBanner.tsx should exist in src/components/ui")
  })

  it("should export ActiveToolBanner component and ActiveToolBannerProps", () => {
    const filePath = path.join(UI_DIR, "ActiveToolBanner.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("export const ActiveToolBanner"), "Should export ActiveToolBanner named component")
    assert.ok(content.includes("export default ActiveToolBanner"), "Should export ActiveToolBanner default component")
    assert.ok(content.includes("export interface ActiveToolBannerProps"), "Should export ActiveToolBannerProps interface")
  })

  it("should be exported in src/components/ui/index.ts", () => {
    const indexPath = path.join(UI_DIR, "index.ts")
    const content = fs.readFileSync(indexPath, "utf8")
    assert.ok(content.includes("ActiveToolBanner"), "ActiveToolBanner should be exported in ui/index.ts")
  })

  it("should not contain raw bracket or slash in default template strings", () => {
    const filePath = path.join(UI_DIR, "ActiveToolBanner.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    // Ensure no old pattern like "(Click element to inspect / Esc to exit)"
    assert.ok(!content.includes("Click element to inspect / Esc to exit"))
    assert.ok(!content.includes("animate-pulse")) // removed raw dot pulse
  })

  it("should not render a redundant 'Active' badge next to the tool title", () => {
    const filePath = path.join(UI_DIR, "ActiveToolBanner.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(!content.includes(">Active<") && !content.includes("Active\n"), "ActiveToolBanner should not render redundant Active badge")
  })
})
