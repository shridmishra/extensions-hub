import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import FontFinderModal, { type FontMetrics } from "../components/extensions/FontFinderModal"
import FontFinderIslandToolbar, { type FontFinderToolbarMode } from "../components/extensions/FontFinderIslandToolbar"
import { ExtensionStorage } from "../lib/storage"

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
    .hub-extension-root *:not(.font-preview-element, .font-preview-element *) {
      font-family: "Satoshi", system-ui, -apple-system, sans-serif;
    }
    .font-preview-element,
    .font-preview-element * {
      font-family: var(--preview-font-family, inherit) !important;
    }
  `
  return style
}

const storage = new Storage({ area: "local" })

/**
 * Extracts typography & computed styles from the inspected element with gradient-text awareness.
 */
function extractFontMetrics(element: HTMLElement): FontMetrics {
  const computed = window.getComputedStyle(element)

  // Prefer innerText if present, or textContent
  let text = ""
  if (element.innerText && element.innerText.trim().length > 0) {
    text = element.innerText.trim()
  } else if (element.textContent && element.textContent.trim().length > 0) {
    text = element.textContent.trim()
  }

  // Fallbacks for inputs/buttons without direct text
  if (!text) {
    text =
      (element as HTMLInputElement).placeholder ||
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.getAttribute("alt") ||
      "Sample typography text"
  }

  // Clean whitespace and limit length
  text = text.replace(/\s+/g, " ").slice(0, 100).trim()
  if (!text) {
    text = "Sample typography text"
  }

  let textColor = computed.color
  const webkitTextFillColor = computed.getPropertyValue("-webkit-text-fill-color")
  const bgClip = (
    computed.getPropertyValue("background-clip") ||
    computed.getPropertyValue("-webkit-background-clip") ||
    ""
  ).toLowerCase()
  const bgImg = computed.backgroundImage

  if (
    bgClip.includes("text") ||
    textColor === "transparent" ||
    textColor === "rgba(0, 0, 0, 0)" ||
    webkitTextFillColor === "transparent"
  ) {
    if (bgImg && bgImg !== "none" && bgImg.includes("gradient")) {
      textColor = "Gradient Fill"
    } else {
      let cur: HTMLElement | null = element.parentElement
      while (cur && cur !== document.body) {
        const c = window.getComputedStyle(cur).color
        if (c && c !== "transparent" && c !== "rgba(0, 0, 0, 0)") {
          textColor = c
          break
        }
        cur = cur.parentElement
      }
    }
  }

  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing,
    color: textColor,
    backgroundColor: computed.backgroundColor,
    textAlign: computed.textAlign,
    textTransform: computed.textTransform,
    sampleText: text,
    tagName: element.tagName
  }
}

export default function FontFinderContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [currentMode, setCurrentMode] = useState<FontFinderToolbarMode>("inspect-element")
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [inspectedMetrics, setInspectedMetrics] = useState<FontMetrics | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Sync active state from storage
  useEffect(() => {
    storage.get<boolean>("font_finder_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      font_finder_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
      },
      color_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedMetrics(null)
        }
      },
      css_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedMetrics(null)
        }
      },
      figma_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedMetrics(null)
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
        sendResponse({ status: "ready", tool: "font-finder" })
        return true
      }

      if (message?.type === "START_FONT_FINDER") {
        setIsActive(true)
        setCurrentMode("inspect-element")
        setHoveredElement(null)
        setHoveredRect(null)
        setInspectedMetrics(null)
        storage.set("font_finder_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER"
      ) {
        setIsActive(false)
        setHoveredElement(null)
        setHoveredRect(null)
        setInspectedMetrics(null)
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

  // Scroll & resize handler to keep hover rect anchored
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (hoveredElement) {
        setHoveredRect(hoveredElement.getBoundingClientRect())
      }
    }

    if (isActive && hoveredElement && !inspectedMetrics) {
      window.addEventListener("scroll", handleScrollOrResize, { passive: true })
      window.addEventListener("resize", handleScrollOrResize, { passive: true })
    }

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isActive, hoveredElement, inspectedMetrics])

  // Esc key listener: close extension completely
  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null)
      setHoveredRect(null)
      setInspectedMetrics(null)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive, inspectedMetrics])

  const handleMouseMoveOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    if (target !== hoveredElement) {
      setHoveredElement(target)
      setHoveredRect(target.getBoundingClientRect())
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

    const metrics = extractFontMetrics(target)
    setInspectedMetrics(metrics)

    // Save to history
    ExtensionStorage.addFontHistory({
      fontFamily: metrics.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
      fontSize: metrics.fontSize,
      fontWeight: metrics.fontWeight,
      color: metrics.color
    }).catch(console.error)

    setHoveredElement(null)
    setHoveredRect(null)
  }

  const handleClose = () => {
    setIsActive(false)
    setInspectedMetrics(null)
    setHoveredElement(null)
    setHoveredRect(null)
    storage.set("font_finder_active", false)
  }

  if (!isActive) return null

  const hoverFont = hoveredElement
    ? window.getComputedStyle(hoveredElement).fontFamily.split(",")[0].replace(/['"]/g, "").trim()
    : ""
  const hoverSize = hoveredElement ? window.getComputedStyle(hoveredElement).fontSize : ""
  const hoverWeight = hoveredElement ? window.getComputedStyle(hoveredElement).fontWeight : ""

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
      <FontFinderIslandToolbar
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode)
          setInspectedMetrics(null)
        }}
        onClose={handleClose}
        isDarkMode={isDarkMode}
      />

      {/* 2. Overlay across viewport */}
      {isActive && !inspectedMetrics && (
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

      {/* 3. Hover Bounding Box */}
      {isActive && hoveredRect && !inspectedMetrics && (
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
            className="rounded-xs transition-all duration-75 border-2 border-emerald-500 bg-emerald-500/10"
          />

          {/* Hover Tag Pill */}
          <div
            style={{
              top: `${pillTop}px`,
              left: `${pillLeft}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-md font-sans text-[10px] font-bold transition-all duration-75 select-none leading-none h-[20px]"
          >
            <span>{hoverFont}</span>
            <span className="opacity-40">|</span>
            <span className="font-mono">{hoverSize}</span>
            <span className="opacity-40">|</span>
            <span>w<span className="font-mono">{hoverWeight}</span></span>
            <span className="opacity-40">|</span>
            <span className="text-[10px] font-extrabold">Click to Inspect</span>
          </div>
        </>
      )}

      {/* 4. Modal Inspector */}
      {inspectedMetrics && (
        <div style={{ pointerEvents: "auto" }}>
          <FontFinderModal
            metrics={inspectedMetrics}
            onClose={handleClose}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  )
}
