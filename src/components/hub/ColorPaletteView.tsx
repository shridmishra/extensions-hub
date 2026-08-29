import React, { useEffect, useState } from "react"
import { ExtensionStorage, type ColorHistoryItem } from "../../lib/storage"
import { copyToClipboard } from "../../lib/utils"
import { getColorName } from "../../lib/color-names"
import { Pipette, Copy, Check, Trash2 } from "lucide-react"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import EmptyState from "../ui/EmptyState"

interface ColorPaletteViewProps {
  onPickColor: () => void
}

export const ColorPaletteView: React.FC<ColorPaletteViewProps> = ({ onPickColor }) => {
  const [colors, setColors] = useState<ColorHistoryItem[]>([])
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const loadHistory = async () => {
    const list = await ExtensionStorage.getColorHistory()
    setColors(list)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleCopy = async (hex: string) => {
    await copyToClipboard(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  const handleClear = async () => {
    await ExtensionStorage.clearColorHistory()
    setColors([])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Saved Palette ({colors.length})
        </span>
        <div className="flex items-center gap-1">
          {colors.length > 0 && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={handleClear}
              title="Clear Color History"
            >
              <Trash2 size={12} className="text-neutral-400 hover:text-red-500" />
            </IconButton>
          )}
          <Button size="sm" variant="primary" onClick={onPickColor} className="h-6 text-[10px] px-2.5">
            <Pipette size={11} />
            Pick Color
          </Button>
        </div>
      </div>

      {colors.length === 0 ? (
        <EmptyState
          icon={<Pipette size={18} />}
          title="No colors picked yet"
          description="Click 'Pick Color' to sample any pixel from your screen."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {colors.map((c) => {
            const isCopied = copiedHex === c.hex
            return (
              <div
                key={c.hex + c.timestamp}
                onClick={() => handleCopy(c.hex)}
                className="group flex items-center justify-between p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md border border-neutral-300 dark:border-neutral-700 shadow-2xs shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate leading-none">
                      {c.name || getColorName(c.hex)}
                    </span>
                    <span className="font-mono text-[10.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate mt-1 leading-none">
                      {c.hex}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-1 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                  {isCopied ? <Check size={12} className="text-green-500 stroke-[3]" /> : <Copy size={11} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
