import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import { convertElementToIRAsync, convertDocumentToIRAsync, copyDirectToFigmaClipboard } from "../converter"
import type { IRDocument } from "../types/ir"
import FigmaPickerModal from "../components/extensions/FigmaPickerModal"
import FigmaIslandToolbar, { type ToolbarMode, type CapturedItem } from "../components/extensions/FigmaIslandToolbar"

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

export default function FigmaPickerContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [currentMode, setCurrentMode] = useState<ToolbarMode>("figma-element")
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [capturedDoc, setCapturedDoc] = useState<IRDocument | null>(null)
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([])
  const [isCapturingPage, setIsCapturingPage] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Watch activation and mutual exclusion
  useEffect(() => {
    storage.get<boolean>("figma_picker_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      figma_picker_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setCapturedDoc(null)
        }
      },
      color_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setCapturedDoc(null)
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

  // Listen for message-based triggers from Popup and background
  useEffect(() => {
    const handleMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      if (message?.type === "PING" || message?.type === "PING_CONTENT_SCRIPT") {
        sendResponse({ status: "ready", tool: "figma-picker" })
        return true
      }

      if (message?.type === "START_ELEMENT_SELECTION" || message?.type === "START_FIGMA_PICKER") {
        setIsActive(true)
        setCurrentMode("figma-element")
        setHoveredElement(null)
        setHoveredRect(null)
        setCapturedDoc(null)
        storage.set("figma_picker_active", true)
        sendResponse({ success: true })
        return true
      }

      if (message?.type === "CAPTURE_FULL_PAGE") {
        handleCaptureFullPage()
          .then((doc) => {
            sendResponse({ success: true, data: doc })
          })
          .catch((err) => {
            sendResponse({ success: false, error: err?.message })
          })
        return true
      }

      if (
        message?.type === "STOP_FIGMA_PICKER" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER"
      ) {
        setIsActive(false)
        setHoveredElement(null)
        setHoveredRect(null)
        setCapturedDoc(null)
        sendResponse({ success: true })
        return true
      }
    }

    chrome.runtime?.onMessage?.addListener(handleMessage)
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage)
    }
  }, [])

  // Handle scroll and resize
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

  // Esc key listener
  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null)
      setHoveredRect(null)
      setCapturedDoc(null)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive, capturedDoc])

  const getTargetFromPoint = (clientX: number, clientY: number): HTMLElement | null => {
    if (typeof document === "undefined") return null
    const elements = document.elementsFromPoint(clientX, clientY)
    for (const el of elements) {
      if (el.closest(".hub-extension-root") || el.tagName.toLowerCase().startsWith("plasmo-")) {
        continue
      }
      const header = el.closest("header, nav, [role='banner']") as HTMLElement
      if (header && !header.closest(".hub-extension-root")) {
        const r = header.getBoundingClientRect()
        if (clientY >= r.top && clientY <= r.bottom + 12) {
          return header
        }
      }
      return el as HTMLElement
    }
    return null
  }

  const handleMouseMoveOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    overlayRef.current.style.setProperty("pointer-events", "none", "important")
    const target = getTargetFromPoint(e.clientX, e.clientY)
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
    const target = getTargetFromPoint(e.clientX, e.clientY)
    overlayRef.current.style.setProperty("pointer-events", "auto", "important")

    if (!target || target.closest(".hub-extension-root")) return

    // Figma element capture
    try {
      const doc = await convertElementToIRAsync(target)
      await copyDirectToFigmaClipboard(doc)
      setCapturedDoc(doc)

      const tagName = target.tagName.toLowerCase()
      const newItem: CapturedItem = {
        id: `item-${Date.now()}`,
        title: tagName,
        doc
      }
      setCapturedItems((prev) => [...prev, newItem])
    } catch (err) {
      console.error("[FigmaPicker] Element capture error:", err)
    }

    setHoveredElement(null)
    setHoveredRect(null)
  }

async function preparePageForCapture(): Promise<() => void> {
  const originalScrollX = window.scrollX || window.pageXOffset || 0
  const originalScrollY = window.scrollY || window.pageYOffset || 0
  const totalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  const step = Math.max(window.innerHeight * 0.75, 500)

  // 1. Scroll in increments to trigger IntersectionObserver, lazy images, and ScrollTrigger
  try {
    for (let y = 0; y <= totalHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 30))
    }
    window.scrollTo(0, totalHeight)
    await new Promise((r) => setTimeout(r, 40))

    // Trigger any global GSAP ScrollTrigger if present
    const win = window as any
    if (win.ScrollTrigger?.getAll) {
      win.ScrollTrigger.getAll().forEach((st: any) => {
        if (typeof st.refresh === "function") st.refresh()
      })
    }
  } catch {}

  // 2. Scroll cleanly to top for full-page capture so navbar and top elements are at natural y=0
  try {
    const win = window as any
    if (win.lenis && typeof win.lenis.scrollTo === "function") {
      win.lenis.scrollTo(0, { immediate: true })
    }
  } catch {}
  window.scrollTo({ left: 0, top: 0, behavior: "instant" as ScrollBehavior })

  // 3. Wait for Lenis and CSS transitions (e.g. duration-500 on fixed headers) to settle
  await new Promise((r) => setTimeout(r, 450))

  return () => {
    try {
      const win = window as any
      if (win.lenis && typeof win.lenis.scrollTo === "function") {
        win.lenis.scrollTo(originalScrollY, { immediate: true })
      }
    } catch {}
    window.scrollTo(originalScrollX, originalScrollY)
  }
}

  const handleCaptureFullPage = async (): Promise<IRDocument> => {
    setIsCapturingPage(true)
    let restoreScroll: (() => void) | null = null
    try {
      restoreScroll = await preparePageForCapture()
      const doc = await convertDocumentToIRAsync({ captureMode: "fullPage" })
      await copyDirectToFigmaClipboard(doc)
      setCapturedDoc(doc)

      const newItem: CapturedItem = {
        id: `page-${Date.now()}`,
        title: "Full Page",
        doc
      }
      setCapturedItems((prev) => [...prev, newItem])

      return doc
    } finally {
      if (restoreScroll) restoreScroll()
      setIsCapturingPage(false)
    }
  }

  const handleCopyAll = async () => {
    if (capturedItems.length === 0) return
    const latest = capturedItems[capturedItems.length - 1]
    await copyDirectToFigmaClipboard(latest.doc)
  }

  const handleClose = () => {
    setIsActive(false)
    setCapturedDoc(null)
    setHoveredElement(null)
    setHoveredRect(null)
    storage.set("figma_picker_active", false)
  }

  if (!isActive) return null

  const hoverTag = hoveredElement?.tagName.toLowerCase() || ""
  const hoverClass =
    hoveredElement?.className && typeof hoveredElement.className === "string"
      ? `.${hoverElementClass(hoveredElement.className)}`
      : ""
  const hoverDimensions = hoveredRect
    ? `${Math.round(hoveredRect.width)} × ${Math.round(hoveredRect.height)}`
    : ""

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""} text-neutral-900 dark:text-neutral-100 antialiased`}>
      {/* 1. Seamless Floating Island Toolbar Centered at Top */}
      <FigmaIslandToolbar
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode)
          setCapturedDoc(null)
        }}
        onCapturePage={handleCaptureFullPage}
        onClose={handleClose}
        isDarkMode={isDarkMode}
        isCapturingPage={isCapturingPage}
      />

      {/* 2. Overlay across viewport for hover & click inspection */}
      {isActive && !capturedDoc && (
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
      {isActive && hoveredRect && !capturedDoc && (
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
            className="rounded-xs transition-all duration-75 border-2 border-purple-500 bg-purple-500/10"
          />

          <div
            style={{
              top: `${Math.max(68, hoveredRect.top - 24)}px`,
              left: `${Math.max(10, hoveredRect.left)}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-md font-sans text-[10px] font-bold transition-all duration-75 select-none leading-none h-[20px]"
          >
            <span>&lt;{hoverTag}&gt;{hoverClass}</span>
            <span className="opacity-40">|</span>
            <span className="font-mono">{hoverDimensions}</span>
            <span className="opacity-40">|</span>
            <span className="text-[10px] font-extrabold">Click to Copy for Figma</span>
          </div>
        </>
      )}

      {/* 4. Figma Confirmation Modal */}
      {capturedDoc && (
        <div style={{ pointerEvents: "auto" }}>
          <FigmaPickerModal
            document={capturedDoc}
            onClose={handleClose}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  )
}

function hoverElementClass(className: string): string {
  if (!className || typeof className !== "string") return ""
  return className.trim().split(/\s+/)[0] || ""
}
