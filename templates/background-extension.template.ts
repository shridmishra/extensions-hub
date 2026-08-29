import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

/**
 * Configure which pages this background micro-extension runs on.
 */
export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_idle"
}

const storage = new Storage({ area: "local" })

const EXTENSION_ID = "__EXTENSION_ID__"

/**
 * Performs your background logic or DOM modification when enabled.
 */
function applyExtensionFeature(isEnabled: boolean) {
  if (!isEnabled) {
    // Cleanup any styles, listeners, or DOM injections
    return
  }

  // Execute background capability
  console.log(`[${EXTENSION_ID}] Active on`, window.location.href)
}

/**
 * Checks storage and runs or tears down extension feature.
 */
async function checkAndApply() {
  try {
    const bgEnabled = await storage.get<Record<string, boolean>>("hub_background_enabled")
    const isEnabled = !!bgEnabled?.[EXTENSION_ID]
    applyExtensionFeature(isEnabled)
  } catch (err) {
    console.error(`[${EXTENSION_ID}] Error reading storage state:`, err)
  }
}

// Watch storage state in real-time
storage.watch({
  hub_background_enabled: () => checkAndApply()
})

// Listen to direct toggle messages from Popup
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "TOGGLE___EXTENSION_UPPER_ID__") {
    checkAndApply()
    sendResponse({ status: "ok" })
  }
})

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkAndApply)
} else {
  checkAndApply()
}
