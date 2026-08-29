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
  launchExtension,
  INTERACTIVE_TOOLS
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
  const [currentHostDarkMode, setCurrentHostDarkMode] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  const checkCurrentHostDarkMode = async () => {
    if (chrome.tabs?.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.url) {
          const hostname = new URL(tab.url).hostname
          const enabled = await ExtensionStorage.isSiteDarkModeEnabled(hostname)
          setCurrentHostDarkMode(enabled)
          return
        }
      } catch {}
    }
    setCurrentHostDarkMode(false)
  }

  useEffect(() => {
    loadAllState()
    checkCurrentHostDarkMode()

    const handleStorageChange = () => {
      loadAllState()
      checkCurrentHostDarkMode()
    }
    chrome.storage?.onChanged?.addListener(handleStorageChange)
    return () => {
      chrome.storage?.onChanged?.removeListener(handleStorageChange)
    }
  }, [])

  const pinnedExtensions = getPinnedExtensions()

  const handleLaunchExtension = async (extensionId: string) => {
    try {
      if (extensionId === "force-dark-mode") {
        setIsDarkModeModalOpen(true)
      } else if (extensionId === "yt-music-redirect") {
        setIsYtMusicModalOpen(true)
      } else {
        await launchExtension(extensionId, { closePopup: true })
      }
    } catch (err) {
      console.error("[Hub] Failed to launch extension:", err)
    }
  }

  return (
    <div
      className={`hub-extension-root ${
        resolvedTheme === "dark" ? "dark" : ""
      } w-[360px] min-h-[480px] h-[520px] flex flex-col bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans select-none relative overflow-hidden p-3.5`}
    >
      {/* ── MINIMAL HEADER ── */}
      <header className="flex items-center justify-between flex-shrink-0 mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center text-white shadow-xs">
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

      <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar pb-1">
        <div className="grid grid-cols-2 gap-2.5">
          {pinnedExtensions.map((ext) => (
            <SquareExtensionCard
              key={ext.id}
              extension={ext}
              isEnabled={ext.id === "force-dark-mode" ? currentHostDarkMode : backgroundEnabled[ext.id]}
              onClick={() => handleLaunchExtension(ext.id)}
              onUnpin={() => togglePin(ext.id)}
            />
          ))}
        </div>
      </div>

      {/* ── BOTTOM "SELECT MORE EXTENSIONS" BUTTON ── */}
      <div className="pt-2 flex-shrink-0 mt-auto">
        <Button
          variant="secondary"
          onClick={() => setIsCatalogOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all flex items-center justify-center gap-1.5 text-xs font-bold h-9 shadow-xs"
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
