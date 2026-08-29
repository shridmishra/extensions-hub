import React, { useEffect, useState } from "react"
import Modal from "../ui/Modal"
import Switch from "../ui/Switch"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
import Tabs, { type TabItem } from "../ui/Tabs"
import IconButton from "../ui/IconButton"
import Input from "../ui/Input"
import {
  ExtensionStorage,
  DEFAULT_DARK_MODE_SETTINGS,
  type DarkModeSettings,
  type DarkPreset,
  type LightPreset
} from "../../lib/storage"
import {
  Moon,
  Sun,
  RotateCcw,
  Globe,
  Sliders,
  Eye,
  Shield,
  Layers
} from "lucide-react"

interface DarkModeSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DARK_PRESETS: { id: DarkPreset; name: string; desc: string; previewBg: string }[] = [
  { id: "midnight", name: "Midnight Zinc", desc: "Balanced rich dark", previewBg: "bg-neutral-900" },
  { id: "oled", name: "OLED Black", desc: "Pure #000 deep black", previewBg: "bg-black" },
  { id: "slate", name: "Deep Slate", desc: "Subtle blue-gray tone", previewBg: "bg-slate-900" },
  { id: "charcoal", name: "Warm Charcoal", desc: "Gentle eye-care tone", previewBg: "bg-stone-900" }
]

const LIGHT_PRESETS: { id: LightPreset; name: string; desc: string; previewBg: string }[] = [
  { id: "pure-white", name: "Pure White", desc: "Crisp clean white", previewBg: "bg-white" },
  { id: "warm-paper", name: "Warm Paper", desc: "Soft sepia reading tone", previewBg: "bg-amber-50" },
  { id: "cool-ice", name: "Cool Ice", desc: "Subtle cool blue light", previewBg: "bg-slate-50" }
]

export const DarkModeSettingsModal: React.FC<DarkModeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<DarkModeSettings>(DEFAULT_DARK_MODE_SETTINGS)
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false)
  const [currentHost, setCurrentHost] = useState("")

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      ExtensionStorage.getDarkModeSettings().then((loaded) => {
        setSettings(loaded)
      })

      // Load background extension enabled state
      ExtensionStorage.getBackgroundEnabled().then((bgMap) => {
        setIsGlobalEnabled(!!bgMap["force-dark-mode"])
      })

      // Get current active tab hostname
      if (chrome.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
          if (tab?.url) {
            try {
              const url = new URL(tab.url)
              setCurrentHost(url.hostname)
            } catch {
              setCurrentHost("")
            }
          }
        })
      }
    }
  }, [isOpen])

  // Sync settings and notify tabs
  const updateSettings = async (partial: Partial<DarkModeSettings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    await ExtensionStorage.setDarkModeSettings(partial)

    // Notify active tab for instant live update
    if (chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "UPDATE_THEME_SETTINGS" }).catch(() => {})
      }
    }
  }

  const handleToggleGlobal = async (enabled: boolean) => {
    setIsGlobalEnabled(enabled)
    await ExtensionStorage.setBackgroundExtensionEnabled("force-dark-mode", enabled)
    await updateSettings({ globalEnabled: enabled })

    if (chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "TOGGLE_DARK_MODE",
          enabled
        }).catch(() => {})
      }
    }
  }

  const handleToggleSiteOverride = async (enabled: boolean) => {
    if (!currentHost) return
    const overrides = { ...(settings.siteOverrides || {}) }
    overrides[currentHost] = enabled
    await updateSettings({ siteOverrides: overrides })
  }

  const handleResetDefaults = async () => {
    await updateSettings(DEFAULT_DARK_MODE_SETTINGS)
  }

  const modeTabs: TabItem[] = [
    {
      id: "dark",
      label: "Force Dark Mode",
      icon: <Moon size={13} className="stroke-[2.5]" />
    },
    {
      id: "light",
      label: "Force Light Mode",
      icon: <Sun size={13} className="stroke-[2.5]" />
    }
  ]

  const isCurrentSiteActive = currentHost
    ? settings.siteOverrides?.[currentHost] !== undefined
      ? settings.siteOverrides[currentHost]
      : isGlobalEnabled
    : isGlobalEnabled

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900">
            {settings.mode === "dark" ? (
              <Moon size={12} className="stroke-[2.5]" />
            ) : (
              <Sun size={12} className="stroke-[2.5]" />
            )}
          </div>
          <span>Smart Dark/Light Mode</span>
        </div>
      }
      description="Force clean, media-preserving themes on any site"
      width="max-w-[360px]"
      contentClassName="p-3.5 flex flex-col gap-3.5 max-h-[500px]"
    >
      {/* ── MAIN POWER SWITCH ── */}
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Theme Engine
            </span>
            <Badge variant={isGlobalEnabled ? "success" : "neutral"}>
              {isGlobalEnabled ? "Active" : "Disabled"}
            </Badge>
          </div>
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
            Applies chosen theme globally across websites
          </span>
        </div>
        <Switch
          checked={isGlobalEnabled}
          onChange={handleToggleGlobal}
          ariaLabel="Toggle Theme Engine"
        />
      </div>

      {/* ── MODE SELECTOR (DARK VS LIGHT) ── */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-0.5">
          Theme Mode
        </span>
        <Tabs
          tabs={modeTabs}
          activeTab={settings.mode}
          onChange={(mode) => updateSettings({ mode: mode as "dark" | "light" })}
        />
      </div>

      {/* ── THEME PRESETS ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-2.5 bg-white dark:bg-[#0c0c0e]">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-neutral-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {settings.mode === "dark" ? "Dark Presets" : "Light Presets"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {settings.mode === "dark"
            ? DARK_PRESETS.map((preset) => {
                const isSelected = settings.darkPreset === preset.id
                return (
                  <Button
                    key={preset.id}
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => updateSettings({ darkPreset: preset.id })}
                    className="flex flex-col items-start justify-center p-2 h-auto text-left rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className={`w-2.5 h-2.5 rounded-full border border-neutral-700 ${preset.previewBg}`} />
                      <span className="text-[11px] font-bold truncate">{preset.name}</span>
                    </div>
                    <span className="text-[9px] font-medium opacity-60 mt-0.5 leading-tight">{preset.desc}</span>
                  </Button>
                )
              })
            : LIGHT_PRESETS.map((preset) => {
                const isSelected = settings.lightPreset === preset.id
                return (
                  <Button
                    key={preset.id}
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => updateSettings({ lightPreset: preset.id })}
                    className="flex flex-col items-start justify-center p-2 h-auto text-left rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className={`w-2.5 h-2.5 rounded-full border border-neutral-300 ${preset.previewBg}`} />
                      <span className="text-[11px] font-bold truncate">{preset.name}</span>
                    </div>
                    <span className="text-[9px] font-medium opacity-60 mt-0.5 leading-tight">{preset.desc}</span>
                  </Button>
                )
              })}
        </div>
      </div>

      {/* ── DISPLAY FINE-TUNING SLIDERS ── */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-2.5 bg-neutral-50/40 dark:bg-neutral-900/20">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-neutral-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Display Adjustments
            </span>
          </div>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleResetDefaults}
            title="Reset display adjustments to default"
            aria-label="Reset adjustments"
            className="h-5 w-5"
          >
            <RotateCcw size={11} className="stroke-[2.2]" />
          </IconButton>
        </div>

        {/* Brightness */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Brightness</span>
            <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">{settings.brightness}%</span>
          </div>
          <Input
            type="range"
            min={70}
            max={120}
            step={5}
            value={settings.brightness}
            onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
            className="h-2 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
        </div>

        {/* Contrast */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Contrast</span>
            <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">{settings.contrast}%</span>
          </div>
          <Input
            type="range"
            min={70}
            max={130}
            step={5}
            value={settings.contrast}
            onChange={(e) => updateSettings({ contrast: Number(e.target.value) })}
            className="h-2 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
        </div>

        {/* Warmth / Sepia */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Warmth (Night Shift)</span>
            <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">{settings.sepia}%</span>
          </div>
          <Input
            type="range"
            min={0}
            max={100}
            step={5}
            value={settings.sepia}
            onChange={(e) => updateSettings({ sepia: Number(e.target.value) })}
            className="h-2 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
        </div>
      </div>

      {/* ── MEDIA PRESERVATION & PROTECTION ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-2.5 bg-white dark:bg-[#0c0c0e]">
        <div className="flex items-center gap-1.5 px-0.5">
          <Shield size={13} className="text-neutral-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Media & Content Protection
          </span>
        </div>

        {/* Preserve Media Colors */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Preserve Media Colors
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              Prevents videos, photos, and canvas from tinting
            </span>
          </div>
          <Switch
            size="sm"
            checked={settings.preserveMedia}
            onChange={(checked) => updateSettings({ preserveMedia: checked })}
            ariaLabel="Toggle Preserve Media Colors"
          />
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-850" />

        {/* Dim Media in Dark Mode */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-1.5">
            <Eye size={13} className="text-neutral-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Dim Bright Images
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Subtle 15% brightness reduction in dark mode
              </span>
            </div>
          </div>
          <Switch
            size="sm"
            checked={settings.dimMediaInDark}
            onChange={(checked) => updateSettings({ dimMediaInDark: checked })}
            ariaLabel="Toggle Dim Bright Images"
          />
        </div>
      </div>

      {/* ── SITE-SPECIFIC OVERRIDE ── */}
      {currentHost && (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={13} className="text-neutral-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                {currentHost}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Per-site theme toggle
              </span>
            </div>
          </div>
          <Switch
            size="sm"
            checked={isCurrentSiteActive}
            onChange={handleToggleSiteOverride}
            ariaLabel={`Toggle theme for ${currentHost}`}
          />
        </div>
      )}
    </Modal>
  )
}

export default DarkModeSettingsModal

