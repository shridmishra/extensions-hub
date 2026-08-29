import React from "react"
import { cn } from "../../lib/utils"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: any) => void
  className?: string
  variant?: "pill" | "underline"
  size?: "sm" | "md"
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "pill",
  size = "sm"
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        variant === "pill" && "p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 shadow-2xs",
        variant === "underline" && "border-b border-neutral-200 dark:border-neutral-800 gap-4",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all select-none cursor-pointer whitespace-nowrap",
              size === "sm" ? "py-1 px-2.5 text-xs" : "py-1.5 px-3 text-sm",
              variant === "pill" && (
                isActive
                  ? "bg-white dark:bg-neutral-750 text-neutral-950 dark:text-neutral-50 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              ),
              variant === "underline" && (
                isActive
                  ? "text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100 pb-2"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 pb-2 border-b-2 border-transparent"
              )
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                isActive
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
