import test, { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UI_DIR = path.resolve(__dirname, "../src/components/ui")
const SRC_DIR = path.resolve(__dirname, "../src")

describe("Badge UI Component & Rounded Styling Verification", () => {
  it("should have Badge.tsx present in src/components/ui", () => {
    const filePath = path.join(UI_DIR, "Badge.tsx")
    assert.ok(fs.existsSync(filePath), "Badge.tsx should exist in src/components/ui")
  })

  it("should export Badge component and BadgeProps interface", () => {
    const filePath = path.join(UI_DIR, "Badge.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    assert.ok(content.includes("export interface BadgeProps"), "Should export BadgeProps interface")
    assert.ok(content.includes("export default Badge"), "Should export Badge default component")
  })

  it("should be exported in src/components/ui/index.ts", () => {
    const indexPath = path.join(UI_DIR, "index.ts")
    const content = fs.readFileSync(indexPath, "utf8")
    assert.ok(content.includes("Badge"), "Badge should be exported in ui/index.ts")
  })

  it("should use rounded-full for rounded pill badge design across Badge.tsx and style.css", () => {
    const badgeFilePath = path.join(UI_DIR, "Badge.tsx")
    const badgeContent = fs.readFileSync(badgeFilePath, "utf8")
    assert.ok(badgeContent.includes("rounded-full"), "Badge.tsx should use 'rounded-full'")
    assert.ok(!badgeContent.includes(" rounded "), "Badge.tsx should not use rectangular 'rounded'")

    const styleFilePath = path.join(SRC_DIR, "style.css")
    const styleContent = fs.readFileSync(styleFilePath, "utf8")
    assert.ok(styleContent.includes(".ds-badge {"), "style.css should define .ds-badge")
    assert.ok(styleContent.includes(".ds-badge-interactive {"), "style.css should define .ds-badge-interactive")
    assert.ok(styleContent.includes(".ds-badge-background {"), "style.css should define .ds-badge-background")

    // Check that .ds-badge rules include rounded-full
    const badgeSection = styleContent.slice(styleContent.indexOf("/* Badges */"), styleContent.indexOf("/* Buttons */"))
    assert.ok(badgeSection.includes("rounded-full"), "Badge classes in style.css should use 'rounded-full'")
    assert.ok(!badgeSection.includes(" rounded "), "Badge classes in style.css should not use rectangular 'rounded'")
  })

  it("should support all standard badge variants", () => {
    const filePath = path.join(UI_DIR, "Badge.tsx")
    const content = fs.readFileSync(filePath, "utf8")
    const variants = ["neutral", "interactive", "background", "success", "muted", "outline"]
    for (const v of variants) {
      assert.ok(content.includes(`"${v}"`), `Badge.tsx should support variant "${v}"`)
    }
  })
})
