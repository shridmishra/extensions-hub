import { activateInteractiveTool, INTERACTIVE_TOOLS, ExtensionStorage } from "./storage.ts"

export const TOOL_MESSAGE_MAP: Record<string, string> = {
  "font-finder": "START_FONT_FINDER",
  "color-picker": "START_COLOR_PICKER",
  "css-picker": "START_CSS_PICKER",
  "figma-picker": "START_ELEMENT_SELECTION",
  "page-ruler": "START_PAGE_RULER",
  "link-grabber": "START_LINK_GRABBER"
}

/**
 * Checks whether a tab's URL supports content script injection.
 * Restricts browser internal protocols, Web Store, and file pages.
 */
export function isSupportedTab(url?: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  if (
    lower.startsWith("chrome://") ||
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("about:") ||
    lower.startsWith("view-source:") ||
    lower.startsWith("devtools://") ||
    lower.includes("chromewebstore.google.com") ||
    lower.includes("chrome.google.com/webstore")
  ) {
    return false
  }
  return lower.startsWith("http://") || lower.startsWith("https://")
}

/**
 * Pings a tab to check if content scripts are active and responsive.
 */
export async function isContentScriptReady(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "PING" })
    return response?.status === "ready" || response?.success === true || Boolean(response)
  } catch {
    return false
  }
}

/**
 * Programmatically injects all manifest content scripts into a specific tab
 * if they are not already loaded.
 */
export async function ensureContentScriptsInjected(tabId: number, url?: string): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.runtime?.getManifest || !chrome.scripting?.executeScript) {
    return false
  }

  if (url && !isSupportedTab(url)) {
    return false
  }

  const isReady = await isContentScriptReady(tabId)
  if (isReady) {
    return true
  }

  try {
    const manifest = chrome.runtime.getManifest()
    const contentScripts = manifest.content_scripts || []

    for (const cs of contentScripts) {
      if (cs.js && cs.js.length > 0) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: cs.js
          })
        } catch (scriptErr) {
          // Log softly as some frames or sub-origins may restrict injection
          console.debug(`[Hub] Script injection notice for tab ${tabId}:`, scriptErr)
        }
      }
    }

    // Brief stabilization window for React/Plasmo CSUI initialization
    await new Promise((resolve) => setTimeout(resolve, 80))
    return true
  } catch (err) {
    console.warn(`[Hub] Failed to inject content scripts into tab ${tabId}:`, err)
    return false
  }
}

/**
 * Injects all manifest content scripts into all open tabs matching http/https.
 * Intended to be called on extension installation or update in background service worker.
 */
export async function injectContentScriptsIntoAllTabs(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.scripting?.executeScript) {
    return
  }

  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] })
    const manifest = chrome.runtime.getManifest()
    const contentScripts = manifest.content_scripts || []

    for (const tab of tabs) {
      if (tab.id && isSupportedTab(tab.url)) {
        for (const cs of contentScripts) {
          if (cs.js && cs.js.length > 0) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: cs.js
              })
            } catch {
              // Ignore tabs that are uninjectable or discardable
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Hub] Failed to batch inject content scripts into existing tabs:", err)
  }
}

export interface LaunchExtensionOptions {
  tabId?: number
  closePopup?: boolean
}

/**
 * Universal launcher for any extension (interactive on-page tools or background tools).
 * Guarantees content script readiness, mutual exclusion, storage sync, and instant messaging.
 */
export async function launchExtension(
  extensionId: string,
  options?: LaunchExtensionOptions
): Promise<{ success: boolean; reason?: string }> {
  try {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      return { success: false, reason: "Chrome extension API not available" }
    }

    let tabId = options?.tabId
    let tabUrl: string | undefined

    if (!tabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      tabId = activeTab?.id
      tabUrl = activeTab?.url
    } else {
      const tab = await chrome.tabs.get(tabId).catch(() => null)
      tabUrl = tab?.url
    }

    if (!tabId) {
      return { success: false, reason: "No active tab found" }
    }

    if (!isSupportedTab(tabUrl)) {
      return { success: false, reason: "Extension cannot run on internal or restricted browser pages" }
    }

    const isInteractive =
      Boolean(INTERACTIVE_TOOLS[extensionId]) ||
      extensionId.includes("picker") ||
      extensionId.includes("finder") ||
      extensionId.includes("ruler") ||
      extensionId.includes("debugger") ||
      extensionId.includes("grabber") ||
      extensionId.includes("inspector")

    // 1. Interactive On-Page Inspection Tools
    if (isInteractive) {
      // Enforce mutual exclusion in storage
      await activateInteractiveTool(extensionId)

      // Ensure content scripts are injected and listening
      await ensureContentScriptsInjected(tabId, tabUrl)

      // Derive action message
      const msgType =
        TOOL_MESSAGE_MAP[extensionId] ||
        `START_${extensionId.toUpperCase().replace(/-/g, "_")}`

      try {
        await chrome.tabs.sendMessage(tabId, { type: msgType, toolId: extensionId })
      } catch (err) {
        // Fallback retry after secondary injection
        console.warn(`[Hub] Primary message delivery missed, executing fallback injection:`, err)
        await ensureContentScriptsInjected(tabId, tabUrl)
        await chrome.tabs.sendMessage(tabId, { type: msgType, toolId: extensionId }).catch(() => {})
      }

      if (options?.closePopup && typeof window !== "undefined" && window.close) {
        window.close()
      }

      return { success: true }
    }

    // 2. Background Tools (Force Dark Mode, YouTube Redirect, etc.)
    if (extensionId === "force-dark-mode") {
      let hostname = ""
      if (tabUrl) {
        try {
          hostname = new URL(tabUrl).hostname
        } catch {}
      }
      if (hostname) {
        const isCurrentlyEnabled = await ExtensionStorage.isSiteDarkModeEnabled(hostname)
        const nextState = !isCurrentlyEnabled
        await ExtensionStorage.setSiteDarkMode(hostname, nextState)
        await ensureContentScriptsInjected(tabId, tabUrl)
        await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_DARK_MODE", enabled: nextState }).catch(() => {})
      }
      return { success: true }
    }

    if (extensionId === "yt-music-redirect") {
      const current = await ExtensionStorage.getBackgroundEnabled()
      const nextState = current["yt-music-redirect"] !== undefined ? !current["yt-music-redirect"] : false
      await ExtensionStorage.setBackgroundExtensionEnabled("yt-music-redirect", nextState)

      return { success: true }
    }

    // 3. Generic / Future Tool Dispatch
    await ensureContentScriptsInjected(tabId, tabUrl)
    await chrome.tabs.sendMessage(tabId, { type: "EXECUTE_TOOL", toolId: extensionId }).catch(() => {})

    return { success: true }
  } catch (err: any) {
    console.error("[Hub] Failed to launch extension:", err)
    return { success: false, reason: err?.message || "Unknown error occurred" }
  }
}
