import React, { useState, useEffect } from "react"
import { Copy, Check, X, Code, CheckCircle2, Box, Hash } from "lucide-react"
import type { ExtractedStyles } from "../../lib/css-extractor"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Tabs from "../ui/Tabs"
import CssIcon from "../ui/CssIcon"

interface CssInspectorModalProps {
  styles: ExtractedStyles
  onClose: () => void
  isDarkMode: boolean
}

type TabType = "tailwind" | "css"

const CssInspectorModal: React.FC<CssInspectorModalProps> = ({
  styles,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("tailwind")
  const [copiedTab, setCopiedTab] = useState<string | null>("tailwind")

  useEffect(() => {
    const timer = setTimeout(() => {
      setCopiedTab(null)
    }, 2500)
    return () => clearTimeout(timer)
  }, [styles])

  const handleCopy = async (tab: TabType) => {
    const textToCopy = tab === "css" ? styles.rawCSS : styles.tailwindClasses
    await copyToClipboard(textToCopy)
    setActiveTab(tab)
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const tabItems = [
    { id: "tailwind", label: "Tailwind CSS" },
    { id: "css", label: "Raw CSS" }
  ]

  const selectorText = styles.id
    ? `#${styles.id}`
    : styles.className
    ? `.${styles.className.split(" ")[0]}`
    : ""

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2147483647,
        width: "420px",
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "90vh"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in text-neutral-900 dark:text-neutral-100 select-none flex flex-col`}
    >
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/40 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <CssIcon size={18} className="shrink-0" />
            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-50 shrink-0">
                CSS & Tailwind
              </h3>
              <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
              <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 truncate">
                &lt;{styles.tagName.toLowerCase()}&gt;
              </span>
              <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
              <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {styles.dimensions.width} × {styles.dimensions.height}
              </span>
            </div>
          </div>

          <IconButton
            size="md"
            variant="ghost"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
            tooltipPosition="bottom-left"
            className="shrink-0 h-8 w-8 rounded-lg"
          >
            <X size={16} className="stroke-[2.2]" />
          </IconButton>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-3 min-h-0 bg-white dark:bg-neutral-950 overflow-y-auto hub-scrollbar">
          {/* Success Banner: Clean Row Layout with Command-Press Badge */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {copiedTab === "css" ? "Raw CSS Copied" : "Tailwind CSS Copied"}
              </span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
              ⌘V
            </kbd>
          </div>

          {/* Stats Grid: Row Layout for Selector & Dimensions */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Target
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate ml-1">
                {selectorText || `<${styles.tagName.toLowerCase()}>`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Size
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {styles.dimensions.width} × {styles.dimensions.height}
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="pt-0.5">
            <Tabs
              tabs={tabItems}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabType)}
              variant="pill"
            />
          </div>

          {/* Code Viewer Box */}
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/40 p-3 flex flex-col font-mono max-h-[160px] overflow-hidden">
            <div
              className="flex-1 overflow-y-auto text-xs font-mono leading-relaxed text-neutral-800 dark:text-neutral-200 select-text whitespace-pre-wrap break-all hub-scrollbar"
              style={{ overscrollBehavior: "contain" }}
            >
              <code>{activeTab === "css" ? styles.rawCSS : styles.tailwindClasses}</code>
            </div>
          </div>

          {/* Actions: Side-by-side Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleCopy("tailwind")}
              className="text-sm font-bold gap-2 h-9 w-full rounded-xl"
            >
              {copiedTab === "tailwind" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Tailwind</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleCopy("css")}
              className="text-sm font-bold gap-2 h-9 w-full rounded-xl"
            >
              {copiedTab === "css" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy CSS</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer: Balanced Dot Separators */}
        <div className="px-4 py-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0 rounded-b-2xl">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Click element to inspect</span>
            <span>•</span>
            <span>Esc to close</span>
          </div>
          <span className="font-mono font-semibold">{activeTab === "css" ? "Raw CSS" : "Tailwind"}</span>
        </div>
      </div>
    </div>
  )
}

export default CssInspectorModal
