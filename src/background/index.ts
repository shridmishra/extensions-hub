import { Storage } from "@plasmohq/storage"
import { launchExtension, injectContentScriptsIntoAllTabs } from "../lib/tool-launcher"

const storage = new Storage({ area: "local" })

// Handle extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  const existingPinned = await storage.get<string[]>("hub_pinned_ids")
  if (!existingPinned) {
    await storage.set("hub_pinned_ids", [
      "font-finder",
      "color-picker",
      "yt-music-redirect",
      "css-picker",
      "figma-picker"
    ])
  }

  // Inject content scripts into all pre-existing open tabs
  await injectContentScriptsIntoAllTabs()
})

// Listen to messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_TOOL") {
    const { toolId, tabId } = message.payload || {}
    launchExtension(toolId, { tabId })
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err?.message }))
    return true
  }

  if (message.type === "FETCH_IMAGE_DATA_URL") {
    fetch(message.url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => sendResponse({ success: true, dataUrl: reader.result })
        reader.onerror = () => sendResponse({ success: false })
        reader.readAsDataURL(blob)
      })
      .catch(() => sendResponse({ success: false }))
    return true
  }

  if (message.type === "CAPTURE_VISIBLE_TAB") {
    const windowId = sender.tab?.windowId
    const format = message.format === "jpeg" || message.format === "jpg" ? "jpeg" : "png"
    const quality = typeof message.quality === "number" ? message.quality : 95
    const captureOptions = {
      format: format as "png" | "jpeg",
      ...(format === "jpeg" ? { quality } : {})
    }

    try {
      chrome.tabs.captureVisibleTab(windowId as any, captureOptions, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError?.message || "Failed to capture tab"
          })
        } else {
          sendResponse({ success: true, dataUrl })
        }
      })
    } catch (err: any) {
      sendResponse({ success: false, error: err?.message || "Exception capturing tab" })
    }
    return true
  }
})

