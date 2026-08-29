import React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/20 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none cursor-pointer",
          
          // Variants
          variant === "primary" && "ds-btn-primary",
          variant === "secondary" && "ds-btn-secondary",
          variant === "ghost" && "ds-btn-ghost",
          variant === "danger" && "ds-btn-danger",

          // Sizes
          size === "sm" && "px-2.5 py-1 h-7 text-[11px] gap-1",
          size === "md" && "px-3.5 py-1.5 h-8 text-xs gap-1.5",
          size === "lg" && "px-4 py-2 h-9 text-xs gap-2",

          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export default Button
