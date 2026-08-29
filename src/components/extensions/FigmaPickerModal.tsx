import React, { useState, useEffect } from "react"
import { Copy, Check, Layers, Download, CheckCircle2, FileCode2 } from "lucide-react"
import type { IRDocument } from "../../types/ir"
import { copyDirectToFigmaClipboard } from "../../converter"
import Button from "../ui/Button"
import FigmaIcon from "../ui/FigmaIcon"
import InspectorModal from "../ui/InspectorModal"

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

  const totalShapes = stats.vectorNodes + stats.cutoutNodes

  return (
    <InspectorModal
      icon={<FigmaIcon size={15} className="shrink-0" />}
      title="Figma Layer Captured"
      breadcrumbs={[
        { label: `${doc.viewport.width} × ${doc.viewport.height} px`, isMono: true, isBold: false }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
    >
      {/* Success Banner: Clean Row Layout with Command-Press Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-850 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Copied to Clipboard
          </span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-neutral-750 text-xs font-sans font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
          ⌘V
        </kbd>
      </div>

      {/* Stats Grid: Row Layout for Layers & Vectors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Layers
            </span>
          </div>
          <span className="text-xs font-sans font-bold text-neutral-900 dark:text-neutral-100 truncate ml-1">
            <span className="font-mono">{stats.totalNodes}</span> nodes
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Vectors
            </span>
          </div>
          <span className="text-xs font-sans font-bold text-neutral-900 dark:text-neutral-100 truncate ml-1">
            <span className="font-mono">{totalShapes}</span> shapes
          </span>
        </div>
      </div>

      {/* Actions: Side-by-side Row */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCopyAgain}
          className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
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
          size="sm"
          onClick={handleDownloadJSON}
          className="text-xs font-bold gap-1.5 h-9 w-full rounded-xl"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </Button>
      </div>
    </InspectorModal>
  )
}

export default FigmaPickerModal
