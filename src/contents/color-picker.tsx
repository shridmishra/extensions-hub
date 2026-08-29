import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import { ExtensionStorage } from "../lib/storage"
import { copyToClipboard } from "../lib/utils"
import { getColorName } from "../lib/color-names"
import { Check, X, Pipette, MousePointer } from "lucide-react"
import Button from "../components/ui/Button"
import IconButton from "../components/ui/IconButton"
import ActiveToolBanner from "../components/ui/ActiveToolBanner"

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
  style.textContent = cssText + `
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

function rgbToHex(rgbStr: string): string {
  if (!rgbStr || rgbStr === "transparent" || rgbStr === "rgba(0, 0, 0, 0)") {
    return "#FFFFFF"
  }
  const match = rgbStr.match(/\d+/g)
  if (!match || match.length < 3) return "#000000"
  const r = parseInt(match[0], 10)
  const g = parseInt(match[1], 10)
  const b = parseInt(match[2], 10)
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()
}

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

export default function ColorPickerContentScript() {
  const [isActive, setIsActive] = useState(false)
  const [toastColor, setToastColor] = useState<string | null>(null)
  const [toastRgb, setToastRgb] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Watch activation state, theme, and mutual exclusion with font_finder
  useEffect(() => {
    storage.get<boolean>("color_picker_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      color_picker_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        // Mutual exclusion: if font finder starts, color picker deactivates
        if (c.newValue) {
          setIsActive(false)
        }
      }
    }

    storage.watch(activeCallbacks)

    return () => {
      storage.unwatch(activeCallbacks)
    }
  }, [])

  // Listen for direct runtime messages from popup and background
  useEffect(() => {
    const handleMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      if (message?.type === "PING" || message?.type === "PING_CONTENT_SCRIPT") {
        sendResponse({ status: "ready", tool: "color-picker" })
        return true
      }

      if (message?.type === "START_COLOR_PICKER") {
        setIsActive(true)
        setToastColor(null)
        storage.set("color_picker_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_COLOR_PICKER" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER"
      ) {
        setIsActive(false)
        sendResponse({ success: true })
        return true
      }
    }

    chrome.runtime?.onMessage?.addListener(handleMessage)
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage)
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

  // Esc key listener
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive])

  const showToast = (hex: string, rgb: string) => {
    setToastColor(hex)
    setToastRgb(rgb)
    setTimeout(() => {
      setToastColor(null)
    }, 3500)
  }

  const handlePickColor = async (hexCode: string) => {
    const hex = hexCode.toUpperCase()
    const rgb = hexToRgb(hex)
    const hsl = hexToHsl(hex)
    const colorName = getColorName(hex)

    await copyToClipboard(hex)
    await ExtensionStorage.addColorHistory({ hex, rgb, hsl, name: colorName })

    showToast(hex, rgb)
    setIsActive(false)
    storage.set("color_picker_active", false)
  }

  const handleClickOverlay = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    e.preventDefault()
    e.stopPropagation()

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    // Try native EyeDropper
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        if (result && result.sRGBHex) {
          await handlePickColor(result.sRGBHex)
          return
        }
      } catch (err) {
        console.log("[ColorPicker] EyeDropper dismissed or fallback to element color", err)
      }
    }

    // Fallback to computed element color
    const computed = window.getComputedStyle(target)
    let color = computed.backgroundColor
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
      color = computed.color
    }
    await handlePickColor(rgbToHex(color))
  }

  const handleClose = () => {
    setIsActive(false)
    storage.set("color_picker_active", false)
  }

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""} text-neutral-900 dark:text-neutral-100 antialiased`}>
      {/* 1. Transparent Overlay across entire viewport with crosshair cursor (NO mouse-follower box) */}
      {isActive && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "auto",
            background: "transparent",
            zIndex: 2147483640,
            cursor: "crosshair"
          }}
          onClick={handleClickOverlay}
        />
      )}

      {/* 2. Top Floating Active Island Pill */}
      {isActive && (
        <ActiveToolBanner
          title="Color Picker"
          icon={<Pipette size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Click element to pick"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 3. Floating Toast Notification when Color is Picked */}
      {toastColor && (
        <div
          style={{ pointerEvents: "auto" }}
          className="fixed bottom-6 right-6 z-[2147483647] animate-scale-in font-sans"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-neutral-900 text-neutral-100 shadow-2xl">
            <div
              className="w-4.5 h-4.5 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: toastColor }}
            />
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono font-semibold text-xs tracking-tight text-neutral-50">
                {toastColor}
              </span>
              <span className="text-neutral-600 text-xs">•</span>
              <span className="font-sans font-bold text-xs text-neutral-200">
                {getColorName(toastColor)}
              </span>
            </div>
            <span className="text-neutral-600 text-xs leading-none">•</span>
            <div className="flex items-center gap-1 leading-none">
              <Check size={11} className="text-emerald-500 stroke-[3]" />
              <span className="text-neutral-400 text-xs font-medium tracking-tight">Copied</span>
            </div>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setToastColor(null)}
              aria-label="Close"
              className="text-neutral-400 hover:text-neutral-200 h-5 w-5 rounded-full p-0.5 ml-1"
            >
              <X size={12} className="stroke-[2.2]" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  )
}
