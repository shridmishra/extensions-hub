import React, { useEffect, useRef } from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconClassName?: string
  actionRight?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, iconClassName, actionRight, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      const el = internalRef.current
      if (!el) return
      const stopProp = (e: KeyboardEvent) => {
        e.stopPropagation()
      }
      el.addEventListener("keydown", stopProp)
      el.addEventListener("keyup", stopProp)
      el.addEventListener("keypress", stopProp)
      return () => {
        el.removeEventListener("keydown", stopProp)
        el.removeEventListener("keyup", stopProp)
        el.removeEventListener("keypress", stopProp)
      }
    }, [])

    return (
      <div className="relative w-full flex items-center">
        {icon && (
          <div className={cn("absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500", iconClassName)}>
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={(node) => {
            internalRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          className={cn(
            "flex h-8 w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] py-1 text-xs font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors focus-visible:border-neutral-700 dark:focus-visible:border-neutral-400 focus-visible:outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-8" : "pl-2.5",
            actionRight ? "pr-8" : "pr-2.5",
            className
          )}
          {...props}
        />
        {actionRight && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            {actionRight}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
