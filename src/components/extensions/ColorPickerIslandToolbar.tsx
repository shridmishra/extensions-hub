import React from "react"
import { Pipette, MousePointer, X } from "lucide-react"
import IconButton from "../ui/IconButton"
import Button from "../ui/Button"

export type ColorPickerToolbarMode = "pick-color"

interface ColorPickerIslandToolbarProps {
  currentMode: ColorPickerToolbarMode
  onModeChange: (mode: ColorPickerToolbarMode) => void
  onClose: () => void
  isDarkMode: boolean
}

export const ColorPickerIslandToolbar: React.FC<ColorPickerIslandToolbarProps> = ({
  currentMode,
  onModeChange,
  onClose,
  isDarkMode
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
          <Pipette size={15} className="shrink-0 text-pink-400" />
          <span>Color Picker</span>
        </div>

        <div className="w-px h-4 bg-neutral-800/80 shrink-0 my-auto mx-0.5" />

        {/* Action: Pick Color */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange("pick-color")}
          title="Hover and click any element or pixel to pick color"
          className="h-7 px-3 text-xs font-medium gap-1.5 shrink-0 rounded-full bg-neutral-800 text-white font-semibold shadow-xs hover:bg-neutral-750 transition-all"
        >
          <MousePointer className="w-3.5 h-3.5 text-pink-400" />
          <span>Pick color</span>
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

export default ColorPickerIslandToolbar
