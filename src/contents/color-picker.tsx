import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import { ExtensionStorage } from "../lib/storage"
import { copyToClipboard } from "../lib/utils"
import { getColorName } from "../lib/color-names"
import { Check, X } from "lucide-react"
import IconButton from "../components/ui/IconButton"
import ColorPickerIslandToolbar, { type ColorPickerToolbarMode } from "../components/extensions/ColorPickerIslandToolbar"

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

function getElementColor(target: HTMLElement): { hex: string; name: string } {
  const computed = window.getComputedStyle(target)
  let color = computed.backgroundColor
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    color = computed.color
  }
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    let cur = target.parentElement
    while (cur && cur !== document.body) {
      const c = window.getComputedStyle(cur).backgroundColor
      if (c && c !== "transparent" && c !== "rgba(0, 0, 0, 0)") {
        color = c
        break
      }
      cur = cur.parentElement
    }
  }
  const hex = rgbToHex(color)
  const name = getColorName(hex)
  return { hex, name }
}

export default function ColorPickerContentScript() {
  const [isActive, setIsActive] = useState(false)
  const [currentMode, setCurrentMode] = useState<ColorPickerToolbarMode>("pick-color")
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [hoveredColor, setHoveredColor] = useState<{ hex: string; name: string } | null>(null)
  const [toastColor, setToastColor] = useState<string | null>(null)
  const [toastRgb, setToastRgb] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Watch activation state, theme, and mutual exclusion
  useEffect(() => {
    storage.get<boolean>("color_picker_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      color_picker_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setHoveredColor(null)
        }
      },
      css_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setHoveredColor(null)
        }
      },
      figma_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setHoveredColor(null)
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
        setCurrentMode("pick-color")
        setHoveredElement(null)
        setHoveredRect(null)
        setHoveredColor(null)
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
        setHoveredElement(null)
        setHoveredRect(null)
        setHoveredColor(null)
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

  // Scroll & resize handler
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (hoveredElement) {
        setHoveredRect(hoveredElement.getBoundingClientRect())
      }
    }

    if (isActive && hoveredElement) {
      window.addEventListener("scroll", handleScrollOrResize, { passive: true })
      window.addEventListener("resize", handleScrollOrResize, { passive: true })
    }

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isActive, hoveredElement])

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
    setHoveredElement(null)
    setHoveredRect(null)
    setHoveredColor(null)
    storage.set("color_picker_active", false)
  }

  const handleMouseMoveOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    if (target !== hoveredElement) {
      setHoveredElement(target)
      setHoveredRect(target.getBoundingClientRect())
      setHoveredColor(getElementColor(target))
    }
  }

  const handleClickOverlay = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    e.preventDefault()
    e.stopPropagation()

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    // Try native EyeDropper if available
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

    const { hex } = getElementColor(target)
    await handlePickColor(hex)
  }

  const handleClose = () => {
    setIsActive(false)
    setHoveredElement(null)
    setHoveredRect(null)
    setHoveredColor(null)
    storage.set("color_picker_active", false)
  }

  if (!isActive && !toastColor) return null

  const hoverTag = hoveredElement?.tagName.toLowerCase() || ""
  const hoverClass =
    hoveredElement?.className && typeof hoveredElement.className === "string"
      ? `.${hoverElementClass(hoveredElement.className)}`
      : ""
  const hoverHex = hoveredColor?.hex || "#FFFFFF"
  const hoverColorName = hoveredColor?.name || ""

  const pillTop = hoveredRect
    ? hoveredRect.top < 68
      ? hoveredRect.bottom + 8
      : Math.max(68, hoveredRect.top - 26)
    : 0

  const pillLeft = hoveredRect
    ? Math.max(12, Math.min(window.innerWidth - 240, hoveredRect.left))
    : 0

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""} text-neutral-900 dark:text-neutral-100 antialiased`}>
      {/* 1. Seamless Floating Island Toolbar Centered at Top */}
      {isActive && (
        <ColorPickerIslandToolbar
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 2. Transparent Overlay across entire viewport with crosshair cursor */}
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
          onMouseMove={handleMouseMoveOverlay}
          onClick={handleClickOverlay}
        />
      )}

      {/* 3. Live Hover Bounding Box */}
      {isActive && hoveredRect && (
        <>
          <div
            style={{
              top: `${hoveredRect.top}px`,
              left: `${hoveredRect.left}px`,
              width: `${hoveredRect.width}px`,
              height: `${hoveredRect.height}px`,
              position: "fixed",
              zIndex: 2147483645,
              pointerEvents: "none"
            }}
            className="rounded-xs transition-all duration-75 border-2 border-pink-500 bg-pink-500/10"
          />

          {/* Hover Tag Pill with Live Color Swatch */}
          <div
            style={{
              top: `${pillTop}px`,
              left: `${pillLeft}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900 text-white shadow-md font-sans text-[10px] font-bold transition-all duration-75 select-none leading-none h-[20px]"
          >
            <span>&lt;{hoverTag}&gt;{hoverClass}</span>
            <span className="opacity-40">|</span>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs border border-white/20"
              style={{ backgroundColor: hoverHex }}
            />
            <span className="font-mono">{hoverHex}</span>
            {hoverColorName && (
              <>
                <span className="opacity-40">•</span>
                <span>{hoverColorName}</span>
              </>
            )}
            <span className="opacity-40">|</span>
            <span className="text-[10px] font-extrabold text-pink-400">Click to Pick</span>
          </div>
        </>
      )}

      {/* 4. Floating Toast Notification when Color is Picked */}
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

function hoverElementClass(className: string): string {
  if (!className || typeof className !== "string") return ""
  return className.trim().split(/\s+/)[0] || ""
}
