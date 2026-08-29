import React, { useState, useEffect } from "react"
import { Copy, Check, X, Layers, Download, CheckCircle2, FileCode2 } from "lucide-react"
import type { IRDocument } from "../../types/ir"
import { copyDirectToFigmaClipboard } from "../../converter"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import FigmaIcon from "../ui/FigmaIcon"

interface FigmaPickerModalProps {
  document: IRDocument
  onClose: () => void
  isDarkMode: boolean
}

const FigmaPickerModal: React.FC<FigmaPickerModalProps> = ({
  document: doc,
  onClose,
  isDarkMode
}) => {
  const [copied, setCopied] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCopied(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [doc])

  const handleCopyAgain = async () => {
    await copyDirectToFigmaClipboard(doc)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(doc, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `figma-capture-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const stats = doc.stats || {
    totalNodes: 1,
    textNodes: 0,
    vectorNodes: 0,
    cutoutNodes: 0,
    imageNodes: 0
  }

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
            <FigmaIcon size={20} className="shrink-0" />
            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-50 shrink-0">
                Figma Layer Captured
              </h3>
              <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
              <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {doc.viewport.width} × {doc.viewport.height} px
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
                Copied to Clipboard
              </span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
              ⌘V
            </kbd>
          </div>

          {/* Stats Grid: Row Layout for Layers & Vectors */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Layers
                </span>
              </div>
              <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                {stats.totalNodes} nodes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Vectors
                </span>
              </div>
              <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                {stats.vectorNodes + stats.cutoutNodes} shapes
              </span>
            </div>
          </div>

          {/* Actions: Side-by-side Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <Button
              variant="primary"
              size="md"
              onClick={handleCopyAgain}
              className="text-sm font-bold gap-2 h-9 w-full rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Again</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleDownloadJSON}
              className="text-sm font-bold gap-2 h-9 w-full rounded-xl"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </Button>
          </div>
        </div>

        {/* Footer: Balanced Dot Separators */}
        <div className="px-4 py-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0 rounded-b-2xl">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Paste in Figma</span>
            <span>•</span>
            <span>Esc to close</span>
          </div>
          <span className="font-mono font-semibold">{stats.totalNodes} Nodes</span>
        </div>
      </div>
    </div>
  )
}

export default FigmaPickerModal
