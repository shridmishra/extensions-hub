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
})
