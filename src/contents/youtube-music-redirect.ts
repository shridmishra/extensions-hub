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

const RIGHT_BUTTON_CLASS = "ytp-ytmusic-right-btn"
const LEFT_BUTTON_CLASS = "ytp-ytmusic-left-btn"
const FLOATING_BTN_ID = "yt-player-ytmusic-floating-btn"
const ACTION_BAR_BTN_ID = "yt-action-bar-ytmusic-btn"
const SHORT_BUTTON_ID = "yt-shorts-ytmusic-redirect-btn"
const TOAST_ID = "ytmusic-redirect-toast"
const STYLE_TAG_ID = "ytmusic-redirect-injected-styles"

let currentSettings: YtMusicSettings = { ...DEFAULT_YT_MUSIC_SETTINGS }
let isInitialized = false

// Standalone High-Contrast YouTube Music SVG (visible on dark and light videos)
const YTMUSIC_PLAYER_SVG = `
<svg viewBox="0 0 36 36" width="28" height="28" xmlns="http://www.w3.org/2000/svg" style="width: 28px !important; height: 28px !important; display: block !important; pointer-events: none !important; margin: auto !important; visibility: visible !important;">
  <!-- Outer white outline ring -->
  <circle cx="18" cy="18" r="14" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.95" />
  <!-- Inner red disc -->
  <circle cx="18" cy="18" r="8.5" fill="#ff0000" stroke="#ffffff" stroke-width="1.2" />
  <!-- White play triangle -->
  <polygon points="16,13.5 22,18 16,22.5" fill="#ffffff" />
</svg>
`

const YTMUSIC_ACTION_BAR_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
  <circle cx="12" cy="12" r="9.5" fill="#ff0000" stroke="#ffffff" stroke-width="1.2" />
  <polygon points="10,8 16,12 10,16" fill="#ffffff" />
</svg>
`

const YTMUSIC_MINI_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#ff0000" stroke="none"/>
  <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="1.5"/>
  <polygon points="10,8 16,12 10,16" fill="#ffffff" stroke="none"/>
</svg>
`

/**
 * Ensure global CSS styles are injected into document
 */
function ensureGlobalStyles() {
  if (document.getElementById(STYLE_TAG_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_TAG_ID
  style.textContent = `
    .ytp-ytmusic-right-btn,
    .ytp-ytmusic-left-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 44px !important;
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
      opacity: 0.95 !important;
      transition: opacity 0.15s ease, transform 0.12s ease !important;
      color: #ffffff !important;
      flex-shrink: 0 !important;
      user-select: none !important;
      z-index: 9999 !important;
      visibility: visible !important;
    }
    .ytp-ytmusic-right-btn:hover,
    .ytp-ytmusic-left-btn:hover {
      opacity: 1 !important;
      transform: scale(1.1) !important;
    }
    .ytp-ytmusic-right-btn svg,
    .ytp-ytmusic-left-btn svg {
      width: 28px !important;
      height: 28px !important;
      display: block !important;
      pointer-events: none !important;
    }
    #yt-player-ytmusic-floating-btn {
      position: absolute !important;
      top: 14px !important;
      right: 14px !important;
      z-index: 2147483646 !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 6px 12px 6px 8px !important;
      background: rgba(18, 18, 20, 0.85) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 9999px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
      font-family: "Roboto", -apple-system, sans-serif !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: -0.01em !important;
      cursor: pointer !important;
      user-select: none !important;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
      backdrop-filter: blur(8px) !important;
      opacity: 0.9 !important;
    }
    #yt-player-ytmusic-floating-btn:hover {
      opacity: 1 !important;
      transform: scale(1.05) !important;
      background: rgba(25, 25, 30, 0.95) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
    }
    .yt-action-bar-ytmusic-btn {
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
      z-index: 999 !important;
    }
    .yt-action-bar-ytmusic-btn:hover {
      background: rgba(255, 255, 255, 0.22) !important;
    }
  `

  if (document.head) {
    document.head.appendChild(style)
  } else if (document.documentElement) {
    document.documentElement.appendChild(style)
  }
}

/**
 * Robustly extract current YouTube Video ID from URL, Shorts path, or Player API
 */
function getCurrentVideoId(): string | null {
  // 1. Standard watch URL query parameter
  const searchParams = new URLSearchParams(window.location.search)
  const v = searchParams.get("v")
  if (v && v.length >= 11) return v

  // 2. YouTube Shorts or Embed or v path (/shorts/ID, /embed/ID, /v/ID)
  const pathMatch = window.location.pathname.match(/\/(?:shorts|embed|v|live)\/([a-zA-Z0-9_-]{11})/)
  if (pathMatch && pathMatch[1]) return pathMatch[1]

  // 3. YouTube Player JavaScript API
  try {
    const moviePlayer = document.getElementById("movie_player") as any
    if (moviePlayer && typeof moviePlayer.getVideoData === "function") {
      const data = moviePlayer.getVideoData()
      if (data && data.video_id && data.video_id.length >= 11) {
        return data.video_id
      }
    }
  } catch (e) {
    // ignore
  }

  // 4. Watch flexy container attribute
  const watchFlexy = document.querySelector("ytd-watch-flexy")
  if (watchFlexy) {
    const attrId = watchFlexy.getAttribute("video-id")
    if (attrId && attrId.length >= 11) return attrId
  }

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
      if (typeof time === "number" && !isNaN(time) && time > 0) {
        return Math.floor(time)
      }
    }
  } catch (e) {
    // ignore
  }

  return 0
}

/**
 * Build destination YouTube Music URL (clean URL)
 */
function buildYtMusicUrl(videoId: string, currentTime: number, listId: string | null, settings: YtMusicSettings): string {
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
function showRedirectToast(message: string) {
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
  const videoId = getCurrentVideoId()

  if (!videoId) {
    showRedirectToast("No active YouTube video found")
    return
  }

  const currentTime = getCurrentPlaybackTime()
  const searchParams = new URLSearchParams(window.location.search)
  const listId = searchParams.get("list")

  const targetUrl = buildYtMusicUrl(videoId, currentTime, listId, currentSettings)

  // Pause playback to prevent overlap audio
  if (currentSettings.autoPause) {
    const video = (document.querySelector("video.html5-main-video") ||
      document.querySelector("video")) as HTMLVideoElement | null
    if (video && !video.paused) {
      video.pause()
    }
  }

  const shouldOpenNewTab = forceNewTab || currentSettings.openInNewTab

  if (shouldOpenNewTab) {
    showRedirectToast("Opening in YouTube Music (New Tab)...")
    window.open(targetUrl, "_blank")
  } else {
    showRedirectToast("Redirecting to YouTube Music...")
    window.location.href = targetUrl
  }
}

/**
 * Creates a YouTube Player button element with explicit inline styling
 */
function createPlayerButton(className: string): HTMLElement {
  const button = document.createElement("button")
  button.className = className
  button.setAttribute("aria-label", "Switch to YouTube Music (Shift+M)")
  button.setAttribute("title", "Switch to YouTube Music (Shift+M)")
  button.setAttribute("data-tooltip-target-id", "ytp-ytmusic-btn")

  button.style.cssText = `
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 44px !important;
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
    opacity: 0.95 !important;
    transition: opacity 0.15s ease, transform 0.12s ease !important;
    color: #ffffff !important;
    flex-shrink: 0 !important;
    user-select: none !important;
    z-index: 9999 !important;
    visibility: visible !important;
  `

  button.innerHTML = YTMUSIC_PLAYER_SVG

  button.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    button.style.transform = "scale(0.92)"
    setTimeout(() => {
      button.style.transform = "scale(1)"
    }, 120)

    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey
    performRedirect(isModifier)
  })

  return button
}

/**
 * Injects the YouTube Music button into Right Player Controls
 */
function injectRightControls() {
  if (currentSettings.enabled === false) return

  const moviePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player")
  const containers: Element[] = []

  if (moviePlayer) {
    const rc = moviePlayer.querySelector(".ytp-right-controls")
    if (rc) containers.push(rc)
  }

  document.querySelectorAll(".ytp-right-controls").forEach((c) => {
    if (!containers.includes(c)) containers.push(c)
  })

  containers.forEach((container) => {
    if (container.querySelector(`.${RIGHT_BUTTON_CLASS}`)) return

    const button = createPlayerButton(RIGHT_BUTTON_CLASS)

    const settingsBtn = container.querySelector(".ytp-settings-button")
    const subtitlesBtn = container.querySelector(".ytp-subtitles-button")
    const anchor = settingsBtn || subtitlesBtn || container.firstChild

    if (anchor) {
      container.insertBefore(button, anchor)
    } else {
      container.appendChild(button)
    }
  })
}

/**
 * Injects the YouTube Music button into Left Player Controls (beside time display)
 */
function injectLeftControls() {
  if (currentSettings.enabled === false) return

  const moviePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player")
  const containers: Element[] = []

  if (moviePlayer) {
    const lc = moviePlayer.querySelector(".ytp-left-controls")
    if (lc) containers.push(lc)
  }

  document.querySelectorAll(".ytp-left-controls").forEach((c) => {
    if (!containers.includes(c)) containers.push(c)
  })

  containers.forEach((container) => {
    if (container.querySelector(`.${LEFT_BUTTON_CLASS}`)) return

    const button = createPlayerButton(LEFT_BUTTON_CLASS)

    const timeDisplay = container.querySelector(".ytp-time-display")
    if (timeDisplay && timeDisplay.nextSibling) {
      container.insertBefore(button, timeDisplay.nextSibling)
    } else {
      container.appendChild(button)
    }
  })
}

/**
 * Injects Floating Switcher Button directly on video player top-right corner
 */
function injectFloatingPlayerButton() {
  if (currentSettings.enabled === false) return
  if (!window.location.pathname.includes("/watch")) return

  const moviePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player")
  if (!moviePlayer) return

  if (moviePlayer.querySelector(`#${FLOATING_BTN_ID}`)) return

  const floatBtn = document.createElement("div")
  floatBtn.id = FLOATING_BTN_ID
  floatBtn.setAttribute("title", "Switch to YouTube Music (Shift+M)")

  floatBtn.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;background:#ff0000;border-radius:50%;flex-shrink:0;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6,3 20,12 6,21"/></svg>
    </span>
    <span>YT Music</span>
  `

  floatBtn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    floatBtn.style.transform = "scale(0.95)"
    setTimeout(() => {
      floatBtn.style.transform = "scale(1)"
    }, 100)

    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey
    performRedirect(isModifier)
  })

  moviePlayer.appendChild(floatBtn)
}

/**
 * Injects YouTube Music button into the Action Bar under video title
 */
function injectActionBarButton() {
  if (currentSettings.enabled === false) return
  if (!window.location.pathname.includes("/watch")) return

  const actionsMenu = document.querySelector(
    "ytd-watch-metadata #actions #top-level-buttons-computed, ytd-menu-renderer #top-level-buttons-computed, #top-level-buttons-computed, ytd-watch-metadata ytd-menu-renderer"
  )
  if (!actionsMenu) return

  if (document.getElementById(ACTION_BAR_BTN_ID)) return

  const actionBtn = document.createElement("div")
  actionBtn.id = ACTION_BAR_BTN_ID
  actionBtn.className = "yt-action-bar-ytmusic-btn"
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
    z-index: 999 !important;
  `

  actionBtn.innerHTML = `
    ${YTMUSIC_ACTION_BAR_SVG}
    <span style="font-size:13px; font-weight:600; letter-spacing: -0.01em;">YT Music</span>
  `

  actionBtn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    actionBtn.style.transform = "scale(0.95)"
    setTimeout(() => {
      actionBtn.style.transform = "scale(1)"
    }, 100)

    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey
    performRedirect(isModifier)
  })

  // Insert at beginning of action buttons
  if (actionsMenu.firstChild) {
    actionsMenu.insertBefore(actionBtn, actionsMenu.firstChild)
  } else {
    actionsMenu.appendChild(actionBtn)
  }
}

/**
 * Injects redirect button for YouTube Shorts
 */
function injectShortsButton() {
  if (currentSettings.enabled === false) return
  if (!window.location.pathname.includes("/shorts/")) return

  const actionsContainer = document.querySelector(
    "ytd-reel-video-renderer[is-active] #actions, ytd-reel-player-header-renderer, #actions.ytd-reel-player-overlay-renderer"
  )
  if (!actionsContainer) return

  if (document.getElementById(SHORT_BUTTON_ID)) return

  const shortsBtn = document.createElement("div")
  shortsBtn.id = SHORT_BUTTON_ID
  shortsBtn.setAttribute("title", "Open in YouTube Music")
  shortsBtn.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    cursor: pointer;
    user-select: none;
    transition: transform 0.15s ease;
  `

  shortsBtn.innerHTML = `
    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.15);">
      ${YTMUSIC_MINI_SVG}
    </div>
    <span style="color: #ffffff; font-size: 10px; font-weight: 700; margin-top: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">YT Music</span>
  `

  shortsBtn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey
    performRedirect(isModifier)
  })

  actionsContainer.appendChild(shortsBtn)
}

/**
 * Clean up all injected buttons
 */
function removeInjectedButtons() {
  document.querySelectorAll(`.${RIGHT_BUTTON_CLASS}`).forEach((el) => el.remove())
  document.querySelectorAll(`.${LEFT_BUTTON_CLASS}`).forEach((el) => el.remove())
  document.querySelectorAll(`#${FLOATING_BTN_ID}`).forEach((el) => el.remove())
  document.querySelectorAll(`#${ACTION_BAR_BTN_ID}`).forEach((el) => el.remove())
  document.querySelectorAll(`#${SHORT_BUTTON_ID}`).forEach((el) => el.remove())
}

/**
 * Perform full injection sweep
 */
function runInjectionSweep() {
  ensureGlobalStyles()
  injectRightControls()
  injectLeftControls()
  injectFloatingPlayerButton()
  injectActionBarButton()
  injectShortsButton()
}

/**
 * Handle initial setup and dynamic YouTube SPA changes
 */
function init() {
  if (isInitialized) return
  isInitialized = true

  // 1. Immediate synchronous run
  runInjectionSweep()

  // 2. Load stored settings asynchronously
  storage.get<Record<string, boolean>>("hub_background_enabled").then((bgEnabled) => {
    storage.get<YtMusicSettings>("hub_yt_music_settings").then((savedSettings) => {
      currentSettings = {
        ...DEFAULT_YT_MUSIC_SETTINGS,
        ...(savedSettings || {})
      }

      // Default to true unless explicitly disabled
      if (bgEnabled && bgEnabled["yt-music-redirect"] !== undefined) {
        currentSettings.enabled = bgEnabled["yt-music-redirect"]
      }

      runInjectionSweep()
    }).catch(() => {})
  }).catch(() => {})

  // 3. YouTube SPA lifecycle hooks
  const onPageChange = () => {
    runInjectionSweep()
    setTimeout(runInjectionSweep, 150)
    setTimeout(runInjectionSweep, 400)
    setTimeout(runInjectionSweep, 800)
    setTimeout(runInjectionSweep, 1500)
  }

  window.addEventListener("yt-navigate-finish", onPageChange)
  window.addEventListener("yt-page-data-updated", onPageChange)
  window.addEventListener("spfdone", onPageChange)
  window.addEventListener("popstate", onPageChange)
  window.addEventListener("load", onPageChange)

  // 4. Keyboard Shortcut listener on CAPTURE phase to intercept before YouTube's native Mute handler
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
    true // Capture phase
  )

  // 5. Periodic polling safeguard
  setInterval(() => {
    if (currentSettings.enabled !== false) {
      const moviePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player")
      if (moviePlayer) {
        if (!moviePlayer.querySelector(`.${RIGHT_BUTTON_CLASS}`)) {
          injectRightControls()
        }
        if (!moviePlayer.querySelector(`.${LEFT_BUTTON_CLASS}`)) {
          injectLeftControls()
        }
        if (!moviePlayer.querySelector(`#${FLOATING_BTN_ID}`)) {
          injectFloatingPlayerButton()
        }
      }
      if (window.location.pathname.includes("/watch") && !document.getElementById(ACTION_BAR_BTN_ID)) {
        injectActionBarButton()
      }
      if (window.location.pathname.includes("/shorts/") && !document.getElementById(SHORT_BUTTON_ID)) {
        injectShortsButton()
      }
    }
  }, 500)

  // 6. MutationObserver on document
  const observer = new MutationObserver(() => {
    if (currentSettings.enabled !== false) {
      runInjectionSweep()
    }
  })

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true })
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true })
    })
  }

  // 7. Storage live sync
  storage.watch({
    hub_background_enabled: async (val: any) => {
      const isEnabled = val?.newValue?.["yt-music-redirect"] ?? true
      currentSettings.enabled = isEnabled
      if (isEnabled) {
        runInjectionSweep()
      } else {
        removeInjectedButtons()
      }
    },
    hub_yt_music_settings: (val: any) => {
      if (val?.newValue) {
        currentSettings = { ...currentSettings, ...val.newValue }
        removeInjectedButtons()
        if (currentSettings.enabled !== false) {
          runInjectionSweep()
        }
      }
    }
  })
}

// Start immediately
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
}
init()
