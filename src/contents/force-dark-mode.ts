import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import type { DarkModeSettings, DarkPreset, LightPreset } from "../lib/storage"
import { DEFAULT_DARK_MODE_SETTINGS } from "../lib/storage"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_start"
}

const storage = new Storage({ area: "local" })
const STYLE_ID = "hub-force-theme-style"

// Preset Background & Surface Tokens
const DARK_PRESETS: Record<DarkPreset, { bg: string; surface: string; border: string; text: string }> = {
  midnight: {
    bg: "#09090b",
    surface: "#121215",
    border: "#27272a",
    text: "#fafafa"
  },
  oled: {
    bg: "#000000",
    surface: "#080808",
    border: "#181818",
    text: "#ffffff"
  },
  slate: {
    bg: "#0f172a",
    surface: "#1e293b",
    border: "#334155",
    text: "#f8fafc"
  },
  charcoal: {
    bg: "#1c1917",
    surface: "#292524",
    border: "#44403c",
    text: "#fafaf9"
  }
}

const LIGHT_PRESETS: Record<LightPreset, { bg: string; surface: string; border: string; text: string }> = {
  "pure-white": {
    bg: "#ffffff",
    surface: "#f4f4f5",
    border: "#e4e4e7",
    text: "#09090b"
  },
  "warm-paper": {
    bg: "#faf8f5",
    surface: "#f3efe6",
    border: "#e5dec9",
    text: "#1c1917"
  },
  "cool-ice": {
    bg: "#f8fafc",
    surface: "#f1f5f9",
    border: "#e2e8f0",
    text: "#0f172a"
  }
}

function buildDarkCSS(settings: DarkModeSettings, isYouTube: boolean): string {
  const preset = DARK_PRESETS[settings.darkPreset] || DARK_PRESETS.midnight
  const brightness = (settings.brightness ?? 100) / 100
  const contrast = (settings.contrast ?? 100) / 100
  const sepia = (settings.sepia ?? 0) / 100
  const grayscale = (settings.grayscale ?? 0) / 100

  const filterAdjustments = `brightness(${brightness}) contrast(${contrast}) ${sepia > 0 ? `sepia(${sepia})` : ""} ${grayscale > 0 ? `grayscale(${grayscale})` : ""}`.trim()

  const mediaDimming = settings.dimMediaInDark ? "opacity: 0.85 !important;" : ""

  const mediaFilter = settings.preserveMedia
    ? `
      img:not(picture > img):not([data-hub-no-invert]), 
      picture, 
      video, 
      canvas, 
      iframe:not(.hub-invertible),
      embed, 
      object, 
      [role="img"],
      [data-hub-media] {
        filter: invert(1) hue-rotate(180deg) !important;
        ${mediaDimming}
      }

      /* Prevent double-inversion on nested images */
      picture > img {
        filter: none !important;
      }
    `
    : ""

  let customSiteCSS = ""
  if (isYouTube) {
    customSiteCSS = `
      /* Native YouTube Dark Overrides */
      html, :root, ytd-app, #page-manager, ytd-watch-flexy {
        --yt-spec-base-background: ${preset.bg} !important;
        --yt-spec-raised-background: ${preset.surface} !important;
        --yt-spec-menu-background: ${preset.surface} !important;
        --yt-spec-inverted-background: #ffffff !important;
        --yt-spec-additive-background: rgba(255, 255, 255, 0.1) !important;
        --yt-spec-outline: ${preset.border} !important;
        --yt-spec-shadow: rgba(0, 0, 0, 0.4) !important;
        --yt-spec-text-primary: ${preset.text} !important;
        --yt-spec-text-secondary: #a1a1aa !important;
        --yt-spec-general-background-a: ${preset.surface} !important;
        --yt-spec-general-background-b: ${preset.bg} !important;
        --ytd-searchbox-background: ${preset.surface} !important;
        --ytd-searchbox-text-color: #ffffff !important;
        background-color: ${preset.bg} !important;
        color: ${preset.text} !important;
      }

      #masthead-container, ytd-masthead, #background.ytd-masthead {
        background-color: ${preset.bg} !important;
        border-bottom: 1px solid ${preset.border} !important;
      }

      ytd-searchbox #container.ytd-searchbox {
        background-color: ${preset.surface} !important;
        border: 1px solid ${preset.border} !important;
      }

      ytd-searchbox #container.ytd-searchbox input#search {
        color: #ffffff !important;
      }

      #search-icon-legacy.ytd-searchbox {
        background-color: ${preset.surface} !important;
        border: 1px solid ${preset.border} !important;
      }

      ytd-playlist-panel-renderer, #playlist.ytd-watch-flexy {
        background-color: ${preset.surface} !important;
        border: 1px solid ${preset.border} !important;
      }

      ytd-playlist-panel-video-renderer[selected] {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }

      yt-chip-cloud-chip-renderer {
        background-color: ${preset.surface} !important;
        color: ${preset.text} !important;
      }

      yt-chip-cloud-chip-renderer[selected] {
        background-color: ${preset.text} !important;
        color: ${preset.bg} !important;
      }

      ytd-watch-metadata yt-button-shape button,
      ytd-watch-metadata ytd-button-renderer button {
        background-color: ${preset.surface} !important;
        color: ${preset.text} !important;
        border: 1px solid ${preset.border} !important;
      }

      #description.ytd-watch-metadata {
        background: ${preset.surface} !important;
        color: ${preset.text} !important;
      }

      ytd-guide-renderer, ytd-mini-guide-renderer {
        background-color: ${preset.bg} !important;
      }
    `
  }

  return `
    :root {
      color-scheme: dark !important;
    }

    html {
      filter: invert(1) hue-rotate(180deg) ${filterAdjustments} !important;
      background-color: ${preset.bg} !important;
    }

    body {
      background-color: transparent !important;
    }

    ${mediaFilter}

    /* Keep extension UI and shadow hosts completely untouched */
    plasmo-csui, 
    .hub-extension-root,
    [data-hub-no-invert] {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      background-color: ${preset.bg} !important;
      width: 8px !important;
      height: 8px !important;
    }
    ::-webkit-scrollbar-thumb {
      background-color: ${preset.border} !important;
      border-radius: 4px !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: #52525b !important;
    }

    ${customSiteCSS}
  `
}

function buildLightCSS(settings: DarkModeSettings, isYouTube: boolean): string {
  const preset = LIGHT_PRESETS[settings.lightPreset] || LIGHT_PRESETS["pure-white"]
  const brightness = (settings.brightness ?? 100) / 100
  const contrast = (settings.contrast ?? 100) / 100
  const sepia = (settings.sepia ?? 0) / 100
  const grayscale = (settings.grayscale ?? 0) / 100

  const filterAdjustments = `brightness(${brightness}) contrast(${contrast}) ${sepia > 0 ? `sepia(${sepia})` : ""} ${grayscale > 0 ? `grayscale(${grayscale})` : ""}`.trim()

  let customSiteCSS = ""

  if (isYouTube) {
    customSiteCSS = `
      /* Native YouTube Clean Light Theme Overrides */
      html, html[dark], [dark], ytd-app, #page-manager, ytd-watch-flexy {
        --yt-spec-base-background: ${preset.bg} !important;
        --yt-spec-raised-background: ${preset.bg} !important;
        --yt-spec-menu-background: ${preset.bg} !important;
        --yt-spec-inverted-background: #0f0f0f !important;
        --yt-spec-additive-background: rgba(0, 0, 0, 0.05) !important;
        --yt-spec-outline: ${preset.border} !important;
        --yt-spec-shadow: rgba(0, 0, 0, 0.1) !important;
        --yt-spec-text-primary: ${preset.text} !important;
        --yt-spec-text-secondary: #52525b !important;
        --yt-spec-text-disabled: #a1a1aa !important;
        --yt-spec-icon-active-other: ${preset.text} !important;
        --yt-spec-icon-inactive: #71717a !important;
        --yt-spec-badge-chip-background: ${preset.surface} !important;
        --yt-spec-button-chip-background-hover: rgba(0, 0, 0, 0.08) !important;
        --yt-spec-touch-response: #000000 !important;
        --yt-spec-brand-icon-active: #ff0000 !important;
        --yt-spec-brand-button-background: #cc0000 !important;
        --yt-spec-static-brand-white: #ffffff !important;
        --yt-spec-brand-background-solid: ${preset.bg} !important;
        --yt-spec-general-background-a: ${preset.surface} !important;
        --yt-spec-general-background-b: #ebebeb !important;
        --yt-spec-general-background-c: #dedede !important;
        --yt-spec-snackbar-background: #0f0f0f !important;
        --yt-spec-snow-white: #ffffff !important;
        --ytd-searchbox-background: ${preset.bg} !important;
        --ytd-searchbox-text-color: ${preset.text} !important;
        background-color: ${preset.bg} !important;
        color: ${preset.text} !important;
      }

      #masthead-container, ytd-masthead, #background.ytd-masthead {
        background-color: ${preset.bg} !important;
        background: ${preset.bg} !important;
        border-bottom: 1px solid ${preset.border} !important;
      }

      ytd-searchbox #container.ytd-searchbox {
        background-color: ${preset.bg} !important;
        border: 1px solid ${preset.border} !important;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06) !important;
      }

      ytd-searchbox #container.ytd-searchbox input#search {
        color: ${preset.text} !important;
      }

      #search-icon-legacy.ytd-searchbox {
        background-color: ${preset.surface} !important;
        border: 1px solid ${preset.border} !important;
      }

      #search-icon-legacy.ytd-searchbox yt-icon {
        color: ${preset.text} !important;
      }

      /* Playlist panel on the right side */
      ytd-playlist-panel-renderer, #playlist.ytd-watch-flexy {
        background-color: ${preset.surface} !important;
        border: 1px solid ${preset.border} !important;
        border-radius: 12px !important;
      }

      ytd-playlist-panel-video-renderer[selected] {
        background-color: ${preset.border} !important;
      }

      ytd-playlist-panel-video-renderer:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
      }

      /* Video metadata, title, author, actions */
      ytd-watch-metadata #owner, ytd-watch-metadata #title, #title.ytd-watch-metadata h1 {
        color: ${preset.text} !important;
      }

      ytd-watch-metadata yt-button-shape button,
      ytd-watch-metadata ytd-button-renderer button {
        background-color: ${preset.surface} !important;
        color: ${preset.text} !important;
        border: 1px solid ${preset.border} !important;
      }

      #description.ytd-watch-metadata {
        background: ${preset.surface} !important;
        color: ${preset.text} !important;
        border-radius: 12px !important;
      }

      /* Chip cloud tags (All, From the series, etc.) */
      yt-chip-cloud-chip-renderer {
        background-color: ${preset.surface} !important;
        color: ${preset.text} !important;
      }

      yt-chip-cloud-chip-renderer[selected] {
        background-color: ${preset.text} !important;
        color: ${preset.bg} !important;
      }

      /* Guide / Sidebar */
      ytd-guide-renderer, ytd-mini-guide-renderer {
        background-color: ${preset.bg} !important;
      }
    `
  }

  return `
    :root {
      color-scheme: light !important;
    }

    html {
      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      ${filterAdjustments ? `filter: ${filterAdjustments} !important;` : ""}
    }

    body {
      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
    }

    /* Form Controls & Basic Tags in Forced Light Mode */
    input, textarea, select {
      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      border-color: ${preset.border} !important;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      background-color: ${preset.bg} !important;
      width: 8px !important;
      height: 8px !important;
    }
    ::-webkit-scrollbar-thumb {
      background-color: ${preset.border} !important;
      border-radius: 4px !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: #a1a1aa !important;
    }

    ${customSiteCSS}
  `
}

function applyTheme(enabled: boolean, settings: DarkModeSettings) {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null

  if (!enabled) {
    if (styleEl) {
      styleEl.remove()
    }
    return
  }

  if (!styleEl) {
    styleEl = document.createElement("style")
    styleEl.id = STYLE_ID
    if (document.head) {
      document.head.appendChild(styleEl)
    } else {
      document.documentElement.appendChild(styleEl)
    }
  }

  const hostname = window.location.hostname
  const isYouTube = hostname.includes("youtube.com")

  const generatedCSS =
    settings.mode === "dark"
      ? buildDarkCSS(settings, isYouTube)
      : buildLightCSS(settings, isYouTube)

  styleEl.textContent = generatedCSS
}

// Initial check & load
async function checkAndApply() {
  try {
    const bgEnabled = await storage.get<Record<string, boolean>>("hub_background_enabled")
    const isDarkModeActive = !!bgEnabled?.["force-dark-mode"]

    const savedSettings = await storage.get<DarkModeSettings>("hub_dark_mode_settings")
    const settings: DarkModeSettings = {
      ...DEFAULT_DARK_MODE_SETTINGS,
      ...savedSettings
    }

    const currentHost = window.location.hostname
    const siteOverride = settings.siteOverrides?.[currentHost]

    // Determine final activation status
    const shouldEnable = siteOverride !== undefined ? siteOverride : isDarkModeActive

    applyTheme(shouldEnable, settings)
  } catch (err) {
    console.error("[ForceDarkMode] Error checking settings:", err)
  }
}

// Watch storage changes in real-time
storage.watch({
  hub_background_enabled: () => checkAndApply(),
  hub_dark_mode_settings: () => checkAndApply()
})

// Listen to direct messages for instant live preview
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "TOGGLE_DARK_MODE" || msg?.type === "UPDATE_THEME_SETTINGS") {
    checkAndApply()
    sendResponse({ status: "updated" })
  }
})

// Run immediately on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkAndApply)
} else {
  checkAndApply()
}
