import test, { describe, it } from "node:test"
import assert from "node:assert"
import { EXTENSION_REGISTRY } from "../src/lib/registry.ts"
import { INTERACTIVE_TOOLS } from "../src/lib/storage.ts"
import { TOOL_MESSAGE_MAP } from "../src/lib/tool-launcher.ts"
import { parseLenientTime } from "../src/lib/time-parser.ts"
import {
  findTimeZone,
  convertTimeZone,
  formatTime12,
  formatTime24
} from "../src/lib/timezone.ts"

describe("Time Zone Converter & Presets Extension (#11)", () => {
  it("should be registered in EXTENSION_REGISTRY with valid metadata", () => {
    const ext = EXTENSION_REGISTRY.find((e) => e.id === "time-zone-converter")
    assert.ok(ext, "time-zone-converter must exist in EXTENSION_REGISTRY")
    assert.strictEqual(ext.number, 11)
    assert.strictEqual(ext.name, "Time Zone Converter & Presets")
    assert.strictEqual(ext.shortName, "Time Zone")
    assert.strictEqual(ext.category, "Utility")
    assert.strictEqual(ext.type, "interactive")
    assert.strictEqual(ext.icon, "Clock")
    assert.strictEqual(ext.isImplemented, true)
    assert.ok(ext.tags.includes("timezone"))
    assert.ok(ext.tags.includes("utc"))
    assert.ok(ext.tags.includes("ist"))
  })

  it("should be mapped in INTERACTIVE_TOOLS for mutual exclusion", () => {
    assert.strictEqual(
      INTERACTIVE_TOOLS["time-zone-converter"],
      "time_zone_converter_active",
      "Must have valid storage key mapped in INTERACTIVE_TOOLS"
    )
  })

  it("should be mapped in TOOL_MESSAGE_MAP to START_TIME_ZONE_CONVERTER", () => {
    assert.strictEqual(
      TOOL_MESSAGE_MAP["time-zone-converter"],
      "START_TIME_ZONE_CONVERTER",
      "Must have START_TIME_ZONE_CONVERTER message type mapped"
    )
  })

  describe("Timezone Resolution & Conversion: UTC+1 to IST (User Preset Case)", () => {
    it("should accurately convert 13000 (13:00) from UTC+1 to IST as 17:30 (5:30 PM)", () => {
      const parsed = parseLenientTime("13000")
      assert.strictEqual(parsed.isValid, true)
      assert.strictEqual(parsed.hours, 13)
      assert.strictEqual(parsed.minutes, 0)

      const result = convertTimeZone(parsed, "UTC+1", "IST")
      assert.strictEqual(result.sourceTz.shortLabel, "UTC+1")
      assert.strictEqual(result.targetTz.shortLabel, "IST")
      assert.strictEqual(result.targetTime.hours, 17)
      assert.strictEqual(result.targetTime.minutes, 30)
      assert.strictEqual(result.dayOffset, 0)
      assert.strictEqual(result.offsetDeltaMinutes, 270) // 4.5 hours ahead
      assert.strictEqual(result.offsetDeltaLabel, "+4.5 hrs")

      // 12h and 24h formats
      assert.strictEqual(result.formattedTarget["12h"], "5:30 PM")
      assert.strictEqual(result.formattedTarget["24h"], "17:30")
      assert.strictEqual(result.formattedSource["12h"], "1:00 PM")
      assert.strictEqual(result.formattedSource["24h"], "13:00")
    })

    it("should accurately convert UTC to IST (+5.5 hours)", () => {
      const parsed = parseLenientTime("10:00")
      const result = convertTimeZone(parsed, "UTC", "IST")
      assert.strictEqual(result.targetTime.hours, 15)
      assert.strictEqual(result.targetTime.minutes, 30)
      assert.strictEqual(result.formattedTarget["12h"], "3:30 PM")
      assert.strictEqual(result.formattedTarget["24h"], "15:30")
    })
  })

  describe("Cross-Midnight Day Shifts (+1 Day & -1 Day)", () => {
    it("should correctly handle +1 Day (Tomorrow) shifts (e.g. 23:00 UTC to IST)", () => {
      const parsed = parseLenientTime("23:00")
      const result = convertTimeZone(parsed, "UTC", "IST")
      // 23:00 + 5.5h = 28.5 -> 04:30 next day
      assert.strictEqual(result.targetTime.hours, 4)
      assert.strictEqual(result.targetTime.minutes, 30)
      assert.strictEqual(result.dayOffset, 1)
      assert.strictEqual(result.dayOffsetLabel, "+1 day (Tomorrow)")
      assert.strictEqual(result.formattedTarget["24h"], "04:30")
      assert.strictEqual(result.formattedTarget["12h"], "4:30 AM")
    })

    it("should correctly handle -1 Day (Yesterday) shifts (e.g. 02:00 UTC to PST)", () => {
      const parsed = parseLenientTime("02:00")
      const result = convertTimeZone(parsed, "UTC", "PST")
      // 02:00 - 8h = -6h -> 18:00 previous day
      assert.strictEqual(result.targetTime.hours, 18)
      assert.strictEqual(result.targetTime.minutes, 0)
      assert.strictEqual(result.dayOffset, -1)
      assert.strictEqual(result.dayOffsetLabel, "-1 day (Yesterday)")
      assert.strictEqual(result.formattedTarget["24h"], "18:00")
      assert.strictEqual(result.formattedTarget["12h"], "6:00 PM")
    })
  })

  describe("Formatting Utilities (12-Hour & 24-Hour)", () => {
    it("should format 24-hour time with and without seconds", () => {
      assert.strictEqual(formatTime24(13, 5, 0, false), "13:05")
      assert.strictEqual(formatTime24(13, 5, 45, true), "13:05:45")
      assert.strictEqual(formatTime24(0, 0, 0, false), "00:00")
    })

    it("should format 12-hour time with AM/PM and midnight/noon edge cases", () => {
      assert.strictEqual(formatTime12(0, 0, 0, false), "12:00 AM")
      assert.strictEqual(formatTime12(12, 0, 0, false), "12:00 PM")
      assert.strictEqual(formatTime12(13, 30, 0, false), "1:30 PM")
      assert.strictEqual(formatTime12(23, 59, 59, true), "11:59:59 PM")
      assert.strictEqual(formatTime12(9, 15, 0, false), "9:15 AM")
    })
  })
})
