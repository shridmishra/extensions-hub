import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { isSupportedTab, TOOL_MESSAGE_MAP } from "../src/lib/tool-launcher.ts"
import { INTERACTIVE_TOOLS } from "../src/lib/storage.ts"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONTENTS_DIR = path.resolve(__dirname, "../src/contents")

describe("Tool Launcher & Dynamic Script Injection Tests", () => {
  describe("isSupportedTab validation", () => {
    it("should allow valid HTTP and HTTPS web URLs", () => {
      assert.strictEqual(isSupportedTab("https://example.com"), true)
      assert.strictEqual(isSupportedTab("http://localhost:3000"), true)
      assert.strictEqual(isSupportedTab("https://github.com/project/repo"), true)
      assert.strictEqual(isSupportedTab("http://127.0.0.1:8080/test"), true)
    })

    it("should reject internal browser scheme URLs", () => {
      assert.strictEqual(isSupportedTab("chrome://extensions"), false)
      assert.strictEqual(isSupportedTab("chrome://settings"), false)
      assert.strictEqual(isSupportedTab("chrome-extension://abcdef/popup.html"), false)
      assert.strictEqual(isSupportedTab("edge://settings"), false)
      assert.strictEqual(isSupportedTab("about:blank"), false)
      assert.strictEqual(isSupportedTab("view-source:https://example.com"), false)
      assert.strictEqual(isSupportedTab("devtools://devtools/bundled/inspector.html"), false)
    })

    it("should reject Chrome Web Store URLs where extensions cannot execute", () => {
      assert.strictEqual(
        isSupportedTab("https://chromewebstore.google.com/detail/xyz"),
        false
      )
      assert.strictEqual(
        isSupportedTab("https://chrome.google.com/webstore/detail/xyz"),
        false
      )
    })

    it("should handle undefined, empty, or invalid input gracefully", () => {
      assert.strictEqual(isSupportedTab(undefined), false)
      assert.strictEqual(isSupportedTab(""), false)
      assert.strictEqual(isSupportedTab("ftp://ftp.example.com"), false)
    })
  })

  describe("Interactive Tools & Action Mapping", () => {
    it("should have mapped message types for all interactive core tools", () => {
      assert.strictEqual(TOOL_MESSAGE_MAP["font-finder"], "START_FONT_FINDER")
      assert.strictEqual(TOOL_MESSAGE_MAP["color-picker"], "START_COLOR_PICKER")
      assert.strictEqual(TOOL_MESSAGE_MAP["css-picker"], "START_CSS_PICKER")
      assert.strictEqual(TOOL_MESSAGE_MAP["figma-picker"], "START_ELEMENT_SELECTION")
      assert.strictEqual(TOOL_MESSAGE_MAP["page-ruler"], "START_PAGE_RULER")
      assert.strictEqual(TOOL_MESSAGE_MAP["link-grabber"], "START_LINK_GRABBER")
      assert.strictEqual(TOOL_MESSAGE_MAP["screenshot-capture"], "START_SCREENSHOT_CAPTURE")
      assert.strictEqual(TOOL_MESSAGE_MAP["color-palette"], "START_COLOR_PALETTE")
    })

    it("should ensure all implemented interactive tools are in INTERACTIVE_TOOLS registry", () => {
      const interactiveImplemented = EXTENSION_REGISTRY.filter(
        (ext) => ext.type === "interactive" && ext.isImplemented
      )

      for (const ext of interactiveImplemented) {
        assert.ok(
          INTERACTIVE_TOOLS[ext.id],
          `Interactive extension '${ext.id}' must be registered in INTERACTIVE_TOOLS in storage.ts`
        )
      }
    })
  })

  describe("Content Script Message Responsiveness & PING protocol", () => {
    const contentFiles = fs.readdirSync(CONTENTS_DIR)

    it("should ensure all content scripts implement chrome.runtime.onMessage with PING handler", () => {
      for (const file of contentFiles) {
        if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue

        const filePath = path.join(CONTENTS_DIR, file)
        const content = fs.readFileSync(filePath, "utf8")

        assert.ok(
          content.includes("chrome.runtime") && content.includes("onMessage"),
          `Content script '${file}' must register a chrome.runtime.onMessage listener`
        )

        assert.ok(
          content.includes("PING"),
          `Content script '${file}' must handle PING message for health checks and on-demand injection`
        )
      }
    })
  })
})
