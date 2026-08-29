import React, { useState, useEffect } from "react"
import { Copy, Check, X, Layers, Download, CheckCircle2, FileCode2 } from "lucide-react"
import type { IRDocument } from "../../types/ir"
import { copyDirectToFigmaClipboard } from "../../converter"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Badge from "../ui/Badge"

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

  const rootNode = doc.rootNode
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
        width: "380px",
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "90vh"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in text-neutral-900 dark:text-neutral-100 select-none flex flex-col`}
    >
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers size={13} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <h3 className="text-xs font-black tracking-tight text-neutral-900 dark:text-neutral-50 shrink-0">
                  Figma Layer Captured
                </h3>
                <Badge variant="muted" className="text-[9px] py-0 px-1 font-mono truncate max-w-[130px]">
                  {rootNode.name || doc.title}
                </Badge>
              </div>
              <span className="text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 leading-none mt-0.5">
                {doc.viewport.width} × {doc.viewport.height} px
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconButton size="sm" variant="ghost" onClick={onClose} title="Close Inspector">
              <X size={14} className="stroke-[2.5]" />
            </IconButton>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-3 min-h-0 bg-white dark:bg-neutral-950 overflow-y-auto hub-scrollbar">
          {/* Success Banner */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-800 dark:text-neutral-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Copied to Clipboard!</div>
              <div className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400 mt-0.5">
                Press <span className="font-mono font-bold">⌘+V</span> on your Figma canvas.
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800/70 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                  Layers
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate block">
                  {stats.totalNodes} nodes
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800/70 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 shrink-0">
                <FileCode2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                  Vectors
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate block">
                  {stats.vectorNodes + stats.cutoutNodes} shapes
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Button
              variant="primary"
              size="md"
              onClick={handleCopyAgain}
              className="text-xs font-bold gap-1.5 h-8"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Again</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleDownloadJSON}
              className="text-xs font-bold gap-1.5 h-8"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
          <span>Paste into Figma canvas / Esc to close</span>
          <span className="font-mono">{stats.totalNodes} Nodes</span>
        </div>
      </div>
    </div>
  )
}

export default FigmaPickerModal
