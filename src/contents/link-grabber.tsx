import cssText from "data-text:~style.css"
import satoshiFontUrl from "url:~assets/Satoshi-Regular.woff2"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState, useCallback } from "react"
import { Storage } from "@plasmohq/storage"
import { Image as ImageIcon, MousePointer } from "lucide-react"
import ActiveToolBanner from "../components/ui/ActiveToolBanner"
import MediaGrabberModal, {
  type ExtractedMediaItem
} from "../components/extensions/MediaGrabberModal"

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

function getMediaExtension(url: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname
    const ext = pathname.split(".").pop()?.toLowerCase() || ""
    if (["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "bmp", "ico"].includes(ext)) {
      return ext === "jpeg" ? "JPG" : ext.toUpperCase()
    }
    if (["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) {
      return "VIDEO"
    }
    if (url.startsWith("data:image/svg")) return "SVG"
    if (url.startsWith("data:image/png")) return "PNG"
    if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) return "JPG"
    if (url.startsWith("data:image/webp")) return "WEBP"
    if (url.startsWith("data:image/gif")) return "GIF"
    return "IMAGE"
  } catch {
    return "IMAGE"
  }
}

function getMediaFileName(url: string, defaultName: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname
    const fileName = pathname.split("/").pop()?.split("?")[0]
    return fileName && fileName.length > 2 ? fileName : defaultName
  } catch {
    return defaultName
  }
}

function scanPageMedia(): ExtractedMediaItem[] {
  const mediaList: ExtractedMediaItem[] = []
  const seenUrls = new Set<string>()

  // 1. Scan <img> elements
  document.querySelectorAll("img").forEach((img, idx) => {
    const src = img.getAttribute("src") || img.currentSrc || (img as any).src
    if (!src) return

    try {
      const fullUrl = new URL(src, window.location.href).href
      if (seenUrls.has(fullUrl)) return
      seenUrls.add(fullUrl)

      const type = getMediaExtension(fullUrl)
      const name = getMediaFileName(fullUrl, `image-${idx + 1}.${type.toLowerCase()}`)

      mediaList.push({
        id: `img-${idx}-${Date.now()}`,
        url: fullUrl,
        name,
        alt: img.alt || img.getAttribute("title") || undefined,
        width: img.naturalWidth || img.width || undefined,
        height: img.naturalHeight || img.height || undefined,
        type,
        isSvg: type === "SVG"
      })
    } catch {}
  })

  // 2. Scan <picture> and <source> elements
  document.querySelectorAll("picture source[srcset]").forEach((srcEl, idx) => {
    const srcset = srcEl.getAttribute("srcset")
    if (!srcset) return

    const candidate = srcset.split(",")[0]?.trim().split(" ")[0]
    if (!candidate) return

    try {
      const fullUrl = new URL(candidate, window.location.href).href
      if (seenUrls.has(fullUrl)) return
      seenUrls.add(fullUrl)

      const type = getMediaExtension(fullUrl)
      mediaList.push({
        id: `pic-src-${idx}-${Date.now()}`,
        url: fullUrl,
        name: getMediaFileName(fullUrl, `picture-${idx + 1}.${type.toLowerCase()}`),
        type,
        isSvg: type === "SVG"
      })
    } catch {}
  })

  // 3. Scan inline <svg> elements
  document.querySelectorAll("svg").forEach((svg, idx) => {
    if (svg.closest(".hub-extension-root")) return
    const rect = svg.getBoundingClientRect()
    if (rect.width < 6 || rect.height < 6) return

    try {
      const clone = svg.cloneNode(true) as SVGElement
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      }
      if (!clone.getAttribute("viewBox") && rect.width && rect.height) {
        clone.setAttribute("viewBox", `0 0 ${Math.round(rect.width)} ${Math.round(rect.height)}`)
      }

      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(clone)
      const encodedSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

      const svgId = `inline-svg-${idx}-${Date.now()}`
      mediaList.push({
        id: svgId,
        url: encodedSvg,
        name: `vector-icon-${idx + 1}.svg`,
        alt: svg.getAttribute("aria-label") || svg.querySelector("title")?.textContent || "SVG Vector",
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        type: "SVG",
        isSvg: true,
        svgContent: svgString
      })
    } catch {}
  })

  // 4. Scan <video> and video poster elements
  document.querySelectorAll("video").forEach((video, idx) => {
    const poster = video.getAttribute("poster")
    if (poster) {
      try {
        const posterUrl = new URL(poster, window.location.href).href
        if (!seenUrls.has(posterUrl)) {
          seenUrls.add(posterUrl)
          mediaList.push({
            id: `video-poster-${idx}-${Date.now()}`,
            url: posterUrl,
            name: getMediaFileName(posterUrl, `video-poster-${idx + 1}.jpg`),
            type: "JPG"
          })
        }
      } catch {}
    }

    const videoSrc = video.getAttribute("src") || video.querySelector("source")?.getAttribute("src")
    if (videoSrc) {
      try {
        const fullUrl = new URL(videoSrc, window.location.href).href
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl)
          mediaList.push({
            id: `video-${idx}-${Date.now()}`,
            url: fullUrl,
            name: getMediaFileName(fullUrl, `video-${idx + 1}.mp4`),
            type: "VIDEO"
          })
        }
      } catch {}
    }
  })

  // 5. Scan CSS background-image across DOM elements
  document.querySelectorAll("div, section, header, banner, a, span, button").forEach((el, idx) => {
    if (el.closest(".hub-extension-root")) return
    const bg = window.getComputedStyle(el).backgroundImage
    if (bg && bg.includes("url(")) {
      const match = bg.match(/url\(["']?([^"')]+)["']?\)/)
      if (match && match[1] && !match[1].startsWith("data:")) {
        try {
          const fullUrl = new URL(match[1], window.location.href).href
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl)
            const type = getMediaExtension(fullUrl)
            mediaList.push({
              id: `bg-media-${idx}-${Date.now()}`,
              url: fullUrl,
              name: getMediaFileName(fullUrl, `background-${idx + 1}.${type.toLowerCase()}`),
              alt: "Background Image",
              type,
              isSvg: type === "SVG"
            })
          }
        } catch {}
      }
    }
  })

  // 6. Scan Favicons and Apple Touch Icons
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]').forEach((linkEl, idx) => {
    const href = linkEl.getAttribute("href")
    if (href) {
      try {
        const fullUrl = new URL(href, window.location.href).href
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl)
          const type = getMediaExtension(fullUrl)
          mediaList.push({
            id: `icon-media-${idx}-${Date.now()}`,
            url: fullUrl,
            name: getMediaFileName(fullUrl, `site-icon-${idx + 1}.${type.toLowerCase()}`),
            alt: "Site Icon",
            type,
            isSvg: type === "SVG"
          })
        }
      } catch {}
    }
  })

  return mediaList
}

export default function LinkGrabberContentScript() {
  const [isActive, setIsActive] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mediaItems, setMediaItems] = useState<ExtractedMediaItem[]>([])

  // Watch storage activation
  useEffect(() => {
    storage.get<boolean>("link_grabber_active").then((val) => {
      setIsActive(!!val)
      if (val) {
        setMediaItems(scanPageMedia())
      }
    })

    const activeCallbacks = {
      link_grabber_active: (c: { newValue?: boolean }) => {
        setIsActive(!!c.newValue)
        if (c.newValue) {
          setMediaItems(scanPageMedia())
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
        sendResponse({ status: "ready", tool: "link-grabber" })
        return true
      }

      if (message?.type === "START_LINK_GRABBER") {
        setIsActive(true)
        setMediaItems(scanPageMedia())
        storage.set("link_grabber_active", true)
        sendResponse({ success: true })
        return true
      }

      if (
        message?.type === "STOP_LINK_GRABBER" ||
        message?.type === "START_FONT_FINDER" ||
        message?.type === "START_COLOR_PICKER" ||
        message?.type === "START_CSS_PICKER" ||
        message?.type === "START_ELEMENT_SELECTION" ||
        message?.type === "START_FIGMA_PICKER" ||
        message?.type === "START_PAGE_RULER"
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
    storage.set("link_grabber_active", false)
  }, [])

  // Keyboard shortcut listener
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

  return (
    <div
      className={`hub-extension-root ${
        isDarkMode ? "dark" : ""
      } text-neutral-900 dark:text-neutral-100 antialiased`}
    >
      {/* 1. Top Floating Active Island Pill */}
      {isActive && (
        <ActiveToolBanner
          title="Media Grabber"
          icon={<ImageIcon size={13} className="text-neutral-900 dark:text-neutral-100" />}
          instruction="Browsing page media & assets"
          instructionIcon={<MousePointer size={12} />}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 2. Bottom-Right Floating Media Grabber Modal */}
      {isActive && (
        <MediaGrabberModal
          media={mediaItems}
          onClose={handleClose}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}
