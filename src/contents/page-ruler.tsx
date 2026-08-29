import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef, useCallback } from "react"
import { Storage } from "@plasmohq/storage"
import { Ruler, MousePointer } from "lucide-react"
import ActiveToolBanner from "../components/ui/ActiveToolBanner"
import PageRulerModal, { type RulerMetrics } from "../components/extensions/PageRulerModal"

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

function parsePixel(val: string): number {
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

function extractElementMetrics(
  el: HTMLElement,
  referenceRect?: DOMRect | null
): RulerMetrics {
  const rect = el.getBoundingClientRect()
  const comp = window.getComputedStyle(el)

  let distanceOffsets: RulerMetrics["distanceOffsets"] = null
  if (referenceRect) {
    const topGap = Math.abs(rect.top - referenceRect.bottom)
    const bottomGap = Math.abs(rect.bottom - referenceRect.top)
    const leftGap = Math.abs(rect.left - referenceRect.right)
    const rightGap = Math.abs(rect.right - referenceRect.left)

    distanceOffsets = {
      top: Math.round(topGap),
      bottom: Math.round(bottomGap),
      left: Math.round(leftGap),
      right: Math.round(rightGap)
    }
  }

  return {
    tagName: el.tagName,
    id: el.id || undefined,
    className: typeof el.className === "string" ? el.className : undefined,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top + window.scrollY),
    left: Math.round(rect.left + window.scrollX),
    padding: {
      top: parsePixel(comp.paddingTop),
      right: parsePixel(comp.paddingRight),
      bottom: parsePixel(comp.paddingBottom),
      left: parsePixel(comp.paddingLeft)
    },
    margin: {
      top: parsePixel(comp.marginTop),
      right: parsePixel(comp.marginRight),
      bottom: parsePixel(comp.marginBottom),
      left: parsePixel(comp.marginLeft)
    },
    distanceOffsets,
    mode: "inspect"
  }
}

export default function PageRulerContentScript() {
  const [isActive, setIsActive] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [lockedElement, setLockedElement] = useState<HTMLElement | null>(null)
  const [lockedRect, setLockedRect] = useState<DOMRect | null>(null)
  const [metrics, setMetrics] = useState<RulerMetrics | null>(null)

  // Drag measurement state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const overlayRef = useRef<HTMLDivElement>(null)

  // Watch storage activation
  useEffect(() => {
    storage.get<boolean>("page_ruler_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      page_ruler_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
        if (!c.newValue) {
          setLockedElement(null)
          setLockedRect(null)
          setHoveredRect(null)
          setMetrics(null)
        }
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        if (c.newValue) setIsActive(false)
      },
      color_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) setIsActive(false)
      },
      css_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) setIsActive(false)
      },
      figma_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) setIsActive(false)
      },
      link_grabber_active: (c: { newValue?: boolean }) => {
        if (c.newValue) setIsActive(false)
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

  // Message listener (PING and activation)
  useEffect(() => {
    const handleMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      if (message?.type === "PING" || message?.type === "PING_CONTENT_SCRIPT") {
        sendResponse({ status: "ready", tool: "page-ruler" })
        return true
      }

      if (message?.type === "START_PAGE_RULER") {
        setIsActive(true)
        storage.set("page_ruler_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_PAGE_RULER" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER" ||
        message?.type === "START_LINK_GRABBER"
      ) {
        setIsActive(false)
        setLockedElement(null)
        setLockedRect(null)
        setHoveredRect(null)
        setMetrics(null)
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
    setLockedElement(null)
    setLockedRect(null)
    setHoveredRect(null)
    setMetrics(null)
    storage.set("page_ruler_active", false)
  }, [])

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      } else if (e.key.toLowerCase() === "c" && lockedElement) {
        setLockedElement(null)
        setLockedRect(null)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, lockedElement, handleClose])

  // Mouse move handler on transparent overlay
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY })

    if (isDragging && dragStart) {
      setDragCurrent({ x: e.clientX, y: e.clientY })
      return
    }

    if (!overlayRef.current) return

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) {
      setHoveredRect(null)
      return
    }

    const rect = target.getBoundingClientRect()
    setHoveredRect(rect)

    if (!lockedElement) {
      setMetrics(extractElementMetrics(target))
    } else if (lockedElement !== target) {
      setMetrics(extractElementMetrics(target, lockedRect))
    }
  }

  // Mouse down: start dragging or element selection
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (e.shiftKey) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setDragCurrent({ x: e.clientX, y: e.clientY })
      return
    }
  }

  // Mouse up
  const handleMouseUp = (_e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && dragStart && dragCurrent) {
      const left = Math.min(dragStart.x, dragCurrent.x)
      const top = Math.min(dragStart.y, dragCurrent.y)
      const width = Math.abs(dragCurrent.x - dragStart.x)
      const height = Math.abs(dragCurrent.y - dragStart.y)

      if (width > 4 && height > 4) {
        setMetrics({
          tagName: "SELECTION",
          width: Math.round(width),
          height: Math.round(height),
          top: Math.round(top + window.scrollY),
          left: Math.round(left + window.scrollX),
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          mode: "drag"
        })
      }
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      return
    }
  }

  // Click on element: lock / unlock reference element
  const handleClick = (_e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return
    if (!overlayRef.current) return

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = document.elementFromPoint(mousePos.x, mousePos.y) as HTMLElement
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    if (lockedElement === target) {
      setLockedElement(null)
      setLockedRect(null)
    } else {
      setLockedElement(target)
      setLockedRect(target.getBoundingClientRect())
      setMetrics(extractElementMetrics(target))
    }
  }

  // Drag bounding box calculation
  const dragBox =
    dragStart && dragCurrent
      ? {
          left: Math.min(dragStart.x, dragCurrent.x),
          top: Math.min(dragStart.y, dragCurrent.y),
          width: Math.abs(dragCurrent.x - dragStart.x),
          height: Math.abs(dragCurrent.y - dragStart.y)
        }
      : null

  const pillTop = hoveredRect
    ? hoveredRect.top < 32
      ? hoveredRect.bottom + 6
      : Math.max(8, hoveredRect.top - 24)
    : 0

  const pillLeft = hoveredRect
    ? Math.max(8, Math.min(window.innerWidth - 120, hoveredRect.left))
    : 0

  return (
    <div
      className={`hub-extension-root ${
        isDarkMode ? "dark" : ""
      } text-neutral-900 dark:text-neutral-100 antialiased`}
    >
      {/* 1. Full-screen Transparent Interaction Overlay */}
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
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          {/* Subtle crosshair guide lines following mouse */}
          <div
            style={{
              position: "fixed",
              top: `${mousePos.y}px`,
              left: 0,
              width: "100vw",
              height: "1px",
              pointerEvents: "none"
            }}
            className="bg-blue-500/30"
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: `${mousePos.x}px`,
              width: "1px",
              height: "100vh",
              pointerEvents: "none"
            }}
            className="bg-blue-500/30"
          />
        </div>
      )}

      {/* 2. Top Floating Active Island Pill */}
      {isActive && (
        <ActiveToolBanner
          title="Page Ruler"
          icon={<Ruler size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Hover/click element or drag to measure"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 3. Highlight Overlay on Hovered Element */}
      {isActive && hoveredRect && !isDragging && (
        <>
          <div
            style={{
              top: `${hoveredRect.top}px`,
              left: `${hoveredRect.left}px`,
              width: `${hoveredRect.width}px`,
              height: `${hoveredRect.height}px`,
              position: "fixed",
              zIndex: 2147483642,
              pointerEvents: "none",
              boxSizing: "border-box"
            }}
            className="border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-xs"
          />

          {/* Live Dimension Tag */}
          <div
            style={{
              top: `${pillTop}px`,
              left: `${pillLeft}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="px-2 py-0.5 rounded-md bg-neutral-900 dark:bg-neutral-800 text-neutral-50 shadow-md font-mono text-[10px] font-bold"
          >
            {Math.round(hoveredRect.width)} × {Math.round(hoveredRect.height)}
          </div>
        </>
      )}

      {/* 4. Highlight Overlay on Locked Reference Element */}
      {isActive && lockedRect && (
        <>
          <div
            style={{
              top: `${lockedRect.top}px`,
              left: `${lockedRect.left}px`,
              width: `${lockedRect.width}px`,
              height: `${lockedRect.height}px`,
              position: "fixed",
              zIndex: 2147483643,
              pointerEvents: "none",
              boxSizing: "border-box"
            }}
            className="border-2 border-emerald-500 bg-emerald-500/15 rounded-xs"
          />

          <div
            style={{
              top: `${Math.max(8, lockedRect.top - 22)}px`,
              left: `${lockedRect.left}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-sans text-[10px] font-bold shadow-md"
          >
            Pinned Reference
          </div>
        </>
      )}

      {/* 5. Drag-to-Measure Bounding Box */}
      {isActive && dragBox && (
        <>
          <div
            style={{
              top: `${dragBox.top}px`,
              left: `${dragBox.left}px`,
              width: `${dragBox.width}px`,
              height: `${dragBox.height}px`,
              position: "fixed",
              zIndex: 2147483644,
              pointerEvents: "none",
              boxSizing: "border-box"
            }}
            className="border-2 border-pink-500 bg-pink-500/15 rounded-xs"
          />

          <div
            style={{
              top: `${dragBox.top + dragBox.height + 6}px`,
              left: `${dragBox.left}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="px-2 py-0.5 rounded-md bg-pink-600 text-white font-mono text-[10px] font-bold shadow-md"
          >
            {Math.round(dragBox.width)} × {Math.round(dragBox.height)}
          </div>
        </>
      )}

      {/* 6. Bottom-Right Floating Dimension Guide Inspector Modal */}
      {isActive && metrics && (
        <PageRulerModal
          metrics={metrics}
          onClose={handleClose}
          isDarkMode={isDarkMode}
          isLocked={Boolean(lockedElement)}
          onUnlock={() => {
            setLockedElement(null)
            setLockedRect(null)
          }}
        />
      )}
    </div>
  )
}
