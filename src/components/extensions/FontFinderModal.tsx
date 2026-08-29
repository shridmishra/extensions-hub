import React, { useState, useEffect } from "react"
import {
  Copy,
  Check,
  X,
  Type,
  ExternalLink,
  Code,
  Globe,
  Minus,
  Plus,
  Info
} from "lucide-react"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import IconButton from "../ui/IconButton"
import Tabs, { type TabItem } from "../ui/Tabs"
import InspectorModal from "../ui/InspectorModal"

export interface FontMetrics {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  color: string
  backgroundColor: string
  textAlign: string
  textTransform: string
  sampleText: string
  tagName: string
}

interface FontFinderModalProps {
  metrics: FontMetrics
  onClose: () => void
  isDarkMode: boolean
}

type PresetKey = "sample" | "headline" | "alphabet" | "numbers"

interface PresetItem {
  id: PresetKey
  label: string
  text: string
}

function formatColorToHex(color: string): string {
  if (!color) return "-"
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0")
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0")
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0")
    return `#${r}${g}${b}`.toUpperCase()
  }
  return color
}

const FontFinderModal: React.FC<FontFinderModalProps> = ({
  metrics,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<string>("inspect")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<PresetKey>("sample")
  
  const parsedPx = parseFloat(metrics.fontSize) || 16
  const [previewSize, setPreviewSize] = useState<number>(Math.max(14, parsedPx))
  const [previewWeight, setPreviewWeight] = useState<string>(metrics.fontWeight || "400")

  const defaultSample = metrics.sampleText && metrics.sampleText.trim().length > 0
    ? metrics.sampleText.trim()
    : "Sphinx of black quartz, judge my vow."

  const [customSample, setCustomSample] = useState<string>(defaultSample)

  const PRESETS: PresetItem[] = [
    { id: "sample", label: "Sample", text: defaultSample },
    { id: "headline", label: "Headline", text: "The quick brown fox jumps over the lazy dog." },
    { id: "alphabet", label: "Aa–Zz", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz" },
    { id: "numbers", label: "123", text: "0123456789 !@#$%^&*()" }
  ]

  // Extract clean primary font name
  const primaryFont = metrics.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
  const cleanFamilyName = primaryFont.replace(/ /g, "+")
  const fontshareFamilyName = primaryFont.toLowerCase().replace(/[\s_]+/g, "-")

  // Sync initial element text if available
  useEffect(() => {
    const initialText = metrics.sampleText && metrics.sampleText.trim().length > 0
      ? metrics.sampleText.trim()
      : "Sphinx of black quartz, judge my vow."
    setCustomSample(initialText)
    setActivePreset("sample")
    setPreviewSize(Math.max(14, parseFloat(metrics.fontSize) || 16))
    setPreviewWeight(metrics.fontWeight || "400")
  }, [metrics])

  // Dynamically load font from Google Fonts / Fontshare into document head for fidelity
  useEffect(() => {
    if (!primaryFont) return
    const genericFonts = [
      "system-ui",
      "-apple-system",
      "sans-serif",
      "serif",
      "monospace",
      "cursive",
      "fantasy",
      "blinkmacsystemfont",
      "arial",
      "helvetica",
      "times new roman",
      "times",
      "courier new",
      "courier",
      "verdana",
      "georgia",
      "trebuchet ms",
      "impact"
    ]
    const cleanLower = primaryFont.toLowerCase()
    if (genericFonts.includes(cleanLower)) return

    // Inject Google Fonts link
    const gfId = `hub-gf-${fontshareFamilyName}`
    if (!document.getElementById(gfId)) {
      const link = document.createElement("link")
      link.id = gfId
      link.rel = "stylesheet"
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(primaryFont)}:ital,wght@0,100..900;1,100..900&display=swap`
      document.head.appendChild(link)
    }

    // Inject Fontshare link
    const fsId = `hub-fs-${fontshareFamilyName}`
    if (!document.getElementById(fsId)) {
      const fsLink = document.createElement("link")
      fsLink.id = fsId
      fsLink.rel = "stylesheet"
      fsLink.href = `https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(fontshareFamilyName)}@100,200,300,400,500,600,700,800,900&display=swap`
      document.head.appendChild(fsLink)
    }
  }, [primaryFont, fontshareFamilyName])

  const handleCopy = async (key: string, text: string) => {
    await copyToClipboard(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handlePresetSelect = (preset: PresetItem) => {
    setActivePreset(preset.id)
    setCustomSample(preset.text)
  }

  const fontSearchUrl = `https://fonts.google.com/?query=${encodeURIComponent(primaryFont)}`

  // Snippets
  const cssSnippet = `font-family: ${metrics.fontFamily};
font-size: ${metrics.fontSize};
font-weight: ${metrics.fontWeight};
line-height: ${metrics.lineHeight};
letter-spacing: ${metrics.letterSpacing};
color: ${metrics.color};`

  const googleFontsHtmlLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${cleanFamilyName}:wght@100..900&display=swap" rel="stylesheet">`

  const googleFontsImport = `@import url('https://fonts.googleapis.com/css2?family=${cleanFamilyName}:wght@100..900&display=swap');`

  const fontshareImport = `@import url('https://api.fontshare.com/v2/css?f[]=${fontshareFamilyName}@100,200,300,400,500,600,700,800,900&display=swap');`

  const tabs: TabItem[] = [
    { id: "inspect", label: "Inspect", icon: <Type size={12} className="stroke-[2.2]" /> },
    { id: "cdn", label: "CDN", icon: <Code size={12} className="stroke-[2.2]" /> },
    { id: "links", label: "Directories", icon: <Globe size={12} className="stroke-[2.2]" /> }
  ]

  const hexColor = formatColorToHex(metrics.color)

  const DIRECTORY_LINKS = [
    {
      name: "Google Fonts",
      tag: "Free & Open Source",
      url: `https://fonts.google.com/?query=${encodeURIComponent(primaryFont)}`
    },
    {
      name: "Fontshare",
      tag: "Quality Typefaces by ITF",
      url: `https://www.fontshare.com/?search=${encodeURIComponent(primaryFont)}`
    },
    {
      name: "Bunny Fonts",
      tag: "Privacy-Friendly CDN",
      url: `https://fonts.bunny.net/?q=${encodeURIComponent(primaryFont)}`
    },
    {
      name: "Fonts In Use",
      tag: "Real-world Type Archives",
      url: `https://fontsinuse.com/search?terms=${encodeURIComponent(primaryFont)}`
    },
    {
      name: "Adobe Fonts",
      tag: "Creative Cloud Catalog",
      url: `https://fonts.adobe.com/search?query=${encodeURIComponent(primaryFont)}`
    }
  ]

  return (
    <InspectorModal
      icon={<Type size={14} className="text-neutral-800 dark:text-neutral-200 shrink-0 stroke-[2.2]" />}
      title="Font Inspector"
      breadcrumbs={[
        { label: `<${metrics.tagName.toLowerCase()}>`, isMono: false, isBold: false },
        { label: primaryFont, isMono: false, isBold: true }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
    >
      {/* Navigation Tabs */}
      <div>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id)}
          variant="pill"
        />
      </div>

          {/* TAB 1: INSPECT */}
          {activeTab === "inspect" && (
            <div className="flex flex-col gap-2.5">
              {/* Primary Font Header Row with Info Tooltip button */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                    {primaryFont}
                  </h2>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    title={metrics.fontFamily}
                    tooltipPosition="bottom-right"
                    className="h-5 w-5 p-0 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 shrink-0"
                    aria-label="Font stack details"
                  >
                    <Info size={12} />
                  </IconButton>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy("name", primaryFont)}
                  className="text-xs h-7 px-2.5 shrink-0 font-bold gap-1 rounded-lg"
                >
                  {copiedKey === "name" ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Name</span>
                    </>
                  )}
                </Button>
              </div>

              {/* 4-Item Compact Specs Strip */}
              <div className="grid grid-cols-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs py-2 text-center">
                {/* Size */}
                <div className="flex flex-col items-center px-1 min-w-0">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Size</span>
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">{metrics.fontSize}</span>
                </div>

                {/* Weight */}
                <div className="flex flex-col items-center px-1 min-w-0">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Weight</span>
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">{metrics.fontWeight}</span>
                </div>

                {/* Line Height */}
                <div className="flex flex-col items-center px-1 min-w-0">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Height</span>
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">{metrics.lineHeight}</span>
                </div>

                {/* Color */}
                <div className="flex flex-col items-center px-1 min-w-0">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Color</span>
                  <div className="flex items-center gap-1 mt-0.5 justify-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
                      style={{ backgroundColor: metrics.color }}
                    />
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate">{hexColor}</span>
                  </div>
                </div>
              </div>

              {/* Primary Feature: Font Preview Canvas */}
              <div className="rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs p-3 flex flex-col gap-2">
                {/* Top Bar: Presets only */}
                <div className="flex items-center gap-1 overflow-x-auto hub-scrollbar">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      size="sm"
                      variant={activePreset === preset.id ? "primary" : "secondary"}
                      onClick={() => handlePresetSelect(preset)}
                      className="text-xs h-6 px-2.5 shrink-0 rounded-md font-semibold"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* Direct Canvas Textarea */}
                <textarea
                  value={customSample}
                  onChange={(e) => setCustomSample(e.target.value)}
                  rows={3}
                  style={
                    {
                      "--preview-font-family": metrics.fontFamily,
                      fontFamily: metrics.fontFamily,
                      fontSize: `${previewSize}px`,
                      fontWeight: previewWeight,
                      lineHeight: metrics.lineHeight || "1.4"
                    } as React.CSSProperties
                  }
                  className="font-preview-element w-full bg-transparent text-neutral-900 dark:text-neutral-100 resize-none outline-none border-none p-1 leading-relaxed text-sm min-h-[84px]"
                  placeholder="Type to test this typeface..."
                />

                {/* Bottom Row Inside Preview Canvas: Size Stepper at Bottom Right */}
                <div className="flex items-center justify-end pt-1">
                  <div className="flex items-center gap-1 bg-white dark:bg-neutral-750 px-1.5 py-0.5 rounded-lg shadow-2xs">
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewSize((s) => Math.max(10, s - 2))}
                      className="h-4.5 w-4.5 p-0"
                      title="Smaller"
                    >
                      <Minus size={10} />
                    </IconButton>
                    <span className="text-xs font-mono font-bold min-w-[28px] text-center text-neutral-900 dark:text-neutral-100">
                      {previewSize}px
                    </span>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewSize((s) => Math.min(64, s + 2))}
                      className="h-4.5 w-4.5 p-0"
                      title="Larger"
                    >
                      <Plus size={10} />
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Actions: Copy CSS and Google Fonts */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleCopy("css", cssSnippet)}
                  className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
                >
                  {copiedKey === "css" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSS</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.open(fontSearchUrl, "_blank", "noopener,noreferrer")}
                  className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Fonts</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: CDN */}
          {activeTab === "cdn" && (
            <div className="flex flex-col gap-2.5">
              {/* Google Fonts HTML Link */}
              <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Google Fonts &lt;link&gt;
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("gf-link", googleFontsHtmlLink)}
                    className="text-xs h-6 px-2 font-bold gap-1 rounded-md"
                  >
                    {copiedKey === "gf-link" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedKey === "gf-link" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <pre className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre hub-scrollbar select-text leading-relaxed shadow-2xs">
                  {googleFontsHtmlLink}
                </pre>
              </div>

              {/* Google Fonts @import */}
              <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Google Fonts @import
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("gf-import", googleFontsImport)}
                    className="text-xs h-6 px-2 font-bold gap-1 rounded-md"
                  >
                    {copiedKey === "gf-import" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedKey === "gf-import" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <pre className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre hub-scrollbar select-text leading-relaxed shadow-2xs">
                  {googleFontsImport}
                </pre>
              </div>

              {/* Fontshare @import */}
              <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Fontshare @import
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("fs-import", fontshareImport)}
                    className="text-xs h-6 px-2 font-bold gap-1 rounded-md"
                  >
                    {copiedKey === "fs-import" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedKey === "fs-import" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <pre className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre hub-scrollbar select-text leading-relaxed shadow-2xs">
                  {fontshareImport}
                </pre>
              </div>

              {/* CSS Declaration Rule */}
              <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    CSS Declaration
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("css-full", cssSnippet)}
                    className="text-xs h-6 px-2 font-bold gap-1 rounded-md"
                  >
                    {copiedKey === "css-full" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedKey === "css-full" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <pre className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre hub-scrollbar select-text leading-relaxed shadow-2xs">
                  {cssSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECTORIES */}
          {activeTab === "links" && (
            <div className="flex flex-col gap-2">
              {DIRECTORY_LINKS.map((dir) => (
                <a
                  key={dir.name}
                  href={dir.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 shadow-2xs hover:shadow-xs transition-all group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white flex items-center gap-1">
                      {dir.name}
                      <ExternalLink size={11} className="text-neutral-400 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {dir.tag}
                    </span>
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    Open
                  </Badge>
                </a>
              ))}
            </div>
          )}
    </InspectorModal>
  )
}

export default FontFinderModal
