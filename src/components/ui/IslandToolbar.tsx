import React from "react"
import { X } from "lucide-react"
import IconButton from "./IconButton"
import Button from "./Button"
import { cn } from "../../lib/utils"

export interface IslandToolbarMode<T extends string = string> {
  id: T
  label: string
  icon?: React.ReactNode
  title?: string
  shortcut?: string
}

export interface IslandToolbarAction {
  id: string
  label: string
  icon?: React.ReactNode
  title?: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export interface IslandToolbarProps<T extends string = string> {
  /** Icon displayed in the brand badge */
  brandIcon?: React.ReactNode
  /** Title displayed in the brand badge */
  brandTitle: string
  /** Available modes for the tool */
  modes?: IslandToolbarMode<T>[]
  /** Currently active mode */
  currentMode?: T
  /** Callback fired when a mode is selected */
  onModeChange?: (mode: T) => void
  /** Quick action buttons */
  actions?: IslandToolbarAction[]
  /** Callback fired when exit button is clicked */
  onClose: () => void
  /** Whether the host page is in dark mode */
  isDarkMode?: boolean
  /** Shortcut key for exit (default: "Esc") */
  exitShortcut?: string
  /** Additional custom children */
  children?: React.ReactNode
  /** Container class overrides */
  className?: string
}

export function IslandToolbar<T extends string = string>({
  brandIcon,
  brandTitle,
  modes = [],
  currentMode,
  onModeChange,
  actions = [],
  onClose,
  isDarkMode = false,
  exitShortcut = "Esc",
  children,
  className
}: IslandToolbarProps<T>) {
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
      className={cn(
        isDarkMode ? "dark" : "",
        "select-none font-sans pointer-events-none",
        className
      )}
    >
      <div className="hub-extension-root pointer-events-auto animate-scale-in flex items-center h-9 px-2.5 gap-1.5 rounded-full bg-neutral-900/95 dark:bg-neutral-900/95 text-white shadow-2xl backdrop-blur-md">
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-1.5 px-2 h-7 text-white font-bold text-xs tracking-tight shrink-0">
          {brandIcon && <span className="shrink-0 flex items-center justify-center">{brandIcon}</span>}
          <span>{brandTitle}</span>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <>
            <div className="w-px h-4 bg-neutral-800/80 shrink-0 my-auto mx-0.5" />
            {actions.map((act) => (
              <Button
                key={act.id}
                variant="ghost"
                size="sm"
                onClick={act.onClick}
                disabled={act.disabled || act.loading}
                title={act.title}
                className="h-7 px-3 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 gap-1.5 shrink-0 rounded-full"
              >
                {act.loading ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  act.icon && <span className="shrink-0">{act.icon}</span>
                )}
                <span>{act.label}</span>
              </Button>
            ))}
          </>
        )}

        {/* Modes Toggle Group */}
        {modes.length > 0 && (
          <>
            <div className="w-px h-4 bg-neutral-800/80 shrink-0 my-auto mx-0.5" />
            {modes.map((mode) => {
              const isSelected = currentMode === mode.id
              return (
                <Button
                  key={mode.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onModeChange?.(mode.id)}
                  title={mode.title}
                  className={`h-7 px-3 text-xs font-medium gap-1.5 shrink-0 rounded-full transition-all ${
                    isSelected
                      ? "bg-neutral-800 text-white font-semibold shadow-xs hover:bg-neutral-750"
                      : "text-neutral-200 hover:text-white hover:bg-neutral-800/80"
                  }`}
                >
                  {mode.icon && <span className="shrink-0">{mode.icon}</span>}
                  <span>{mode.label}</span>
                  {mode.shortcut && (
                    <span className="text-[10px] opacity-60 ml-0.5 font-mono">
                      {mode.shortcut}
                    </span>
                  )}
                </Button>
              )
            })}
          </>
        )}

        {children}

        <div className="w-px h-4 bg-neutral-800/80 shrink-0 my-auto mx-0.5" />

        {/* Exit Button */}
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onClose}
          title={`Close (${exitShortcut})`}
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

export default IslandToolbar
