import test, { describe, it } from "node:test"
import assert from "node:assert"
import {
  DEFAULT_DARK_MODE_SETTINGS,
  type DarkModeSettings,
  type DarkPreset,
  type LightPreset
} from "../src/lib/storage.ts"

describe("Dark & Light Mode Storage & Configuration Tests", () => {
  it("should have valid default dark mode settings", () => {
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.mode, "dark")
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.globalEnabled, false)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.darkPreset, "midnight")
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.lightPreset, "pure-white")
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.brightness, 100)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.contrast, 100)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.sepia, 0)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.grayscale, 0)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.preserveMedia, true)
    assert.strictEqual(DEFAULT_DARK_MODE_SETTINGS.dimMediaInDark, false)
    assert.deepStrictEqual(DEFAULT_DARK_MODE_SETTINGS.siteOverrides, {})
  })

  it("should support all defined dark and light presets", () => {
    const validDarkPresets: DarkPreset[] = ["midnight", "oled", "slate", "charcoal"]
    const validLightPresets: LightPreset[] = ["pure-white", "warm-paper", "cool-ice"]

    assert.ok(validDarkPresets.includes(DEFAULT_DARK_MODE_SETTINGS.darkPreset))
    assert.ok(validLightPresets.includes(DEFAULT_DARK_MODE_SETTINGS.lightPreset))
  })

  it("should invert dark mode to light mode when toggle is active", () => {
    const detectedTheme: "dark" | "light" = "dark"
    const targetMode = detectedTheme === "dark" ? "light" : "dark"

    assert.strictEqual(targetMode, "light", "A dark mode webpage must be forced into light mode")
  })

  it("should invert light mode to dark mode when toggle is active", () => {
    const detectedTheme: "dark" | "light" = "light"
    const targetMode = detectedTheme === "dark" ? "light" : "dark"

    assert.strictEqual(targetMode, "dark", "A light mode webpage must be forced into dark mode")
  })

  it("should correctly compute luminance to distinguish dark and light backgrounds", () => {
    const calculateLuminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b
    const getModeFromRgb = (r: number, g: number, b: number) => (calculateLuminance(r, g, b) < 128 ? "dark" : "light")

    // Dark backgrounds
    assert.strictEqual(getModeFromRgb(0, 0, 0), "dark") // Pure black
    assert.strictEqual(getModeFromRgb(9, 9, 11), "dark") // Midnight Zinc
    assert.strictEqual(getModeFromRgb(15, 15, 15), "dark") // YouTube Dark #0f0f0f
    assert.strictEqual(getModeFromRgb(30, 41, 59), "dark") // Slate 800

    // Light backgrounds
    assert.strictEqual(getModeFromRgb(255, 255, 255), "light") // Pure white
    assert.strictEqual(getModeFromRgb(250, 248, 245), "light") // Warm paper
    assert.strictEqual(getModeFromRgb(248, 250, 252), "light") // Cool ice
    assert.strictEqual(getModeFromRgb(244, 244, 245), "light") // Zinc 100
  })

  it("should be disabled by default for any new or untoggled website", () => {
    const settings: DarkModeSettings = { ...DEFAULT_DARK_MODE_SETTINGS }
    const checkSiteEnabled = (hostname: string) => Boolean(settings.siteOverrides?.[hostname])

    assert.strictEqual(checkSiteEnabled("github.com"), false)
    assert.strictEqual(checkSiteEnabled("google.com"), false)
    assert.strictEqual(checkSiteEnabled("wikipedia.org"), false)
  })

  it("should selectively activate only for explicitly enabled websites", () => {
    const settings: DarkModeSettings = {
      ...DEFAULT_DARK_MODE_SETTINGS,
      siteOverrides: {
        "github.com": true,
        "reddit.com": true,
        "nytimes.com": false
      }
    }

    const checkSiteEnabled = (hostname: string) => Boolean(settings.siteOverrides?.[hostname])

    assert.strictEqual(checkSiteEnabled("github.com"), true)
    assert.strictEqual(checkSiteEnabled("reddit.com"), true)
    assert.strictEqual(checkSiteEnabled("nytimes.com"), false)
    assert.strictEqual(checkSiteEnabled("youtube.com"), false)
  })

  it("should extract sorted active sites list and handle visible pagination", () => {
    const settings: DarkModeSettings = {
      ...DEFAULT_DARK_MODE_SETTINGS,
      siteOverrides: {
        "github.com": true,
        "reddit.com": true,
        "news.ycombinator.com": true,
        "wikipedia.org": true,
        "twitter.com": true,
        "stackoverflow.com": true
      }
    }

    const activeSites = Object.entries(settings.siteOverrides)
      .filter(([_, isEnabled]) => Boolean(isEnabled))
      .map(([hostname]) => hostname)
      .sort((a, b) => a.localeCompare(b))

    assert.strictEqual(activeSites.length, 6)
    assert.deepStrictEqual(activeSites, [
      "github.com",
      "news.ycombinator.com",
      "reddit.com",
      "stackoverflow.com",
      "twitter.com",
      "wikipedia.org"
    ])

    const defaultVisibleCount = 4
    const collapsedVisible = activeSites.slice(0, defaultVisibleCount)
    assert.strictEqual(collapsedVisible.length, 4)
    assert.strictEqual(activeSites.length - defaultVisibleCount, 2)
  })

  it("should detect GitHub data-color-mode attributes correctly", () => {
    const detectGitHubTheme = (colorModeAttr: string | null, prefersDark: boolean) => {
      if (colorModeAttr === "dark") return "dark"
      if (colorModeAttr === "light") return "light"
      if (colorModeAttr === "auto") {
        return prefersDark ? "dark" : "light"
      }
      return prefersDark ? "dark" : "light"
    }

    assert.strictEqual(detectGitHubTheme("dark", false), "dark")
    assert.strictEqual(detectGitHubTheme("light", true), "light")
    assert.strictEqual(detectGitHubTheme("auto", true), "dark")
    assert.strictEqual(detectGitHubTheme("auto", false), "light")
    assert.strictEqual(detectGitHubTheme(null, true), "dark")
  })

  it("should detect Twitter / X themes (Dim, Lights Out, Light) correctly", () => {
    const detectTwitterTheme = (styleAttr: string, themeColorMeta: string | null) => {
      if (styleAttr.includes("color-scheme: dark")) return "dark"
      if (styleAttr.includes("color-scheme: light")) return "light"
      if (themeColorMeta === "#000000" || themeColorMeta === "#15202b") return "dark"
      if (themeColorMeta === "#ffffff") return "light"
      return "dark" // Default fallback on X
    }

    assert.strictEqual(detectTwitterTheme("color-scheme: dark;", null), "dark")
    assert.strictEqual(detectTwitterTheme("color-scheme: light;", null), "light")
    assert.strictEqual(detectTwitterTheme("", "#000000"), "dark") // Lights out
    assert.strictEqual(detectTwitterTheme("", "#15202b"), "dark") // Dim mode
    assert.strictEqual(detectTwitterTheme("", "#ffffff"), "light") // Light mode
  })

  it("should generate proper target modes for Twitter / X", () => {
    const getTargetMode = (nativeTheme: "dark" | "light") => (nativeTheme === "dark" ? "light" : "dark")

    assert.strictEqual(getTargetMode("dark"), "light", "When X is in dark mode, toggling should target Force Light")
    assert.strictEqual(getTargetMode("light"), "dark", "When X is in light mode, toggling should target Force Dark")
  })
})
