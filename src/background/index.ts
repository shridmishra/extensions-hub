import { Storage } from "@plasmohq/storage"
import { activateInteractiveTool } from "../lib/storage"

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
})

// Listen to messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_TOOL") {
    const { toolId, tabId } = message.payload
    handleToolExecution(toolId, tabId)
      .then((res) => sendResponse({ success: true, result: res }))
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
})

async function handleToolExecution(toolId: string, targetTabId?: number) {
  let tabId = targetTabId
  if (!tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    tabId = tab?.id
  }

  if (!tabId) return

  if (toolId === "font-finder") {
    await activateInteractiveTool("font-finder")
    await chrome.tabs.sendMessage(tabId, { type: "START_FONT_FINDER" }).catch(() => {})
  } else if (toolId === "color-picker") {
    await activateInteractiveTool("color-picker")
    await chrome.tabs.sendMessage(tabId, { type: "START_COLOR_PICKER" }).catch(() => {})
  } else if (toolId === "css-picker") {
    await activateInteractiveTool("css-picker")
    await chrome.tabs.sendMessage(tabId, { type: "START_CSS_PICKER" }).catch(() => {})
  } else if (toolId === "figma-picker") {
    await activateInteractiveTool("figma-picker")
    await chrome.tabs.sendMessage(tabId, { type: "START_ELEMENT_SELECTION" }).catch(() => {})
  } else if (toolId === "force-dark-mode") {
    const current = (await storage.get<Record<string, boolean>>("hub_background_enabled")) || {}
    const nextState = !current["force-dark-mode"]
    current["force-dark-mode"] = nextState
    await storage.set("hub_background_enabled", current)
    await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_DARK_MODE", enabled: nextState }).catch(() => {})
  } else if (toolId === "yt-music-redirect") {
    const current = (await storage.get<Record<string, boolean>>("hub_background_enabled")) || {}
    const nextState = current["yt-music-redirect"] !== undefined ? !current["yt-music-redirect"] : false
    current["yt-music-redirect"] = nextState
    await storage.set("hub_background_enabled", current)
  }
}

