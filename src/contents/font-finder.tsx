import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import FontFinderModal, { type FontMetrics } from "../components/extensions/FontFinderModal"
import { ExtensionStorage } from "../lib/storage"
import { Type, MousePointer } from "lucide-react"
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
 * Resolves the appropriate inspectable HTML element from an event target.
 * Walks past SVGs, icons, and non-text pseudoelements up to their parent button/link/container.
 */
function getInspectableElement(target: Element | null): HTMLElement | null {
  if (!target) return null
  if (target.closest(".hub-extension-root")) return null

  let el: Element | null = target

  // If target is inside an SVG or is an SVGElement, walk up to its container (button, a, div, etc.)
  if (el instanceof SVGElement || el.tagName.toLowerCase() === "svg" || el.closest("svg")) {
    const svgRoot = el.closest("svg")
    const container = svgRoot?.parentElement || el.parentElement
    if (container && !container.closest(".hub-extension-root")) {
      el = container
    }
  }

  if (!(el instanceof HTMLElement)) return null

  return el
}

/**
 * Extracts typography & computed styles from the inspected element.
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
    text = (element as HTMLInputElement).placeholder ||
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

  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing,
    color: computed.color,
    backgroundColor: computed.backgroundColor,
    textAlign: computed.textAlign,
    textTransform: computed.textTransform,
    sampleText: text,
    tagName: element.tagName
  }
}

export default function FontFinderContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [inspectedMetrics, setInspectedMetrics] = useState<FontMetrics | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  // Manage crosshair cursor on page without breaking extension root cursor
  useEffect(() => {
    const styleId = "hub-font-finder-global-cursor"
    if (isActive && !inspectedMetrics) {
      if (!document.getElementById(styleId)) {
        const cursorStyle = document.createElement("style")
        cursorStyle.id = styleId
        cursorStyle.textContent = `
          *:not(.hub-extension-root, .hub-extension-root *) {
            cursor: crosshair !important;
          }
        `
        document.head.appendChild(cursorStyle)
      }
    } else {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }

    return () => {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }
  }, [isActive, inspectedMetrics])

  // Native non-blocking event interception (mousemove, click, mousedown)
  useEffect(() => {
    if (!isActive || inspectedMetrics) {
      setHoveredElement(null)
      setHoveredRect(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = getInspectableElement(e.target as Element)
      if (!target) {
        setHoveredElement(null)
        setHoveredRect(null)
        return
      }

      setHoveredElement(target)
      setHoveredRect(target.getBoundingClientRect())
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target && !target.closest(".hub-extension-root")) {
        // Prevent accidental text drag or button activation on press
        e.preventDefault()
      }
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return

      // Allow clicks on extension UI
      if (target.closest(".hub-extension-root")) return

      // Intercept page click so links/buttons don't navigate or fire actions
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      const inspectable = getInspectableElement(target)
      if (!inspectable) return

      const metrics = extractFontMetrics(inspectable)
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

    document.addEventListener("mousemove", handleMouseMove, { capture: true, passive: true })
    document.addEventListener("mousedown", handleMouseDown, { capture: true })
    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, { capture: true })
      document.removeEventListener("mousedown", handleMouseDown, { capture: true })
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [isActive, inspectedMetrics])

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
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive])

  const handleClose = () => {
    setIsActive(false)
    setInspectedMetrics(null)
    setHoveredElement(null)
    setHoveredRect(null)
    storage.set("font_finder_active", false)
  }

  if (!isActive) return null

  // Computed font details on hover
  const hoverFont = hoveredElement
    ? window.getComputedStyle(hoveredElement).fontFamily.split(",")[0].replace(/['"]/g, "").trim()
    : ""
  const hoverSize = hoveredElement ? window.getComputedStyle(hoveredElement).fontSize : ""
  const hoverWeight = hoveredElement ? window.getComputedStyle(hoveredElement).fontWeight : ""

  const pillTop = hoveredRect
    ? hoveredRect.top < 32
      ? hoveredRect.bottom + 6
      : Math.max(8, hoveredRect.top - 24)
    : 0

  const pillLeft = hoveredRect
    ? Math.max(8, Math.min(window.innerWidth - 200, hoveredRect.left))
    : 0

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""} text-neutral-900 dark:text-neutral-100 antialiased`}>
      {/* Top Floating Active Island Pill */}
      {isActive && (
        <ActiveToolBanner
          title="Font Finder"
          icon={<Type size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Click element to inspect"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Hover Bounding Box */}
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
              pointerEvents: "none",
              border: isDarkMode ? "2px solid #ffffff" : "2px solid #000000",
              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }}
            className="rounded-xs transition-all duration-75"
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
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black shadow-md font-sans text-[10px] font-bold transition-all duration-75 select-none leading-none h-[20px]"
          >
            <span>{hoverFont}</span>
            <span className="opacity-40">|</span>
            <span className="font-mono">{hoverSize}</span>
            <span className="opacity-40">|</span>
            <span>w<span className="font-mono">{hoverWeight}</span></span>
          </div>
        </>
      )}

      {/* Modal Inspector */}
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
