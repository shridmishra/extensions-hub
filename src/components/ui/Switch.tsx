import React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
  id?: string
  ariaLabel?: string
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  className,
  id,
  ariaLabel
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/30 disabled:opacity-40 disabled:cursor-not-allowed",
        size === "sm" ? "h-4 w-7 p-0.5" : "h-5 w-9 p-0.5",
        checked
          ? "bg-neutral-900 dark:bg-neutral-100"
          : "bg-neutral-300 dark:bg-neutral-700",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white dark:bg-neutral-950 shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          size === "sm"
            ? cn("h-3 w-3", checked ? "translate-x-3" : "translate-x-0")
            : cn("h-4 w-4", checked ? "translate-x-4" : "translate-x-0")
        )}
      />
    </button>
  )
}

export default Switch
