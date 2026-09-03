import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import {
  Camera,
  Maximize2,
  Crop,
  MousePointer,
  Layers,
  Check,
  X,
  Loader2
} from "lucide-react"
import type { ScreenshotData, CaptureMode } from "../types/screenshot"
import ActiveToolBanner from "../components/ui/ActiveToolBanner"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import ScreenshotModal from "../components/extensions/ScreenshotModal"

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function ScreenshotCaptureContentScript() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isHidingForCapture, setIsHidingForCapture] = useState<boolean>(false)

  // Modes: "ready" | "capturing_full" | "selecting_area" | "selecting_element" | "preview"
  const [appMode, setAppMode] = useState<
    "ready" | "capturing_full" | "selecting_area" | "selecting_element" | "preview"
  >("ready")
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0
  })
  const [screenshot, setScreenshot] = useState<ScreenshotData | null>(null)

  // Area Selection State
  const [areaDrag, setAreaDrag] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
    isDragging: boolean
  } | null>(null)

  // Element Selection State
  const [hoveredElementRect, setHoveredElementRect] = useState<{
    rect: DOMRect
    tagName: string
  } | null>(null)

  // 1. Sync Storage & Mutual Exclusion
  useEffect(() => {
    storage.get<boolean>("screenshot_capture_active").then((val) => {
      setIsActive(!!val)
      if (val) {
        setAppMode("ready")
      }
    })

    const activeCallbacks = {
      screenshot_capture_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
        if (c.newValue) {
          setAppMode("ready")
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
      page_ruler_active: (c: { newValue?: boolean }) => {
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

  // Sync Theme
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

  // 2. Messaging Listener
  useEffect(() => {
    const handleMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      if (message?.type === "PING" || message?.type === "PING_CONTENT_SCRIPT") {
        sendResponse({ status: "ready", tool: "screenshot-capture" })
        return true
      }

      if (message?.type === "START_SCREENSHOT_CAPTURE") {
        setIsActive(true)
        setAppMode("ready")
        storage.set("screenshot_capture_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_SCREENSHOT_CAPTURE" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER" ||
        message?.type === "START_PAGE_RULER" ||
        message?.type === "START_LINK_GRABBER"
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

  const handleClose = useCallback(() => {
    setIsActive(false)
    setAppMode("ready")
    setScreenshot(null)
    setAreaDrag(null)
    setHoveredElementRect(null)
    storage.set("screenshot_capture_active", false)
  }, [])

  // Keyboard Shortcuts (Esc to close/cancel)
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (appMode === "selecting_area" || appMode === "selecting_element") {
          setAppMode("ready")
          setAreaDrag(null)
          setHoveredElementRect(null)
        } else {
          handleClose()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, appMode, handleClose])

  // ── CAPTURE PIPELINES ──

  // 1. FULL PAGE CAPTURE
  const handleCaptureFullPage = async () => {
    if (appMode === "capturing_full") return
    setAppMode("capturing_full")

    const originalX = window.scrollX
    const originalY = window.scrollY
    const originalOverflow = document.documentElement.style.overflow

    try {
      const fullWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        window.innerWidth
      )
      const fullHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      )
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      // Hide scrollbars & extension UI
      document.documentElement.style.overflow = "hidden"
      setIsHidingForCapture(true)
      await sleep(100)

      // Calculate scroll coordinates
      const yPositions: number[] = []
      let currentY = 0
      while (currentY < fullHeight) {
        yPositions.push(currentY)
        if (currentY + viewportHeight >= fullHeight) {
          break
        }
        currentY += viewportHeight - 20 // 20px overlap for seamless stitch
      }

      // If document has only 1 viewport
      if (yPositions.length === 0) {
        yPositions.push(0)
      }

      const totalChunks = yPositions.length
      setProgress({ current: 0, total: totalChunks, percent: 0 })

      // Create destination canvas
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(fullWidth * dpr)
      canvas.height = Math.round(fullHeight * dpr)
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not initialize 2D canvas context")

      ctx.imageSmoothingEnabled = true

      for (let i = 0; i < yPositions.length; i++) {
        const y = yPositions[i]
        window.scrollTo({ left: 0, top: y, behavior: "instant" })
        await sleep(160) // Wait for render and sticky headers

        // Request background visible tab capture
        const res = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB", format: "png" }, resolve)
        })

        if (!res?.dataUrl) {
          throw new Error("Background failed to capture tab slice")
        }

        const img = await loadImage(res.dataUrl)

        // Draw captured slice
        const destY = y * dpr
        const destHeight = Math.min(viewportHeight, fullHeight - y) * dpr
        const sourceHeight = destHeight

        ctx.drawImage(
          img,
          0,
          0,
          Math.round(viewportWidth * dpr),
          Math.round(sourceHeight),
          0,
          Math.round(destY),
          Math.round(fullWidth * dpr),
          Math.round(destHeight)
        )

        const currentStep = i + 1
        setProgress({
          current: currentStep,
          total: totalChunks,
          percent: Math.round((currentStep / totalChunks) * 100)
        })
      }

      const stitchedDataUrl = canvas.toDataURL("image/png")

      setScreenshot({
        id: `screenshot-${Date.now()}`,
        dataUrl: stitchedDataUrl,
        width: fullWidth,
        height: fullHeight,
        devicePixelRatio: dpr,
        mode: "full",
        title: document.title || "Full Page Screenshot",
        url: window.location.href,
        timestamp: Date.now()
      })

      setAppMode("preview")
    } catch (err) {
      console.error("[Hub] Full page capture error:", err)
      setAppMode("ready")
    } finally {
      document.documentElement.style.overflow = originalOverflow
      window.scrollTo(originalX, originalY)
      setIsHidingForCapture(false)
    }
  }

  // 2. VIEWPORT CAPTURE
  const handleCaptureViewport = async () => {
    setIsHidingForCapture(true)
    await sleep(80)

    try {
      const res = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB", format: "png" }, resolve)
      })

      if (!res?.dataUrl) return

      const dpr = window.devicePixelRatio || 1
      setScreenshot({
        id: `screenshot-${Date.now()}`,
        dataUrl: res.dataUrl,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: dpr,
        mode: "viewport",
        title: document.title || "Viewport Screenshot",
        url: window.location.href,
        timestamp: Date.now()
      })
      setAppMode("preview")
    } catch (err) {
      console.error("[Hub] Viewport capture error:", err)
      setAppMode("ready")
    } finally {
      setIsHidingForCapture(false)
    }
  }

  // 3. AREA MARQUEE CAPTURE
  const handleStartAreaSelection = () => {
    setAppMode("selecting_area")
    setAreaDrag(null)
  }

  const handleAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (appMode !== "selecting_area") return
    setAreaDrag({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: true
    })
  }

  const handleAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!areaDrag?.isDragging) return
    setAreaDrag((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null))
  }

  const handleAreaMouseUp = async () => {
    if (!areaDrag || !areaDrag.isDragging) return

    const x = Math.min(areaDrag.startX, areaDrag.currentX)
    const y = Math.min(areaDrag.startY, areaDrag.currentY)
    const width = Math.abs(areaDrag.currentX - areaDrag.startX)
    const height = Math.abs(areaDrag.currentY - areaDrag.startY)

    setAreaDrag(null)

    if (width < 10 || height < 10) {
      return
    }

    setIsHidingForCapture(true)
    await sleep(80)

    try {
      const res = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB", format: "png" }, resolve)
      })

      if (!res?.dataUrl) return

      const img = await loadImage(res.dataUrl)
      const dpr = window.devicePixelRatio || 1

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(
        img,
        Math.round(x * dpr),
        Math.round(y * dpr),
        Math.round(width * dpr),
        Math.round(height * dpr),
        0,
        0,
        canvas.width,
        canvas.height
      )

      const croppedUrl = canvas.toDataURL("image/png")
      setScreenshot({
        id: `screenshot-${Date.now()}`,
        dataUrl: croppedUrl,
        width: Math.round(width),
        height: Math.round(height),
        devicePixelRatio: dpr,
        mode: "area",
        title: document.title || "Selected Area Screenshot",
        url: window.location.href,
        timestamp: Date.now()
      })
      setAppMode("preview")
    } catch (err) {
      console.error("[Hub] Area capture error:", err)
      setAppMode("ready")
    } finally {
      setIsHidingForCapture(false)
    }
  }

  // 4. ELEMENT PICKER CAPTURE
  const handleStartElementSelection = () => {
    setAppMode("selecting_element")
    setHoveredElementRect(null)
  }

  useEffect(() => {
    if (appMode !== "selecting_element" || !isActive) return

    const isEventInsideExtension = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : []
      return path.some((el: any) => {
        if (!el) return false
        if (el.classList && typeof el.classList.contains === "function" && el.classList.contains("hub-extension-root")) return true
        if (el.id === "plasmo-shadow-container") return true
        if (el.tagName && el.tagName.toLowerCase() === "plasmo-csui") return true
        return false
      })
    }

    const handleMouseOver = (e: MouseEvent) => {
      if (isEventInsideExtension(e)) return
      const target = e.target as HTMLElement
      if (!target) return

      const rect = target.getBoundingClientRect()
      setHoveredElementRect({
        rect,
        tagName: target.tagName.toLowerCase()
      })
    }

    const handleClickElement = async (e: MouseEvent) => {
      if (isEventInsideExtension(e)) return
      const target = e.target as HTMLElement
      if (!target) return

      e.preventDefault()
      e.stopPropagation()

      const rect = target.getBoundingClientRect()
      setHoveredElementRect(null)
      setIsHidingForCapture(true)
      await sleep(80)

      try {
        const res = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB", format: "png" }, resolve)
        })

        if (!res?.dataUrl) return

        const img = await loadImage(res.dataUrl)
        const dpr = window.devicePixelRatio || 1

        const width = Math.max(1, rect.width)
        const height = Math.max(1, rect.height)

        const canvas = document.createElement("canvas")
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(
          img,
          Math.round(rect.left * dpr),
          Math.round(rect.top * dpr),
          Math.round(width * dpr),
          Math.round(height * dpr),
          0,
          0,
          canvas.width,
          canvas.height
        )

        const croppedUrl = canvas.toDataURL("image/png")
        setScreenshot({
          id: `screenshot-${Date.now()}`,
          dataUrl: croppedUrl,
          width: Math.round(width),
          height: Math.round(height),
          devicePixelRatio: dpr,
          mode: "element",
          title: `<${target.tagName.toLowerCase()}> Element Screenshot`,
          url: window.location.href,
          timestamp: Date.now()
        })
        setAppMode("preview")
      } catch (err) {
        console.error("[Hub] Element capture error:", err)
        setAppMode("ready")
      } finally {
        setIsHidingForCapture(false)
      }
    }

    document.addEventListener("mouseover", handleMouseOver, true)
    document.addEventListener("click", handleClickElement, true)

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true)
      document.removeEventListener("click", handleClickElement, true)
    }
  }, [appMode, isActive])

  if (!isActive) return null

  const renderBannerInstruction = () => {
    if (appMode === "capturing_full") {
      return `Capturing full page (${progress.percent}%)`
    }
    if (appMode === "selecting_area") {
      return "Drag a rectangle to capture"
    }
    if (appMode === "selecting_element") {
      return "Click any element to capture"
    }
    if (appMode === "preview") {
      return "Screenshot ready to copy or download"
    }
    return "Select capture mode"
  }

  const renderBannerIcon = () => {
    if (appMode === "capturing_full") {
      return <Loader2 size={13} className="animate-spin text-neutral-900 dark:text-neutral-100" />
    }
    if (appMode === "selecting_area") {
      return <Crop size={13} className="text-neutral-900 dark:text-neutral-100" />
    }
    if (appMode === "selecting_element") {
      return <Layers size={13} className="text-neutral-900 dark:text-neutral-100" />
    }
    return <Camera size={13} className="text-neutral-900 dark:text-neutral-100" />
  }

  return (
    <div
      className={`hub-extension-root ${
        isDarkMode ? "dark" : ""
      } text-neutral-900 dark:text-neutral-100 antialiased`}
    >
      {/* 1. Top Floating Active Island Banner */}
      {!isHidingForCapture && appMode === "ready" && (
        <ActiveToolBanner
          title="Page Screenshot"
          icon={<Camera size={13} className="text-neutral-900 dark:text-neutral-100" />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        >
          <div className="w-px h-3.5 bg-neutral-200/80 dark:bg-neutral-800/80 shrink-0" />
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCaptureFullPage}
              title="Capture entire scrolling webpage"
              className="h-6 px-2.5 text-xs font-semibold gap-1 shrink-0 rounded-full text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800"
            >
              <Camera size={12} className="stroke-[2.2]" />
              <span>Full Page</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCaptureViewport}
              title="Capture visible screen area"
              className="h-6 px-2.5 text-xs font-semibold gap-1 shrink-0 rounded-full text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800"
            >
              <Maximize2 size={12} className="stroke-[2.2]" />
              <span>Viewport</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartAreaSelection}
              title="Drag marquee box to capture custom area"
              className="h-6 px-2.5 text-xs font-semibold gap-1 shrink-0 rounded-full text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800"
            >
              <Crop size={12} className="stroke-[2.2]" />
              <span>Area</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartElementSelection}
              title="Hover and click any element to capture"
              className="h-6 px-2.5 text-xs font-semibold gap-1 shrink-0 rounded-full text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800"
            >
              <Layers size={12} className="stroke-[2.2]" />
              <span>Element</span>
            </Button>
          </div>
        </ActiveToolBanner>
      )}

      {!isHidingForCapture && appMode === "capturing_full" && (
        <ActiveToolBanner
          title="Page Screenshot"
          icon={<Loader2 size={13} className="animate-spin text-neutral-900 dark:text-neutral-100" />}
          instruction={`Capturing full page (${progress.percent}%) • ${progress.current}/${progress.total}`}
          instructionIcon={<Camera size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {!isHidingForCapture && appMode === "selecting_area" && (
        <ActiveToolBanner
          title="Page Screenshot"
          icon={<Crop size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Drag a box to capture area"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {!isHidingForCapture && appMode === "selecting_element" && (
        <ActiveToolBanner
          title="Page Screenshot"
          icon={<Layers size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Click any element to capture"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 2. Interactive Area Selection Drag Layer */}
      {appMode === "selecting_area" && (
        <div
          onMouseDown={handleAreaMouseDown}
          onMouseMove={handleAreaMouseMove}
          onMouseUp={handleAreaMouseUp}
          className="fixed inset-0 z-[2147483646] cursor-crosshair bg-neutral-950/20 backdrop-blur-[0.5px] pointer-events-auto"
        >
          {areaDrag && areaDrag.isDragging && (
            <div
              className="absolute border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900/15 dark:bg-neutral-100/15 pointer-events-none rounded-xs"
              style={{
                left: Math.min(areaDrag.startX, areaDrag.currentX),
                top: Math.min(areaDrag.startY, areaDrag.currentY),
                width: Math.abs(areaDrag.currentX - areaDrag.startX),
                height: Math.abs(areaDrag.currentY - areaDrag.startY)
              }}
            >
              <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-mono font-bold leading-none shadow-xs">
                {Math.round(Math.abs(areaDrag.currentX - areaDrag.startX))} ×{" "}
                {Math.round(Math.abs(areaDrag.currentY - areaDrag.startY))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Element Hover Box Highlight */}
      {appMode === "selecting_element" && hoveredElementRect && (
        <div
          className="fixed pointer-events-none z-[2147483646] border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900/10 dark:bg-neutral-100/10 rounded-xs transition-all duration-75"
          style={{
            left: hoveredElementRect.rect.left,
            top: hoveredElementRect.rect.top,
            width: hoveredElementRect.rect.width,
            height: hoveredElementRect.rect.height
          }}
        >
          <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-bold leading-none shadow-xs flex items-center gap-1">
            <span>&lt;{hoveredElementRect.tagName}&gt;</span>
            <span className="font-mono">
              {Math.round(hoveredElementRect.rect.width)} × {Math.round(hoveredElementRect.rect.height)}
            </span>
          </div>
        </div>
      )}

      {/* 4. Bottom-Right Floating Screenshot Preview & Export Modal */}
      {appMode === "preview" && screenshot && (
        <ScreenshotModal
          screenshot={screenshot}
          onClose={handleClose}
          onRetake={() => setAppMode("ready")}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}
