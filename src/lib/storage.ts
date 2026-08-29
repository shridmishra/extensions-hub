import { Storage } from "@plasmohq/storage"
import { EXTENSION_REGISTRY } from "./registry.ts"

export const storage = new Storage({ area: "local" })

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

export const DEFAULT_DARK_MODE_SETTINGS: DarkModeSettings = {
  mode: "dark",
  globalEnabled: false,
  darkPreset: "midnight",
  lightPreset: "pure-white",
  brightness: 100,
  contrast: 100,
  sepia: 0,
  grayscale: 0,
  preserveMedia: true,
  dimMediaInDark: false,
  siteOverrides: {}
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

export const DEFAULT_YT_MUSIC_SETTINGS: YtMusicSettings = {
  enabled: true,
  openInNewTab: false,
  preserveTimestamp: true,
  preservePlaylist: true,
  preferSongVersion: true,
  buttonPosition: "right",
  autoPause: true
}



// Registry of interactive / on-page inspection tools that require exclusive activation
export const INTERACTIVE_TOOLS: Record<string, string> = {
  "color-picker": "color_picker_active",
  "font-finder": "font_finder_active",
  "css-picker": "css_picker_active",
  "figma-picker": "figma_picker_active",
  "page-ruler": "page_ruler_active",
  "css-inspector": "css_inspector_active",
  "element-remover": "element_remover_active"
}

// Enforces mutual exclusion: only ONE interactive on-page tool can be active at a time
export async function activateInteractiveTool(activeToolId: string): Promise<void> {
  for (const [toolId, storageKey] of Object.entries(INTERACTIVE_TOOLS)) {
    if (toolId === activeToolId) {
      await storage.set(storageKey, true)
    } else {
      await storage.set(storageKey, false)
    }
  }
}

// Deactivates all interactive on-page tools
export async function deactivateAllInteractiveTools(): Promise<void> {
  for (const storageKey of Object.values(INTERACTIVE_TOOLS)) {
    await storage.set(storageKey, false)
  }
}

export const ExtensionStorage = {
  // Pinned extension IDs
  async getPinnedIds(): Promise<string[]> {
    const saved = await storage.get<string[]>("hub_pinned_ids")
    if (saved && Array.isArray(saved)) return saved
    return EXTENSION_REGISTRY.filter((e) => e.defaultPinned).map((e) => e.id)
  },

  async setPinnedIds(ids: string[]): Promise<void> {
    await storage.set("hub_pinned_ids", ids)
  },

  async togglePin(id: string): Promise<string[]> {
    const current = await this.getPinnedIds()
    let updated: string[]
    if (current.includes(id)) {
      updated = current.filter((x) => x !== id)
    } else {
      updated = [...current, id]
    }
    await this.setPinnedIds(updated)
    return updated
  },

  // Starred / Liked
  async getStarredIds(): Promise<string[]> {
    const saved = await storage.get<string[]>("hub_starred_ids")
    return saved || []
  },

  async toggleStarred(id: string): Promise<string[]> {
    const current = await this.getStarredIds()
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    await storage.set("hub_starred_ids", updated)
    return updated
  },

  async getLikedIds(): Promise<string[]> {
    const saved = await storage.get<string[]>("hub_liked_ids")
    return saved || []
  },

  async toggleLiked(id: string): Promise<string[]> {
    const current = await this.getLikedIds()
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    await storage.set("hub_liked_ids", updated)
    return updated
  },

  // Background toggleable extensions
  async getBackgroundEnabled(): Promise<Record<string, boolean>> {
    const saved = await storage.get<Record<string, boolean>>("hub_background_enabled")
    const defaults: Record<string, boolean> = {}
    EXTENSION_REGISTRY.filter((e) => e.type === "background").forEach((e) => {
      defaults[e.id] = e.defaultEnabled
    })
    if (saved) return { ...defaults, ...saved }
    return defaults
  },


  async setBackgroundExtensionEnabled(id: string, enabled: boolean): Promise<void> {
    const current = await this.getBackgroundEnabled()
    current[id] = enabled
    await storage.set("hub_background_enabled", current)
  },

  // Dark / Light Forcer Settings
  async getDarkModeSettings(): Promise<DarkModeSettings> {
    const saved = await storage.get<DarkModeSettings>("hub_dark_mode_settings")
    if (saved) return { ...DEFAULT_DARK_MODE_SETTINGS, ...saved }
    return DEFAULT_DARK_MODE_SETTINGS
  },

  async setDarkModeSettings(settings: Partial<DarkModeSettings>): Promise<DarkModeSettings> {
    const current = await this.getDarkModeSettings()
    const updated = { ...current, ...settings }
    await storage.set("hub_dark_mode_settings", updated)
    return updated
  },

  // Color Picker History
  async getColorHistory(): Promise<ColorHistoryItem[]> {
    const saved = await storage.get<ColorHistoryItem[]>("color_picker_history")
    return saved || []
  },

  async addColorHistory(item: Omit<ColorHistoryItem, "timestamp">): Promise<ColorHistoryItem[]> {
    const current = await this.getColorHistory()
    const filtered = current.filter((c) => c.hex.toLowerCase() !== item.hex.toLowerCase())
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20)
    await storage.set("color_picker_history", updated)
    return updated
  },

  async clearColorHistory(): Promise<void> {
    await storage.set("color_picker_history", [])
  },

  // Font Finder History
  async getFontHistory(): Promise<FontHistoryItem[]> {
    const saved = await storage.get<FontHistoryItem[]>("font_finder_history")
    return saved || []
  },

  async addFontHistory(item: Omit<FontHistoryItem, "timestamp">): Promise<FontHistoryItem[]> {
    const current = await this.getFontHistory()
    const filtered = current.filter((f) => f.fontFamily !== item.fontFamily)
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20)
    await storage.set("font_finder_history", updated)
    return updated
  },

  // Hub UI Theme
  async getTheme(): Promise<"light" | "dark" | "system"> {
    const saved = await storage.get<"light" | "dark" | "system">("hub_theme")
    return saved || "light"
  },

  async setTheme(theme: "light" | "dark" | "system"): Promise<void> {
    await storage.set("hub_theme", theme)
  },

  // YouTube to YT Music Settings
  async getYtMusicSettings(): Promise<YtMusicSettings> {
    const saved = await storage.get<YtMusicSettings>("hub_yt_music_settings")
    if (saved) return { ...DEFAULT_YT_MUSIC_SETTINGS, ...saved }
    return DEFAULT_YT_MUSIC_SETTINGS
  },

  async setYtMusicSettings(settings: Partial<YtMusicSettings>): Promise<YtMusicSettings> {
    const current = await this.getYtMusicSettings()
    const updated = { ...current, ...settings }
    await storage.set("hub_yt_music_settings", updated)
    return updated
  }
}

