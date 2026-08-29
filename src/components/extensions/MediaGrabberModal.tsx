import React, { useState, useMemo } from "react"
import {
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Search,
  X,
  Download,
  Video,
  Eye
} from "lucide-react"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Badge from "../ui/Badge"
import Input from "../ui/Input"
import Checkbox from "../ui/Checkbox"
import EmptyState from "../ui/EmptyState"
import InspectorModal from "../ui/InspectorModal"

export interface ExtractedMediaItem {
  id: string
  url: string
  name: string
  alt?: string
  width?: number
  height?: number
  type: string
  isSvg?: boolean
  svgContent?: string
}

export interface MediaGrabberModalProps {
  media: ExtractedMediaItem[]
  onClose: () => void
  isDarkMode: boolean
}

export const MediaGrabberModal: React.FC<MediaGrabberModalProps> = ({
  media,
  onClose,
  isDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("All")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewItem, setPreviewItem] = useState<ExtractedMediaItem | null>(null)
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Compute available types and counts from scanned media
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: media.length }
    for (const item of media) {
      const t = item.type.toUpperCase()
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [media])

  // Filtered media list based on search and selected type
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      // Type match
      if (selectedType !== "All" && item.type.toUpperCase() !== selectedType.toUpperCase()) {
        return false
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchUrl = item.url.toLowerCase().includes(q)
        const matchName = item.name.toLowerCase().includes(q)
        const matchAlt = item.alt ? item.alt.toLowerCase().includes(q) : false
        const matchType = item.type.toLowerCase().includes(q)
        return matchUrl || matchName || matchAlt || matchType
      }
      return true
    })
  }, [media, selectedType, searchQuery])

  // Selection handlers
  const allFilteredSelected =
    filteredMedia.length > 0 &&
    filteredMedia.every((item) => selectedIds.has(item.id))

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (allFilteredSelected) {
      for (const item of filteredMedia) {
        next.delete(item.id)
      }
    } else {
      for (const item of filteredMedia) {
        next.add(item.id)
      }
    }
    setSelectedIds(next)
  }

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Single item download
  const handleDownloadSingle = (item: ExtractedMediaItem) => {
    if (item.isSvg && item.svgContent) {
      const blob = new Blob([item.svgContent], { type: "image/svg+xml" })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = item.name.endsWith(".svg") ? item.name : `${item.name}.svg`
      a.click()
      URL.revokeObjectURL(blobUrl)
      return
    }

    const a = document.createElement("a")
    a.href = item.url
    a.download = item.name
    a.target = "_blank"
    a.click()
  }

  // Bulk download function
  const handleBulkDownload = async (itemsToDownload: ExtractedMediaItem[]) => {
    if (itemsToDownload.length === 0 || isDownloading) return
    setIsDownloading(true)

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i]
      handleDownloadSingle(item)
      if (i < itemsToDownload.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    setIsDownloading(false)
  }

  const handleCopySingle = async (item: ExtractedMediaItem) => {
    await copyToClipboard(item.url)
    setCopiedUrlId(item.id)
    setTimeout(() => setCopiedUrlId(null), 2000)
  }

  // Copy URLs action for bottom button
  const handleCopyUrls = async () => {
    const targetItems =
      selectedIds.size > 0
        ? filteredMedia.filter((item) => selectedIds.has(item.id))
        : filteredMedia

    const urls = targetItems.map((item) => item.url).join("\n")
    if (!urls) return

    await copyToClipboard(urls)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  // Download action for bottom button
  const handleMainDownload = () => {
    const targetItems =
      selectedIds.size > 0
        ? filteredMedia.filter((item) => selectedIds.has(item.id))
        : filteredMedia

    handleBulkDownload(targetItems)
  }

  // Primary filter options list
  const availableFilterTypes = useMemo(() => {
    const types = ["All"]
    const common = ["SVG", "PNG", "JPG", "WEBP", "GIF", "VIDEO"]
    for (const t of common) {
      if (typeCounts[t]) types.push(t)
    }
    for (const t of Object.keys(typeCounts)) {
      if (!types.includes(t)) types.push(t)
    }
    return types
  }, [typeCounts])

  const selectedCount = selectedIds.size

  const downloadButtonLabel = isDownloading
    ? "Downloading..."
    : selectedCount > 0
    ? `Download (${selectedCount})`
    : selectedType !== "All"
    ? `Download All ${selectedType}`
    : `Download All`

  const copyButtonLabel = copiedAll
    ? "Copied"
    : selectedCount > 0
    ? `Copy Selected (${selectedCount})`
    : `Copy All URLs`

  return (
    <InspectorModal
      icon={<ImageIcon size={15} className="shrink-0 text-neutral-800 dark:text-neutral-200" />}
      title="Media Grabber"
      breadcrumbs={[
        { label: `${filteredMedia.length} items`, isMono: false, isBold: false }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
      width="380px"
    >
      {/* Search Filter Input */}
      <div className="flex-shrink-0">
        <Input
          placeholder="Search media files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={13} />}
          actionRight={
            searchQuery ? (
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="h-5 w-5 p-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                aria-label="Clear search"
              >
                <X size={12} />
              </IconButton>
            ) : null
          }
        />
      </div>

      {/* File Type Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-shrink-0">
        {availableFilterTypes.map((type) => {
          const isActive = selectedType === type
          return (
            <Button
              key={type}
              size="sm"
              variant={isActive ? "primary" : "secondary"}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all h-6 ${
                isActive
                  ? "shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-850 border-none hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              <span>{type}</span>
            </Button>
          )
        })}
      </div>

      {/* Selection Summary Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex-shrink-0 text-xs">
        <div className="flex-shrink-0 flex items-center">
          <Checkbox
            checked={allFilteredSelected}
            onChange={handleToggleSelectAll}
            label={
              selectedCount > 0
                ? `${selectedCount} Selected`
                : "Select All"
            }
          />
        </div>

        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
          {filteredMedia.length} media found
        </span>
      </div>

      {/* Enlarged In-Modal Media Preview Card */}
      {previewItem && (
        <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex-shrink-0 animate-scale-in">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {previewItem.alt || previewItem.name}
              </span>
              <Badge variant="interactive" className="shrink-0 text-[10px] font-bold px-1.5 py-0.5">
                {previewItem.type}
              </Badge>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadSingle(previewItem)}
                title="Download"
                aria-label="Download"
                className="h-6 w-6"
              >
                <Download size={12} className="stroke-[2.2]" />
              </IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => handleCopySingle(previewItem)}
                title="Copy URL"
                aria-label="Copy URL"
                className="h-6 w-6"
              >
                {copiedUrlId === previewItem.id ? (
                  <Check size={12} className="text-emerald-500 stroke-[3]" />
                ) : (
                  <Copy size={12} />
                )}
              </IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => window.open(previewItem.url, "_blank")}
                title="Open in new tab"
                aria-label="Open in new tab"
                className="h-6 w-6"
              >
                <ExternalLink size={12} />
              </IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => setPreviewItem(null)}
                title="Close Preview"
                aria-label="Close Preview"
                className="h-6 w-6 ml-0.5"
              >
                <X size={12} className="stroke-[2.5]" />
              </IconButton>
            </div>
          </div>

          {/* Large High-Contrast Viewport Box */}
          <div className="w-full h-36 rounded-xl bg-neutral-200/80 dark:bg-neutral-800/90 border border-neutral-300/70 dark:border-neutral-700/70 flex items-center justify-center p-2 overflow-hidden relative">
            {previewItem.svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: previewItem.svgContent }}
              />
            ) : previewItem.type === "VIDEO" ? (
              <video
                src={previewItem.url}
                controls
                className="w-full h-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <img
                src={previewItem.url}
                alt={previewItem.alt || ""}
                className="w-full h-full object-contain"
              />
            )}

            {/* Dimensions Badge Overlay */}
            {previewItem.width && previewItem.height && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-neutral-900/90 text-white text-[10px] font-mono font-bold shadow-xs">
                {previewItem.width} × {previewItem.height}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Items Scrollable List */}
      <div
        className="flex flex-col gap-1.5 overflow-y-auto hub-scrollbar max-h-[220px] min-h-[140px] pr-0.5"
        style={{ overscrollBehavior: "contain" }}
      >
        {filteredMedia.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={18} className="text-neutral-400" />}
            title="No media found"
            description="No matching media or images found on this page."
          />
        ) : (
          filteredMedia.map((item) => {
            const isChecked = selectedIds.has(item.id)
            const isSelectedForPreview = previewItem?.id === item.id

            return (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-xs cursor-pointer select-none ${
                  isSelectedForPreview
                    ? "border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/25 ring-1 ring-blue-500/40"
                    : isChecked
                    ? "border-neutral-400 dark:border-neutral-600 bg-neutral-100/90 dark:bg-neutral-850/80"
                    : "border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-850/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleItem(item.id)
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.id)}
                    />
                  </div>

                  {/* Thumbnail Square */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewItem(item)
                    }}
                    title="Click to preview enlarged"
                    className="w-8 h-8 rounded-lg bg-neutral-200/80 dark:bg-neutral-750 border border-neutral-300/80 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-transform"
                  >
                    {item.svgContent ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-1 overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: item.svgContent }}
                      />
                    ) : item.type === "VIDEO" ? (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                        <Video size={14} className="stroke-[2.2]" />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-xs">
                        {item.alt || item.name}
                      </span>
                      <Badge variant="interactive" className="shrink-0 text-[10px] font-bold px-1.5 py-0.5">
                        {item.type}
                      </Badge>
                    </div>
                    {item.width && item.height ? (
                      <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                        {item.width} × {item.height}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {item.name}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewItem(item)}
                    title="Enlarge preview"
                    aria-label="Enlarge preview"
                    className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    <Eye size={12} className="stroke-[2.2]" />
                  </IconButton>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadSingle(item)}
                    title="Download"
                    aria-label="Download"
                    className="h-6 w-6"
                  >
                    <Download size={12} className="stroke-[2.2]" />
                  </IconButton>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopySingle(item)}
                    title="Copy URL"
                    aria-label="Copy URL"
                    className="h-6 w-6"
                  >
                    {copiedUrlId === item.id ? (
                      <Check size={12} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </IconButton>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(item.url, "_blank")}
                    title="View Media"
                    aria-label="View Media"
                    className="h-6 w-6"
                  >
                    <ExternalLink size={12} />
                  </IconButton>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Action Bar: Exactly TWO clean action buttons (Download & Copy URLs) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
        <Button
          variant="primary"
          size="sm"
          disabled={isDownloading || filteredMedia.length === 0}
          onClick={handleMainDownload}
          className="text-xs font-bold gap-1.5 h-8.5 px-3 rounded-xl"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{downloadButtonLabel}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={filteredMedia.length === 0}
          onClick={handleCopyUrls}
          className="text-xs font-bold gap-1.5 h-8.5 px-3 rounded-xl"
        >
          {copiedAll ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copyButtonLabel}</span>
        </Button>
      </div>
    </InspectorModal>
  )
}

export default MediaGrabberModal
