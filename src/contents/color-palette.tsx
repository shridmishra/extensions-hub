import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useCallback } from "react"
import { Storage } from "@plasmohq/storage"
import { Palette, MousePointer } from "lucide-react"
import ActiveToolBanner from "../components/ui/ActiveToolBanner"
import ColorPaletteModal from "../components/extensions/ColorPaletteModal"
import { scanPagePalette, clearHighlightOverlays } from "../lib/palette-extractor"
import type { PagePaletteSummary } from "../types/palette"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_idle"
}

export const getStyle: PlasmoGetStyle = () => {
  if (!document.getElementById("hub-satoshi-font")) {
    const fontStyle = document.createElement("style")
    fontStyle.id = "hub-satoshi-font"
    fontStyle.textContent = `
      @import url("https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap");
      @import url("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap");
      @font-face {
        font-family: "Satoshi";
        src: url("${satoshiFontUrl}") format("woff2");
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `
    document.head.appendChild(fontStyle)
  }

  const style = document.createElement("style")
  style.textContent =
    cssText +
    `
    :host,
    #plasmo-shadow-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      background: transparent !important;
    }
    .hub-extension-root {
      pointer-events: auto !important;
      background: transparent !important;
      font-family: "Satoshi", system-ui, -apple-system, sans-serif !important;
    }
    .hub-extension-root * {
      font-family: "Satoshi", system-ui, -apple-system, sans-serif !important;
    }
  `
  return style
}

const storage = new Storage({ area: "local" })

export default function ColorPaletteContentScript() {
  const [isActive, setIsActive] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [palette, setPalette] = useState<PagePaletteSummary>({
    allColors: [],
    bgColors: [],
    textColors: [],
    borderColors: [],
    ctaColors: [],
    totalUniqueColors: 0,
    totalUsages: 0
  })

  // Watch storage activation and mutual exclusion
  useEffect(() => {
    storage.get<boolean>("color_palette_active").then((val) => {
      setIsActive(!!val)
      if (val) {
        setPalette(scanPagePalette())
      }
    })

    const activeCallbacks = {
      color_palette_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
        if (c.newValue) {
          setPalette(scanPagePalette())
        } else {
          clearHighlightOverlays()
        }
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      color_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      css_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      figma_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      page_ruler_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      link_grabber_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      },
      screenshot_capture_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          clearHighlightOverlays()
        }
      }
    }

    storage.watch(activeCallbacks)
    return () => {
      storage.unwatch(activeCallbacks)
    }
  }, [])

  // Sync theme
  useEffect(() => {
    storage.get<string>("hub_theme").then((val) => {
      setIsDarkMode(val === "dark")
    })

    const themeCallbacks = {
      hub_theme: (c: { newValue?: string }) => {
        setIsDarkMode(c.newValue === "dark")
      }
    }

    storage.watch(themeCallbacks)
    return () => {
      storage.unwatch(themeCallbacks)
    }
  }, [])

  // Listen for direct runtime messages from popup and background
  useEffect(() => {
    const handleMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      if (message?.type === "PING" || message?.type === "PING_CONTENT_SCRIPT") {
        sendResponse({ status: "ready", tool: "color-palette" })
        return true
      }

      if (message?.type === "START_COLOR_PALETTE") {
        setIsActive(true)
        setPalette(scanPagePalette())
        storage.set("color_palette_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_COLOR_PALETTE" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER" ||
        message?.type === "START_PAGE_RULER" ||
        message?.type === "START_LINK_GRABBER" ||
        message?.type === "START_SCREENSHOT_CAPTURE"
      ) {
        setIsActive(false)
        clearHighlightOverlays()
        sendResponse({ success: true })
        return true
      }
    }

    chrome.runtime?.onMessage?.addListener(handleMessage)
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage)
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsActive(false)
    clearHighlightOverlays()
    storage.set("color_palette_active", false)
  }, [])

  // Esc keyboard shortcut listener
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, handleClose])

  if (!isActive) return null

  return (
    <div
      className={`hub-extension-root ${
        isDarkMode ? "dark" : ""
      } text-neutral-900 dark:text-neutral-100 antialiased`}
    >
      {/* 1. Top Floating Active Banner */}
      <ActiveToolBanner
        title="Color Palette"
        icon={<Palette size={13} className="text-neutral-900 dark:text-neutral-100" />}
        instruction="Browsing page color palette"
        instructionIcon={<MousePointer size={12} />}
        onClose={handleClose}
        isDarkMode={isDarkMode}
      />

      {/* 2. Bottom-Right Floating Inspector Modal */}
      <ColorPaletteModal
        palette={palette}
        onClose={handleClose}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
