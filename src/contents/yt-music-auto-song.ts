import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { DEFAULT_YT_MUSIC_SETTINGS, type YtMusicSettings } from "../lib/storage"

export const config: PlasmoCSConfig = {
  matches: [
    "https://music.youtube.com/*",
    "http://music.youtube.com/*"
  ],
  run_at: "document_idle",
  all_frames: false
}

const storage = new Storage({ area: "local" })
const TOAST_ID = "ytmusic-auto-song-toast"

let currentSettings: YtMusicSettings = { ...DEFAULT_YT_MUSIC_SETTINGS }
let lastAttemptedVideoId: string | null = null
let isSwitching = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Display a clean floating toast on YouTube Music
 */
function showToast(message: string) {
  const existing = document.getElementById(TOAST_ID)
  if (existing) existing.remove()

  const toast = document.createElement("div")
  toast.id = TOAST_ID
  toast.style.cssText = `
    position: fixed !important;
    bottom: 96px !important;
    left: 50% !important;
    transform: translateX(-50%) translateY(12px) scale(0.96) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 8px 16px !important;
    background: rgba(18, 18, 20, 0.95) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 9999px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    opacity: 0 !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    pointer-events: none !important;
    backdrop-filter: blur(10px) !important;
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
  }, 2400)
}

/**
 * Attempts to switch to Song mode ONCE per video
 */
function attemptSwitchToSong() {
  if (!currentSettings.preferSongVersion) return
  if (isSwitching) return

  const urlParams = new URLSearchParams(window.location.search)
  const currentVideoId = urlParams.get("v")

  // Do not re-trigger for the same video ID if already handled
  if (currentVideoId && lastAttemptedVideoId === currentVideoId) {
    return
  }

  // Find AV toggle on YouTube Music
  const avToggle = document.querySelector("ytmusic-av-toggle, #av-toggle, .av-toggle")
  if (!avToggle) return

  // Find Song button
  const songButton = (
    avToggle.querySelector("#song-tab") ||
    avToggle.querySelector(".song-button") ||
    avToggle.querySelector("tp-yt-paper-tab:first-child") ||
    avToggle.querySelector("[aria-label*='Song' i]") ||
    Array.from(avToggle.querySelectorAll("tp-yt-paper-tab, button, div[role='tab']")).find(
      (el) => el.textContent?.trim().toLowerCase() === "song"
    )
  ) as HTMLElement | null

  if (!songButton) return

  // If already in Song mode (selected), mark as handled
  const isSelected =
    songButton.getAttribute("aria-selected") === "true" ||
    songButton.classList.contains("iron-selected") ||
    songButton.classList.contains("selected")

  if (isSelected) {
    if (currentVideoId) lastAttemptedVideoId = currentVideoId
    return
  }

  // Set guard
  isSwitching = true
  if (currentVideoId) {
    lastAttemptedVideoId = currentVideoId
  }

  try {
    songButton.click()
    showToast("Switched to Song Audio version")
  } catch (err) {
    console.error("[YTMusicAutoSong] Error clicking Song button:", err)
  } finally {
    setTimeout(() => {
      isSwitching = false
    }, 1500)
  }
}

/**
 * Debounced check to prevent rapid firing
 */
function debouncedCheck() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    attemptSwitchToSong()
  }, 250)
}

function init() {
  // Load settings
  storage.get<YtMusicSettings>("hub_yt_music_settings").then((savedSettings) => {
    if (savedSettings) {
      currentSettings = { ...DEFAULT_YT_MUSIC_SETTINGS, ...savedSettings }
    }
    debouncedCheck()
  }).catch(() => {})

  // Listen to navigation events on YouTube Music SPA
  const onNav = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const newVideoId = urlParams.get("v")
    if (newVideoId && newVideoId !== lastAttemptedVideoId) {
      lastAttemptedVideoId = null
    }
    setTimeout(debouncedCheck, 300)
    setTimeout(debouncedCheck, 800)
    setTimeout(debouncedCheck, 1600)
  }

  window.addEventListener("yt-navigate-finish", onNav)
  window.addEventListener("yt-page-data-updated", onNav)
  window.addEventListener("spfdone", onNav)
  window.addEventListener("popstate", onNav)
  window.addEventListener("load", onNav)

  // Watch for storage updates
  storage.watch({
    hub_yt_music_settings: (val: any) => {
      if (val?.newValue) {
        currentSettings = { ...currentSettings, ...val.newValue }
        debouncedCheck()
      }
    }
  })

  // Light periodic check (only fires if not already handled for this video ID)
  setInterval(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const currentVideoId = urlParams.get("v")
    if (currentVideoId && lastAttemptedVideoId !== currentVideoId) {
      debouncedCheck()
    }
  }, 1000)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
