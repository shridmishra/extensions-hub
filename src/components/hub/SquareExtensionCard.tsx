import React, { useState } from "react"
import type { ExtensionManifestItem } from "../../lib/registry"
import { ExtensionIcon } from "./ExtensionIcon"
import { MoreVertical, Trash2 } from "lucide-react"
import { cn } from "../../lib/utils"
import IconButton from "../ui/IconButton"
import Button from "../ui/Button"

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
        "group relative flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all duration-150 cursor-pointer select-none aspect-square text-center shadow-xs",
        "bg-neutral-50/90 dark:bg-neutral-850/80 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm active:scale-[0.98]",
        isBackground && isEnabled && "bg-neutral-100 dark:bg-neutral-800 shadow-sm"
      )}
    >
      {/* Options Menu Pop-up (Top Right) */}
      <div className="absolute top-2 right-2 z-20">
        <IconButton
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setIsMenuOpen(!isMenuOpen)
          }}
          className={cn(
            "h-6 w-6 p-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-750 rounded-md transition-all",
            !isMenuOpen && "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          title="Options"
          aria-label="Options"
        >
          <MoreVertical size={13} className="stroke-[2.2]" />
        </IconButton>

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
              className="absolute right-0 top-7 z-40 w-28 rounded-xl bg-white/98 dark:bg-neutral-800/98 backdrop-blur-md p-1 shadow-xl animate-scale-in text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsMenuOpen(false)
                  onUnpin()
                }}
                className="w-full justify-start px-2 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1.5 h-auto transition-colors"
              >
                <Trash2 size={12} className="stroke-[2.2]" />
                <span>Remove</span>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Background Active Indicator Dot (if background tool) */}
      {isBackground && (
        <div className="absolute top-3 left-3 flex items-center gap-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0c0c0e]",
              isEnabled ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-300 dark:bg-neutral-700"
            )}
          />
        </div>
      )}

      {/* Main Square Content: Centered Icon + Title */}
      <div className="flex flex-col items-center justify-center gap-2.5 my-auto">
        <div
          className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 shadow-2xs",
            "bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 group-hover:bg-white dark:group-hover:bg-neutral-700 group-hover:scale-105 group-hover:shadow-xs"
          )}
        >
          <ExtensionIcon name={extension.icon} size={20} />
        </div>

        <div className="flex flex-col items-center px-1">
          <span className="text-[12px] font-bold text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug line-clamp-1">
            {extension.shortName}
          </span>
        </div>
      </div>
    </div>
  )
}
