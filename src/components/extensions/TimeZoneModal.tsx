import React, { useEffect, useState } from "react"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import Input from "../ui/Input"
import Switch from "../ui/Switch"
import {
  ExtensionStorage,
  DEFAULT_TIMEZONE_SETTINGS,
  DEFAULT_TIMEZONE_PRESETS,
  type TimeZoneSettings,
  type TimeZonePreset
} from "../../lib/storage"
import { parseLenientTime, type ParsedTime } from "../../lib/time-parser"
import {
  TIMEZONE_OPTIONS,
  findTimeZone,
  convertTimeZone,
  formatTime12,
  formatTime24,
  type TimeZoneConversionResult
} from "../../lib/timezone"
import { copyToClipboard } from "../../lib/utils"
import {
  Clock,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown
} from "lucide-react"

interface TimeZoneModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TimeZoneModal: React.FC<TimeZoneModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<TimeZoneSettings>(DEFAULT_TIMEZONE_SETTINGS)
  const [inputTime, setInputTime] = useState<string>("1300")
  const [fromTz, setFromTz] = useState<string>("UTC+1")
  const [toTz, setToTz] = useState<string>("IST")
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h")
  const [showSeconds, setShowSeconds] = useState<boolean>(false)
  const [isCopiedTime, setIsCopiedTime] = useState(false)
  const [isAddingPreset, setIsAddingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false)
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false)
  const [searchFromTz, setSearchFromTz] = useState("")
  const [searchToTz, setSearchToTz] = useState("")

  // Load saved settings from storage
  useEffect(() => {
    if (isOpen) {
      ExtensionStorage.getTimeZoneSettings().then((loaded) => {
        setSettings(loaded)
        if (loaded.fromTz) setFromTz(loaded.fromTz)
        if (loaded.toTz) setToTz(loaded.toTz)
        if (loaded.timeFormat) setTimeFormat(loaded.timeFormat)
        if (loaded.showSeconds !== undefined) setShowSeconds(loaded.showSeconds)
      })
    }
  }, [isOpen])

  // Sync back to storage on changes
  const updateSettings = async (updates: Partial<TimeZoneSettings>) => {
    const updated = { ...settings, ...updates }
    setSettings(updated)
    await ExtensionStorage.setTimeZoneSettings(updates)
  }

  // Parse input
  const parsed: ParsedTime = parseLenientTime(inputTime)

  // Compute conversion
  const result: TimeZoneConversionResult | null = parsed.isValid
    ? convertTimeZone(parsed, fromTz, toTz, { showSeconds })
    : null

  const handleSelectPreset = (preset: TimeZonePreset) => {
    setFromTz(preset.fromTz)
    setToTz(preset.toTz)
    updateSettings({
      selectedPresetId: preset.id,
      fromTz: preset.fromTz,
      toTz: preset.toTz
    })
  }

  const handleSwapTimezones = () => {
    const prevFrom = fromTz
    const prevTo = toTz
    setFromTz(prevTo)
    setToTz(prevFrom)
    updateSettings({
      fromTz: prevTo,
      toTz: prevFrom,
      selectedPresetId: ""
    })
  }

  const handleSetNow = () => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, "0")
    const m = String(now.getMinutes()).padStart(2, "0")
    const s = String(now.getSeconds()).padStart(2, "0")
    const val = showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`
    setInputTime(val)
  }

  const handleCopyTime = async () => {
    if (!result) return
    const textToCopy = result.formattedTarget[timeFormat]
    await copyToClipboard(textToCopy)
    setIsCopiedTime(true)
    setTimeout(() => setIsCopiedTime(false), 1500)
  }

  const handleSaveCustomPreset = async () => {
    if (!newPresetName.trim()) return
    const newPreset: TimeZonePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      fromTz,
      toTz,
      isDefault: false
    }
    const updatedPresets = [...(settings.customPresets || DEFAULT_TIMEZONE_PRESETS), newPreset]
    await updateSettings({
      customPresets: updatedPresets,
      selectedPresetId: newPreset.id
    })
    setNewPresetName("")
    setIsAddingPreset(false)
  }

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedPresets = (settings.customPresets || DEFAULT_TIMEZONE_PRESETS).filter(
      (p) => p.id !== presetId
    )
    await updateSettings({
      customPresets: updatedPresets,
      selectedPresetId: settings.selectedPresetId === presetId ? "" : settings.selectedPresetId
    })
  }

  const filteredFromTimezones = TIMEZONE_OPTIONS.filter(
    (tz) =>
      tz.shortLabel.toLowerCase().includes(searchFromTz.toLowerCase()) ||
      tz.label.toLowerCase().includes(searchFromTz.toLowerCase())
  )

  const filteredToTimezones = TIMEZONE_OPTIONS.filter(
    (tz) =>
      tz.shortLabel.toLowerCase().includes(searchToTz.toLowerCase()) ||
      tz.label.toLowerCase().includes(searchToTz.toLowerCase())
  )

  const activeFromOption = findTimeZone(fromTz)
  const activeToOption = findTimeZone(toTz)
  const presetsList = settings.customPresets || DEFAULT_TIMEZONE_PRESETS

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Clock size={16} className="shrink-0 text-neutral-900 dark:text-neutral-100" />
          <span>Time Zone Converter</span>
        </div>
      }
      width="max-w-[350px]"
      contentClassName="p-3.5 flex flex-col gap-3.5 min-h-0 overflow-y-auto hub-scrollbar"
    >
      {/* ── 1. PRESETS BAR ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
            Presets
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingPreset(!isAddingPreset)}
            className="h-5 px-1.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
          >
            <Plus size={10} className="mr-0.5" />
            <span>Add Preset</span>
          </Button>
        </div>

        {/* Add Preset Inline Form */}
        {isAddingPreset && (
          <div className="p-2.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-850/90 flex flex-col gap-2 shadow-2xs animate-scale-in">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-600 dark:text-neutral-400 px-0.5">
              <span>Save Preset: {activeFromOption.shortLabel} → {activeToOption.shortLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Preset Name (e.g. UTC+1 to IST)..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-8 text-xs flex-1 bg-white dark:bg-neutral-900"
                autoFocus
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveCustomPreset}
                disabled={!newPresetName.trim()}
                className="h-8 px-3 text-xs font-bold shrink-0 rounded-xl"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Presets Horizontal Scrollable Pill List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presetsList.map((preset) => {
            const isSelected =
              fromTz.toUpperCase() === preset.fromTz.toUpperCase() &&
              toTz.toUpperCase() === preset.toTz.toUpperCase()

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer text-[10px] font-bold transition-all shrink-0 select-none shadow-2xs ${
                  isSelected
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-xs"
                    : "bg-neutral-100/90 dark:bg-neutral-850/90 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                <span>{preset.name}</span>
                {!preset.isDefault && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="w-3.5 h-3.5 p-0 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 ml-0.5"
                    title="Delete preset"
                    aria-label="Delete preset"
                  >
                    <Trash2 size={9} />
                  </IconButton>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 2. TIMEZONE SELECTION ROW ── */}
      <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 px-0.5">
          Timezone Selection
        </span>

        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          {/* Source Timezone Selector */}
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsFromDropdownOpen(!isFromDropdownOpen)
                setIsToDropdownOpen(false)
              }}
              className="w-full h-8 px-2.5 justify-between text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs rounded-xl"
            >
              <span className="truncate">{activeFromOption.shortLabel}</span>
              <ChevronDown size={12} className="text-neutral-400 shrink-0 ml-1" />
            </Button>

            {isFromDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto bg-white dark:bg-neutral-850 rounded-xl shadow-xl z-50 p-1.5 border border-neutral-200 dark:border-neutral-750 flex flex-col gap-0.5 hub-scrollbar">
                <Input
                  placeholder="Search timezone..."
                  value={searchFromTz}
                  onChange={(e) => setSearchFromTz(e.target.value)}
                  className="h-7 text-[10px] mb-1"
                  autoFocus
                />
                {filteredFromTimezones.map((tz) => (
                  <div
                    key={tz.id}
                    onClick={() => {
                      setFromTz(tz.id)
                      updateSettings({ fromTz: tz.id, selectedPresetId: "" })
                      setIsFromDropdownOpen(false)
                      setSearchFromTz("")
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center justify-between ${
                      fromTz === tz.id
                        ? "bg-neutral-100 dark:bg-neutral-750 font-bold text-neutral-900 dark:text-white"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{tz.label}</span>
                    {fromTz === tz.id && <Check size={11} className="shrink-0 text-emerald-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleSwapTimezones}
            title="Swap Timezones"
            aria-label="Swap Timezones"
            className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 shadow-2xs"
          >
            <ArrowRightLeft size={13} className="stroke-[2.2]" />
          </IconButton>

          {/* Target Timezone Selector */}
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsToDropdownOpen(!isToDropdownOpen)
                setIsFromDropdownOpen(false)
              }}
              className="w-full h-8 px-2.5 justify-between text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs rounded-xl"
            >
              <span className="truncate">{activeToOption.shortLabel}</span>
              <ChevronDown size={12} className="text-neutral-400 shrink-0 ml-1" />
            </Button>

            {isToDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 max-h-48 overflow-y-auto bg-white dark:bg-neutral-850 rounded-xl shadow-xl z-50 p-1.5 border border-neutral-200 dark:border-neutral-750 flex flex-col gap-0.5 hub-scrollbar">
                <Input
                  placeholder="Search timezone..."
                  value={searchToTz}
                  onChange={(e) => setSearchToTz(e.target.value)}
                  className="h-7 text-[10px] mb-1"
                  autoFocus
                />
                {filteredToTimezones.map((tz) => (
                  <div
                    key={tz.id}
                    onClick={() => {
                      setToTz(tz.id)
                      updateSettings({ toTz: tz.id, selectedPresetId: "" })
                      setIsToDropdownOpen(false)
                      setSearchToTz("")
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center justify-between ${
                      toTz === tz.id
                        ? "bg-neutral-100 dark:bg-neutral-750 font-bold text-neutral-900 dark:text-white"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{tz.label}</span>
                    {toTz === tz.id && <Check size={11} className="shrink-0 text-emerald-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. SOURCE TIME INPUT SECTION ── */}
      <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
            Source Time ({activeFromOption.shortLabel})
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSetNow}
            className="h-5 px-1.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
          >
            <RotateCcw size={10} />
            <span>Now</span>
          </Button>
        </div>

        <Input
          placeholder="e.g. 1300, 13:00, 1:30 PM, 930"
          value={inputTime}
          onChange={(e) => setInputTime(e.target.value)}
          icon={<Clock size={14} />}
          className="h-9 text-xs font-mono font-bold bg-white dark:bg-neutral-900 rounded-xl"
        />

        {/* Input Auto-Detection Feedback */}
        {parsed.isValid ? (
          <div className="flex items-center justify-between px-1 text-[10px] text-neutral-500 dark:text-neutral-400">
            <span>Parsed:</span>
            <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
              {formatTime24(parsed.hours, parsed.minutes, parsed.seconds, showSeconds)} ({formatTime12(parsed.hours, parsed.minutes, parsed.seconds, showSeconds)})
            </span>
          </div>
        ) : inputTime.trim() ? (
          <div className="px-1 text-[10px] text-amber-600 dark:text-amber-400">
            <span>Enter time format like 1300, 13:00, or 1pm</span>
          </div>
        ) : null}
      </div>

      {/* ── 4. CONVERTED RESULT HERO CARD ── */}
      {result ? (
        <div className="p-3.5 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-md flex flex-col gap-2.5">
          {/* Header Row: Target Name + Badges */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 dark:text-neutral-600 truncate">
              {result.targetTz.label}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {result.dayOffset !== 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/20 dark:bg-neutral-900/10 text-white dark:text-neutral-900">
                  {result.dayOffset > 0 ? "+1 day" : "-1 day"}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/20 dark:bg-neutral-900/10 text-white dark:text-neutral-900">
                {result.offsetDeltaLabel}
              </span>
            </div>
          </div>

          {/* Main Converted Output Display */}
          <div className="flex items-baseline justify-between gap-2 py-1">
            <span className="text-3xl font-black font-mono tracking-tight leading-none">
              {result.formattedTarget[timeFormat]}
            </span>
            <span className="text-xs font-mono font-bold opacity-80">
              {timeFormat === "12h" ? result.formattedTarget["24h"] : result.formattedTarget["12h"]}
            </span>
          </div>

          {/* Action Row: Summary + Copy Button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 dark:border-neutral-900/10">
            <span className="text-[10px] font-mono opacity-70 truncate">
              {result.formattedSource[timeFormat]} {result.sourceTz.shortLabel}
            </span>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyTime}
              className="h-7 px-3 text-[10px] font-bold bg-white/15 dark:bg-neutral-900/15 hover:bg-white/25 dark:hover:bg-neutral-900/25 text-white dark:text-neutral-950 border-0 rounded-xl"
            >
              {isCopiedTime ? (
                <span className="flex items-center gap-1 text-emerald-400 dark:text-emerald-600">
                  <Check size={11} className="stroke-[3]" />
                  <span>Copied</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy size={11} />
                  <span>Copy</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── 5. DISPLAY & FORMAT PREFERENCES (12h vs 24h & Seconds) ── */}
      <div className="p-2.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs flex items-center justify-between">
        {/* 12h vs 24h Switcher */}
        <div className="flex items-center rounded-xl bg-neutral-200/70 dark:bg-neutral-800 p-0.5">
          <Button
            size="sm"
            variant={timeFormat === "12h" ? "primary" : "ghost"}
            onClick={() => {
              setTimeFormat("12h")
              updateSettings({ timeFormat: "12h" })
            }}
            className={`h-6 px-2.5 text-[10px] font-bold rounded-lg ${
              timeFormat === "12h"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-transparent"
            }`}
          >
            12-Hour
          </Button>
          <Button
            size="sm"
            variant={timeFormat === "24h" ? "primary" : "ghost"}
            onClick={() => {
              setTimeFormat("24h")
              updateSettings({ timeFormat: "24h" })
            }}
            className={`h-6 px-2.5 text-[10px] font-bold rounded-lg ${
              timeFormat === "24h"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-transparent"
            }`}
          >
            24-Hour
          </Button>
        </div>

        {/* Include Seconds Switch */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
            Seconds
          </span>
          <Switch
            size="sm"
            checked={showSeconds}
            onChange={(checked) => {
              setShowSeconds(checked)
              updateSettings({ showSeconds: checked })
            }}
            ariaLabel="Toggle Include Seconds"
          />
        </div>
      </div>
    </Modal>
  )
}

export default TimeZoneModal
