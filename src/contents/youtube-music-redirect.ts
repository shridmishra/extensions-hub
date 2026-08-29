import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { DEFAULT_YT_MUSIC_SETTINGS, type YtMusicSettings } from "../lib/storage"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.youtube.com/*",
    "https://youtube.com/*",
    "http://*.youtube.com/*",
    "http://youtube.com/*"
  ],
  run_at: "document_idle",
  all_frames: false
}

const storage = new Storage({ area: "local" })

const RIGHT_BTN_CLASS = "ytp-ytmusic-btn"
const ACTION_BAR_BTN_ID = "yt-action-bar-ytmusic-btn"
const TOAST_ID = "ytmusic-redirect-toast"
const STYLE_ID = "ytmusic-player-styles"

let settings: YtMusicSettings = { ...DEFAULT_YT_MUSIC_SETTINGS }

/**
 * Get current YouTube Video ID
 */
function getCurrentVideoId(): string | null {
  const searchParams = new URLSearchParams(window.location.search)
  const v = searchParams.get("v")
  if (v && v.length >= 11) return v

  const pathMatch = window.location.pathname.match(/\/(?:shorts|embed|v|live)\/([a-zA-Z0-9_-]{11})/)
  if (pathMatch && pathMatch[1]) return pathMatch[1]

  try {
    const moviePlayer = document.getElementById("movie_player") as any
    if (moviePlayer && typeof moviePlayer.getVideoData === "function") {
      const data = moviePlayer.getVideoData()
      if (data && data.video_id) return data.video_id
    }
  } catch (e) {}

  return null
}

/**
 * Get current video playback timestamp in whole seconds
 */
function getCurrentPlaybackTime(): number {
  const video = (document.querySelector("video.html5-main-video") ||
    document.querySelector("video")) as HTMLVideoElement | null
  if (video && !isNaN(video.currentTime) && video.currentTime > 0) {
    return Math.floor(video.currentTime)
  }

  try {
    const moviePlayer = document.getElementById("movie_player") as any
    if (moviePlayer && typeof moviePlayer.getCurrentTime === "function") {
      const time = moviePlayer.getCurrentTime()
      if (typeof time === "number" && !isNaN(time) && time > 0) return Math.floor(time)
    }
  } catch (e) {}

  return 0
}

/**
 * Build destination YouTube Music URL
 */
function buildYtMusicUrl(): string | null {
  const videoId = getCurrentVideoId()
  if (!videoId) return null

  const currentTime = getCurrentPlaybackTime()
  const searchParams = new URLSearchParams(window.location.search)
  const listId = searchParams.get("list")

  let url = `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}`

  if (settings.preserveTimestamp && currentTime > 0) {
    url += `&t=${currentTime}s`
  }

  if (settings.preservePlaylist && listId) {
    url += `&list=${encodeURIComponent(listId)}`
  }

  return url
}

/**
 * Display a floating toast notification
 */
function showToast(message: string) {
  const existing = document.getElementById(TOAST_ID)
  if (existing) existing.remove()

  const toast = document.createElement("div")
  toast.id = TOAST_ID
  toast.style.cssText = `
    position: fixed !important;
    bottom: 84px !important;
    left: 50% !important;
    transform: translateX(-50%) translateY(12px) scale(0.96) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 8px 16px !important;
    background: rgba(15, 15, 15, 0.95) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 9999px !important;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    opacity: 0 !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    pointer-events: none !important;
    backdrop-filter: blur(8px) !important;
  `
  toast.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;flex-shrink:0;border:1.5px solid #ffffff;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6,3 20,12 6,21"/></svg>
    </span>
    <span>${message}</span>
  `

  document.body.appendChild(toast)

  requestAnimationFrame(() => {
    toast.style.opacity = "1"
    toast.style.transform = "translateX(-50%) translateY(0) scale(1)"
  })

  setTimeout(() => {
    toast.style.opacity = "0"
    toast.style.transform = "translateX(-50%) translateY(10px) scale(0.96)"
    setTimeout(() => toast.remove(), 250)
  }, 2200)
}

/**
 * Execute redirection to YouTube Music
 */
function performRedirect(forceNewTab: boolean = false) {
  const targetUrl = buildYtMusicUrl()
  if (!targetUrl) {
    showToast("No active YouTube video found")
    return
  }

  // Pause playback
  if (settings.autoPause) {
    const video = (document.querySelector("video.html5-main-video") ||
      document.querySelector("video")) as HTMLVideoElement | null
    if (video && !video.paused) {
      video.pause()
    }
  }

  const shouldOpenNewTab = forceNewTab || settings.openInNewTab

  if (shouldOpenNewTab) {
    showToast("Opening in YouTube Music (New Tab)...")
    window.open(targetUrl, "_blank")
  } else {
    showToast("Opening in YouTube Music...")
    window.location.href = targetUrl
  }
}

/**
 * Inject dedicated CSS styles for player controls button and tooltip
 */
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return

  const styleEl = document.createElement("style")
  styleEl.id = STYLE_ID
  styleEl.textContent = `
    .ytp-ytmusic-btn {
      display: inline-block !important;
      vertical-align: top !important;
      width: 46px !important;
      height: 100% !important;
      cursor: pointer !important;
      background: transparent !important;
      border: none !important;
      outline: none !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 0.1s ease, opacity 0.1s ease !important;
      position: relative !important;
      opacity: 0.9 !important;
    }

    .ytp-ytmusic-btn:hover {
      transform: scale(1.15) !important;
      opacity: 1 !important;
    }

    .ytp-ytmusic-btn svg {
      width: 20px !important;
      height: 20px !important;
      display: block !important;
      pointer-events: none !important;
      transition: transform 0.15s ease !important;
    }

    .ytp-ytmusic-btn:hover svg {
      filter: brightness(1.15) !important;
    }

    /* YouTube Music Player Tooltip */
    .ytp-ytmusic-btn::after {
      content: "Switch to YouTube Music (Shift+M)";
      position: absolute;
      bottom: calc(100% + 15px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease;
      font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
    }

    .ytp-ytmusic-btn:hover::after {
      opacity: 1;
    }
  `

  if (document.head) {
    document.head.appendChild(styleEl)
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(styleEl)
    })
  }
}

/**
 * Create Player Controls Button Element matching paths technique
 */
function createTimelineButton(className: string): HTMLElement {
  const button = document.createElement("button")
  button.className = `ytp-button ${className}`
  button.setAttribute("type", "button")
  button.setAttribute("tabindex", "-1")
  button.setAttribute("aria-label", "Switch to YouTube Music (Shift+M)")

  // Clean, minimal monochrome music note icon matching player controls
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; pointer-events:none;">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="#ffffff" />
      <circle cx="18" cy="16" r="3" fill="#ffffff" />
    </svg>
  `

  button.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Default: Open in same tab directly (only open in new tab if ctrl/meta clicked)
    const forceNewTab = e.ctrlKey || e.metaKey
    performRedirect(forceNewTab)
  })

  return button
}

/**
 * Injects buttons into YouTube's Player DOM
 */
function checkAndInject() {
  injectStyles()

  // Clean up any legacy action bar button under video title if present
  const existingActionBarBtn = document.getElementById(ACTION_BAR_BTN_ID)
  if (existingActionBarBtn) existingActionBarBtn.remove()

  if (!settings.enabled) {
    const existingBtns = document.querySelectorAll(`.${RIGHT_BTN_CLASS}`)
    existingBtns.forEach((btn) => btn.remove())
    return
  }

  // Right Controls (beside Subtitles & Settings in the timeline)
  const rightControls = document.querySelector(".ytp-right-controls")
  if (rightControls && !rightControls.querySelector(`.${RIGHT_BTN_CLASS}`)) {
    const btn = createTimelineButton(RIGHT_BTN_CLASS)
    const subtitlesBtn = rightControls.querySelector(".ytp-subtitles-button")
    const settingsBtn = rightControls.querySelector(".ytp-settings-button")

    if (subtitlesBtn) {
      subtitlesBtn.insertAdjacentElement("beforebegin", btn)
    } else if (settingsBtn) {
      settingsBtn.insertAdjacentElement("beforebegin", btn)
    } else {
      rightControls.appendChild(btn)
    }
  }
}

// Intercept Shift+M keyboard shortcut
window.addEventListener(
  "keydown",
  (e: KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    const isEditable = (e.target as HTMLElement)?.isContentEditable
    if (targetTag === "input" || targetTag === "textarea" || isEditable) return

    if (e.shiftKey && (e.key === "M" || e.key === "m" || e.code === "KeyM")) {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
      performRedirect(false)
    }
  },
  true
)

function init() {
  injectStyles()

  // Load initial settings
  storage.get<YtMusicSettings>("hub_yt_music_settings").then((s) => {
    if (s) {
      settings = { ...DEFAULT_YT_MUSIC_SETTINGS, ...s }
      checkAndInject()
    }
  }).catch(() => {})

  // Listen to changes in settings
  storage.watch({
    hub_yt_music_settings: (val: any) => {
      if (val?.newValue) {
        settings = { ...settings, ...val.newValue }
        checkAndInject()
      }
    },
    hub_background_enabled: (val: any) => {
      if (val?.newValue && typeof val.newValue["yt-music-redirect"] === "boolean") {
        settings.enabled = val.newValue["yt-music-redirect"]
        checkAndInject()
      }
    }
  })

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hub_yt_music_settings?.newValue) {
      settings = { ...settings, ...changes.hub_yt_music_settings.newValue }
      checkAndInject()
    }
    if (changes.hub_background_enabled?.newValue) {
      if (typeof changes.hub_background_enabled.newValue["yt-music-redirect"] === "boolean") {
        settings.enabled = changes.hub_background_enabled.newValue["yt-music-redirect"]
        checkAndInject()
      }
    }
  })

  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "PING" || msg?.type === "PING_CONTENT_SCRIPT") {
      sendResponse({ status: "ready", tool: "yt-music-redirect" })
      return true
    }
    if (msg?.type === "UPDATE_YT_MUSIC_SETTINGS" || msg?.type === "TOGGLE_YT_MUSIC") {
      checkAndInject()
      sendResponse({ success: true })
      return true
    }
  })

  // Hook YouTube SPA navigation events
  window.addEventListener("yt-navigate-finish", () => {
    setTimeout(checkAndInject, 100)
    setTimeout(checkAndInject, 500)
  })
  window.addEventListener("yt-page-data-updated", () => {
    setTimeout(checkAndInject, 100)
    setTimeout(checkAndInject, 500)
  })
  window.addEventListener("spfdone", checkAndInject)
  window.addEventListener("popstate", checkAndInject)
  window.addEventListener("DOMContentLoaded", checkAndInject)
  window.addEventListener("load", checkAndInject)

  // Observe DOM changes on YouTube's player container
  if (document.body) {
    const observer = new MutationObserver(() => {
      checkAndInject()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  // Periodic heartbeat check
  setInterval(checkAndInject, 1500)

  // Initial trigger
  checkAndInject()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
