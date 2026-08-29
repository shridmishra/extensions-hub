import React, { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import IconButton from "./IconButton"

export interface InspectorModalBreadcrumb {
  label: string
  isMono?: boolean
  isBold?: boolean
}

export interface InspectorModalProps {
  icon?: React.ReactNode
  title: string
  breadcrumbs?: (string | InspectorModalBreadcrumb)[]
  onClose: () => void
  isDarkMode?: boolean
  children: React.ReactNode
  className?: string
  contentClassName?: string
  width?: string
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  icon,
  title,
  breadcrumbs = [],
  onClose,
  isDarkMode = false,
  children,
  className,
  contentClassName,
  width = "360px"
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 2147483647,
        width,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "88vh"
      }}
      className={cn(
        "hub-extension-root animate-scale-in text-neutral-900 dark:text-neutral-100 select-none flex flex-col font-sans",
        isDarkMode ? "dark" : "",
        className
      )}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full min-h-0 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-100/70 dark:bg-neutral-850/70 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <div className="shrink-0 flex items-center justify-center">{icon}</div>}
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <h3 className="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-50 shrink-0">
                {title}
              </h3>
              {breadcrumbs.map((crumb, idx) => {
                const label: string = typeof crumb === "string" ? crumb : crumb.label
                const isMono = typeof crumb === "object" && crumb !== null ? Boolean(crumb.isMono) : false
                const isBold = typeof crumb === "object" && crumb !== null ? Boolean(crumb.isBold) : false

                return (
                  <React.Fragment key={idx}>
                    <span className="text-neutral-400 dark:text-neutral-600 text-xs shrink-0">•</span>
                    <span
                      className={cn(
                        "text-xs truncate",
                        isMono ? "font-mono" : "font-sans",
                        isBold
                          ? "font-bold text-neutral-800 dark:text-neutral-200"
                          : "font-medium text-neutral-500 dark:text-neutral-400"
                      )}
                    >
                      {label}
                    </span>
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
            tooltipPosition="bottom-left"
            className="shrink-0 h-7 w-7 rounded-lg"
          >
            <X size={14} className="stroke-[2.2]" />
          </IconButton>
        </div>

        {/* Content Area */}
        <div
          className={cn(
            "p-3.5 flex flex-col gap-3 min-h-0 bg-white dark:bg-neutral-900 overflow-y-auto hub-scrollbar flex-1",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default InspectorModal
