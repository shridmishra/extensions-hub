import React, { useState } from "react"
import { Ruler, Copy, Check, Hash, Box, Move, Layers } from "lucide-react"
import { copyToClipboard } from "../../lib/utils"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import InspectorModal from "../ui/InspectorModal"

export interface RulerMetrics {
  tagName: string
  id?: string
  className?: string
  width: number
  height: number
  top: number
  left: number
  padding: { top: number; right: number; bottom: number; left: number }
  margin: { top: number; right: number; bottom: number; left: number }
  distanceOffsets?: { top?: number; right?: number; bottom?: number; left?: number } | null
  mode?: "inspect" | "drag"
}

export interface PageRulerModalProps {
  metrics: RulerMetrics
  onClose: () => void
  isDarkMode: boolean
  isLocked?: boolean
  onUnlock?: () => void
}

export const PageRulerModal: React.FC<PageRulerModalProps> = ({
  metrics,
  onClose,
  isDarkMode,
  isLocked = false,
  onUnlock
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const w = Math.round(metrics.width)
  const h = Math.round(metrics.height)
  const x = Math.round(metrics.left)
  const y = Math.round(metrics.top)

  const selectorText = metrics.id
    ? `#${metrics.id}`
    : metrics.className
    ? `.${metrics.className.split(" ").filter(Boolean)[0] || ""}`
    : ""

  const handleCopy = async (key: "dims" | "tailwind" | "css") => {
    let text = ""
    if (key === "dims") {
      text = `${w} × ${h}px`
    } else if (key === "tailwind") {
      text = `w-[${w}px] h-[${h}px]`
    } else if (key === "css") {
      text = `width: ${w}px; height: ${h}px;`
    }

    await copyToClipboard(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const pTop = Math.round(metrics.padding.top)
  const pRight = Math.round(metrics.padding.right)
  const pBottom = Math.round(metrics.padding.bottom)
  const pLeft = Math.round(metrics.padding.left)

  const mTop = Math.round(metrics.margin.top)
  const mRight = Math.round(metrics.margin.right)
  const mBottom = Math.round(metrics.margin.bottom)
  const mLeft = Math.round(metrics.margin.left)

  return (
    <InspectorModal
      icon={<Ruler size={15} className="shrink-0 text-neutral-800 dark:text-neutral-200" />}
      title="Dimension Guide"
      breadcrumbs={[
        { label: `<${metrics.tagName.toLowerCase()}>`, isMono: false, isBold: false },
        { label: `${w} × ${h}`, isMono: true, isBold: false }
      ]}
      onClose={onClose}
      isDarkMode={isDarkMode}
    >
      {/* Target & Lock Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-850 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {selectorText || `<${metrics.tagName.toLowerCase()}>`}
          </span>
        </div>
        {isLocked ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="success">
              Locked
            </Badge>
            {onUnlock && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnlock}
                className="h-5 px-1.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        ) : (
          <Badge variant="muted">
            Hover
          </Badge>
        )}
      </div>

      {/* Primary Metrics 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Width & Height */}
        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 shrink-0">
            <Box className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Dimensions
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {w} × {h}
          </span>
        </div>

        {/* Position X, Y */}
        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 shrink-0">
            <Move className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Position
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {x}, {y}
          </span>
        </div>
      </div>

      {/* Relative Distance Offsets (if measuring against locked reference element) */}
      {metrics.distanceOffsets && (
        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 shadow-2xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
              Relative Offsets
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
            <div className="p-1 rounded-lg bg-white/80 dark:bg-neutral-900 shadow-2xs">
              <span className="block text-[10px] font-sans font-semibold text-neutral-400">Top</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {metrics.distanceOffsets.top !== undefined ? `${Math.round(metrics.distanceOffsets.top)}px` : "0px"}
              </span>
            </div>
            <div className="p-1 rounded-lg bg-white/80 dark:bg-neutral-900 shadow-2xs">
              <span className="block text-[10px] font-sans font-semibold text-neutral-400">Right</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {metrics.distanceOffsets.right !== undefined ? `${Math.round(metrics.distanceOffsets.right)}px` : "0px"}
              </span>
            </div>
            <div className="p-1 rounded-lg bg-white/80 dark:bg-neutral-900 shadow-2xs">
              <span className="block text-[10px] font-sans font-semibold text-neutral-400">Bottom</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {metrics.distanceOffsets.bottom !== undefined ? `${Math.round(metrics.distanceOffsets.bottom)}px` : "0px"}
              </span>
            </div>
            <div className="p-1 rounded-lg bg-white/80 dark:bg-neutral-900 shadow-2xs">
              <span className="block text-[10px] font-sans font-semibold text-neutral-400">Left</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {metrics.distanceOffsets.left !== undefined ? `${Math.round(metrics.distanceOffsets.left)}px` : "0px"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Box Model Metrics (Padding & Margin) */}
      <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
            Box Model (T • R • B • L)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-850">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Padding
            </span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs">
              {pTop} {pRight} {pBottom} {pLeft}
            </span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-850">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              Margin
            </span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs">
              {mTop} {mRight} {mBottom} {mLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Copy Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCopy("dims")}
          className="text-xs font-bold gap-1 h-8 px-2 rounded-xl"
        >
          {copiedKey === "dims" ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>Dimensions</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleCopy("tailwind")}
          className="text-xs font-bold gap-1 h-8 px-2 rounded-xl"
        >
          {copiedKey === "tailwind" ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>Tailwind</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCopy("css")}
          className="text-xs font-bold gap-1 h-8 px-2 rounded-xl"
        >
          {copiedKey === "css" ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>CSS</span>
        </Button>
      </div>
    </InspectorModal>
  )
}

export default PageRulerModal
