import React, { useState } from "react"
import { cn } from "../../lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  className?: string
  delay?: number
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className,
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const t = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimer(t)
  }

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer)
    setIsVisible(false)
  }

  if (!content) return <>{children}</>

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-0.5 text-[10px] font-bold rounded-md whitespace-nowrap pointer-events-none transition-all duration-150 shadow-md",
            "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200",
            
            // Positioning
            position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
            position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1.5",
            position === "left" && "right-full top-1/2 -translate-y-1/2 mr-1.5",
            position === "right" && "left-full top-1/2 -translate-y-1/2 ml-1.5",
            position === "top-right" && "bottom-full right-0 mb-1.5",
            position === "top-left" && "bottom-full left-0 mb-1.5",
            position === "bottom-right" && "top-full right-0 mt-1.5",
            position === "bottom-left" && "top-full left-0 mt-1.5",

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
