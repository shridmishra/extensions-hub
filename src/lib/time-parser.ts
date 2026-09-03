/**
 * Time Parser Utility
 * Smart auto-detecting and lenient time parser for Extension Hub.
 * Converts unstructured user inputs (e.g. "13000", "1300", "930", "1:30pm", "now")
 * into normalized hours, minutes, and seconds.
 */

export interface ParsedTime {
  hours: number // 0 - 23
  minutes: number // 0 - 59
  seconds: number // 0 - 59
  isValid: boolean
  hasSeconds: boolean
  originalInput: string
}

/**
 * Normalizes input string by trimming and lowercasing.
 */
function cleanInput(input: string): string {
  return input.trim().toLowerCase()
}

/**
 * Parses any user time input with smart auto-detection.
 */
export function parseLenientTime(input: string, baseDate: Date = new Date()): ParsedTime {
  const originalInput = input
  const clean = cleanInput(input)

  if (!clean) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: false,
      hasSeconds: false,
      originalInput
    }
  }

  // 1. "now" keyword or "current"
  if (clean === "now" || clean === "current") {
    return {
      hours: baseDate.getHours(),
      minutes: baseDate.getMinutes(),
      seconds: baseDate.getSeconds(),
      isValid: true,
      hasSeconds: true,
      originalInput
    }
  }

  // 2. ISO 8601 string or full date (e.g., 2026-08-31T13:00:00)
  if (clean.includes("t") && !isNaN(Date.parse(clean))) {
    const d = new Date(clean)
    return {
      hours: d.getHours(),
      minutes: d.getMinutes(),
      seconds: d.getSeconds(),
      isValid: true,
      hasSeconds: true,
      originalInput
    }
  }

  // 3. Extract 12-hour AM/PM modifiers if present
  let isPm = false
  let isAm = false
  let rawWithoutMeridiem = clean

  if (/(pm|p\.m\.|p)$/.test(clean)) {
    isPm = true
    rawWithoutMeridiem = clean.replace(/(pm|p\.m\.|p)$/, "").trim()
  } else if (/(am|a\.m\.|a)$/.test(clean)) {
    isAm = true
    rawWithoutMeridiem = clean.replace(/(am|a\.m\.|a)$/, "").trim()
  }

  // 4. Colon or dot separated strings (e.g., "13:00", "13:00:00", "9.30", "1:30:15")
  if (rawWithoutMeridiem.includes(":") || (rawWithoutMeridiem.includes(".") && !rawWithoutMeridiem.startsWith("."))) {
    const separator = rawWithoutMeridiem.includes(":") ? ":" : "."
    const parts = rawWithoutMeridiem.split(separator).map((p) => p.trim())

    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10)
      let m = parseInt(parts[1], 10)
      let s = parts.length >= 3 ? parseInt(parts[2], 10) : 0
      const hasSeconds = parts.length >= 3

      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        if (isPm && h < 12) h += 12
        if (isAm && h === 12) h = 0

        if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59) {
          return {
            hours: h,
            minutes: m,
            seconds: s,
            isValid: true,
            hasSeconds,
            originalInput
          }
        }
      }
    }
  }

  // 5. Continuous digits handling (e.g. "13000", "1300", "0930", "930", "130", "143000")
  const numericOnly = rawWithoutMeridiem.replace(/[^0-9]/g, "")
  if (numericOnly.length > 0 && numericOnly.length <= 6) {
    let h = 0
    let m = 0
    let s = 0
    let hasSeconds = false

    if (numericOnly.length === 6) {
      // "130000" -> HH:MM:SS
      h = parseInt(numericOnly.slice(0, 2), 10)
      m = parseInt(numericOnly.slice(2, 4), 10)
      s = parseInt(numericOnly.slice(4, 6), 10)
      hasSeconds = s > 0
    } else if (numericOnly.length === 5) {
      // "13000" -> HH:MM:S (e.g. 13:00:00 -> 13h 00m 0s)
      h = parseInt(numericOnly.slice(0, 2), 10)
      m = parseInt(numericOnly.slice(2, 4), 10)
      s = parseInt(numericOnly.slice(4, 5), 10) * 10
      hasSeconds = s > 0
    } else if (numericOnly.length === 4) {
      // "1300" -> HH:MM
      h = parseInt(numericOnly.slice(0, 2), 10)
      m = parseInt(numericOnly.slice(2, 4), 10)
      s = 0
      hasSeconds = false
    } else if (numericOnly.length === 3) {
      // "930" -> H:MM (09:30)
      h = parseInt(numericOnly.slice(0, 1), 10)
      m = parseInt(numericOnly.slice(1, 3), 10)
      s = 0
      hasSeconds = false
    } else if (numericOnly.length === 1 || numericOnly.length === 2) {
      // "9" -> 09:00, "13" -> 13:00
      h = parseInt(numericOnly, 10)
      m = 0
      s = 0
      hasSeconds = false
    }

    if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
      if (isPm && h < 12) h += 12
      if (isAm && h === 12) h = 0

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59) {
        return {
          hours: h,
          minutes: m,
          seconds: s,
          isValid: true,
          hasSeconds,
          originalInput
        }
      }
    }
  }

  return {
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: false,
    hasSeconds: false,
    originalInput
  }
}
