import React, { useState, useMemo } from "react"
import {
  Palette,
  Copy,
  Check,
  Search,
  X,
  Eye,
  EyeOff,
  Download,
  Code,
  FileJson,
  ArrowUpDown,
  SunMedium,
  Layers
} from "lucide-react"
import type {
  ColorRole,
  ExtractedColorItem,
  PagePaletteSummary,
  PaletteSortBy,
  PaletteExportFormat
} from "../../types/palette"
import {
  sortPaletteColors,
  formatPaletteAsHexList,
  formatPaletteAsTailwind,
  formatPaletteAsCssVariables,
  formatPaletteAsJson,
  highlightElementsByHex,
  clearHighlightOverlays
} from "../../lib/palette-extractor"
import { copyToClipboard } from "../../lib/utils"
import InspectorModal from "../ui/InspectorModal"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Input from "../ui/Input"
import Badge from "../ui/Badge"
import EmptyState from "../ui/EmptyState"

export interface ColorPaletteModalProps {
  palette: PagePaletteSummary
  onClose: () => void
  isDarkMode: boolean
}

type TabCategory = "all" | "bg" | "text" | "border" | "cta"

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  palette,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<PaletteSortBy>("frequency")
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [highlightedHex, setHighlightedHex] = useState<string | null>(null)
  const [highlightCount, setHighlightCount] = useState<number>(0)
  const [exportFormat, setExportFormat] = useState<PaletteExportFormat | null>(null)

  // 1. Filter by active category tab
  const categoryColors = useMemo(() => {
    switch (activeTab) {
      case "bg":
        return palette.bgColors
      case "text":
        return palette.textColors
      case "border":
        return palette.borderColors
      case "cta":
        return palette.ctaColors
      case "all":
      default:
        return palette.allColors
    }
  }, [activeTab, palette])

  // 2. Filter by search query (hex, color name, or rgb)
  const filteredColors = useMemo(() => {
    let list = categoryColors
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.hex.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.rgb.toLowerCase().includes(q)
      )
    }
    return sortPaletteColors(list, sortBy)
  }, [categoryColors, searchQuery, sortBy])

  // Counts for tabs
  const tabCounts = useMemo(() => ({
    all: palette.allColors.length,
    bg: palette.bgColors.length,
    text: palette.textColors.length,
    border: palette.borderColors.length,
    cta: palette.ctaColors.length
  }), [palette])

  // Copy single hex handler
  const handleCopySingle = async (hex: string) => {
    await copyToClipboard(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1600)
  }

  // Copy structured export
  const handleCopyExport = async (format: PaletteExportFormat) => {
    let text = ""
    switch (format) {
      case "hex":
        text = formatPaletteAsHexList(filteredColors)
        break
      case "tailwind":
        text = formatPaletteAsTailwind(filteredColors)
        break
      case "css":
        text = formatPaletteAsCssVariables(filteredColors)
        break
      case "json":
        text = formatPaletteAsJson(palette)
        break
    }
    await copyToClipboard(text)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 1800)
  }

  // Download palette file
  const handleDownloadFile = (format: PaletteExportFormat) => {
    let content = ""
    let mime = "text/plain"
    let filename = `palette-${Date.now()}`

    switch (format) {
      case "hex":
        content = formatPaletteAsHexList(filteredColors)
        filename += ".txt"
        break
      case "tailwind":
        content = formatPaletteAsTailwind(filteredColors)
        filename = `tailwind-colors-${Date.now()}.js`
        mime = "application/javascript"
        break
      case "css":
        content = formatPaletteAsCssVariables(filteredColors)
        filename = `palette-vars-${Date.now()}.css`
        mime = "text/css"
        break
      case "json":
        content = formatPaletteAsJson(palette)
        filename = `palette-${Date.now()}.json`
        mime = "application/json"
        break
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Toggle highlight overlay on webpage
  const handleToggleHighlight = (hex: string) => {
    if (highlightedHex === hex) {
      clearHighlightOverlays()
      setHighlightedHex(null)
      setHighlightCount(0)
    } else {
      const role = activeTab === "all" ? undefined : (activeTab as ColorRole)
      const count = highlightElementsByHex(hex, role)
      setHighlightedHex(hex)
      setHighlightCount(count)
    }
  }

  // Breadcrumbs for InspectorModal
  const breadcrumbs = [
    { label: `${palette.totalUniqueColors} colors`, isMono: false, isBold: false },
    { label: `${palette.totalUsages} elements`, isMono: false, isBold: false }
  ]

  const tabLabels: Array<{ id: TabCategory; label: string; count: number }> = [
    { id: "all", label: "All", count: tabCounts.all },
    { id: "bg", label: "Background", count: tabCounts.bg },
    { id: "text", label: "Text", count: tabCounts.text },
    { id: "border", label: "Border", count: tabCounts.border },
    { id: "cta", label: "CTA", count: tabCounts.cta }
  ]

  return (
    <InspectorModal
      icon={<Palette size={15} className="shrink-0 text-neutral-800 dark:text-neutral-200" />}
      title="Color Palette"
      breadcrumbs={breadcrumbs}
      onClose={() => {
        clearHighlightOverlays()
        onClose()
      }}
      isDarkMode={isDarkMode}
      width="380px"
    >
      {/* 1. Search Bar & Sort Toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search hex, name, or rgb..."
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

        {/* Sort Filter Buttons */}
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-850 p-0.5 rounded-xl flex-shrink-0">
          <IconButton
            size="sm"
            variant={sortBy === "frequency" ? "primary" : "ghost"}
            onClick={() => setSortBy("frequency")}
            title="Sort by Most Used"
            aria-label="Sort by Most Used"
            className="h-7 w-7 rounded-lg"
          >
            <ArrowUpDown size={12} className="stroke-[2.2]" />
          </IconButton>
          <IconButton
            size="sm"
            variant={sortBy === "luminance" ? "primary" : "ghost"}
            onClick={() => setSortBy("luminance")}
            title="Sort by Lightness"
            aria-label="Sort by Lightness"
            className="h-7 w-7 rounded-lg"
          >
            <SunMedium size={12} className="stroke-[2.2]" />
          </IconButton>
          <IconButton
            size="sm"
            variant={sortBy === "hue" ? "primary" : "ghost"}
            onClick={() => setSortBy("hue")}
            title="Sort by Color Spectrum"
            aria-label="Sort by Color Spectrum"
            className="h-7 w-7 rounded-lg"
          >
            <Layers size={12} className="stroke-[2.2]" />
          </IconButton>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 flex-shrink-0">
        {tabLabels.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isActive ? "primary" : "secondary"}
              onClick={() => {
                setActiveTab(tab.id)
                if (highlightedHex) {
                  clearHighlightOverlays()
                  setHighlightedHex(null)
                }
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all h-6 ${
                isActive
                  ? "shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-850 border-none hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1 opacity-70 font-mono text-[10px]">
                {tab.count}
              </span>
            </Button>
          )
        })}
      </div>

      {/* 3. Highlight Status Bar if active */}
      {highlightedHex && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex-shrink-0 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-3.5 h-3.5 rounded-md shrink-0 border border-black/10 dark:border-white/20"
              style={{ backgroundColor: highlightedHex }}
            />
            <span className="font-medium truncate text-xs">
              Highlighting <span className="font-mono font-bold text-xs">{highlightCount}</span> element{highlightCount !== 1 ? "s" : ""} on page
            </span>
          </div>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => {
              clearHighlightOverlays()
              setHighlightedHex(null)
            }}
            title="Clear highlight"
            aria-label="Clear highlight"
            className="h-5 w-5 text-blue-600 dark:text-blue-400 p-0"
          >
            <X size={12} />
          </IconButton>
        </div>
      )}

      {/* 4. Color Swatches List */}
      <div
        className="flex flex-col gap-1.5 overflow-y-auto hub-scrollbar max-h-[240px] min-h-[150px] pr-0.5"
        style={{ overscrollBehavior: "contain" }}
      >
        {filteredColors.length === 0 ? (
          <EmptyState
            icon={<Palette size={18} className="text-neutral-400" />}
            title="No colors found"
            description="No matching colors found in this category."
          />
        ) : (
          filteredColors.map((color) => {
            const isCopied = copiedHex === color.hex
            const isHighlighted = highlightedHex === color.hex

            return (
              <div
                key={color.hex}
                onClick={() => handleCopySingle(color.hex)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-xs cursor-pointer select-none group ${
                  isHighlighted
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-500/40"
                    : "border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-850/60"
                }`}
              >
                {/* Left Swatch & Color Info */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {/* Swatch with contrast text preview */}
                  <div
                    className="w-8 h-8 rounded-lg shadow-2xs border border-neutral-300/60 dark:border-neutral-700/60 flex items-center justify-center shrink-0 overflow-hidden font-bold transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Luminance: ${Math.round(color.luminance * 100)}%`}
                  >
                    <span
                      style={{ color: color.luminance > 0.5 ? "#000000" : "#FFFFFF" }}
                      className="text-[10px] select-none leading-none"
                    >
                      Aa
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-xs leading-none">
                        {color.name}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 leading-none">
                        {color.hex}
                      </span>
                    </div>

                    {/* Role Badges & Usages */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {color.roleCounts.bg > 0 && (
                        <span className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-750 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 leading-none">
                          <span>BG</span>
                          <span className="inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-neutral-200/90 dark:bg-neutral-700 text-[10px] font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {color.roleCounts.bg}
                          </span>
                        </span>
                      )}
                      {color.roleCounts.text > 0 && (
                        <span className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-750 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 leading-none">
                          <span>Text</span>
                          <span className="inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-neutral-200/90 dark:bg-neutral-700 text-[10px] font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {color.roleCounts.text}
                          </span>
                        </span>
                      )}
                      {color.roleCounts.border > 0 && (
                        <span className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-750 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 leading-none">
                          <span>Border</span>
                          <span className="inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-neutral-200/90 dark:bg-neutral-700 text-[10px] font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {color.roleCounts.border}
                          </span>
                        </span>
                      )}
                      {color.roleCounts.cta > 0 && (
                        <span className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 text-[10px] font-semibold text-blue-700 dark:text-blue-300 leading-none">
                          <span>CTA</span>
                          <span className="inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-blue-200/80 dark:bg-blue-800 text-[10px] font-mono font-bold text-blue-900 dark:text-blue-100">
                            {color.roleCounts.cta}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Highlight on page button */}
                  <IconButton
                    size="sm"
                    variant={isHighlighted ? "primary" : "ghost"}
                    onClick={() => handleToggleHighlight(color.hex)}
                    title={isHighlighted ? "Remove Highlight" : "Highlight on page"}
                    aria-label="Highlight on page"
                    className="h-6 w-6 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    {isHighlighted ? (
                      <EyeOff size={12} className="stroke-[2.2]" />
                    ) : (
                      <Eye size={12} className="stroke-[2.2]" />
                    )}
                  </IconButton>

                  {/* Copy hex button */}
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopySingle(color.hex)}
                    title="Copy HEX"
                    aria-label="Copy HEX"
                    className="h-6 w-6"
                  >
                    {isCopied ? (
                      <Check size={12} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </IconButton>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 5. Export Code Modal Sub-sheet if toggled */}
      {exportFormat && (
        <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex-shrink-0 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Export {exportFormat === "tailwind" ? "Tailwind Theme" : exportFormat === "css" ? "CSS Variables" : exportFormat === "json" ? "JSON" : "HEX"}
            </span>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setExportFormat(null)}
              className="h-5 w-5 p-0"
              aria-label="Close export sheet"
            >
              <X size={12} />
            </IconButton>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCopyExport(exportFormat)}
              className="flex-1 text-xs font-bold h-8 px-2.5 rounded-xl gap-1.5"
            >
              {copiedFormat === exportFormat ? (
                <Check size={12} className="text-emerald-500 stroke-[3]" />
              ) : (
                <Copy size={12} />
              )}
              <span>{copiedFormat === exportFormat ? "Copied to Clipboard" : "Copy Code"}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDownloadFile(exportFormat)}
              className="text-xs font-bold h-8 px-2.5 rounded-xl gap-1.5"
            >
              <Download size={12} />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )}

      {/* 6. Bottom Action Bar (Copy Palette & Code Export Buttons) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 flex-shrink-0">
        <Button
          variant="primary"
          size="sm"
          disabled={filteredColors.length === 0}
          onClick={() => handleCopyExport("hex")}
          className="text-xs font-bold gap-1.5 h-8.5 px-3 rounded-xl"
        >
          {copiedFormat === "hex" ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copiedFormat === "hex" ? "Copied HEX" : "Copy Palette"}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={filteredColors.length === 0}
          onClick={() => setExportFormat(exportFormat ? null : "tailwind")}
          className="text-xs font-bold gap-1.5 h-8.5 px-3 rounded-xl"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Export Code</span>
        </Button>
      </div>
    </InspectorModal>
  )
}

export default ColorPaletteModal
