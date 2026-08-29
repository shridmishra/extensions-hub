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

function buildGitHubDarkCSS(settings: DarkModeSettings): string {
  const preset = DARK_PRESETS[settings.darkPreset] || DARK_PRESETS.midnight
  const brightness = (settings.brightness ?? 100) / 100
  const contrast = (settings.contrast ?? 100) / 100
  const sepia = (settings.sepia ?? 0) / 100
  const grayscale = (settings.grayscale ?? 0) / 100

  const filterAdjustments = `brightness(${brightness}) contrast(${contrast}) ${sepia > 0 ? `sepia(${sepia})` : ""} ${grayscale > 0 ? `grayscale(${grayscale})` : ""}`.trim()
  const mediaDimming = settings.dimMediaInDark ? "opacity: 0.85 !important;" : ""

  return `
    :root, [data-color-mode], [data-dark-theme], html, body {
      --bgColor-default: ${preset.bg} !important;
      --bgColor-muted: ${preset.surface} !important;
      --bgColor-inset: ${preset.bg} !important;
      --bgColor-emphasis: ${preset.border} !important;
      --fgColor-default: ${preset.text} !important;
      --fgColor-muted: #a1a1aa !important;
      --fgColor-subtle: #71717a !important;
      --borderColor-default: ${preset.border} !important;
      --borderColor-muted: ${preset.border} !important;
      --borderColor-subtle: ${preset.border} !important;

      --color-canvas-default: ${preset.bg} !important;
      --color-canvas-subtle: ${preset.surface} !important;
      --color-canvas-inset: ${preset.bg} !important;
      --color-canvas-overlay: ${preset.surface} !important;
      --color-fg-default: ${preset.text} !important;
      --color-fg-muted: #a1a1aa !important;
      --color-fg-subtle: #71717a !important;
      --color-border-default: ${preset.border} !important;
      --color-border-subtle: ${preset.border} !important;
      --color-border-muted: ${preset.border} !important;
      --color-header-bg: ${preset.bg} !important;
      --color-header-logo: ${preset.text} !important;
      --color-btn-bg: ${preset.surface} !important;
      --color-btn-text: ${preset.text} !important;
      --color-btn-border: ${preset.border} !important;
      --color-btn-hover-bg: #27272a !important;

      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      color-scheme: dark !important;
    }

    html {
      filter: ${filterAdjustments} !important;
    }

    /* GitHub Top Header */
    .AppHeader, header.Header, .Header, .AppHeader-globalBar, .AppHeader-localBar, .AppHeader-context-full {
      background-color: ${preset.bg} !important;
      border-bottom: 1px solid ${preset.border} !important;
      color: ${preset.text} !important;
    }

    /* Navigation & Tabs */
    .UnderlineNav, .UnderlineNav-body, nav[aria-label="User profile"], .tabnav, .tabnav-tabs, .AppHeader-tabs {
      background-color: ${preset.bg} !important;
      border-bottom: 1px solid ${preset.border} !important;
    }
    .UnderlineNav-item, .tabnav-tab {
      color: #a1a1aa !important;
    }
    .UnderlineNav-item:hover, .tabnav-tab:hover {
      color: ${preset.text} !important;
    }
    .UnderlineNav-item[aria-current="page"], .UnderlineNav-item.selected, .tabnav-tab.selected {
      color: ${preset.text} !important;
      border-bottom-color: ${preset.text} !important;
    }

    /* Sidebar Profile Details & Typography */
    .vcard-names-container .p-name, .vcard-fullname, .p-name {
      color: ${preset.text} !important;
    }
    .vcard-names-container .p-nickname, .vcard-username, .p-nickname, .user-profile-bio, .p-note, .vcard-details, .vcard-detail, .user-following-container {
      color: #a1a1aa !important;
    }

    /* Readme & Markdown Canvas */
    .markdown-body, article.markdown-body, .Box, .Box-body, .Box-header, .Box-footer, .border-subtle, .color-bg-default, .color-bg-subtle, .color-bg-inset, .Subhead, .timeline-comment {
      background-color: ${preset.surface} !important;
      color: ${preset.text} !important;
      border-color: ${preset.border} !important;
    }

    .markdown-body pre, .markdown-body code, .markdown-body .highlight pre, .markdown-body pre code, .snippet-clipboard-content, .blob-wrapper, .file {
      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      border-color: ${preset.border} !important;
    }

    .markdown-body a {
      color: #60a5fa !important;
    }

    .markdown-body table tr {
      background-color: ${preset.surface} !important;
      border-top-color: ${preset.border} !important;
    }
    .markdown-body table tr:nth-child(2n) {
      background-color: ${preset.bg} !important;
    }

    /* Repo Cards & Pinned Items */
    #user-repositories-list li, .pinned-item-list-item-content, .repo-card, .user-repo-search-results {
      background-color: ${preset.surface} !important;
      border-color: ${preset.border} !important;
    }

    /* Counter Badges */
    .Counter {
      background-color: ${preset.border} !important;
      color: ${preset.text} !important;
    }

    /* Action Buttons */
    .btn, button.btn, a.btn {
      background-color: ${preset.surface} !important;
      color: ${preset.text} !important;
      border: 1px solid ${preset.border} !important;
    }

    /* Dim media if enabled */
    ${settings.dimMediaInDark ? `img, video, [role="img"] { ${mediaDimming} }` : ""}

    /* Ensure user avatar is never inverted */
    .avatar, .avatar-user, img.avatar {
      filter: none !important;
    }
  `
}

function buildGitHubLightCSS(settings: DarkModeSettings): string {
  const preset = LIGHT_PRESETS[settings.lightPreset] || LIGHT_PRESETS["pure-white"]
  const brightness = (settings.brightness ?? 100) / 100
  const contrast = (settings.contrast ?? 100) / 100
  const sepia = (settings.sepia ?? 0) / 100
  const grayscale = (settings.grayscale ?? 0) / 100

  let presetFilter = ""
  if (settings.lightPreset === "warm-paper" && sepia === 0) {
    presetFilter = "sepia(0.08) "
  } else if (settings.lightPreset === "cool-ice" && sepia === 0) {
    presetFilter = "contrast(1.02) "
  }

  const filterAdjustments = `${presetFilter}brightness(${brightness}) contrast(${contrast}) ${sepia > 0 ? `sepia(${sepia})` : ""} ${grayscale > 0 ? `grayscale(${grayscale})` : ""}`.trim()

  return `
    :root, [data-color-mode], [data-light-theme], html, body {
      --bgColor-default: ${preset.bg} !important;
      --bgColor-muted: ${preset.surface} !important;
      --bgColor-inset: ${preset.bg} !important;
      --bgColor-emphasis: ${preset.border} !important;
      --fgColor-default: ${preset.text} !important;
      --fgColor-muted: #52525b !important;
      --fgColor-subtle: #71717a !important;
      --borderColor-default: ${preset.border} !important;
      --borderColor-muted: ${preset.border} !important;
      --borderColor-subtle: ${preset.border} !important;

      --color-canvas-default: ${preset.bg} !important;
      --color-canvas-subtle: ${preset.surface} !important;
      --color-canvas-inset: ${preset.bg} !important;
      --color-canvas-overlay: ${preset.surface} !important;
      --color-fg-default: ${preset.text} !important;
      --color-fg-muted: #52525b !important;
      --color-fg-subtle: #71717a !important;
      --color-border-default: ${preset.border} !important;
      --color-border-subtle: ${preset.border} !important;
      --color-border-muted: ${preset.border} !important;
      --color-header-bg: ${preset.surface} !important;
      --color-header-logo: ${preset.text} !important;
      --color-btn-bg: ${preset.surface} !important;
      --color-btn-text: ${preset.text} !important;
      --color-btn-border: ${preset.border} !important;

      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      color-scheme: light !important;
    }

    html {
      filter: ${filterAdjustments} !important;
    }

    .AppHeader, header.Header, .Header, .AppHeader-globalBar, .AppHeader-localBar {
      background-color: ${preset.surface} !important;
      border-bottom: 1px solid ${preset.border} !important;
      color: ${preset.text} !important;
    }

    .UnderlineNav, .UnderlineNav-body, nav[aria-label="User profile"], .tabnav, .tabnav-tabs {
      background-color: ${preset.bg} !important;
      border-bottom: 1px solid ${preset.border} !important;
    }

    .vcard-names-container .p-name, .vcard-fullname, .p-name {
      color: ${preset.text} !important;
    }
    .vcard-names-container .p-nickname, .vcard-username, .p-nickname, .user-profile-bio, .p-note, .vcard-details, .vcard-detail {
      color: #52525b !important;
    }

    .markdown-body, article.markdown-body, .Box, .Box-body, .Box-header, .Box-footer, .Subhead {
      background-color: ${preset.bg} !important;
      color: ${preset.text} !important;
      border-color: ${preset.border} !important;
    }

    .markdown-body pre, .markdown-body code, .markdown-body .highlight pre, .snippet-clipboard-content {
      background-color: ${preset.surface} !important;
      color: ${preset.text} !important;
      border-color: ${preset.border} !important;
    }

    .btn, button.btn, a.btn {
      background-color: ${preset.surface} !important;
      color: ${preset.text} !important;
      border: 1px solid ${preset.border} !important;
    }
  `
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
      svg[role="img"],
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

  // Optional preset-specific tone adjustments
  let presetFilter = ""
  if (settings.lightPreset === "warm-paper" && sepia === 0) {
    presetFilter = "sepia(0.08) "
  } else if (settings.lightPreset === "cool-ice" && sepia === 0) {
    presetFilter = "contrast(1.02) "
  }

  const filterAdjustments = `${presetFilter}brightness(${brightness}) contrast(${contrast}) ${sepia > 0 ? `sepia(${sepia})` : ""} ${grayscale > 0 ? `grayscale(${grayscale})` : ""}`.trim()

  const mediaFilter = settings.preserveMedia
    ? `
      img:not(picture > img):not([data-hub-no-invert]), 
      picture, 
      video, 
      canvas, 
      iframe:not(.hub-invertible),
      embed, 
      object, 
      svg[role="img"],
      [data-hub-media] {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      /* Prevent double-inversion on nested images */
      picture > img {
        filter: none !important;
      }
    `
    : ""

  return `
    :root {
      color-scheme: light !important;
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
      background-color: #a1a1aa !important;
    }
  `
}

function parseColorLuminance(colorStr: string): number | null {
  if (!colorStr) return null
  const str = colorStr.trim().toLowerCase()

  // Hex format #fff or #ffffff
  if (str.startsWith("#")) {
    let hex = str.slice(1)
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("")
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return 0.299 * r + 0.587 * g + 0.114 * b
    }
  }

  // RGB / RGBA format
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1
    if (a >= 0.15) {
      return 0.299 * parseInt(match[1], 10) + 0.587 * parseInt(match[2], 10) + 0.114 * parseInt(match[3], 10)
    }
  }
  return null
}

let isMutatingByExtension = false
let originalState: {
  colorMode: string | null
  darkTheme: string | null
  lightTheme: string | null
  hasRecorded: boolean
} = {
  colorMode: null,
  darkTheme: null,
  lightTheme: null,
  hasRecorded: false
}

function recordInitialState() {
  if (typeof document === "undefined" || !document.documentElement || originalState.hasRecorded) return
  originalState = {
    colorMode: document.documentElement.getAttribute("data-color-mode"),
    darkTheme: document.documentElement.getAttribute("data-dark-theme"),
    lightTheme: document.documentElement.getAttribute("data-light-theme"),
    hasRecorded: true
  }
}

/**
 * Automatically detects whether the current webpage is natively in dark mode or light mode.
 */
export function detectNativePageTheme(): "dark" | "light" {
  try {
    const hostname = window.location.hostname
    const html = document.documentElement
    const body = document.body

    // 1. Domain-specific checks (e.g. GitHub, YouTube, Twitter/X)
    if (hostname.includes("github.com")) {
      const isStyleActive = Boolean(document.getElementById(STYLE_ID))
      const colorMode = (isStyleActive && originalState.hasRecorded)
        ? (originalState.colorMode?.toLowerCase() || null)
        : html.getAttribute("data-color-mode")?.toLowerCase()

      if (colorMode === "dark") return "dark"
      if (colorMode === "light") return "light"
      if (colorMode === "auto" || !colorMode) {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark"
        }
        return "light"
      }
    }

    if (hostname.includes("youtube.com")) {
      const htmlDarkAttr = html.hasAttribute("dark") || html.getAttribute("dark") !== null
      const ytdAppDark = document.querySelector("ytd-app")?.hasAttribute("dark")
      if (htmlDarkAttr || ytdAppDark || html.classList.contains("dark")) {
        return "dark"
      }
      const ytBg =
        html.style.getPropertyValue("--yt-spec-base-background") ||
        getComputedStyle(html).getPropertyValue("--yt-spec-base-background").trim()
      if (ytBg) {
        const lum = parseColorLuminance(ytBg)
        if (lum !== null) return lum < 128 ? "dark" : "light"
      }
    }

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      const htmlStyle = html.getAttribute("style") || ""
      if (htmlStyle.includes("color-scheme: dark") || html.style.colorScheme === "dark") {
        return "dark"
      }
      if (htmlStyle.includes("color-scheme: light") || html.style.colorScheme === "light") {
        return "light"
      }
    }

    // 2. Common class markers on html or body
    const darkClasses = ["dark", "dark-mode", "dark-theme", "theme-dark", "night", "theme-night", "mode-dark"]
    const lightClasses = ["light", "light-mode", "light-theme", "theme-light", "day", "theme-day", "mode-light"]

    for (const cls of darkClasses) {
      if (html.classList.contains(cls) || body?.classList.contains(cls)) {
        return "dark"
      }
    }
    for (const cls of lightClasses) {
      if (html.classList.contains(cls) || body?.classList.contains(cls)) {
        return "light"
      }
    }

    // 3. Common DOM Theme Attributes
    const themeAttrs = ["data-theme", "data-color-mode", "data-bs-theme", "data-mode", "theme", "color-scheme"]
    for (const attr of themeAttrs) {
      const hVal = html.getAttribute(attr)?.toLowerCase()
      if (hVal === "dark") return "dark"
      if (hVal === "light") return "light"

      const bVal = body?.getAttribute(attr)?.toLowerCase()
      if (bVal === "dark") return "dark"
      if (bVal === "light") return "light"
    }

    // 4. Color scheme meta tag & theme-color meta tag
    const metaTag = document.querySelector('meta[name="color-scheme"]')?.getAttribute("content")?.toLowerCase()
    if (metaTag?.includes("dark") && !metaTag?.includes("light")) return "dark"
    if (metaTag?.includes("light") && !metaTag?.includes("dark")) return "light"

    const themeColorMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute("content")
    if (themeColorMeta) {
      const lum = parseColorLuminance(themeColorMeta)
      if (lum !== null) {
        return lum < 128 ? "dark" : "light"
      }
    }

    // 5. Inspect computed background color (when our override stylesheet is not active)
    const styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    const isStyleActive = Boolean(styleEl && styleEl.sheet && !styleEl.sheet.disabled)

    if (!isStyleActive && body) {
      const bodyBg = window.getComputedStyle(body).backgroundColor
      const htmlBg = window.getComputedStyle(html).backgroundColor

      const bodyLum = parseColorLuminance(bodyBg)
      if (bodyLum !== null) {
        return bodyLum < 128 ? "dark" : "light"
      }

      const htmlLum = parseColorLuminance(htmlBg)
      if (htmlLum !== null) {
        return htmlLum < 128 ? "dark" : "light"
      }
    }

    // 6. System prefers-color-scheme fallback
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }

    return "light"
  } catch {
    return "light"
  }
}

function applyTheme(enabled: boolean, settings: DarkModeSettings) {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  const hostname = window.location.hostname
  const isYouTube = hostname.includes("youtube.com")
  const isGitHub = hostname.includes("github.com")

  if (!enabled) {
    if (styleEl) {
      styleEl.remove()
    }
    if (isGitHub && typeof document !== "undefined" && document.documentElement && originalState.hasRecorded) {
      isMutatingByExtension = true
      if (originalState.colorMode !== null) {
        document.documentElement.setAttribute("data-color-mode", originalState.colorMode)
      } else {
        document.documentElement.removeAttribute("data-color-mode")
      }
      if (originalState.darkTheme !== null) {
        document.documentElement.setAttribute("data-dark-theme", originalState.darkTheme)
      } else {
        document.documentElement.removeAttribute("data-dark-theme")
      }
      if (originalState.lightTheme !== null) {
        document.documentElement.setAttribute("data-light-theme", originalState.lightTheme)
      } else {
        document.documentElement.removeAttribute("data-light-theme")
      }
      setTimeout(() => {
        isMutatingByExtension = false
      }, 100)
    }
    return
  }

  recordInitialState()

  // Detect native theme and force the opposite mode
  const nativeTheme = detectNativePageTheme()
  const targetMode = nativeTheme === "dark" ? "light" : "dark"

  if (isGitHub && typeof document !== "undefined" && document.documentElement) {
    isMutatingByExtension = true
    document.documentElement.setAttribute("data-color-mode", targetMode)
    document.documentElement.setAttribute("data-dark-theme", "dark")
    document.documentElement.setAttribute("data-light-theme", "light")
    setTimeout(() => {
      isMutatingByExtension = false
    }, 100)
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

  let generatedCSS = ""
  if (isGitHub) {
    generatedCSS = targetMode === "dark" ? buildGitHubDarkCSS(settings) : buildGitHubLightCSS(settings)
  } else {
    generatedCSS =
      targetMode === "dark"
        ? buildDarkCSS(settings, isYouTube)
        : buildLightCSS(settings, isYouTube)
  }

  styleEl.textContent = generatedCSS
}

// Initial check & load
async function checkAndApply() {
  try {
    recordInitialState()
    const savedSettings = await storage.get<DarkModeSettings>("hub_dark_mode_settings")
    const settings: DarkModeSettings = {
      ...DEFAULT_DARK_MODE_SETTINGS,
      ...savedSettings
    }

    const currentHost = window.location.hostname
    // Strictly selective: only enabled if explicitly toggled ON for this website
    const shouldEnable = Boolean(settings.siteOverrides?.[currentHost])

    applyTheme(shouldEnable, settings)
  } catch (err) {
    console.error("[ForceDarkMode] Error checking settings:", err)
  }
}

// Watch storage changes in real-time
storage.watch({
  hub_dark_mode_settings: () => checkAndApply()
})

// Listen to direct messages for instant live preview and page theme queries
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING" || msg?.type === "PING_CONTENT_SCRIPT") {
    sendResponse({ status: "ready", tool: "force-dark-mode" })
    return true
  }

  if (msg?.type === "GET_PAGE_THEME") {
    storage.get<DarkModeSettings>("hub_dark_mode_settings").then((savedSettings) => {
      const settings = { ...DEFAULT_DARK_MODE_SETTINGS, ...savedSettings }
      const currentHost = window.location.hostname
      const isSiteEnabled = Boolean(settings.siteOverrides?.[currentHost])
      const nativeTheme = detectNativePageTheme()
      const targetMode = nativeTheme === "dark" ? "light" : "dark"

      sendResponse({
        nativeTheme,
        targetMode,
        isApplied: Boolean(document.getElementById(STYLE_ID)),
        isSiteEnabled
      })
    }).catch(() => {
      const nativeTheme = detectNativePageTheme()
      const targetMode = nativeTheme === "dark" ? "light" : "dark"
      sendResponse({
        nativeTheme,
        targetMode,
        isApplied: Boolean(document.getElementById(STYLE_ID)),
        isSiteEnabled: false
      })
    })
    return true
  }

  if (msg?.type === "TOGGLE_DARK_MODE" || msg?.type === "UPDATE_THEME_SETTINGS") {
    checkAndApply()
    sendResponse({ status: "updated" })
    return true
  }
})

// Observe DOM changes to react if website dynamically changes theme
let lastDetectedTheme = detectNativePageTheme()
const observer = new MutationObserver(() => {
  if (isMutatingByExtension) return
  const currentDetected = detectNativePageTheme()
  if (currentDetected !== lastDetectedTheme) {
    lastDetectedTheme = currentDetected
    checkAndApply()
  }
})

if (typeof document !== "undefined" && document.documentElement) {
  recordInitialState()
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dark", "class", "data-theme", "data-color-mode", "data-bs-theme", "theme"]
  })
}

// Run immediately on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    recordInitialState()
    checkAndApply()
  })
} else {
  recordInitialState()
  checkAndApply()
}
