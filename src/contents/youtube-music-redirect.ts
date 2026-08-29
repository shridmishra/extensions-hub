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
  run_at: "document_start",
  all_frames: false
}

const storage = new Storage({ area: "local" })

const RIGHT_BTN_CLASS = "ytp-ytmusic-btn"
const LEFT_BTN_CLASS = "ytp-ytmusic-left-btn"
const ACTION_BAR_BTN_ID = "yt-action-bar-ytmusic-btn"
const TOAST_ID = "ytmusic-redirect-toast"

let settings: YtMusicSettings = { ...DEFAULT_YT_MUSIC_SETTINGS }

// Load settings asynchronously without blocking synchronous injection
storage.get<YtMusicSettings>("hub_yt_music_settings").then((s) => {
  if (s) settings = { ...DEFAULT_YT_MUSIC_SETTINGS, ...s }
}).catch(() => {})

storage.watch({
  hub_yt_music_settings: (val: any) => {
    if (val?.newValue) settings = { ...settings, ...val.newValue }
  }
})

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
    <span style="display:flex;align-items:center;justify-content:center;width:14px;height:14px;background:#ff0000;border-radius:50%;flex-shrink:0;">
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
    showToast("Redirecting to YouTube Music...")
    window.location.href = targetUrl
  }
}

/**
 * Create Player Controls Button Element
 */
function createTimelineButton(className: string): HTMLElement {
  const button = document.createElement("button")
  button.className = `ytp-button ${className}`
  button.setAttribute("aria-label", "Switch to YouTube Music (Shift+M)")
  button.setAttribute("title", "Switch to YouTube Music (Shift+M)")

  button.style.cssText = `
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 48px !important;
    min-width: 40px !important;
    height: 100% !important;
    min-height: 36px !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
    cursor: pointer !important;
    vertical-align: top !important;
    position: relative !important;
    opacity: 0.9 !important;
    transition: opacity 0.15s ease, transform 0.12s ease !important;
    flex-shrink: 0 !important;
    user-select: none !important;
    z-index: 20 !important;
  `

  button.innerHTML = `
    <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" style="display:block; pointer-events:none;">
      <!-- Outer white ring -->
      <path d="M18 4C10.27 4 4 10.27 4 18s6.27 14 14 14 14-6.27 14-14S25.73 4 18 4zm0 25.5c-6.34 0-11.5-5.16-11.5-11.5S11.66 6.5 18 6.5s11.5 5.16 11.5 11.5-5.16 11.5-11.5 11.5z" fill="#ffffff" opacity="0.95"></path>
      <!-- Inner red disc -->
      <circle cx="18" cy="18" r="8.5" fill="#ff0000"></circle>
      <!-- Play triangle -->
      <polygon points="16,13.5 22,18 16,22.5" fill="#ffffff"></polygon>
    </svg>
  `

  button.addEventListener("mouseenter", () => {
    button.style.opacity = "1"
    button.style.transform = "scale(1.1)"
  })

  button.addEventListener("mouseleave", () => {
    button.style.opacity = "0.9"
    button.style.transform = "scale(1)"
  })

  button.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    performRedirect(e.ctrlKey || e.metaKey || e.shiftKey)
  })

  return button
}

/**
 * Injects buttons into YouTube's DOM
 */
function checkAndInject() {
  const moviePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player")

  // 1. Right Controls (beside Settings and CC)
  const rightControls = moviePlayer
    ? moviePlayer.querySelector(".ytp-right-controls")
    : document.querySelector(".ytp-right-controls")

  if (rightControls && !rightControls.querySelector(`.${RIGHT_BTN_CLASS}`)) {
    const btn = createTimelineButton(RIGHT_BTN_CLASS)
    const settingsBtn = rightControls.querySelector(".ytp-settings-button")
    const subtitlesBtn = rightControls.querySelector(".ytp-subtitles-button")
    const anchor = settingsBtn || subtitlesBtn || rightControls.firstChild

    if (anchor) {
      rightControls.insertBefore(btn, anchor)
    } else {
      rightControls.appendChild(btn)
    }
  }

  // 2. Left Controls (beside time display)
  const leftControls = moviePlayer
    ? moviePlayer.querySelector(".ytp-left-controls")
    : document.querySelector(".ytp-left-controls")

  if (leftControls && !leftControls.querySelector(`.${LEFT_BTN_CLASS}`)) {
    const btn = createTimelineButton(LEFT_BTN_CLASS)
    const timeDisplay = leftControls.querySelector(".ytp-time-display")

    if (timeDisplay && timeDisplay.nextSibling) {
      leftControls.insertBefore(btn, timeDisplay.nextSibling)
    } else {
      leftControls.appendChild(btn)
    }
  }

  // 3. Action Bar under video title
  if (window.location.pathname.includes("/watch")) {
    const actionsMenu = document.querySelector(
      "ytd-watch-metadata #actions #top-level-buttons-computed, #top-level-buttons-computed"
    )

    if (actionsMenu && !document.getElementById(ACTION_BAR_BTN_ID)) {
      const actionBtn = document.createElement("div")
      actionBtn.id = ACTION_BAR_BTN_ID
      actionBtn.setAttribute("title", "Open in YouTube Music (Shift+M)")
      actionBtn.style.cssText = `
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        height: 36px !important;
        padding: 0 14px !important;
        margin-right: 8px !important;
        border-radius: 18px !important;
        background: rgba(255, 255, 255, 0.12) !important;
        color: var(--yt-spec-text-primary, #ffffff) !important;
        font-family: "Roboto", -apple-system, sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: background 0.15s ease, transform 0.1s ease !important;
        vertical-align: middle !important;
      `

      actionBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
          <circle cx="12" cy="12" r="9.5" fill="#ff0000" stroke="#ffffff" stroke-width="1.2" />
          <polygon points="10,8 16,12 10,16" fill="#ffffff" />
        </svg>
        <span style="font-size:13px; font-weight:600; letter-spacing: -0.01em;">YT Music</span>
      `

      actionBtn.addEventListener("mouseenter", () => {
        actionBtn.style.background = "rgba(255, 255, 255, 0.22)"
      })

      actionBtn.addEventListener("mouseleave", () => {
        actionBtn.style.background = "rgba(255, 255, 255, 0.12)"
      })

      actionBtn.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        performRedirect(e.ctrlKey || e.metaKey || e.shiftKey)
      })

      if (actionsMenu.firstChild) {
        actionsMenu.insertBefore(actionBtn, actionsMenu.firstChild)
      } else {
        actionsMenu.appendChild(actionBtn)
      }
    }
  }
}

// Intercept Shift+M on capture phase
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

// Run continuously with lightweight interval
setInterval(checkAndInject, 300)

window.addEventListener("yt-navigate-finish", checkAndInject)
window.addEventListener("yt-page-data-updated", checkAndInject)
window.addEventListener("DOMContentLoaded", checkAndInject)
window.addEventListener("load", checkAndInject)

if (document.body) {
  const observer = new MutationObserver(checkAndInject)
  observer.observe(document.body, { childList: true, subtree: true })
} else {
  document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(checkAndInject)
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

checkAndInject()
