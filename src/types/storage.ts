export type DarkPreset = "midnight" | "oled" | "slate" | "charcoal"
export type LightPreset = "pure-white" | "warm-paper" | "cool-ice"

export interface DarkModeSettings {
  mode: "dark" | "light"
  globalEnabled: boolean
  darkPreset: DarkPreset
  lightPreset: LightPreset
  brightness: number
  contrast: number
  sepia: number
  grayscale: number
  preserveMedia: boolean
  dimMediaInDark: boolean
  siteOverrides: Record<string, boolean>
}

export interface ColorHistoryItem {
  hex: string
  rgb: string
  hsl: string
  name?: string
  timestamp: number
}

export interface FontHistoryItem {
  fontFamily: string
  fontSize: string
  fontWeight: string
  color: string
  timestamp: number
}

export interface YtMusicSettings {
  enabled: boolean
  openInNewTab: boolean
  preserveTimestamp: boolean
  preservePlaylist: boolean
  preferSongVersion: boolean
  buttonPosition: "right" | "left"
  autoPause: boolean
}

export interface TimeZonePreset {
  id: string
  name: string
  fromTz: string
  toTz: string
  isDefault?: boolean
}

export interface TimeZoneSettings {
  selectedPresetId: string
  fromTz: string
  toTz: string
  timeFormat: "12h" | "24h"
  showSeconds: boolean
  customPresets: TimeZonePreset[]
  recentInputs: string[]
}

