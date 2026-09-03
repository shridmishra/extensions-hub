import test, { describe, it } from "node:test"
import assert from "node:assert"
import { parseLenientTime } from "../src/lib/time-parser.ts"

describe("Smart Time Parser (Lenient & Auto-Detecting)", () => {
  describe("5-digit raw inputs (e.g. 13000 -> 13:00:00)", () => {
    it("should parse 13000 as 13:00:00", () => {
      const res = parseLenientTime("13000")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
      assert.strictEqual(res.seconds, 0)
    })

    it("should parse 09300 as 09:30:00", () => {
      const res = parseLenientTime("09300")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 9)
      assert.strictEqual(res.minutes, 30)
      assert.strictEqual(res.seconds, 0)
    })
  })

  describe("4-digit & 3-digit military/compact inputs", () => {
    it("should parse 1300 as 13:00", () => {
      const res = parseLenientTime("1300")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
    })

    it("should parse 0930 as 09:30", () => {
      const res = parseLenientTime("0930")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 9)
      assert.strictEqual(res.minutes, 30)
    })

    it("should parse 930 as 09:30", () => {
      const res = parseLenientTime("930")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 9)
      assert.strictEqual(res.minutes, 30)
    })

    it("should parse 130000 as 13:00:00", () => {
      const res = parseLenientTime("130000")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
      assert.strictEqual(res.seconds, 0)
    })
  })

  describe("Standard 24-hour punctuated strings", () => {
    it("should parse '13:00' as 13:00:00", () => {
      const res = parseLenientTime("13:00")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
    })

    it("should parse '17:45:30' as 17:45:30", () => {
      const res = parseLenientTime("17:45:30")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 17)
      assert.strictEqual(res.minutes, 45)
      assert.strictEqual(res.seconds, 30)
      assert.strictEqual(res.hasSeconds, true)
    })

    it("should parse '9.30' as 09:30:00", () => {
      const res = parseLenientTime("9.30")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 9)
      assert.strictEqual(res.minutes, 30)
    })
  })

  describe("12-hour AM/PM strings", () => {
    it("should parse '1:00 PM' as 13:00", () => {
      const res = parseLenientTime("1:00 PM")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
    })

    it("should parse '1pm' as 13:00", () => {
      const res = parseLenientTime("1pm")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 13)
      assert.strictEqual(res.minutes, 0)
    })

    it("should parse '12:00 am' as 00:00", () => {
      const res = parseLenientTime("12:00 am")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 0)
      assert.strictEqual(res.minutes, 0)
    })

    it("should parse '12:30 pm' as 12:30", () => {
      const res = parseLenientTime("12:30 pm")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 12)
      assert.strictEqual(res.minutes, 30)
    })

    it("should parse '9:45 AM' as 09:45", () => {
      const res = parseLenientTime("9:45 AM")
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 9)
      assert.strictEqual(res.minutes, 45)
    })
  })

  describe("Special keywords & Invalid inputs", () => {
    it("should parse 'now' keyword using base date", () => {
      const baseDate = new Date(2026, 7, 31, 14, 25, 10)
      const res = parseLenientTime("now", baseDate)
      assert.strictEqual(res.isValid, true)
      assert.strictEqual(res.hours, 14)
      assert.strictEqual(res.minutes, 25)
      assert.strictEqual(res.seconds, 10)
    })

    it("should return invalid for gibberish strings", () => {
      const res = parseLenientTime("hello world")
      assert.strictEqual(res.isValid, false)
    })

    it("should return invalid for out of bounds numbers", () => {
      const res = parseLenientTime("25:99")
      assert.strictEqual(res.isValid, false)
    })
  })
})
