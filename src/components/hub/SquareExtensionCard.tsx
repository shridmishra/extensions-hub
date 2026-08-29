import React, { useState } from "react"
import type { ExtensionManifestItem } from "../../lib/registry"
import { ExtensionIcon } from "./ExtensionIcon"
import { MoreVertical, Trash2, ExternalLink, Power } from "lucide-react"
import { cn } from "../../lib/utils"

interface SquareExtensionCardProps {
  extension: ExtensionManifestItem
  isEnabled?: boolean
  onClick: () => void
  onUnpin: () => void
}

export const SquareExtensionCard: React.FC<SquareExtensionCardProps> = ({
  extension,
  isEnabled = false,
  onClick,
  onUnpin
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isBackground = extension.type === "background"

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none aspect-square text-center shadow-xs",
        "bg-white dark:bg-[#0c0c0e] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md active:scale-[0.97]",
        isBackground && isEnabled && "border-neutral-900 dark:border-neutral-100 bg-neutral-50/50 dark:bg-neutral-900/40"
      )}
    >
      {/* Three-Dot Menu (Top Right) */}
      <div className="absolute top-2.5 right-2.5 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsMenuOpen(!isMenuOpen)
          }}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Options"
          aria-label="Options"
        >
          <MoreVertical size={14} className="stroke-[2.2]" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30 cursor-default"
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(false)
              }}
            />
            <div
              className="absolute right-0 top-7 z-40 w-32 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] py-1 shadow-lg animate-scale-in text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  onUnpin()
                }}
                className="w-full px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={12} className="stroke-[2.2]" />
                <span>Remove</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Background Active Indicator Dot (if background tool) */}
      {isBackground && (
        <div className="absolute top-3 left-3 flex items-center gap-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isEnabled ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-300 dark:bg-neutral-700"
            )}
          />
        </div>
      )}

      {/* Main Square Content: Centered Icon + Title */}
      <div className="flex flex-col items-center justify-center gap-2.5 my-auto">
        <div
          className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 shadow-xs",
            isBackground && isEnabled
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "bg-neutral-100 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-800"
          )}
        >
          <ExtensionIcon name={extension.icon} size={20} />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug line-clamp-1">
            {extension.shortName}
          </span>
          {isBackground && (
            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 mt-0.5">
              {isEnabled ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
