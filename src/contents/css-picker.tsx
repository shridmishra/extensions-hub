import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import { extractStyles, type ExtractedStyles } from "../lib/css-extractor"
import CssInspectorModal from "../components/extensions/CssInspectorModal"
import FigmaIslandToolbar, { type ToolbarMode, type CapturedItem } from "../components/extensions/FigmaIslandToolbar"
import { convertElementToIRAsync, convertDocumentToIRAsync, copyDirectToFigmaClipboard } from "../converter"
import FigmaPickerModal from "../components/extensions/FigmaPickerModal"
import type { IRDocument } from "../types/ir"
import { copyToClipboard } from "../lib/utils"

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
    .hub-extension-root * {
      font-family: "Satoshi", system-ui, -apple-system, sans-serif !important;
    }
  `
  return style
}

const storage = new Storage({ area: "local" })

export default function CssPickerContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [currentMode, setCurrentMode] = useState<ToolbarMode>("inspect-css")
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [inspectedStyles, setInspectedStyles] = useState<ExtractedStyles | null>(null)
  const [capturedDoc, setCapturedDoc] = useState<IRDocument | null>(null)
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([])
  const [isCapturingPage, setIsCapturingPage] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [modalPos, setModalPos] = useState({ x: Math.max(20, window.innerWidth - 390), y: 80 })
  const overlayRef = useRef<HTMLDivElement>(null)

  // Watch activation and mutual exclusion
  useEffect(() => {
    storage.get<boolean>("css_picker_active").then((val) => {
      setIsActive(!!val)
    })

    const activeCallbacks = {
      css_picker_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
      },
      font_finder_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedStyles(null)
          setCapturedDoc(null)
        }
      },
      color_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedStyles(null)
          setCapturedDoc(null)
        }
      },
      figma_picker_active: (c: { newValue?: boolean }) => {
        if (c.newValue) {
          setIsActive(false)
          setHoveredElement(null)
          setHoveredRect(null)
          setInspectedStyles(null)
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
      setInspectedStyles(null)
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
  }, [isActive, inspectedStyles, capturedDoc])

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

    const targetRect = target.getBoundingClientRect()
    const targetX = targetRect.right + 20
    const targetY = Math.max(80, targetRect.top)
    const maxX = window.innerWidth - 380
    const maxY = window.innerHeight - 100

    setModalPos({
      x: Math.max(10, Math.min(maxX, targetX > maxX ? targetRect.left - 380 : targetX)),
      y: Math.max(80, Math.min(maxY, targetY))
    })

    if (currentMode === "figma-element") {
      try {
        const doc = await convertElementToIRAsync(target)
        await copyDirectToFigmaClipboard(doc)
        setCapturedDoc(doc)
        setInspectedStyles(null)

        const tagName = target.tagName.toLowerCase()
        const newItem: CapturedItem = {
          id: `item-${Date.now()}`,
          title: tagName,
          doc
        }
        setCapturedItems((prev) => [...prev, newItem])
      } catch (err) {
        console.error("[CssPicker] Element capture error:", err)
      }
    } else {
      const styles = extractStyles(target)
      setInspectedStyles(styles)
      setCapturedDoc(null)
      await copyToClipboard(styles.tailwindClasses)
    }

    setHoveredElement(null)
    setHoveredRect(null)
  }

  const handleCaptureFullPage = async (): Promise<IRDocument> => {
    setIsCapturingPage(true)
    try {
      const doc = await convertDocumentToIRAsync({ captureMode: "fullPage" })
      await copyDirectToFigmaClipboard(doc)
      setCapturedDoc(doc)
      setInspectedStyles(null)

      const newItem: CapturedItem = {
        id: `page-${Date.now()}`,
        title: "Full Page",
        doc
      }
      setCapturedItems((prev) => [...prev, newItem])

      setModalPos({
        x: Math.max(10, window.innerWidth - 390),
        y: 80
      })

      return doc
    } finally {
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
    setInspectedStyles(null)
    setCapturedDoc(null)
    setHoveredElement(null)
    setHoveredRect(null)
    storage.set("css_picker_active", false)
    storage.set("figma_picker_active", false)
  }

  if (!isActive) return null

  const isFigmaMode = currentMode === "figma-element"
  const hoverTag = hoveredElement?.tagName.toLowerCase() || ""
  const hoverClass = hoveredElement?.className && typeof hoveredElement.className === "string"
    ? `.${hoverElementClass(hoveredElement.className)}`
    : ""
  const hoverDimensions = hoveredRect
    ? `${Math.round(hoveredRect.width)} × ${Math.round(hoveredRect.height)}`
    : ""

  return (
    <div className={`hub-extension-root ${isDarkMode ? "dark" : ""} text-neutral-900 dark:text-neutral-100 antialiased`}>
      {/* 1. Seamless Floating Island Toolbar at Top Center */}
      <FigmaIslandToolbar
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode)
          setInspectedStyles(null)
          setCapturedDoc(null)
        }}
        onCapturePage={handleCaptureFullPage}
        onCopyAll={handleCopyAll}
        onClose={handleClose}
        capturedItems={capturedItems}
        onSelectCapturedItem={(item) => {
          copyDirectToFigmaClipboard(item.doc)
          setCapturedDoc(item.doc)
          setInspectedStyles(null)
        }}
        isDarkMode={isDarkMode}
        isCapturingPage={isCapturingPage}
      />

      {/* 2. Overlay across viewport */}
      {isActive && !inspectedStyles && !capturedDoc && (
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
      {isActive && hoveredRect && !inspectedStyles && !capturedDoc && (
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
              border: isFigmaMode
                ? isDarkMode ? "2px solid #a855f7" : "2px solid #9333ea"
                : isDarkMode ? "2px solid #3b82f6" : "2px solid #2563eb",
              backgroundColor: isFigmaMode ? "rgba(168, 85, 247, 0.08)" : "rgba(59, 130, 246, 0.08)"
            }}
            className="rounded-xs transition-all duration-75"
          />

          <div
            style={{
              top: `${Math.max(68, hoveredRect.top - 24)}px`,
              left: `${Math.max(10, hoveredRect.left)}px`,
              position: "fixed",
              zIndex: 2147483646,
              pointerEvents: "none"
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
              isFigmaMode ? "bg-purple-600" : "bg-blue-600"
            } text-white shadow-md font-mono text-[10px] font-bold transition-all duration-75 select-none leading-none h-[20px]`}
          >
            <span>&lt;{hoverTag}&gt;{hoverClass}</span>
            <span className="opacity-40">|</span>
            <span>{hoverDimensions}</span>
            <span className="opacity-40">|</span>
            <span className="text-[9px] font-black uppercase">
              {isFigmaMode ? "Click to Copy Figma" : "Click to Copy CSS"}
            </span>
          </div>
        </>
      )}

      {/* 4. Inspector Modal */}
      {inspectedStyles && (
        <div style={{ pointerEvents: "auto" }}>
          <CssInspectorModal
            styles={inspectedStyles}
            onClose={() => setInspectedStyles(null)}
            isDarkMode={isDarkMode}
            position={modalPos}
            setPosition={setModalPos}
          />
        </div>
      )}

      {/* 5. Figma Confirmation Modal */}
      {capturedDoc && (
        <div style={{ pointerEvents: "auto" }}>
          <FigmaPickerModal
            document={capturedDoc}
            onClose={() => setCapturedDoc(null)}
            isDarkMode={isDarkMode}
            position={modalPos}
            setPosition={setModalPos}
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
