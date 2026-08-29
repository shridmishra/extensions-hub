import React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import Button from "./Button"

export interface ActiveToolBannerProps {
  /** Name of the active tool (e.g. "Font Finder", "Color Picker") */
  title: string
  /** Tool icon element (e.g. <Type size={14} /> or <Pipette size={14} />) */
  icon?: React.ReactNode
  /** Action instruction text (e.g. "Click element to inspect", "Click element to pick") */
  instruction?: string
  /** Icon displayed alongside the instruction (e.g. <MousePointer size={12} />) */
  instructionIcon?: React.ReactNode
  /** Callback fired when the exit button is clicked */
  onClose: () => void
  /** Whether the host page is in dark mode */
  isDarkMode?: boolean
  /** Label for the exit button (default: "Exit") */
  exitLabel?: string
  /** Shortcut key hint displayed on the exit badge (default: "Esc") */
  shortcutKey?: string
  /** Extra children/action items inserted before the exit button */
  children?: React.ReactNode
  /** Additional container CSS class names */
  className?: string
}

export const ActiveToolBanner: React.FC<ActiveToolBannerProps> = ({
  title,
  icon,
  instruction,
  instructionIcon,
  onClose,
  isDarkMode = false,
  exitLabel = "Exit",
  shortcutKey = "Esc",
  children,
  className
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
      className={cn("hub-extension-root font-sans select-none", isDarkMode ? "dark" : "", className)}
    >
      <div className="pointer-events-auto animate-scale-in flex items-center h-8.5 px-3 py-1 gap-2.5 rounded-full bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 shadow-xl backdrop-blur-md">
        {/* Tool Identifier */}
        <div className="flex items-center gap-1.5 shrink-0">
          {icon && <span className="flex items-center justify-center shrink-0">{icon}</span>}
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            {title}
          </span>
        </div>

        {/* Action Instruction */}
        {instruction && (
          <>
            <div className="w-px h-3.5 bg-neutral-200/80 dark:bg-neutral-800/80 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0 text-neutral-600 dark:text-neutral-300 text-xs font-medium">
              {instructionIcon && (
                <span className="flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                  {instructionIcon}
                </span>
              )}
              <span>{instruction}</span>
            </div>
          </>
        )}

        {children}

        {/* Divider */}
        <div className="w-px h-3.5 bg-neutral-200/80 dark:bg-neutral-800/80 shrink-0" />

        {/* Dedicated Exit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title={`Exit (${shortcutKey})`}
          className="h-6 px-2 text-xs font-semibold gap-1.5 shrink-0 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800 active:scale-95 transition-all bg-neutral-100/90 dark:bg-neutral-850 shadow-2xs"
        >
          <span>{exitLabel}</span>
          <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-white dark:bg-neutral-750 text-neutral-600 dark:text-neutral-300 shadow-2xs leading-none">
            {shortcutKey}
          </span>
          <X size={12} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
        </Button>
      </div>
    </div>
  )
}

export default ActiveToolBanner
