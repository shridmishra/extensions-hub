import React, { useEffect, useState, useRef, useCallback } from "react"
import { X, GripHorizontal } from "lucide-react"
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

type CornerDirection = "se" | "sw"

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
  const modalRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState<{ width: number; height?: number } | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [activeCorner, setActiveCorner] = useState<CornerDirection | null>(null)

  // Esc key listener
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

  // Window resize handler to ensure modal stays within viewport bounds
  useEffect(() => {
    const handleWindowResize = () => {
      if (!modalRef.current) return
      setPosition((prev) => {
        if (!prev) return null
        const rect = modalRef.current?.getBoundingClientRect()
        const modalW = rect?.width || 360
        const modalH = rect?.height || 300
        const maxX = Math.max(8, window.innerWidth - modalW - 8)
        const maxY = Math.max(8, window.innerHeight - modalH - 8)
        return {
          x: Math.max(8, Math.min(maxX, prev.x)),
          y: Math.max(8, Math.min(maxY, prev.y))
        }
      })
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [])

  // Header pointer down for dragging
  const handleHeaderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return

      // Do not initiate drag if user interacted with interactive elements
      const target = e.target as HTMLElement | null
      if (
        target?.closest(
          "button, a, input, select, textarea, [role='button'], .no-drag, [data-no-drag]"
        )
      ) {
        return
      }

      if (!modalRef.current) return

      const rect = modalRef.current.getBoundingClientRect()
      const startPointerX = e.clientX
      const startPointerY = e.clientY
      const startPosX = rect.left
      const startPosY = rect.top
      const modalWidth = rect.width
      const modalHeight = rect.height

      setIsDragging(true)
      e.preventDefault()

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startPointerX
        const deltaY = moveEvent.clientY - startPointerY
        const nextX = startPosX + deltaX
        const nextY = startPosY + deltaY

        const minX = 8
        const maxX = Math.max(8, window.innerWidth - modalWidth - 8)
        const minY = 8
        const maxY = Math.max(8, window.innerHeight - modalHeight - 8)

        const clampedX = Math.max(minX, Math.min(maxX, nextX))
        const clampedY = Math.max(minY, Math.min(maxY, nextY))

        setPosition({ x: clampedX, y: clampedY })
      }

      const handlePointerUp = () => {
        setIsDragging(false)
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("pointercancel", handlePointerUp)
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerUp)
    },
    []
  )

  // Corner pointer down for diagonal-only resizing
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, corner: CornerDirection) => {
      if (e.button !== 0) return
      if (!modalRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = modalRef.current.getBoundingClientRect()
      const startPointerX = e.clientX
      const startPointerY = e.clientY
      const startWidth = rect.width
      const startHeight = rect.height
      const startPosX = rect.left
      const startPosY = rect.top

      setIsResizing(true)
      setActiveCorner(corner)

      // Lock current fixed coordinates so resize transition is seamless
      setPosition({ x: startPosX, y: startPosY })

      const minW = 280
      const maxW = Math.max(minW, Math.min(800, window.innerWidth - 16))
      const minH = 200
      const maxH = Math.max(minH, Math.min(window.innerHeight - 16, window.innerHeight * 0.92))

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startPointerX
        const deltaY = moveEvent.clientY - startPointerY

        let newWidth = startWidth
        let newHeight = startHeight
        let newPosX = startPosX
        let newPosY = startPosY

        if (corner === "se") {
          // Bottom-Right: adjust width and height down & right
          newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX))
          newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY))
          if (startPosX + newWidth > window.innerWidth - 8) {
            newWidth = window.innerWidth - 8 - startPosX
          }
          if (startPosY + newHeight > window.innerHeight - 8) {
            newHeight = window.innerHeight - 8 - startPosY
          }
        } else if (corner === "sw") {
          // Bottom-Left: adjust width, height, posX down & left
          const candidateW = Math.max(minW, Math.min(maxW, startWidth - deltaX))
          newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY))
          if (startPosY + newHeight > window.innerHeight - 8) {
            newHeight = window.innerHeight - 8 - startPosY
          }
          newPosX = Math.max(8, startPosX + (startWidth - candidateW))
          newWidth = startWidth + (startPosX - newPosX)
        }

        newWidth = Math.max(minW, Math.min(maxW, newWidth))
        newHeight = Math.max(minH, Math.min(maxH, newHeight))

        setPosition({ x: newPosX, y: newPosY })
        setSize({ width: Math.round(newWidth), height: Math.round(newHeight) })
      }

      const handlePointerUp = () => {
        setIsResizing(false)
        setActiveCorner(null)
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("pointercancel", handlePointerUp)
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerUp)
    },
    []
  )

  const isPositioned = position !== null

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: isPositioned ? `${position.y}px` : undefined,
        left: isPositioned ? `${position.x}px` : undefined,
        bottom: !isPositioned ? "20px" : undefined,
        right: !isPositioned ? "20px" : undefined,
        zIndex: 2147483647,
        width: size ? `${size.width}px` : width,
        height: size?.height ? `${size.height}px` : undefined,
        maxWidth: "calc(100vw - 16px)",
        maxHeight: size?.height ? `${size.height}px` : "88vh"
      }}
      className={cn(
        "hub-extension-root text-neutral-900 dark:text-neutral-100 select-none flex flex-col font-sans",
        !isDragging && !isResizing && "animate-scale-in",
        isDarkMode ? "dark" : "",
        className
      )}
    >
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full min-h-0 flex-1 border border-neutral-200/80 dark:border-neutral-800/80">
        {/* Header - Draggable Area */}
        <div
          onPointerDown={handleHeaderPointerDown}
          className={cn(
            "flex items-center justify-between px-3.5 py-2.5 bg-neutral-100/80 dark:bg-neutral-850/80 shrink-0 rounded-t-2xl border-b border-neutral-200/50 dark:border-neutral-800/50 touch-none transition-colors",
            isDragging ? "cursor-grabbing" : "cursor-grab hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60"
          )}
          title="Drag to reposition modal"
        >
          <div className="flex items-center gap-2 min-w-0 pointer-events-none">
            <GripHorizontal size={13} className="text-neutral-400 dark:text-neutral-500 shrink-0 opacity-70" />
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

          {/* Close Button Container - Guaranteed Clickable with stopPropagation */}
          <div
            className="no-drag relative z-30 flex items-center gap-1 shrink-0 ml-2"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <IconButton
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              title="Close (Esc)"
              aria-label="Close"
              tooltipPosition="bottom-left"
              className="shrink-0 h-7 w-7 rounded-lg relative z-30"
            >
              <X size={14} className="stroke-[2.2]" />
            </IconButton>
          </div>
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

        {/* Diagonal Resize Handles (Bottom Corners only - away from header action buttons) */}
        {/* 1. Bottom-Left Corner */}
        <div
          onPointerDown={(e) => handleResizePointerDown(e, "sw")}
          className={cn(
            "absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-20 touch-none",
            activeCorner === "sw" && "opacity-100"
          )}
          title="Drag to resize diagonally"
        />

        {/* 2. Bottom-Right Corner (with visual diagonal grip indicator) */}
        <div
          onPointerDown={(e) => handleResizePointerDown(e, "se")}
          className={cn(
            "absolute bottom-0.5 right-0.5 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-1 z-20 opacity-40 hover:opacity-100 transition-opacity select-none touch-none",
            activeCorner === "se" && "opacity-100"
          )}
          title="Drag to resize diagonally"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            className="text-neutral-400 dark:text-neutral-500 fill-current pointer-events-none"
          >
            <circle cx="6.5" cy="1.5" r="0.75" />
            <circle cx="6.5" cy="4" r="0.75" />
            <circle cx="4" cy="4" r="0.75" />
            <circle cx="6.5" cy="6.5" r="0.75" />
            <circle cx="4" cy="6.5" r="0.75" />
            <circle cx="1.5" cy="6.5" r="0.75" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default InspectorModal
