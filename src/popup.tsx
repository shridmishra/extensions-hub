import React, { useEffect, useRef, useState } from "react"
import { Search, Moon, Sun, Plus } from "lucide-react"
import { HubLogo } from "./components/icons"
import { Button, IconButton } from "./components/ui"
import { SquareExtensionCard, ExtensionCatalogModal } from "./components/hub"
import { YtMusicSettingsModal, DarkModeSettingsModal, TimeZoneModal } from "./components/extensions"
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
    reorderPinned,
    toggleBackground,
    getPinnedExtensions,
    isCatalogOpen,
    setIsCatalogOpen
  } = useHubStore()

  const [isYtMusicModalOpen, setIsYtMusicModalOpen] = useState(false)
  const [isDarkModeModalOpen, setIsDarkModeModalOpen] = useState(false)
  const [isTimeZoneModalOpen, setIsTimeZoneModalOpen] = useState(false)
  const [currentHostDarkMode, setCurrentHostDarkMode] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggedIdRef = useRef<string | null>(null)
  const dragOverIdRef = useRef<string | null>(null)
  const isDraggingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollAnimationRef = useRef<number | null>(null)
  const { resolvedTheme, toggleTheme } = useTheme()

  const stopAutoScroll = () => {
    if (autoScrollAnimationRef.current !== null) {
      cancelAnimationFrame(autoScrollAnimationRef.current)
      autoScrollAnimationRef.current = null
    }
  }

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
      stopAutoScroll()
    }
  }, [])

  const pinnedExtensions = getPinnedExtensions()

  const handleContainerDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    const container = scrollContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const distFromTop = e.clientY - rect.top
    const distFromBottom = rect.bottom - e.clientY
    const THRESHOLD = 70

    if (distFromTop < THRESHOLD) {
      // Near or above top edge: auto-scroll up
      stopAutoScroll()
      const intensity = Math.max(0.15, 1 - Math.max(0, distFromTop) / THRESHOLD)
      const speed = Math.max(5, Math.round(intensity * 18))

      const scrollUp = () => {
        if (!scrollContainerRef.current) return
        if (scrollContainerRef.current.scrollTop > 0) {
          scrollContainerRef.current.scrollTop -= speed
          autoScrollAnimationRef.current = requestAnimationFrame(scrollUp)
        } else {
          stopAutoScroll()
        }
      }
      autoScrollAnimationRef.current = requestAnimationFrame(scrollUp)

      if (distFromTop < 25 && pinnedExtensions[0]) {
        dragOverIdRef.current = pinnedExtensions[0].id
        setDragOverId(pinnedExtensions[0].id)
      }
    } else if (distFromBottom < THRESHOLD) {
      // Near or below bottom edge: auto-scroll down
      stopAutoScroll()
      const intensity = Math.max(0.15, 1 - Math.max(0, distFromBottom) / THRESHOLD)
      const speed = Math.max(5, Math.round(intensity * 18))

      const scrollDown = () => {
        if (!scrollContainerRef.current) return
        const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight
        if (scrollContainerRef.current.scrollTop < maxScroll) {
          scrollContainerRef.current.scrollTop += speed
          autoScrollAnimationRef.current = requestAnimationFrame(scrollDown)
        } else {
          stopAutoScroll()
        }
      }
      autoScrollAnimationRef.current = requestAnimationFrame(scrollDown)

      const lastExt = pinnedExtensions[pinnedExtensions.length - 1]
      if (distFromBottom < 25 && lastExt) {
        dragOverIdRef.current = lastExt.id
        setDragOverId(lastExt.id)
      }
    } else {
      stopAutoScroll()
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    isDraggingRef.current = true
    draggedIdRef.current = id
    setDraggedId(id)
    e.dataTransfer.setData("text/plain", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    dragOverIdRef.current = id
    if (dragOverId !== id) {
      setDragOverId(id)
    }
    handleContainerDragOver(e)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    dragOverIdRef.current = id
    setDragOverId(id)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    // Keep dragOverIdRef intact so drop always knows the intended destination
  }

  const handleDrop = async (e: React.DragEvent<HTMLElement>, targetId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    stopAutoScroll()

    const sourceId = draggedIdRef.current || e.dataTransfer.getData("text/plain")
    const destId = targetId || dragOverIdRef.current

    if (sourceId && destId && sourceId !== destId) {
      await reorderPinned(sourceId, destId)
    }

    draggedIdRef.current = null
    dragOverIdRef.current = null
    setDraggedId(null)
    setDragOverId(null)
    setTimeout(() => {
      isDraggingRef.current = false
    }, 60)
  }

  const handleDragEnd = () => {
    stopAutoScroll()
    draggedIdRef.current = null
    dragOverIdRef.current = null
    setDraggedId(null)
    setDragOverId(null)
    setTimeout(() => {
      isDraggingRef.current = false
    }, 60)
  }

  const handleLaunchExtension = async (extensionId: string) => {
    if (isDraggingRef.current) return
    try {
      if (extensionId === "force-dark-mode") {
        setIsDarkModeModalOpen(true)
      } else if (extensionId === "yt-music-redirect") {
        setIsYtMusicModalOpen(true)
      } else if (extensionId === "time-zone-converter") {
        setIsTimeZoneModalOpen(true)
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
      } w-[360px] min-h-[480px] h-[520px] flex flex-col bg-white dark:bg-hub-950 text-neutral-900 dark:text-neutral-100 font-sans select-none relative overflow-hidden p-3.5`}
    >
      {/* ── MINIMAL HEADER ── */}
      <header
        onDragOver={(e) => {
          e.preventDefault()
          handleContainerDragOver(e)
          if (pinnedExtensions[0]) {
            dragOverIdRef.current = pinnedExtensions[0].id
            setDragOverId(pinnedExtensions[0].id)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (pinnedExtensions[0]) {
            handleDrop(e, pinnedExtensions[0].id)
          }
        }}
        className="flex items-center justify-between flex-shrink-0 mb-3 px-0.5"
      >
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

      <div
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleDrop(e)
        }}
        className="flex-1 overflow-y-auto min-h-0 no-scrollbar pt-1 pb-2"
      >
        <div className="grid grid-cols-2 gap-2">
          {pinnedExtensions.map((ext) => (
            <SquareExtensionCard
              key={ext.id}
              extension={ext}
              isEnabled={ext.id === "force-dark-mode" ? currentHostDarkMode : backgroundEnabled[ext.id]}
              isDragging={draggedId === ext.id}
              isDragOver={dragOverId === ext.id}
              onDragStart={(e) => handleDragStart(e, ext.id)}
              onDragOver={(e) => handleDragOver(e, ext.id)}
              onDragEnter={(e) => handleDragEnter(e, ext.id)}
              onDragLeave={(e) => handleDragLeave(e, ext.id)}
              onDrop={(e) => handleDrop(e, ext.id)}
              onDragEnd={handleDragEnd}
              onClick={() => handleLaunchExtension(ext.id)}
              onUnpin={() => togglePin(ext.id)}
            />
          ))}
        </div>
      </div>

      {/* ── BOTTOM "SELECT MORE EXTENSIONS" BUTTON ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          handleContainerDragOver(e)
          const lastExt = pinnedExtensions[pinnedExtensions.length - 1]
          if (lastExt) {
            dragOverIdRef.current = lastExt.id
            setDragOverId(lastExt.id)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const lastExt = pinnedExtensions[pinnedExtensions.length - 1]
          if (lastExt) {
            handleDrop(e, lastExt.id)
          }
        }}
        className="pt-2 flex-shrink-0 mt-auto"
      >
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

      {/* ── TIME ZONE CONVERTER MODAL ── */}
      <TimeZoneModal
        isOpen={isTimeZoneModalOpen}
        onClose={() => setIsTimeZoneModalOpen(false)}
      />
    </div>
  )
}

export default IndexPopup
