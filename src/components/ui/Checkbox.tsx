import React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
  id?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
  id
}) => {
  return (
    <label
      htmlFor={id}
      onClick={(e) => {
        if (disabled) return
        e.preventDefault()
        onChange(!checked)
      }}
      className={cn(
        "inline-flex items-center gap-2 select-none cursor-pointer group text-xs",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        className={cn(
          "w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 border",
          checked
            ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-950 shadow-2xs"
            : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-transparent group-hover:border-neutral-400 dark:group-hover:border-neutral-600"
        )}
      >
        {checked && <Check size={11} className="stroke-[3.5]" />}
      </div>
      {label && (
        <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs truncate">
          {label}
        </span>
      )}
    </label>
  )
}

export default Checkbox
