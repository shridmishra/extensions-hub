import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { X } from "lucide-react"
import { IconButton } from "../src/components/ui"

/**
 * Configure which pages this interactive micro-extension runs on.
 */
export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_idle"
}

/**
 * Injects required fonts and global extension CSS into the Shadow DOM root.
 */
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
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    }
    .hub-extension-root {
      pointer-events: auto !important;
      font-family: "Satoshi", system-ui, -apple-system, sans-serif !important;
    }
  `
  return style
}

const storage = new Storage({ area: "local" })

/**
 * Interactive Micro-Extension Content Script Component.
 * Replace `__EXTENSION_ID__` with your extension's snake_case storage key.
 */
export default function InteractiveExtensionContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // 1. Sync active state & participate in mutual exclusion
  useEffect(() => {
    storage.get<boolean>("__EXTENSION_ID___active").then((val) => {
      setIsActive(!!val)
    })

    const unwatch = storage.watch({
      __EXTENSION_ID___active: (c) => {
        setIsActive(!!c.newValue)
      }
    })

    // Detect system dark theme
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(darkQuery.matches)
    const handleThemeChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    darkQuery.addEventListener("change", handleThemeChange)

    return () => {
      unwatch()
      darkQuery.removeEventListener("change", handleThemeChange)
    }
  }, [])

  // 2. Listen to direct trigger messages from Popup
  useEffect(() => {
    const handleMessage = (msg: any) => {
      if (msg?.type === "START___EXTENSION_UPPER_ID__") {
        setIsActive(true)
      } else if (msg?.type === "STOP___EXTENSION_UPPER_ID__") {
        setIsActive(false)
      }
    }

    chrome.runtime?.onMessage?.addListener(handleMessage)
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage)
    }
  }, [])

  const handleDeactivate = async () => {
    setIsActive(false)
    await storage.set("__EXTENSION_ID___active", false)
  }

  if (!isActive) return null

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""}`}>
      {/* On-Page Inspector / Tool Overlay */}
      <div className="fixed top-4 right-4 z-[2147483647] p-4 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-sans tracking-tight">
            __EXTENSION_NAME__
          </span>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleDeactivate}
            aria-label="Close"
            title="Close"
          >
            <X size={14} />
          </IconButton>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          __EXTENSION_DESCRIPTION__
        </p>
      </div>
    </div>
  )
}
