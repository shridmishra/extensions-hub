import React, { useState, useEffect } from "react"
import {
  Copy,
  Check,
  X,
  Type,
  ExternalLink,
  Code,
  Globe,
  CaseUpper,
  CaseLower,
  Minus,
  Plus
} from "lucide-react"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import IconButton from "../ui/IconButton"
import Tabs, { type TabItem } from "../ui/Tabs"

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

type DummyPresetKey = "element" | "headline" | "alphabet" | "numbers" | "paragraph"

interface DummyPreset {
  id: DummyPresetKey
  label: string
  text: string
}

const DUMMY_PRESETS: DummyPreset[] = [
  { id: "headline", label: "Headline", text: "Sphinx of black quartz, judge my vow." },
  { id: "alphabet", label: "Alphabet", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz" },
  { id: "numbers", label: "123 & #", text: "0123456789 !@#$%^&*()_+-=[]{}|;:,.<>?" },
  { id: "paragraph", label: "Paragraph", text: "Typography is the art and technique of arranging type to make written language legible, readable, and appealing." }
]

const FontFinderModal: React.FC<FontFinderModalProps> = ({
  metrics,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<string>("inspect")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<DummyPresetKey>("headline")
  const [customSample, setCustomSample] = useState<string>("Sphinx of black quartz, judge my vow.")
  
  const parsedPx = parseFloat(metrics.fontSize) || 16
  const [previewSize, setPreviewSize] = useState<number>(parsedPx)
  const [previewWeight, setPreviewWeight] = useState<string>(metrics.fontWeight || "400")
  const [previewTransform, setPreviewTransform] = useState<"none" | "uppercase" | "lowercase">("none")

  // Extract clean primary font name
  const primaryFont = metrics.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
  const cleanFamilyName = primaryFont.replace(/ /g, "+")
  const fontshareFamilyName = primaryFont.toLowerCase().replace(/[\s_]+/g, "-")

  // Sync initial element text if available
  useEffect(() => {
    if (metrics.sampleText && metrics.sampleText.trim().length > 0) {
      setCustomSample(metrics.sampleText.trim())
      setActivePreset("element")
    } else {
      setCustomSample(DUMMY_PRESETS[0].text)
      setActivePreset("headline")
    }
    setPreviewSize(parseFloat(metrics.fontSize) || 16)
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
    setTimeout(() => setCopiedKey(null), 1800)
  }

  const handlePresetSelect = (presetId: DummyPresetKey) => {
    setActivePreset(presetId)
    if (presetId === "element") {
      setCustomSample(metrics.sampleText || "Sample text")
    } else {
      const found = DUMMY_PRESETS.find((p) => p.id === presetId)
      if (found) setCustomSample(found.text)
    }
  }

  // Snippets
  const cssSnippet = `font-family: ${metrics.fontFamily};
font-size: ${metrics.fontSize};
font-weight: ${metrics.fontWeight};
line-height: ${metrics.lineHeight};
letter-spacing: ${metrics.letterSpacing};
color: ${metrics.color};`

  const fontPx = parseFloat(metrics.fontSize) || 16
  let twSize = "text-base"
  if (fontPx <= 12) twSize = "text-xs"
  else if (fontPx <= 14) twSize = "text-sm"
  else if (fontPx <= 16) twSize = "text-base"
  else if (fontPx <= 18) twSize = "text-lg"
  else if (fontPx <= 20) twSize = "text-xl"
  else if (fontPx <= 24) twSize = "text-2xl"
  else if (fontPx <= 30) twSize = "text-3xl"
  else twSize = "text-4xl"

  const twWeight = `font-[${metrics.fontWeight}]`
  const tailwindSnippet = `${twSize} ${twWeight} leading-normal`

  const googleFontsHtmlLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${cleanFamilyName}:wght@100..900&display=swap" rel="stylesheet">`

  const googleFontsImport = `@import url('https://fonts.googleapis.com/css2?family=${cleanFamilyName}:wght@100..900&display=swap');`

  const fontshareImport = `@import url('https://api.fontshare.com/v2/css?f[]=${fontshareFamilyName}@100,200,300,400,500,600,700,800,900&display=swap');`

  // Single-word tab labels to ensure no multi-line wrapping
  const tabs: TabItem[] = [
    { id: "inspect", label: "Inspect", icon: <Type size={12} className="stroke-[2.2]" /> },
    { id: "cdn", label: "CDN", icon: <Code size={12} className="stroke-[2.2]" /> },
    { id: "links", label: "Links", icon: <Globe size={12} className="stroke-[2.2]" /> }
  ]

  const weights = ["300", "400", "500", "600", "700", "800", "900"]

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2147483647,
        width: "440px",
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "90vh"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in text-neutral-900 dark:text-neutral-100 select-none flex flex-col`}
    >
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Type size={13} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black tracking-tight leading-none text-neutral-900 dark:text-neutral-50">
                Font Inspector
              </h3>
              <Badge variant="muted" className="text-[9px] py-0 px-1 font-mono">
                &lt;{metrics.tagName.toLowerCase()}&gt;
              </Badge>
            </div>
          </div>
          <IconButton size="sm" variant="ghost" onClick={onClose} title="Close Inspector">
            <X size={14} className="stroke-[2.5]" />
          </IconButton>
        </div>

        {/* Navigation Tabs (One-word labels, strictly 1 line) */}
        <div className="px-3 pt-2.5 pb-1.5 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-850 shrink-0">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto hub-scrollbar">
          {activeTab === "inspect" && (
            <div className="p-4 space-y-3.5">
              {/* Primary Font Header Box */}
              <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                    Primary Font
                  </span>
                  <h2 className="text-[15px] font-black truncate tracking-tight text-neutral-900 dark:text-neutral-50 mt-0.5">
                    {primaryFont}
                  </h2>
                  <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate mt-0.5" title={metrics.fontFamily}>
                    {metrics.fontFamily}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy("name", primaryFont)}
                  className="text-[10px] h-7 px-2.5 shrink-0 font-bold"
                >
                  {copiedKey === "name" ? <Check size={11} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={11} />}
                  {copiedKey === "name" ? "Copied" : "Copy Name"}
                </Button>
              </div>

              {/* Minimal Dummy Test Area */}
              <div className="space-y-2">
                {/* Clean Preset Chips */}
                <div className="flex items-center gap-1 overflow-x-auto hub-scrollbar">
                  {metrics.sampleText && (
                    <Button
                      size="sm"
                      variant={activePreset === "element" ? "primary" : "secondary"}
                      onClick={() => handlePresetSelect("element")}
                      className="text-[10px] h-6 px-2.5 shrink-0 rounded-md font-semibold"
                    >
                      Element
                    </Button>
                  )}
                  {DUMMY_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      size="sm"
                      variant={activePreset === preset.id ? "primary" : "secondary"}
                      onClick={() => handlePresetSelect(preset.id)}
                      className="text-[10px] h-6 px-2.5 shrink-0 rounded-md font-semibold"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* Interactive Dummy Text Box (guaranteed rendered in picked font) */}
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 transition-all focus-within:border-neutral-400 dark:focus-within:border-neutral-600 shadow-inner">
                  <textarea
                    value={customSample}
                    onChange={(e) => setCustomSample(e.target.value)}
                    rows={2}
                    style={
                      {
                        "--preview-font-family": metrics.fontFamily,
                        fontFamily: metrics.fontFamily,
                        fontSize: `${previewSize}px`,
                        fontWeight: previewWeight,
                        textTransform: previewTransform,
                        lineHeight: metrics.lineHeight || "1.4"
                      } as React.CSSProperties
                    }
                    className="font-preview-element w-full bg-transparent text-neutral-900 dark:text-neutral-100 resize-none outline-none border-none p-0 leading-snug transition-all"
                    placeholder="Type anything to test this font..."
                  />
                </div>

                {/* Sleek Minimal Preview Controls */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-neutral-100/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 text-[11px] gap-2">
                  {/* Size Stepper */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Size:</span>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewSize((s) => Math.max(10, s - 2))}
                      className="h-5 w-5 p-0"
                      title="Decrease size"
                    >
                      <Minus size={10} />
                    </IconButton>
                    <span className="font-mono font-bold text-[11px] min-w-[26px] text-center">
                      {previewSize}px
                    </span>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewSize((s) => Math.min(48, s + 2))}
                      className="h-5 w-5 p-0"
                      title="Increase size"
                    >
                      <Plus size={10} />
                    </IconButton>
                  </div>

                  {/* Weight Quick Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">W:</span>
                    <div className="flex items-center gap-0.5">
                      {weights.map((w) => (
                        <Button
                          key={w}
                          size="sm"
                          variant={previewWeight === w ? "primary" : "ghost"}
                          onClick={() => setPreviewWeight(w)}
                          className="h-5 px-1 text-[9px] min-w-[18px] rounded font-bold"
                        >
                          {w[0]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Case Toggle */}
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      size="sm"
                      variant={previewTransform === "uppercase" ? "primary" : "ghost"}
                      onClick={() => setPreviewTransform(previewTransform === "uppercase" ? "none" : "uppercase")}
                      className="h-5 w-5 p-0"
                      title="Uppercase"
                    >
                      <CaseUpper size={12} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant={previewTransform === "lowercase" ? "primary" : "ghost"}
                      onClick={() => setPreviewTransform(previewTransform === "lowercase" ? "none" : "lowercase")}
                      className="h-5 w-5 p-0"
                      title="Lowercase"
                    >
                      <CaseLower size={12} />
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Size</span>
                  <span className="font-mono font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">{metrics.fontSize}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Weight</span>
                  <span className="font-mono font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">{metrics.fontWeight}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Line Height</span>
                  <span className="font-mono font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">{metrics.lineHeight}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Color</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0 shadow-2xs"
                      style={{ backgroundColor: metrics.color }}
                    />
                    <span className="font-mono font-bold text-[11px] truncate text-neutral-900 dark:text-neutral-100">{metrics.color}</span>
                  </div>
                </div>
              </div>

              {/* Quick Snippet Copy Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy("css", cssSnippet)}
                  className="text-[11px] h-8 font-bold"
                >
                  {copiedKey === "css" ? <Check size={12} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={12} />}
                  {copiedKey === "css" ? "Copied CSS" : "Copy CSS"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy("tailwind", tailwindSnippet)}
                  className="text-[11px] h-8 font-bold"
                >
                  {copiedKey === "tailwind" ? <Check size={12} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={12} />}
                  {copiedKey === "tailwind" ? "Copied Tailwind" : "Copy Tailwind"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "cdn" && (
            <div className="p-4 space-y-3">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                CDN and embed snippets for <span className="font-bold text-neutral-900 dark:text-neutral-100">{primaryFont}</span>:
              </div>

              {/* Google Fonts HTML Link */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="interactive" className="text-[9px]">HTML Link</Badge>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Google Fonts</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("gf-link", googleFontsHtmlLink)}
                    className="text-[10px] h-6 px-2 font-bold"
                  >
                    {copiedKey === "gf-link" ? <Check size={11} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={11} />}
                    {copiedKey === "gf-link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
                <pre className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre hub-scrollbar select-text">
                  {googleFontsHtmlLink}
                </pre>
              </div>

              {/* Google Fonts CSS @import */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="neutral" className="text-[9px]">CSS Import</Badge>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Google Fonts</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("gf-import", googleFontsImport)}
                    className="text-[10px] h-6 px-2 font-bold"
                  >
                    {copiedKey === "gf-import" ? <Check size={11} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={11} />}
                    {copiedKey === "gf-import" ? "Copied" : "Copy @import"}
                  </Button>
                </div>
                <pre className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre hub-scrollbar select-text">
                  {googleFontsImport}
                </pre>
              </div>

              {/* Fontshare CSS @import */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="neutral" className="text-[9px]">CSS Import</Badge>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Fontshare</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("fs-import", fontshareImport)}
                    className="text-[10px] h-6 px-2 font-bold"
                  >
                    {copiedKey === "fs-import" ? <Check size={11} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={11} />}
                    {copiedKey === "fs-import" ? "Copied" : "Copy @import"}
                  </Button>
                </div>
                <pre className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre hub-scrollbar select-text">
                  {fontshareImport}
                </pre>
              </div>

              {/* Full CSS Declaration */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">CSS Rule</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("css-full", cssSnippet)}
                    className="text-[10px] h-6 px-2 font-bold"
                  >
                    {copiedKey === "css-full" ? <Check size={11} className="text-neutral-900 dark:text-neutral-100" /> : <Copy size={11} />}
                    {copiedKey === "css-full" ? "Copied" : "Copy CSS"}
                  </Button>
                </div>
                <pre className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre hub-scrollbar select-text">
                  {cssSnippet}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="p-4 space-y-2.5">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Find <span className="font-bold text-neutral-900 dark:text-neutral-100">{primaryFont}</span> on font directories:
              </div>

              <div className="space-y-1.5">
                {/* Fontshare */}
                <a
                  href={`https://www.fontshare.com/?search=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      FS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        Fontshare
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Indian Type Foundry free fonts & CDN
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>

                {/* Google Fonts */}
                <a
                  href={`https://fonts.google.com/?query=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      GF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        Google Fonts
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Open-source font catalog
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>

                {/* Bunny Fonts */}
                <a
                  href={`https://fonts.bunny.net/?q=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      BF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        Bunny Fonts
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Privacy-friendly Google Fonts mirror
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>

                {/* Fonts In Use */}
                <a
                  href={`https://fontsinuse.com/search?terms=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      FU
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        Fonts in Use
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Real-world typography specimens
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>

                {/* CDNfonts */}
                <a
                  href={`https://www.cdnfonts.com/search?q=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      CF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        CDNfonts
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Web font CDN files
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>

                {/* Adobe Fonts */}
                <a
                  href={`https://fonts.adobe.com/search?query=${encodeURIComponent(primaryFont)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                      AF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
                        Adobe Fonts
                        <ExternalLink size={10} className="text-neutral-400" />
                      </h4>
                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400">
                        Adobe Creative Cloud catalog
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[9px]">Open</Badge>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
          <span>Click element or press Esc</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.fontshare.com/?search=${encodeURIComponent(primaryFont)}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-0.5"
            >
              Fontshare <ExternalLink size={9} />
            </a>
            <span>•</span>
            <a
              href={`https://fonts.google.com/?query=${encodeURIComponent(primaryFont)}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-0.5"
            >
              Google Fonts <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FontFinderModal
