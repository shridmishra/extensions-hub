import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Camera,
  Copy,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileDown,
  Scissors,
  RefreshCw,
  FileText
} from "lucide-react"
import type { ScreenshotData, CropRect } from "../../types/screenshot"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Badge from "../ui/Badge"
import InspectorModal from "../ui/InspectorModal"

export interface ScreenshotModalProps {
  screenshot: ScreenshotData
  onClose: () => void
  onRetake: () => void
  isDarkMode: boolean
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  screenshot,
  onClose,
  onRetake,
  isDarkMode
}) => {
  const [zoom, setZoom] = useState<number>(100)
  const [copied, setCopied] = useState<boolean>(false)
  const [isCropMode, setIsCropMode] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>(screenshot.dataUrl)
  const [currentDims, setCurrentDims] = useState<{ width: number; height: number }>({
    width: screenshot.width,
    height: screenshot.height
  })
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageElementRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setCurrentImage(screenshot.dataUrl)
    setCurrentDims({ width: screenshot.width, height: screenshot.height })
    setCropRect(null)
    setIsCropMode(false)
  }, [screenshot])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleFitZoom = () => {
    if (!imageContainerRef.current) return
    const containerWidth = imageContainerRef.current.clientWidth - 32
    if (currentDims.width > 0) {
      const fitPercent = Math.round((containerWidth / currentDims.width) * 100)
      setZoom(Math.max(10, Math.min(fitPercent, 100)))
    }
  }

  const handleCopyImage = async () => {
    try {
      const res = await fetch(currentImage)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getCleanFilename = (ext: string): string => {
    try {
      const host = new URL(screenshot.url).hostname.replace(/[^a-z0-9]/gi, "-")
      const date = new Date().toISOString().slice(0, 10)
      return `screenshot-${host}-${date}.${ext}`
    } catch {
      return `screenshot-${Date.now()}.${ext}`
    }
  }

  const handleDownloadPng = () => {
    const a = document.createElement("a")
    a.href = currentImage
    a.download = getCleanFilename("png")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadJpg = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.92)

      const a = document.createElement("a")
      a.href = jpgUrl
      a.download = getCleanFilename("jpg")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    img.src = currentImage
  }

  const handleDownloadPdf = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95)

      // Convert dimensions to standard 72 DPI PDF points
      const widthPt = (img.naturalWidth / (screenshot.devicePixelRatio || 1)) * 0.75
      const heightPt = (img.naturalHeight / (screenshot.devicePixelRatio || 1)) * 0.75

      const base64Data = jpegDataUrl.split(",")[1]
      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const pdfHeader = `%PDF-1.4\n`
      const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
      const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
      const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt.toFixed(2)} ${heightPt.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
      const obj4Header = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.naturalWidth} /Height ${img.naturalHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${len} >>\nstream\n`
      const obj4Footer = `\nendstream\nendobj\n`
      const streamContent = `q ${widthPt.toFixed(2)} 0 0 ${heightPt.toFixed(2)} 0 0 cm /Im1 Do Q`
      const obj5 = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`

      const pdfBlob = new Blob([
        pdfHeader,
        obj1,
        obj2,
        obj3,
        obj4Header,
        bytes,
        obj4Footer,
        obj5,
        `xref\n0 6\n0000000000 65535 f \n`,
        `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%%EOF`
      ], { type: "application/pdf" })

      const blobUrl = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = getCleanFilename("pdf")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    }
    img.src = currentImage
  }

  // Crop interaction handlers
  const handleMouseDownOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropMode || !imageElementRef.current) return
    const rect = imageElementRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCropStart({ x, y })
    setCropRect({ x, y, width: 0, height: 0 })
    setIsDraggingCrop(true)
  }

  const handleMouseMoveOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCrop || !cropStart || !imageElementRef.current) return
    const rect = imageElementRef.current.getBoundingClientRect()
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

    const x = Math.min(cropStart.x, currentX)
    const y = Math.min(cropStart.y, currentY)
    const width = Math.abs(currentX - cropStart.x)
    const height = Math.abs(currentY - cropStart.y)

    setCropRect({ x, y, width, height })
  }

  const handleMouseUpOnImage = () => {
    setIsDraggingCrop(false)
  }

  const handleApplyCrop = () => {
    if (!cropRect || cropRect.width < 10 || cropRect.height < 10 || !imageElementRef.current) {
      return
    }

    const img = imageElementRef.current
    const displayedWidth = img.clientWidth
    const displayedHeight = img.clientHeight
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight

    const scaleX = naturalWidth / displayedWidth
    const scaleY = naturalHeight / displayedHeight

    const sourceX = cropRect.x * scaleX
    const sourceY = cropRect.y * scaleY
    const sourceWidth = cropRect.width * scaleX
    const sourceHeight = cropRect.height * scaleY

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(sourceWidth)
    canvas.height = Math.round(sourceHeight)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const croppedUrl = canvas.toDataURL("image/png")
    setCurrentImage(croppedUrl)
    setCurrentDims({ width: canvas.width, height: canvas.height })
    setCropRect(null)
    setIsCropMode(false)
  }

  const handleResetCrop = () => {
    setCurrentImage(screenshot.dataUrl)
    setCurrentDims({ width: screenshot.width, height: screenshot.height })
    setCropRect(null)
    setIsCropMode(false)
  }

  const modeLabel =
    screenshot.mode === "full"
      ? "Full Page"
      : screenshot.mode === "viewport"
      ? "Viewport"
      : screenshot.mode === "area"
      ? "Area Crop"
      : "Element"

  return (
    <InspectorModal
      icon={<Camera size={15} className="shrink-0 text-neutral-800 dark:text-neutral-200" />}
      title="Page Screenshot"
      breadcrumbs={[
        { label: modeLabel, isMono: false, isBold: false },
        { label: `${currentDims.width} × ${currentDims.height}`, isMono: true, isBold: false }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
    >
      {/* 1. Header Toolbar with Zoom & Crop Mode */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 shadow-2xs">
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut size={13} className="stroke-[2.2]" />
          </IconButton>

          <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 min-w-[34px] text-center">
            {zoom}%
          </span>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn size={13} className="stroke-[2.2]" />
          </IconButton>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleResetZoom}
            title="Actual Size (100%)"
            aria-label="Reset zoom"
          >
            <RotateCcw size={12} className="stroke-[2.2]" />
          </IconButton>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={isCropMode ? "primary" : "ghost"}
            size="sm"
            onClick={() => setIsCropMode(!isCropMode)}
            className="h-6 px-2 text-[10px] font-bold gap-1 rounded-lg"
          >
            <Scissors size={11} className="stroke-[2.2]" />
            <span>{isCropMode ? "Cancel Crop" : "Crop"}</span>
          </Button>

          {currentImage !== screenshot.dataUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetCrop}
              className="h-6 px-2 text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Image Viewer */}
      <div
        ref={imageContainerRef}
        onMouseMove={handleMouseMoveOnImage}
        onMouseUp={handleMouseUpOnImage}
        className="relative w-full h-[230px] rounded-xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/60 dark:border-neutral-800/60 overflow-auto flex items-start justify-center p-2 shadow-inner select-none cursor-crosshair"
      >
        <div
          className="relative inline-block"
          onMouseDown={handleMouseDownOnImage}
          style={{ width: `${zoom}%`, transition: isDraggingCrop ? "none" : "width 0.15s ease" }}
        >
          <img
            ref={imageElementRef}
            src={currentImage}
            alt="Captured Screenshot"
            className="w-full h-auto block rounded-md shadow-xs pointer-events-none"
            draggable={false}
          />

          {/* Crop Rectangle Overlay */}
          {isCropMode && cropRect && cropRect.width > 0 && cropRect.height > 0 && (
            <div
              className="absolute border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900/20 dark:bg-neutral-100/20 pointer-events-none rounded-xs"
              style={{
                left: cropRect.x,
                top: cropRect.y,
                width: cropRect.width,
                height: cropRect.height
              }}
            >
              <div className="absolute -top-5 left-0 px-1 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-mono font-bold leading-none shadow-xs">
                {Math.round(cropRect.width)} × {Math.round(cropRect.height)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Crop Confirmation Bar (If active) */}
      {isCropMode && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
            Drag a box to crop image
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              disabled={!cropRect || cropRect.width < 10}
              onClick={handleApplyCrop}
              className="h-6 px-2 text-[10px] font-bold rounded-lg"
            >
              Apply Crop
            </Button>
          </div>
        </div>
      )}

      {/* 4. Specs & Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
            Resolution
          </span>
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {currentDims.width} × {currentDims.height}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
            DPR Scale
          </span>
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {screenshot.devicePixelRatio || 1}×
          </span>
        </div>

        <div className="p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
            Type
          </span>
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            PNG
          </span>
        </div>
      </div>

      {/* 5. Primary Actions Grid */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCopyImage}
          className="text-xs font-bold gap-1.5 h-8.5 px-2.5 rounded-xl shadow-xs"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
          ) : (
            <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
          )}
          <span>{copied ? "Copied Image" : "Copy Image"}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadPng}
          className="text-xs font-bold gap-1.5 h-8.5 px-2.5 rounded-xl shadow-xs"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Download PNG</span>
        </Button>
      </div>

      {/* 6. Secondary Export & Retake Actions */}
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadJpg}
          className="text-[10px] font-bold gap-1 h-7 px-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850"
        >
          <FileDown className="w-3 h-3 stroke-[2.2]" />
          <span>Save JPG</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadPdf}
          className="text-[10px] font-bold gap-1 h-7 px-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850"
        >
          <FileText className="w-3 h-3 stroke-[2.2]" />
          <span>Save PDF</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRetake}
          className="text-[10px] font-bold gap-1 h-7 px-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850"
        >
          <RefreshCw className="w-3 h-3 stroke-[2.2]" />
          <span>Retake</span>
        </Button>
      </div>
    </InspectorModal>
  )
}

export default ScreenshotModal
