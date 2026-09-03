import type { IRDocument, IRNode } from "../../types/ir.ts"

/**
 * Converts any non-PNG/JPEG Blob into a PNG Data URL using Canvas or ImageBitmap.
 * Figma's SVG clipboard parser reliably displays PNG and JPEG, but renders WebP as solid black or drops it.
 */
export async function blobToPngDataUrl(blob: Blob): Promise<string> {
  if (typeof document === "undefined") {
    return blobToDataUrl(blob)
  }

  if (blob.type === "image/png" || blob.type === "image/jpeg") {
    return blobToDataUrl(blob)
  }

  // 1. Decode via createImageBitmap (fast, direct offscreen decoding)
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob)
      const canvas = document.createElement("canvas")
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        const pngData = canvas.toDataURL("image/png")
        if (pngData && pngData.startsWith("data:image/png")) {
          return pngData
        }
      }
    } catch {}
  }

  // 2. Fallback decode via Image element
  try {
    const objectUrl = URL.createObjectURL(blob)
    const img = new Image()
    img.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      setTimeout(reject, 3000)
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth || 100
    canvas.height = img.naturalHeight || 100
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(objectUrl)
      const pngData = canvas.toDataURL("image/png")
      if (pngData && pngData.startsWith("data:image/png")) {
        return pngData
      }
    }
    URL.revokeObjectURL(objectUrl)
  } catch {}

  return blobToDataUrl(blob)
}

/**
 * Converts a data:image/webp string into a data:image/png string for Figma compatibility.
 */
export async function convertDataUrlToPng(dataUrl: string): Promise<string> {
  if (typeof document === "undefined" || !dataUrl.startsWith("data:image/webp")) {
    return dataUrl
  }

  try {
    const img = new Image()
    img.src = dataUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      setTimeout(reject, 2500)
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth || 100
    canvas.height = img.naturalHeight || 100
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(img, 0, 0)
      const png = canvas.toDataURL("image/png")
      if (png && png.startsWith("data:image/png")) {
        return png
      }
    }
  } catch {}

  return dataUrl
}

/**
 * Resolves an image URL into a base64 PNG Data URL using canvas, direct fetch,
 * or Chrome background service worker messaging.
 */
export async function resolveImageDataUrl(
  url: string,
  imgEl?: HTMLImageElement
): Promise<string | null> {
  if (!url || typeof url !== "string") return null
  const cleanUrl = url.trim()

  if (cleanUrl.startsWith("data:image/png") || cleanUrl.startsWith("data:image/jpeg")) {
    return cleanUrl
  }
  if (cleanUrl.startsWith("data:image/webp")) {
    return convertDataUrlToPng(cleanUrl)
  }

  // 1. Try finding already loaded HTMLImageElement in the DOM if not provided
  if (!imgEl && typeof document !== "undefined") {
    const allImgs = Array.from(document.querySelectorAll("img"))
    imgEl = allImgs.find((img) => img.currentSrc === cleanUrl || img.src === cleanUrl)
  }

  // 2. Try canvas extraction if HTMLImageElement is loaded and not tainted
  if (typeof document !== "undefined" && imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
    try {
      const canvas = document.createElement("canvas")
      canvas.width = imgEl.naturalWidth
      canvas.height = imgEl.naturalHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(imgEl, 0, 0)
        const data = canvas.toDataURL("image/png")
        if (data && data.startsWith("data:image/png")) return data
      }
    } catch {}
  }

  // 3. Try direct fetch in current page context and decode to PNG
  if (typeof fetch === "function") {
    try {
      const res = await fetch(cleanUrl, { mode: "cors" })
      if (res.ok) {
        const blob = await res.blob()
        const dataUrl = await blobToPngDataUrl(blob)
        if (dataUrl && dataUrl.startsWith("data:")) return dataUrl
      }
    } catch {}
  }

  // 4. Request background service worker to fetch
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
        if (response.dataUrl.startsWith("data:image/webp")) {
          return convertDataUrlToPng(response.dataUrl)
        }
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
          if (fill.url.startsWith("data:image/webp")) {
            // Needs WebP to PNG conversion
            urlsToFetch.add(fill.url)
          } else if (fill.url.startsWith("data:")) {
            if (!fill.dataUrl) fill.dataUrl = fill.url
          } else if (!fill.dataUrl || fill.dataUrl.startsWith("data:image/webp")) {
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
        if (fill.type === "IMAGE" && fill.url) {
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
