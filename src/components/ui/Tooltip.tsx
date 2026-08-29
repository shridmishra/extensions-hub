import React, { useState, useEffect, useRef } from "react"
import { cn } from "../../lib/utils"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  className?: string
  delay?: number
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "bottom",
  className,
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!content) return <>{children}</>

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleDismiss}
      onMouseDown={handleDismiss}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap pointer-events-none transition-opacity duration-150 shadow-lg animate-scale-in",
            "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border border-neutral-700/80 dark:border-neutral-300",
            
            // Positioning
            position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
            position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1.5",
            position === "left" && "right-full top-1/2 -translate-y-1/2 mr-1.5",
            position === "right" && "left-full top-1/2 -translate-y-1/2 ml-1.5",
            position === "top-right" && "bottom-full right-0 mb-1.5",
            position === "top-left" && "bottom-full left-0 mb-1.5",
            position === "bottom-right" && "top-full left-0 mt-1.5",
            position === "bottom-left" && "top-full right-0 mt-1.5",

            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
