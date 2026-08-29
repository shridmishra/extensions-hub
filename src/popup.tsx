import React, { useEffect, useState } from "react"
import {
  Search,
  Moon,
  Sun,
  Plus
} from "lucide-react"
import HubLogo from "./components/ui/HubLogo"
import { useHubStore } from "./store/hub-store"
import { useTheme } from "./hooks/useTheme"
import { SquareExtensionCard } from "./components/hub/SquareExtensionCard"
import { ExtensionCatalogModal } from "./components/hub/ExtensionCatalogModal"
import { YtMusicSettingsModal } from "./components/extensions/YtMusicSettingsModal"
import { DarkModeSettingsModal } from "./components/extensions/DarkModeSettingsModal"
import {
  ExtensionStorage,
  storage,
  activateInteractiveTool,
  INTERACTIVE_TOOLS
} from "./lib/storage"

import { copyToClipboard } from "./lib/utils"
import { getColorName } from "./lib/color-names"
import IconButton from "./components/ui/IconButton"
import Button from "./components/ui/Button"
import "./style.css"

function hexToRgb(hex: string): string {
  let c = hex.replace("#", "")
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("")
  }
  const num = parseInt(c, 16) || 0
  return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`
}

function hexToHsl(hex: string): string {
  let c = hex.replace("#", "")
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("")
  }
  const r = (parseInt(c.substring(0, 2), 16) || 0) / 255
  const g = (parseInt(c.substring(2, 4), 16) || 0) / 255
  const b = (parseInt(c.substring(4, 6), 16) || 0) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function IndexPopup() {
  const {
    loadAllState,
    pinnedIds,
    backgroundEnabled,
    togglePin,
    toggleBackground,
    getPinnedExtensions,
    isCatalogOpen,
    setIsCatalogOpen
  } = useHubStore()

  const [isYtMusicModalOpen, setIsYtMusicModalOpen] = useState(false)
  const [isDarkModeModalOpen, setIsDarkModeModalOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()


  useEffect(() => {
    loadAllState()

    const handleStorageChange = () => {
      loadAllState()
    }
    chrome.storage?.onChanged?.addListener(handleStorageChange)
    return () => {
      chrome.storage?.onChanged?.removeListener(handleStorageChange)
    }
  }, [])

  const pinnedExtensions = getPinnedExtensions()

  const handleLaunchExtension = async (extensionId: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (extensionId === "color-picker") {
        if ("EyeDropper" in window) {
          try {
            const eyeDropper = new (window as any).EyeDropper()
            // Immediately opens the native CIRCLE magnifying eyedropper selector from start
            const result = await eyeDropper.open()
            if (result && result.sRGBHex) {
              const hex = result.sRGBHex.toUpperCase()
              const rgb = hexToRgb(hex)
              const hsl = hexToHsl(hex)
              const colorName = getColorName(hex)

              await copyToClipboard(hex)
              await ExtensionStorage.addColorHistory({ hex, rgb, hsl, name: colorName })

              if (tab?.id) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: (pickedHex: string, pickedRgb: string, name: string) => {
                    const existing = document.getElementById("hub-color-toast-overlay")
                    if (existing) existing.remove()

                    const toast = document.createElement("div")
                    toast.id = "hub-color-toast-overlay"
                    toast.style.cssText = `
                      position: fixed !important;
                      bottom: 24px !important;
                      right: 24px !important;
                      z-index: 2147483647 !important;
                      display: flex !important;
                      align-items: center !important;
                      gap: 10px !important;
                      padding: 8px 14px 8px 10px !important;
                      background: #09090b !important;
                      color: #ffffff !important;
                      border: 1px solid rgba(255, 255, 255, 0.12) !important;
                      border-radius: 9999px !important;
                      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2) !important;
                      font-family: 'Geist Mono', -apple-system, system-ui, monospace !important;
                      animation: hubToastIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                      user-select: none !important;
                      -webkit-font-smoothing: antialiased !important;
                    `

                    toast.innerHTML = `
                      <style>
                        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap');
                        @keyframes hubToastIn {
                          from { opacity: 0; transform: translateY(8px) scale(0.96); }
                          to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                      </style>
                      <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: ${pickedHex}; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 0 0 1px rgba(0,0,0,0.5); flex-shrink: 0;"></div>
                      <div style="display: flex; align-items: center; gap: 6px; line-height: 1;">
                        <span style="font-family: 'Geist Mono', monospace; font-weight: 600; font-size: 13px; letter-spacing: -0.01em; color: #fafafa; font-feature-settings: 'tnum' 1;">${pickedHex}</span>
                        <span style="color: rgba(255,255,255,0.3); font-size: 10px;">•</span>
                        <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">${name}</span>
                      </div>
                      <span style="color: rgba(255,255,255,0.25); font-size: 10px; line-height: 1;">•</span>
                      <div style="display: flex; align-items: center; gap: 4px; line-height: 1;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style="color: #a1a1aa; font-size: 11px; font-weight: 500; letter-spacing: -0.01em;">Copied</span>
                      </div>
                    `

                    document.body.appendChild(toast)

                    setTimeout(() => {
                      toast.style.transition = "opacity 0.2s ease, transform 0.2s ease"
                      toast.style.opacity = "0"
                      toast.style.transform = "translateY(6px)"
                      setTimeout(() => toast.remove(), 200)
                    }, 2800)
                  },
                  args: [hex, rgb, colorName]
                }).catch(() => {})
              }
              window.close()
            }
          } catch (e) {
            console.log("[ColorPicker] Cancelled or dismissed", e)
          }
        }
      } else if (INTERACTIVE_TOOLS[extensionId]) {
        // Enforce mutual exclusion: only ONE interactive on-page tool active at a time
        await activateInteractiveTool(extensionId)
        if (tab?.id) {
          let msgType = "START_FONT_FINDER"
          if (extensionId === "css-picker") msgType = "START_CSS_PICKER"
          else if (extensionId === "figma-picker") msgType = "START_ELEMENT_SELECTION"
          else if (extensionId === "color-picker") msgType = "START_COLOR_PICKER"

          await chrome.tabs.sendMessage(tab.id, { type: msgType }).catch(async () => {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (type: string) => {
                window.postMessage({ type }, "*")
              },
              args: [msgType]
            }).catch(() => {})
          })
        }
        window.close()
      } else if (extensionId === "force-dark-mode") {
        setIsDarkModeModalOpen(true)
      } else if (extensionId === "yt-music-redirect") {
        setIsYtMusicModalOpen(true)
      } else {
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, { type: "EXECUTE_TOOL", toolId: extensionId }).catch(() => {})
        }
      }
    } catch (err) {
      console.error("[Hub] Failed to launch extension:", err)
    }
  }

  return (
    <div className={`hub-extension-root ${resolvedTheme === "dark" ? "dark" : ""} w-[360px] min-h-[480px] h-[520px] flex flex-col bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans select-none relative overflow-hidden p-4`}>
      {/* ── MINIMAL HEADER ── */}
      <header className="flex items-center justify-between flex-shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-850 flex items-center justify-center text-white shadow-2xs border border-neutral-800 dark:border-neutral-750">
            <HubLogo size={12} className="fill-white text-white" />
          </div>
          <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-50 tracking-tight leading-none">
            Extension Hub
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Search Icon Button */}
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => setIsCatalogOpen(true)}
            title="Search Extensions"
            aria-label="Search"
            tooltipPosition="bottom"
          >
            <Search size={14} className="stroke-[2.2]" />
          </IconButton>

          {/* Theme Toggle (Sun / Moon) */}
          <IconButton
            size="sm"
            variant="ghost"
            onClick={toggleTheme}
            title={resolvedTheme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle theme"
            tooltipPosition="bottom-left"
          >
            {resolvedTheme === "dark" ? (
              <Sun size={14} className="stroke-[2.2]" />
            ) : (
              <Moon size={14} className="stroke-[2.2]" />
            )}
          </IconButton>
        </div>
      </header>

      {/* ── SCROLLABLE MIDDLE CONTENT (2-COLUMN SQUARE TILES GRID) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 hub-scrollbar pr-0.5 pb-2">
        <div className="grid grid-cols-2 gap-3">
          {pinnedExtensions.map((ext) => (
            <SquareExtensionCard
              key={ext.id}
              extension={ext}
              isEnabled={backgroundEnabled[ext.id]}
              onClick={() => handleLaunchExtension(ext.id)}
              onUnpin={() => togglePin(ext.id)}
            />
          ))}
        </div>
      </div>

      {/* ── BOTTOM "SELECT MORE EXTENSIONS" BUTTON ── */}
      <div className="pt-3 flex-shrink-0 border-t border-neutral-100 dark:border-neutral-850/60 mt-auto">
        <Button
          variant="secondary"
          onClick={() => setIsCatalogOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 h-auto"
        >
          <Plus size={13} className="stroke-[2.5]" />
          <span>Select More Extensions</span>
        </Button>
      </div>

      {/* ── SEARCH & CATALOG MODAL ── */}
      <ExtensionCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onLaunchExtension={handleLaunchExtension}
      />

      {/* ── YT MUSIC SETTINGS MODAL ── */}
      <YtMusicSettingsModal
        isOpen={isYtMusicModalOpen}
        onClose={() => setIsYtMusicModalOpen(false)}
      />

      {/* ── DARK/LIGHT MODE SETTINGS MODAL ── */}
      <DarkModeSettingsModal
        isOpen={isDarkModeModalOpen}
        onClose={() => setIsDarkModeModalOpen(false)}
      />
    </div>
  )
}

export default IndexPopup

