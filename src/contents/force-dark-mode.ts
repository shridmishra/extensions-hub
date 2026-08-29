import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_start"
}

const storage = new Storage({ area: "local" })

const STYLE_ID = "hub-force-theme-style"

const DARK_CSS = `
  html {
    filter: invert(0.92) hue-rotate(180deg) contrast(0.96) !important;
    background-color: #121214 !important;
  }
  
  /* Protect media and images from being inverted */
  img, 
  video, 
  canvas, 
  picture, 
  iframe,
  embed,
  object,
  [style*="background-image"],
  [role="img"],
  svg:not(.hub-invertible-svg) {
    filter: invert(1) hue-rotate(180deg) !important;
  }

  /* Keep shadow roots and extension UI clean */
  plasmo-csui, .hub-extension-root {
    filter: invert(1) hue-rotate(180deg) !important;
  }
`

const LIGHT_CSS = `
  html {
    background-color: #ffffff !important;
    color: #111111 !important;
  }
`

function applyTheme(enabled: boolean, mode: "dark" | "light" = "dark") {
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

  styleEl.textContent = mode === "dark" ? DARK_CSS : LIGHT_CSS
}

// Initial check
async function checkAndApply() {
  try {
    const bgEnabled = await storage.get<Record<string, boolean>>("hub_background_enabled")
    const isDarkModeActive = !!bgEnabled?.["force-dark-mode"]

    const settings = await storage.get<{
      mode: "dark" | "light"
      globalEnabled: boolean
      siteOverrides: Record<string, boolean>
    }>("hub_dark_mode_settings")

    const currentHost = window.location.hostname
    const siteOverride = settings?.siteOverrides?.[currentHost]

    // Determine final status
    const shouldEnable = siteOverride !== undefined ? siteOverride : isDarkModeActive
    const mode = settings?.mode || "dark"

    applyTheme(shouldEnable, mode)
  } catch (err) {
    console.error("[ForceDarkMode] Error checking settings:", err)
  }
}

// Watch storage changes in real-time
storage.watch({
  hub_background_enabled: () => checkAndApply(),
  hub_dark_mode_settings: () => checkAndApply()
})

// Listen to direct messages for instant tab preview
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "TOGGLE_DARK_MODE") {
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
