import React from "react"
import {
  Maximize2,
  MousePointer,
  X
} from "lucide-react"
import type { IRDocument } from "../../types/ir"
import IconButton from "../ui/IconButton"
import Button from "../ui/Button"
import FigmaIcon from "../ui/FigmaIcon"

export type ToolbarMode = "figma-element" | "figma-fullpage"

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
        top: "16px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        zIndex: 2147483647,
        pointerEvents: "none",
        background: "transparent"
      }}
      className={`${isDarkMode ? "dark" : ""} select-none font-sans pointer-events-none`}
    >
      <div className="hub-extension-root pointer-events-auto animate-scale-in flex items-center h-9 px-2.5 gap-1.5 rounded-full bg-neutral-900/95 dark:bg-neutral-900/95 text-white shadow-2xl backdrop-blur-md">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 px-2 h-7 text-white font-bold text-xs tracking-tight shrink-0">
          <FigmaIcon size={15} className="shrink-0" />
          <span>Figma</span>
        </div>

        <div className="w-px h-4 bg-neutral-800/80 shrink-0 my-auto mx-0.5" />

        {/* Action 1: Capture Page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCapturePage}
          disabled={isCapturingPage}
          title="1-Click Capture Entire Page to Figma"
          className="h-7 px-3 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 gap-1.5 shrink-0 rounded-full"
        >
          {isCapturingPage ? (
            <svg className="animate-spin h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-neutral-300" />
          )}
          <span>{isCapturingPage ? "Capturing..." : "Capture page"}</span>
        </Button>

        {/* Action 2: Select Element (Figma Vector) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("figma-element")}
          title="Hover and click any element to copy for Figma"
          className={`h-7 px-3 text-xs font-medium gap-1.5 shrink-0 rounded-full transition-all ${
            currentMode === "figma-element"
              ? "bg-neutral-800 text-white font-semibold shadow-xs hover:bg-neutral-750"
              : "text-neutral-200 hover:text-white hover:bg-neutral-800/80"
          }`}
        >
          <MousePointer className="w-3.5 h-3.5 text-purple-400" />
          <span>Select element</span>
        </Button>

        <div className="w-px h-4 bg-neutral-800 shrink-0 my-auto mx-0.5" />

        {/* Close Button */}
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close"
          tooltipPosition="bottom-left"
          className="text-neutral-400 hover:text-white hover:bg-neutral-800 h-7 w-7 rounded-full shrink-0 p-1.5"
        >
          <X className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
  )
}

export default FigmaIslandToolbar
