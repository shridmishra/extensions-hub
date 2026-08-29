import React, { useState, useEffect } from "react"
import { Copy, Check, CheckCircle2, Box, Hash } from "lucide-react"
import type { ExtractedStyles } from "../../lib/css-extractor"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import Tabs from "../ui/Tabs"
import CssIcon from "../ui/CssIcon"
import InspectorModal from "../ui/InspectorModal"

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
    <InspectorModal
      icon={<CssIcon size={15} className="shrink-0" />}
      title="CSS & Tailwind"
      breadcrumbs={[
        { label: `<${styles.tagName.toLowerCase()}>`, isMono: false, isBold: false },
        { label: `${styles.dimensions.width} × ${styles.dimensions.height}`, isMono: true, isBold: false }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
    >
      {/* Success Banner: Clean Compact Row Layout with Command-Press Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-850 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {copiedTab === "css" ? "Raw CSS Copied" : "Tailwind CSS Copied"}
          </span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-neutral-750 text-xs font-sans font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
          ⌘V
        </kbd>
      </div>

      {/* Stats Grid: Row Layout for Selector & Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Target
            </span>
          </div>
          <span className="text-xs font-sans font-bold text-neutral-900 dark:text-neutral-100 truncate ml-1">
            {selectorText || `<${styles.tagName.toLowerCase()}>`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Box className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Size
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate ml-1">
            {styles.dimensions.width} × {styles.dimensions.height}
          </span>
        </div>
      </div>

      {/* Tab Selector */}
      <div>
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
          variant="pill"
        />
      </div>

      {/* Code Viewer Box */}
      <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-850/80 shadow-2xs p-3 flex flex-col font-mono max-h-[170px] overflow-hidden">
        <div
          className="flex-1 overflow-y-auto text-xs font-mono leading-relaxed text-neutral-800 dark:text-neutral-200 select-text whitespace-pre-wrap break-all hub-scrollbar"
          style={{ overscrollBehavior: "contain" }}
        >
          <code>{activeTab === "css" ? styles.rawCSS : styles.tailwindClasses}</code>
        </div>
      </div>

      {/* Actions: Side-by-side Row */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleCopy("tailwind")}
          className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
        >
          {copiedTab === "tailwind" ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Tailwind</span>
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCopy("css")}
          className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
        >
          {copiedTab === "css" ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy CSS</span>
            </>
          )}
        </Button>
      </div>
    </InspectorModal>
  )
}

export default CssInspectorModal
