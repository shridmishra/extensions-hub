import React, { useState, useEffect } from "react"
import { Copy, Check, X, Code, CheckCircle2 } from "lucide-react"
import type { ExtractedStyles } from "../../lib/css-extractor"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Tabs from "../ui/Tabs"

interface CssInspectorModalProps {
  styles: ExtractedStyles
  onClose: () => void
  isDarkMode: boolean
}

type TabType = "css" | "tailwind"

const CssInspectorModal: React.FC<CssInspectorModalProps> = ({
  styles,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("css")
  const [copied, setCopied] = useState(false)
  const [autoCopiedShow, setAutoCopiedShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoCopiedShow(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = async () => {
    const textToCopy = activeTab === "css" ? styles.rawCSS : styles.tailwindClasses
    await copyToClipboard(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const tabItems = [
    { id: "css", label: "Raw CSS" },
    { id: "tailwind", label: "Tailwind CSS" }
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
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2147483647,
        width: "420px",
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "90vh"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in text-neutral-900 dark:text-neutral-100 select-none flex flex-col`}
    >
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs shrink-0">
              <Code size={14} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-50 shrink-0">
                &lt;{styles.tagName.toLowerCase()}&gt;
              </h3>
              {selectorText && (
                <>
                  <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
                  <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    {selectorText}
                  </span>
                </>
              )}
              <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
              <span className="text-xs font-mono font-medium text-neutral-400 dark:text-neutral-500 truncate">
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
            className="shrink-0 h-8 w-8 rounded-lg"
          >
            <X size={16} className="stroke-[2.2]" />
          </IconButton>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-3 min-h-0 bg-white dark:bg-neutral-950 overflow-y-auto hub-scrollbar">
          {/* Auto-Copied Banner */}
          {autoCopiedShow && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 text-sm font-bold">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tailwind CSS copied to clipboard</span>
              </div>
              <kbd className="px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
                ⌘V
              </kbd>
            </div>
          )}

          {/* Tab Selector */}
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabType)}
            variant="pill"
          />

          {/* Code Viewer Box */}
          <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/70 overflow-hidden flex flex-col font-mono min-h-[130px] max-h-[220px]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-200/80 dark:border-neutral-800/80 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase shrink-0">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                {activeTab === "css" ? "CSS Ruleset" : "Tailwind Classes"}
              </span>
            </div>

            <div
              className="flex-1 overflow-y-auto p-3 text-xs font-mono leading-relaxed text-neutral-800 dark:text-neutral-200 select-text whitespace-pre-wrap break-all hub-scrollbar"
              style={{ overscrollBehavior: "contain" }}
            >
              <code>{activeTab === "css" ? styles.rawCSS : styles.tailwindClasses}</code>
            </div>
          </div>

          {/* Action Copy Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleCopy}
            className="w-full h-9 text-sm font-bold gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy {activeTab === "css" ? "CSS Ruleset" : "Tailwind Classes"}</span>
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
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
