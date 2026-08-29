import React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps {
  variant?: "neutral" | "interactive" | "background" | "success" | "muted"
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant = "neutral", children, className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none select-none transition-colors",
        variant === "neutral" && "ds-badge",
        variant === "interactive" && "ds-badge-interactive",
        variant === "background" && "ds-badge-background",
        variant === "success" && "border border-neutral-300 dark:border-neutral-700 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950",
        variant === "muted" && "bg-neutral-100 dark:bg-neutral-850 text-neutral-500 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-800/50",
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
