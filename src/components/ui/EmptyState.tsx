import React from "react"
import { cn } from "../../lib/utils"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 select-none",
        className
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-850 border border-neutral-800 dark:border-neutral-750 flex items-center justify-center text-white mb-3 shadow-xs">
          {icon}
        </div>
      )}
      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
        {title}
      </h4>
      {description && (
        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 max-w-[220px] leading-normal">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  )
}

export default EmptyState
