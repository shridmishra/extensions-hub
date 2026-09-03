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
  isDragging?: boolean
  isDragOver?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onClick: () => void
  onUnpin: () => void
}

export const SquareExtensionCard: React.FC<SquareExtensionCardProps> = ({
  extension,
  isEnabled = false,
  isDragging = false,
  isDragOver = false,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  onClick,
  onUnpin
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isBackground = extension.type === "background"

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(e)
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        onDragEnter?.(e)
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop?.(e)
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-150 cursor-pointer active:cursor-grabbing select-none text-center shadow-xs h-[104px]",
        "bg-neutral-50/90 dark:bg-neutral-850/80 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm active:scale-[0.98]",
        isBackground && isEnabled && "bg-neutral-100 dark:bg-neutral-800 shadow-sm",
        isDragging && "opacity-40 scale-95 border-2 border-dashed border-neutral-300 dark:border-neutral-700 shadow-none cursor-grabbing",
        isDragOver && !isDragging && "ring-2 ring-neutral-900 dark:ring-neutral-100 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-[1.02] shadow-md z-10"
      )}
    >
      {/* Background Active Indicator Dot (if background tool) */}
      {isBackground && (
        <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
          <span
            className={cn(
              "w-2 h-2 rounded-full ring-2 ring-white dark:ring-neutral-900",
              isEnabled ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-300 dark:bg-neutral-700"
            )}
          />
        </div>
      )}

      {/* Options Menu Pop-up (Top Right) */}
      <div
        className="absolute top-1.5 right-1.5 z-20"
        draggable={false}
        onDragStart={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <IconButton
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setIsMenuOpen(!isMenuOpen)
          }}
          className={cn(
            "h-5 w-5 p-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-750 rounded-md transition-all",
            !isMenuOpen && "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          title="Options"
          aria-label="Options"
        >
          <MoreVertical size={12} className="stroke-[2.2]" />
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
              className="absolute right-0 top-6 z-40 w-28 rounded-xl bg-white/98 dark:bg-neutral-800/98 backdrop-blur-md p-1 shadow-xl animate-scale-in text-left"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
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

      {/* Main Content: Centered Icon + Title */}
      <div className="flex flex-col items-center justify-center gap-1.5 my-auto pointer-events-none">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shadow-2xs",
            "bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 group-hover:bg-white dark:group-hover:bg-neutral-700 group-hover:scale-105 group-hover:shadow-xs"
          )}
        >
          <ExtensionIcon name={extension.icon} size={17} />
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
