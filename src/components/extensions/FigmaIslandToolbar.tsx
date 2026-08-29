import React from "react"
import {
  Maximize2,
  MousePointer,
  Code,
  X
} from "lucide-react"
import type { IRDocument } from "../../types/ir"
import IconButton from "../ui/IconButton"
import Button from "../ui/Button"
import FigmaIcon from "../ui/FigmaIcon"

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
  onCopyAll?: () => void
  onClose: () => void
  capturedItems?: CapturedItem[]
  onSelectCapturedItem?: (item: CapturedItem) => void
  isDarkMode: boolean
  isCapturingPage?: boolean
}

export const FigmaIslandToolbar: React.FC<FigmaIslandToolbarProps> = ({
  currentMode,
  onModeChange,
  onCapturePage,
  onClose,
  isDarkMode,
  isCapturingPage = false
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        pointerEvents: "auto"
      }}
      className={`hub-extension-root ${isDarkMode ? "dark" : ""} animate-scale-in select-none font-sans`}
    >
      <div className="flex items-center h-12 px-2.5 gap-1.5 rounded-2xl bg-neutral-900/95 dark:bg-[#121215]/95 text-white border border-neutral-700/60 dark:border-neutral-800 shadow-2xl backdrop-blur-md">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 px-2 h-9 text-white font-black text-sm tracking-tight shrink-0">
          <FigmaIcon size={18} className="shrink-0" />
          <span>Figma</span>
        </div>

        <div className="w-px h-6 bg-neutral-800 shrink-0 my-auto mx-0.5" />

        {/* Action 1: Capture Page */}
        <Button
          variant="ghost"
          size="md"
          onClick={onCapturePage}
          disabled={isCapturingPage}
          title="1-Click Capture Entire Page to Figma"
          className="h-9 px-3 text-sm font-bold text-neutral-200 hover:text-white hover:bg-neutral-800/80 gap-2 shrink-0 border-0"
        >
          {isCapturingPage ? (
            <svg className="animate-spin h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Maximize2 className="w-4 h-4 text-neutral-300" />
          )}
          <span>{isCapturingPage ? "Capturing..." : "Capture page"}</span>
        </Button>

        {/* Action 2: Select Element (Figma Vector) */}
        <Button
          variant={currentMode === "figma-element" ? "primary" : "ghost"}
          size="md"
          onClick={() => onModeChange("figma-element")}
          title="Hover and click any element to copy for Figma"
          className={`h-9 px-3 text-sm font-bold gap-2 shrink-0 ${
            currentMode === "figma-element"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700/80 hover:bg-neutral-750"
              : "text-neutral-200 hover:text-white hover:bg-neutral-800/80 border-0"
          }`}
        >
          <MousePointer className="w-4 h-4 text-purple-400" />
          <span>Select element</span>
        </Button>

        {/* Action 3: Copy CSS */}
        <Button
          variant={currentMode === "inspect-css" ? "primary" : "ghost"}
          size="md"
          onClick={() => onModeChange("inspect-css")}
          title="Hover and click any element to inspect & copy CSS"
          className={`h-9 px-3 text-sm font-bold gap-2 shrink-0 ${
            currentMode === "inspect-css"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700/80 hover:bg-neutral-750"
              : "text-neutral-200 hover:text-white hover:bg-neutral-800/80 border-0"
          }`}
        >
          <Code className="w-4 h-4 text-blue-400" />
          <span>Copy CSS</span>
        </Button>

        <div className="w-px h-6 bg-neutral-800 shrink-0 my-auto mx-0.5" />

        {/* Close Button */}
        <IconButton
          size="md"
          variant="ghost"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close"
          className="text-neutral-400 hover:text-white hover:bg-neutral-800 h-8 w-8 rounded-lg shrink-0"
        >
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  )
}

export default FigmaIslandToolbar
