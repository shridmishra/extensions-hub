/**
 * Time Zone Registry & Conversion Engine
 * Comprehensive time zone options, UTC offset resolution, time difference calculation,
 * and 12/24-hour time formatting for Extension Hub.
 */

import type { ParsedTime } from "./time-parser"

export interface TimeZoneOption {
  id: string
  label: string
  shortLabel: string
  offsetMinutes: number
  group: "Popular" | "Americas" | "Europe & Africa" | "Asia & Pacific" | "UTC Fixed"
}

export const TIMEZONE_OPTIONS: TimeZoneOption[] = [
  // Popular Timezones
  {
    id: "UTC",
    label: "UTC (Coordinated Universal Time)",
    shortLabel: "UTC",
    offsetMinutes: 0,
    group: "Popular"
  },
  {
    id: "UTC+1",
    label: "UTC+1 (CET / BST / Central European)",
    shortLabel: "UTC+1",
    offsetMinutes: 60,
    group: "Popular"
  },
  {
    id: "IST",
    label: "IST (India Standard Time, UTC+5:30)",
    shortLabel: "IST",
    offsetMinutes: 330,
    group: "Popular"
  },
  {
    id: "EST",
    label: "EST (Eastern Standard Time, UTC-5)",
    shortLabel: "EST",
    offsetMinutes: -300,
    group: "Popular"
  },
  {
    id: "PST",
    label: "PST (Pacific Standard Time, UTC-8)",
    shortLabel: "PST",
    offsetMinutes: -480,
    group: "Popular"
  },
  {
    id: "JST",
    label: "JST (Japan Standard Time, UTC+9)",
    shortLabel: "JST",
    offsetMinutes: 540,
    group: "Popular"
  },
  {
    id: "GMT",
    label: "GMT (Greenwich Mean Time, UTC+0)",
    shortLabel: "GMT",
    offsetMinutes: 0,
    group: "Popular"
  },
  {
    id: "CET",
    label: "CET (Central European Time, UTC+1)",
    shortLabel: "CET",
    offsetMinutes: 60,
    group: "Popular"
  },

  // Americas
  {
    id: "EDT",
    label: "EDT (Eastern Daylight Time, UTC-4)",
    shortLabel: "EDT",
    offsetMinutes: -240,
    group: "Americas"
  },
  {
    id: "CST",
    label: "CST (Central Standard Time, UTC-6)",
    shortLabel: "CST",
    offsetMinutes: -360,
    group: "Americas"
  },
  {
    id: "CDT",
    label: "CDT (Central Daylight Time, UTC-5)",
    shortLabel: "CDT",
    offsetMinutes: -300,
    group: "Americas"
  },
  {
    id: "MST",
    label: "MST (Mountain Standard Time, UTC-7)",
    shortLabel: "MST",
    offsetMinutes: -420,
    group: "Americas"
  },
  {
    id: "PDT",
    label: "PDT (Pacific Daylight Time, UTC-7)",
    shortLabel: "PDT",
    offsetMinutes: -420,
    group: "Americas"
  },
  {
    id: "AKST",
    label: "AKST (Alaska Standard Time, UTC-9)",
    shortLabel: "AKST",
    offsetMinutes: -540,
    group: "Americas"
  },
  {
    id: "HST",
    label: "HST (Hawaii Standard Time, UTC-10)",
    shortLabel: "HST",
    offsetMinutes: -600,
    group: "Americas"
  },
  {
    id: "BRT",
    label: "BRT (Brasilia Time, UTC-3)",
    shortLabel: "BRT",
    offsetMinutes: -180,
    group: "Americas"
  },

  // Europe & Africa
  {
    id: "WEST",
    label: "WEST (Western European Summer, UTC+1)",
    shortLabel: "WEST",
    offsetMinutes: 60,
    group: "Europe & Africa"
  },
  {
    id: "CEST",
    label: "CEST (Central European Summer, UTC+2)",
    shortLabel: "CEST",
    offsetMinutes: 120,
    group: "Europe & Africa"
  },
  {
    id: "EEST",
    label: "EEST (Eastern European Summer, UTC+3)",
    shortLabel: "EEST",
    offsetMinutes: 180,
    group: "Europe & Africa"
  },
  {
    id: "MSK",
    label: "MSK (Moscow Standard Time, UTC+3)",
    shortLabel: "MSK",
    offsetMinutes: 180,
    group: "Europe & Africa"
  },
  {
    id: "WAT",
    label: "WAT (West Africa Time, UTC+1)",
    shortLabel: "WAT",
    offsetMinutes: 60,
    group: "Europe & Africa"
  },
  {
    id: "CAT",
    label: "CAT (Central Africa Time, UTC+2)",
    shortLabel: "CAT",
    offsetMinutes: 120,
    group: "Europe & Africa"
  },
  {
    id: "EAT",
    label: "EAT (East Africa Time, UTC+3)",
    shortLabel: "EAT",
    offsetMinutes: 180,
    group: "Europe & Africa"
  },

  // Asia & Pacific
  {
    id: "GST",
    label: "GST (Gulf Standard Time / Dubai, UTC+4)",
    shortLabel: "GST",
    offsetMinutes: 240,
    group: "Asia & Pacific"
  },
  {
    id: "PKT",
    label: "PKT (Pakistan Standard Time, UTC+5)",
    shortLabel: "PKT",
    offsetMinutes: 300,
    group: "Asia & Pacific"
  },
  {
    id: "NPT",
    label: "NPT (Nepal Time, UTC+5:45)",
    shortLabel: "NPT",
    offsetMinutes: 345,
    group: "Asia & Pacific"
  },
  {
    id: "BST_BD",
    label: "BST (Bangladesh Standard Time, UTC+6)",
    shortLabel: "BST (BD)",
    offsetMinutes: 360,
    group: "Asia & Pacific"
  },
  {
    id: "ICT",
    label: "ICT (Indochina / Bangkok / Hanoi, UTC+7)",
    shortLabel: "ICT",
    offsetMinutes: 420,
    group: "Asia & Pacific"
  },
  {
    id: "SGT",
    label: "SGT (Singapore Time, UTC+8)",
    shortLabel: "SGT",
    offsetMinutes: 480,
    group: "Asia & Pacific"
  },
  {
    id: "CST_CHINA",
    label: "CST (China Standard Time, UTC+8)",
    shortLabel: "CST (CN)",
    offsetMinutes: 480,
    group: "Asia & Pacific"
  },
  {
    id: "HKT",
    label: "HKT (Hong Kong Time, UTC+8)",
    shortLabel: "HKT",
    offsetMinutes: 480,
    group: "Asia & Pacific"
  },
  {
    id: "KST",
    label: "KST (Korea Standard Time, UTC+9)",
    shortLabel: "KST",
    offsetMinutes: 540,
    group: "Asia & Pacific"
  },
  {
    id: "ACST",
    label: "ACST (Australian Central Time, UTC+9:30)",
    shortLabel: "ACST",
    offsetMinutes: 570,
    group: "Asia & Pacific"
  },
  {
    id: "AEST",
    label: "AEST (Australian Eastern Time, UTC+10)",
    shortLabel: "AEST",
    offsetMinutes: 600,
    group: "Asia & Pacific"
  },
  {
    id: "NZST",
    label: "NZST (New Zealand Standard Time, UTC+12)",
    shortLabel: "NZST",
    offsetMinutes: 720,
    group: "Asia & Pacific"
  },

  // UTC Fixed Offsets
  { id: "UTC-12", label: "UTC-12 (Baker Island)", shortLabel: "UTC-12", offsetMinutes: -720, group: "UTC Fixed" },
  { id: "UTC-11", label: "UTC-11 (Samoa)", shortLabel: "UTC-11", offsetMinutes: -660, group: "UTC Fixed" },
  { id: "UTC-10", label: "UTC-10 (Hawaii)", shortLabel: "UTC-10", offsetMinutes: -600, group: "UTC Fixed" },
  { id: "UTC-9", label: "UTC-9 (Alaska)", shortLabel: "UTC-9", offsetMinutes: -540, group: "UTC Fixed" },
  { id: "UTC-8", label: "UTC-8 (Pacific Time)", shortLabel: "UTC-8", offsetMinutes: -480, group: "UTC Fixed" },
  { id: "UTC-7", label: "UTC-7 (Mountain Time)", shortLabel: "UTC-7", offsetMinutes: -420, group: "UTC Fixed" },
  { id: "UTC-6", label: "UTC-6 (Central Time)", shortLabel: "UTC-6", offsetMinutes: -360, group: "UTC Fixed" },
  { id: "UTC-5", label: "UTC-5 (Eastern Time)", shortLabel: "UTC-5", offsetMinutes: -300, group: "UTC Fixed" },
  { id: "UTC-4", label: "UTC-4 (Atlantic)", shortLabel: "UTC-4", offsetMinutes: -240, group: "UTC Fixed" },
  { id: "UTC-3", label: "UTC-3 (Buenos Aires)", shortLabel: "UTC-3", offsetMinutes: -180, group: "UTC Fixed" },
  { id: "UTC-2", label: "UTC-2 (Mid-Atlantic)", shortLabel: "UTC-2", offsetMinutes: -120, group: "UTC Fixed" },
  { id: "UTC-1", label: "UTC-1 (Azores)", shortLabel: "UTC-1", offsetMinutes: -60, group: "UTC Fixed" },
  { id: "UTC+0", label: "UTC+0 (London / GMT)", shortLabel: "UTC+0", offsetMinutes: 0, group: "UTC Fixed" },
  { id: "UTC+2", label: "UTC+2 (Eastern Europe)", shortLabel: "UTC+2", offsetMinutes: 120, group: "UTC Fixed" },
  { id: "UTC+3", label: "UTC+3 (Moscow / Riyadh)", shortLabel: "UTC+3", offsetMinutes: 180, group: "UTC Fixed" },
  { id: "UTC+3:30", label: "UTC+3:30 (Tehran)", shortLabel: "UTC+3:30", offsetMinutes: 210, group: "UTC Fixed" },
  { id: "UTC+4", label: "UTC+4 (Dubai)", shortLabel: "UTC+4", offsetMinutes: 240, group: "UTC Fixed" },
  { id: "UTC+4:30", label: "UTC+4:30 (Kabul)", shortLabel: "UTC+4:30", offsetMinutes: 270, group: "UTC Fixed" },
  { id: "UTC+5", label: "UTC+5 (Karachi)", shortLabel: "UTC+5", offsetMinutes: 300, group: "UTC Fixed" },
  { id: "UTC+5:30", label: "UTC+5:30 (India / Colombo)", shortLabel: "UTC+5:30", offsetMinutes: 330, group: "UTC Fixed" },
  { id: "UTC+5:45", label: "UTC+5:45 (Kathmandu)", shortLabel: "UTC+5:45", offsetMinutes: 345, group: "UTC Fixed" },
  { id: "UTC+6", label: "UTC+6 (Dhaka)", shortLabel: "UTC+6", offsetMinutes: 360, group: "UTC Fixed" },
  { id: "UTC+6:30", label: "UTC+6:30 (Yangon)", shortLabel: "UTC+6:30", offsetMinutes: 390, group: "UTC Fixed" },
  { id: "UTC+7", label: "UTC+7 (Bangkok / Jakarta)", shortLabel: "UTC+7", offsetMinutes: 420, group: "UTC Fixed" },
  { id: "UTC+8", label: "UTC+8 (Singapore / Beijing)", shortLabel: "UTC+8", offsetMinutes: 480, group: "UTC Fixed" },
  { id: "UTC+9", label: "UTC+9 (Tokyo / Seoul)", shortLabel: "UTC+9", offsetMinutes: 540, group: "UTC Fixed" },
  { id: "UTC+9:30", label: "UTC+9:30 (Adelaide)", shortLabel: "UTC+9:30", offsetMinutes: 570, group: "UTC Fixed" },
  { id: "UTC+10", label: "UTC+10 (Sydney / Melbourne)", shortLabel: "UTC+10", offsetMinutes: 600, group: "UTC Fixed" },
  { id: "UTC+11", label: "UTC+11 (Solomon Islands)", shortLabel: "UTC+11", offsetMinutes: 660, group: "UTC Fixed" },
  { id: "UTC+12", label: "UTC+12 (Auckland / Fiji)", shortLabel: "UTC+12", offsetMinutes: 720, group: "UTC Fixed" },
  { id: "UTC+13", label: "UTC+13 (Tonga)", shortLabel: "UTC+13", offsetMinutes: 780, group: "UTC Fixed" },
  { id: "UTC+14", label: "UTC+14 (Line Islands)", shortLabel: "UTC+14", offsetMinutes: 840, group: "UTC Fixed" }
]

/**
 * Finds a timezone by its ID, alias, or offset representation.
 */
export function findTimeZone(id: string): TimeZoneOption {
  const normalized = id.trim().toUpperCase()
  const found = TIMEZONE_OPTIONS.find(
    (tz) =>
      tz.id.toUpperCase() === normalized ||
      tz.shortLabel.toUpperCase() === normalized ||
      tz.label.toUpperCase().includes(normalized)
  )
  if (found) return found

  // Parse custom UTC offset strings like "UTC+1.5", "+05:30", "-04:00"
  const offsetMatch = id.match(/^(?:UTC)?([+-])(\d{1,2})(?::?(\d{2}))?$/i)
  if (offsetMatch) {
    const sign = offsetMatch[1] === "-" ? -1 : 1
    const hours = parseInt(offsetMatch[2], 10)
    const minutes = offsetMatch[3] ? parseInt(offsetMatch[3], 10) : 0
    const totalMinutes = sign * (hours * 60 + minutes)
    return {
      id,
      label: id,
      shortLabel: id,
      offsetMinutes: totalMinutes,
      group: "UTC Fixed"
    }
  }

  // Fallback to UTC
  return TIMEZONE_OPTIONS[0]
}

/**
 * Formats a time in 24-hour military clock (HH:MM or HH:MM:SS).
 */
export function formatTime24(
  hours: number,
  minutes: number,
  seconds: number = 0,
  showSeconds: boolean = false
): string {
  const h = String(hours).padStart(2, "0")
  const m = String(minutes).padStart(2, "0")
  if (showSeconds) {
    const s = String(seconds).padStart(2, "0")
    return `${h}:${m}:${s}`
  }
  return `${h}:${m}`
}

/**
 * Formats a time in 12-hour clock with AM/PM (h:MM AM/PM or h:MM:SS AM/PM).
 */
export function formatTime12(
  hours: number,
  minutes: number,
  seconds: number = 0,
  showSeconds: boolean = false
): string {
  const meridiem = hours >= 12 ? "PM" : "AM"
  let h12 = hours % 12
  if (h12 === 0) h12 = 12
  const m = String(minutes).padStart(2, "0")
  if (showSeconds) {
    const s = String(seconds).padStart(2, "0")
    return `${h12}:${m}:${s} ${meridiem}`
  }
  return `${h12}:${m} ${meridiem}`
}

export interface TimeZoneConversionResult {
  sourceTz: TimeZoneOption
  targetTz: TimeZoneOption
  sourceTime: { hours: number; minutes: number; seconds: number }
  targetTime: { hours: number; minutes: number; seconds: number }
  dayOffset: -1 | 0 | 1 // -1 = yesterday, 0 = same day, 1 = tomorrow
  dayOffsetLabel: string
  offsetDeltaMinutes: number
  offsetDeltaLabel: string
  formattedSource: {
    "12h": string
    "24h": string
  }
  formattedTarget: {
    "12h": string
    "24h": string
  }
  conversionSummary: string
}

/**
 * Converts a parsed time between source and target time zones.
 */
export function convertTimeZone(
  parsed: ParsedTime,
  fromTzId: string,
  toTzId: string,
  options: { showSeconds?: boolean } = {}
): TimeZoneConversionResult {
  const fromTz = findTimeZone(fromTzId)
  const toTz = findTimeZone(toTzId)
  const showSeconds = options.showSeconds ?? parsed.hasSeconds

  const deltaMinutes = toTz.offsetMinutes - fromTz.offsetMinutes
  const totalSourceMinutes = parsed.hours * 60 + parsed.minutes + deltaMinutes

  let totalTargetSeconds = totalSourceMinutes * 60 + parsed.seconds
  const SECONDS_IN_DAY = 24 * 60 * 60

  let dayOffset: -1 | 0 | 1 = 0
  if (totalTargetSeconds >= SECONDS_IN_DAY) {
    dayOffset = 1
    totalTargetSeconds = totalTargetSeconds % SECONDS_IN_DAY
  } else if (totalTargetSeconds < 0) {
    dayOffset = -1
    totalTargetSeconds = ((totalTargetSeconds % SECONDS_IN_DAY) + SECONDS_IN_DAY) % SECONDS_IN_DAY
  }

  const targetHours = Math.floor(totalTargetSeconds / 3600)
  const targetMinutes = Math.floor((totalTargetSeconds % 3600) / 60)
  const targetSeconds = totalTargetSeconds % 60

  // Offset delta label (e.g. "+4.5 hrs", "-5 hrs", "Same time")
  let offsetDeltaLabel = "Same time"
  if (deltaMinutes > 0) {
    const h = Math.floor(deltaMinutes / 60)
    const m = deltaMinutes % 60
    offsetDeltaLabel = m > 0 ? `+${h}.${(m / 60) * 10} hrs` : `+${h} hrs`
  } else if (deltaMinutes < 0) {
    const abs = Math.abs(deltaMinutes)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    offsetDeltaLabel = m > 0 ? `-${h}.${(m / 60) * 10} hrs` : `-${h} hrs`
  }

  // Day offset label
  let dayOffsetLabel = "Same day"
  if (dayOffset === 1) dayOffsetLabel = "+1 day (Tomorrow)"
  else if (dayOffset === -1) dayOffsetLabel = "-1 day (Yesterday)"

  const formattedSource = {
    "12h": formatTime12(parsed.hours, parsed.minutes, parsed.seconds, showSeconds),
    "24h": formatTime24(parsed.hours, parsed.minutes, parsed.seconds, showSeconds)
  }

  const formattedTarget = {
    "12h": formatTime12(targetHours, targetMinutes, targetSeconds, showSeconds),
    "24h": formatTime24(targetHours, targetMinutes, targetSeconds, showSeconds)
  }

  const conversionSummary = `${formattedSource["24h"]} ${fromTz.shortLabel} = ${formattedTarget["24h"]} ${toTz.shortLabel}${
    dayOffset !== 0 ? ` (${dayOffsetLabel})` : ""
  }`

  return {
    sourceTz: fromTz,
    targetTz: toTz,
    sourceTime: { hours: parsed.hours, minutes: parsed.minutes, seconds: parsed.seconds },
    targetTime: { hours: targetHours, minutes: targetMinutes, seconds: targetSeconds },
    dayOffset,
    dayOffsetLabel,
    offsetDeltaMinutes: deltaMinutes,
    offsetDeltaLabel,
    formattedSource,
    formattedTarget,
    conversionSummary
  }
}
