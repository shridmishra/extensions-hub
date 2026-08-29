import React from "react"
import {
  Layers,
  Maximize2,
  MousePointer,
  Code,
  Files,
  X
} from "lucide-react"
import type { IRDocument } from "../../types/ir"
import IconButton from "../ui/IconButton"

export type ToolbarMode = "figma-element" | "figma-fullpage" | "inspect-css"

export interface CapturedItem {
  id: string
  title: string
  doc: IRDocument
}

interface FigmaIslandToolbarProps {
  currentMode: ToolbarMode
  onModeChange: (mode: ToolbarMode) => void
  onCapturePage: () => void
  onCopyAll: () => void
  onClose: () => void
  capturedItems: CapturedItem[]
  onSelectCapturedItem: (item: CapturedItem) => void
  isDarkMode: boolean
  isCapturingPage?: boolean
}

export const FigmaIslandToolbar: React.FC<FigmaIslandToolbarProps> = ({
  currentMode,
  onModeChange,
  onCapturePage,
  onCopyAll,
  onClose,
  capturedItems,
  onSelectCapturedItem,
  isDarkMode,
  isCapturingPage = false
}) => {
  const hasCapturedItems = capturedItems.length > 0

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        pointerEvents: "auto"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in select-none font-sans`}
    >
      <div className="flex flex-col rounded-2xl bg-neutral-900/95 dark:bg-[#121215]/95 text-white border border-neutral-700/60 dark:border-neutral-800 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Top Shelf for Captured Thumbnails */}
        {hasCapturedItems && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/80 border-b border-neutral-800/80 gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[420px] py-0.5 hub-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1 shrink-0">
                Captured:
              </span>
              {capturedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCapturedItem(item)}
                  title={`Click to copy: ${item.title}`}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/80 text-[11px] font-semibold text-neutral-200 hover:text-white cursor-pointer transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="truncate max-w-[90px]">{item.title}</span>
                </button>
              ))}
            </div>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={onClose}
              title="Close (Esc)"
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 shrink-0 h-6 w-6 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        )}

        {/* Main Floating Island Bar Row */}
        <div className="flex items-center h-11 px-1.5 gap-1">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 px-2.5 h-8 text-white font-black text-xs tracking-tight shrink-0">
            <div className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span>Figma</span>
          </div>

          <div className="w-px h-5 bg-neutral-800/80 shrink-0 my-auto" />

          {/* Action 1: Capture Page */}
          <button
            type="button"
            onClick={onCapturePage}
            disabled={isCapturingPage}
            title="1-Click Capture Entire Page to Figma"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer disabled:opacity-50 active:scale-98 shrink-0"
          >
            {isCapturingPage ? (
              <svg className="animate-spin h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{isCapturingPage ? "Capturing..." : "Capture page"}</span>
          </button>

          {/* Action 2: Select Element (Figma Vector) */}
          <button
            type="button"
            onClick={() => onModeChange("figma-element")}
            title="Hover and click any element to copy for Figma"
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-98 shrink-0 ${
              currentMode === "figma-element"
                ? "bg-neutral-800 text-white shadow-xs border border-neutral-700/80"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-transparent"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5 text-purple-400" />
            <span>Select element</span>
          </button>

          {/* Action 3: Copy CSS */}
          <button
            type="button"
            onClick={() => onModeChange("inspect-css")}
            title="Hover and click any element to inspect & copy CSS"
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-98 shrink-0 ${
              currentMode === "inspect-css"
                ? "bg-neutral-800 text-white shadow-xs border border-neutral-700/80"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-transparent"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Copy CSS</span>
          </button>

          {/* Action 4: Copy All (if items exist) */}
          {hasCapturedItems && (
            <button
              type="button"
              onClick={onCopyAll}
              title="Copy all captured items to clipboard"
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer active:scale-98 shrink-0 border border-transparent"
            >
              <Files className="w-3.5 h-3.5" />
              <span>Copy all</span>
            </button>
          )}

          <div className="w-px h-5 bg-neutral-800/80 shrink-0 my-auto" />

          {/* Close Button */}
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            title="Close (Esc)"
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 h-7 w-7 rounded-lg shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

export default FigmaIslandToolbar
