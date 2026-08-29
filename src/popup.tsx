import React, { useEffect, useState } from "react"
import { Search, Moon, Sun, Plus } from "lucide-react"
import { HubLogo } from "./components/icons"
import { Button, IconButton } from "./components/ui"
import { SquareExtensionCard, ExtensionCatalogModal } from "./components/hub"
import { YtMusicSettingsModal, DarkModeSettingsModal } from "./components/extensions"
import { useHubStore } from "./store"
import { useTheme } from "./hooks"
import {
  ExtensionStorage,
  activateInteractiveTool,
  INTERACTIVE_TOOLS,
  copyToClipboard,
  getColorName,
  hexToRgb,
  hexToHsl,
  injectColorToast
} from "./lib"
import "./style.css"

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
                await chrome.scripting
                  .executeScript({
                    target: { tabId: tab.id },
                    func: injectColorToast,
                    args: [hex, rgb, colorName]
                  })
                  .catch(() => {})
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
            await chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                func: (type: string) => {
                  window.postMessage({ type }, "*")
                },
                args: [msgType]
              })
              .catch(() => {})
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
    <div
      className={`hub-extension-root ${
        resolvedTheme === "dark" ? "dark" : ""
      } w-[360px] min-h-[480px] h-[520px] flex flex-col bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans select-none relative overflow-hidden p-4`}
    >
      {/* ── MINIMAL HEADER ── */}
      <header className="flex items-center justify-between flex-shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-850 flex items-center justify-center text-white shadow-2xs border border-neutral-800 dark:border-neutral-750">
            <HubLogo size={12} className="fill-white text-white" />
          </div>
          <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-50 tracking-tight leading-none">
            Extensions Hub
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
