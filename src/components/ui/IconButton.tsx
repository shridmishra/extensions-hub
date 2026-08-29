import React from "react"
import { cn } from "../../lib/utils"
import Tooltip, { type TooltipPosition } from "./Tooltip"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  tooltipPosition?: TooltipPosition
  variant?: "ghost" | "secondary" | "primary" | "danger"
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", children, title, tooltipPosition = "bottom", variant = "ghost", ...props }, ref) => {
    const buttonElement = (
      <button
        ref={ref}
        aria-label={props["aria-label"] || title}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/20 active:scale-95 disabled:opacity-50 cursor-pointer select-none",
          
          variant === "ghost" && "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-850",
          variant === "secondary" && "bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-xs",
          variant === "primary" && "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black hover:bg-black dark:hover:bg-white shadow-xs",
          variant === "danger" && "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",

          size === "sm" && "p-1 text-xs h-7 w-7",
          size === "md" && "p-1.5 text-sm h-8 w-8",
          size === "lg" && "p-2 text-base h-9 w-9",

          className
        )}
        {...props}
      >
        {children}
      </button>
    )

    if (title) {
      return (
        <Tooltip content={title} position={tooltipPosition}>
          {buttonElement}
        </Tooltip>
      )
    }

    return buttonElement
  }
)

IconButton.displayName = "IconButton"

export default IconButton
