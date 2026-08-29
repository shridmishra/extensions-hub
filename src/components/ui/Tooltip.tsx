import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/utils"

export type TooltipPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: TooltipPosition
  className?: string
  delay?: number
}

interface Coords {
  top: number
  left: number
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "bottom",
  className,
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0 })
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()

    // If trigger element is hidden or has 0 dimensions, hide
    if (triggerRect.width === 0 && triggerRect.height === 0) {
      setIsVisible(false)
      return
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 360
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 520

    // If trigger is scrolled completely out of viewport, dismiss
    if (
      triggerRect.bottom < 0 ||
      triggerRect.top > viewportHeight ||
      triggerRect.right < 0 ||
      triggerRect.left > viewportWidth
    ) {
      setIsVisible(false)
      return
    }

    const tooltipEl = tooltipRef.current
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 120
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 28

    const offset = 6
    const margin = 8

    let targetPlacement = position

    // Vertical auto-flip collision detection
    if (targetPlacement.startsWith("top")) {
      const neededSpace = tooltipHeight + offset + margin
      if (triggerRect.top < neededSpace && viewportHeight - triggerRect.bottom > triggerRect.top) {
        if (targetPlacement === "top") targetPlacement = "bottom"
        else if (targetPlacement === "top-left") targetPlacement = "bottom-left"
        else if (targetPlacement === "top-right") targetPlacement = "bottom-right"
      }
    } else if (targetPlacement.startsWith("bottom")) {
      const neededSpace = tooltipHeight + offset + margin
      if (
        viewportHeight - triggerRect.bottom < neededSpace &&
        triggerRect.top > viewportHeight - triggerRect.bottom
      ) {
        if (targetPlacement === "bottom") targetPlacement = "top"
        else if (targetPlacement === "bottom-left") targetPlacement = "top-left"
        else if (targetPlacement === "bottom-right") targetPlacement = "top-right"
      }
    }

    let top = 0
    let left = 0

    switch (targetPlacement) {
      case "top":
        top = triggerRect.top - tooltipHeight - offset
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2
        break
      case "top-left":
        top = triggerRect.top - tooltipHeight - offset
        left = triggerRect.right - tooltipWidth
        break
      case "top-right":
        top = triggerRect.top - tooltipHeight - offset
        left = triggerRect.left
        break
      case "bottom":
        top = triggerRect.bottom + offset
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2
        break
      case "bottom-left":
        top = triggerRect.bottom + offset
        left = triggerRect.right - tooltipWidth
        break
      case "bottom-right":
        top = triggerRect.bottom + offset
        left = triggerRect.left
        break
      case "left":
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2
        left = triggerRect.left - tooltipWidth - offset
        break
      case "right":
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2
        left = triggerRect.right + offset
        break
    }

    // Viewport collision bounds clamping
    const clampedLeft = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin))
    const clampedTop = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin))

    setCoords({
      top: clampedTop,
      left: clampedLeft
    })
  }, [position])

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        // Resolve dark mode from trigger hierarchy
        const isDark = Boolean(
          triggerRef.current.closest(".dark") ||
            document.documentElement.classList.contains("dark") ||
            document.body.classList.contains("dark")
        )
        setIsDarkMode(isDark)

        // Resolve portal mount target
        const root = triggerRef.current.getRootNode()
        if (root instanceof ShadowRoot) {
          const extRoot = (root.querySelector(".hub-extension-root") as HTMLElement) || root
          setPortalTarget(extRoot as unknown as HTMLElement)
        } else {
          setPortalTarget(document.body)
        }
      }
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsVisible(false)
  }

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition()
    }
  }, [isVisible, updatePosition])

  useEffect(() => {
    if (!isVisible) return

    const handleScroll = () => {
      updatePosition()
    }

    const handleResize = () => {
      updatePosition()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true })
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isVisible, updatePosition])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!content) return <>{children}</>

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleDismiss}
      onMouseDown={handleDismiss}
    >
      {children}
      {isVisible &&
        portalTarget &&
        createPortal(
          <div
            className={cn(
              "hub-extension-root font-sans select-none pointer-events-none",
              isDarkMode ? "dark" : ""
            )}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2147483647,
              pointerEvents: "none"
            }}
          >
            <div
              ref={tooltipRef}
              role="tooltip"
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 2147483647
              }}
              className={cn(
                "px-2.5 py-1.5 text-[10px] font-medium rounded-lg max-w-[240px] w-max whitespace-normal break-words leading-tight pointer-events-none shadow-xl animate-scale-in text-left",
                "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900",
                className
              )}
            >
              {content}
            </div>
          </div>,
          portalTarget
        )}
    </div>
  )
}

export default Tooltip
