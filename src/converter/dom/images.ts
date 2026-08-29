import type { IRDocument, IRNode } from "../../types/ir"

/**
 * Resolves an image URL into a base64 Data URL using canvas, direct fetch,
 * or Chrome background service worker messaging.
 */
export async function resolveImageDataUrl(
  url: string,
  imgEl?: HTMLImageElement
): Promise<string | null> {
  if (!url || typeof url !== "string") return null
  const cleanUrl = url.trim()
  if (cleanUrl.startsWith("data:image/")) return cleanUrl

  // 1. Try canvas extraction if HTMLImageElement is loaded and not tainted
  if (typeof document !== "undefined" && imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
    try {
      const canvas = document.createElement("canvas")
      canvas.width = imgEl.naturalWidth
      canvas.height = imgEl.naturalHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(imgEl, 0, 0)
        const data = canvas.toDataURL("image/png")
        if (data && data.startsWith("data:image")) return data
      }
    } catch {}
  }

  // 2. Try direct fetch in current page context
  if (typeof fetch === "function") {
    try {
      const res = await fetch(cleanUrl, { mode: "cors" })
      if (res.ok) {
        const blob = await res.blob()
        const dataUrl = await blobToDataUrl(blob)
        if (dataUrl && dataUrl.startsWith("data:")) return dataUrl
      }
    } catch {}
  }

  // 3. Request background service worker to fetch
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "FETCH_IMAGE_DATA_URL", url: cleanUrl },
          (res) => {
            if (chrome.runtime.lastError) {
              resolve(null)
            } else {
              resolve(res)
            }
          }
        )
      })
      if (response && response.success && response.dataUrl) {
        return response.dataUrl
      }
    } catch {}
  }

  return null
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Traverses an IRDocument tree and resolves all remote image URLs into base64 Data URLs
 */
export async function embedImagesInIRDocument(doc: IRDocument): Promise<IRDocument> {
  if (!doc || !doc.rootNode) return doc

  const urlMap = new Map<string, string>()
  const urlsToFetch = new Set<string>()

  function collectImageUrls(node: IRNode) {
    if (!node) return

    if (node.fills && node.fills.length > 0) {
      for (const fill of node.fills) {
        if (fill.type === "IMAGE" && fill.url) {
          if (fill.url.startsWith("data:")) {
            if (!fill.dataUrl) fill.dataUrl = fill.url
          } else if (!fill.dataUrl) {
            urlsToFetch.add(fill.url)
          }
        }
      }
    }

    if (node.type === "SVG" && node.svgContent && node.svgContent.includes("<image")) {
      const regex = /href=["'](https?:\/\/[^"']+)["']/g
      let match: RegExpExecArray | null
      while ((match = regex.exec(node.svgContent)) !== null) {
        if (match[1]) urlsToFetch.add(match[1])
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        collectImageUrls(child)
      }
    }
  }

  collectImageUrls(doc.rootNode)

  if (urlsToFetch.size === 0) return doc

  const fetchPromises = Array.from(urlsToFetch).map(async (url) => {
    try {
      const dataUrl = await resolveImageDataUrl(url)
      if (dataUrl) {
        urlMap.set(url, dataUrl)
      }
    } catch {}
  })

  await Promise.allSettled(fetchPromises)

  function applyResolvedImages(node: IRNode) {
    if (!node) return

    if (node.fills && node.fills.length > 0) {
      for (const fill of node.fills) {
        if (fill.type === "IMAGE" && fill.url && !fill.dataUrl) {
          const resolved = urlMap.get(fill.url)
          if (resolved) {
            fill.dataUrl = resolved
          }
        }
      }
    }

    if (node.type === "SVG" && node.svgContent && urlMap.size > 0) {
      let updatedSvg = node.svgContent
      urlMap.forEach((dataUrl, origUrl) => {
        updatedSvg = updatedSvg.split(origUrl).join(dataUrl)
      })
      node.svgContent = updatedSvg
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        applyResolvedImages(child)
      }
    }
  }

  applyResolvedImages(doc.rootNode)

  return doc
}
