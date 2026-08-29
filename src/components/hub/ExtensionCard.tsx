import React from "react"
import type { ExtensionManifestItem } from "../../lib/registry"
import { ExtensionIcon } from "./ExtensionIcon"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Badge from "../ui/Badge"
import Switch from "../ui/Switch"
import { Bookmark, BookmarkCheck, Heart, Star, Play, Power } from "lucide-react"
import { cn } from "../../lib/utils"

interface ExtensionCardProps {
  extension: ExtensionManifestItem
  isPinned: boolean
  isStarred: boolean
  isLiked: boolean
  isEnabled?: boolean
  onTogglePin: () => void
  onToggleStar: () => void
  onToggleLike: () => void
  onToggleBackground?: () => void
  onLaunch?: () => void
  variant?: "compact" | "detailed"
}

export const ExtensionCard: React.FC<ExtensionCardProps> = ({
  extension,
  isPinned,
  isStarred,
  isLiked,
  isEnabled = false,
  onTogglePin,
  onToggleStar,
  onToggleLike,
  onToggleBackground,
  onLaunch,
  variant = "detailed"
}) => {
  const isInteractive = extension.type === "interactive"

  return (
    <div
      className={cn(
        "group relative ds-card p-3.5 flex flex-col justify-between transition-all duration-150 select-none border border-neutral-200/80 dark:border-neutral-800/90 hover:border-neutral-400/80 dark:hover:border-neutral-750",
        variant === "compact" ? "gap-2.5" : "gap-3"
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon Badge */}
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-850 border border-neutral-200/70 dark:border-neutral-750 flex items-center justify-center text-neutral-900 dark:text-neutral-100 shrink-0 shadow-2xs">
            <ExtensionIcon name={extension.icon} size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                #{String(extension.number).padStart(2, "0")}
              </span>
              <h3 className="text-xs font-black text-neutral-900 dark:text-neutral-50 truncate tracking-tight">
                {extension.shortName}
              </h3>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="muted" className="text-[9px] py-0 px-1 font-semibold">
                {extension.category}
              </Badge>
              <Badge
                variant={isInteractive ? "interactive" : "background"}
                className="text-[9px] py-0 px-1"
              >
                {isInteractive ? "On-Demand" : "Always-On"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Pin Button */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onTogglePin}
            title={isPinned ? "Unpin from main popup" : "Pin to main popup"}
            aria-label={isPinned ? "Unpin extension" : "Pin extension"}
            className={isPinned ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"}
          >
            {isPinned ? (
              <BookmarkCheck size={14} className="stroke-[2.2] fill-neutral-900 dark:fill-neutral-100 text-neutral-900 dark:text-neutral-100" />
            ) : (
              <Bookmark size={14} className="stroke-[2]" />
            )}
          </IconButton>
        </div>
      </div>

      {/* Description */}
      {variant === "detailed" && (
        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {extension.description}
        </p>
      )}

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-850/60 mt-0.5">
        {/* Social / Rating metrics */}
        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
          <button
            onClick={onToggleStar}
            className={cn(
              "flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer",
              isStarred && "text-neutral-900 dark:text-neutral-100 font-bold"
            )}
            title="Star this extension"
          >
            <Star
              size={11}
              className={cn(
                "stroke-[2]",
                isStarred && "fill-neutral-900 dark:fill-neutral-100"
              )}
            />
            <span>{extension.stars + (isStarred ? 1 : 0)}</span>
          </button>

          <button
            onClick={onToggleLike}
            className={cn(
              "flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer",
              isLiked && "text-neutral-900 dark:text-neutral-100 font-bold"
            )}
            title="Like this extension"
          >
            <Heart
              size={11}
              className={cn(
                "stroke-[2]",
                isLiked && "fill-neutral-900 dark:fill-neutral-100"
              )}
            />
            <span>{extension.likes + (isLiked ? 1 : 0)}</span>
          </button>
        </div>

        {/* Action Trigger / Switch */}
        <div>
          {isInteractive ? (
            <Button
              size="sm"
              variant="primary"
              onClick={onLaunch}
              className="text-[11px] h-7 px-3 font-bold"
            >
              <Play size={10} className="fill-current" />
              <span>Launch</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={isEnabled}
                onChange={() => onToggleBackground && onToggleBackground()}
                size="sm"
                ariaLabel={`Toggle ${extension.name}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
