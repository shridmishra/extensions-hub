import React, { useEffect, useState } from "react"
import Modal from "../ui/Modal"
import Switch from "../ui/Switch"
import Button from "../ui/Button"
import Badge from "../ui/Badge"
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
  Layers,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from "lucide-react"

interface DarkModeSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_VISIBLE_SITES = 4

const DARK_PRESETS: { id: DarkPreset; name: string; previewBg: string }[] = [
  { id: "midnight", name: "Midnight Zinc", previewBg: "bg-neutral-900" },
  { id: "oled", name: "OLED Black", previewBg: "bg-black" },
  { id: "slate", name: "Deep Slate", previewBg: "bg-slate-900" },
  { id: "charcoal", name: "Warm Charcoal", previewBg: "bg-stone-900" }
]

const LIGHT_PRESETS: { id: LightPreset; name: string; previewBg: string }[] = [
  { id: "pure-white", name: "Pure White", previewBg: "bg-white" },
  { id: "warm-paper", name: "Warm Paper", previewBg: "bg-amber-50" },
  { id: "cool-ice", name: "Cool Ice", previewBg: "bg-slate-50" }
]

export const DarkModeSettingsModal: React.FC<DarkModeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<DarkModeSettings>(DEFAULT_DARK_MODE_SETTINGS)
  const [currentHost, setCurrentHost] = useState("")
  const [detectedTheme, setDetectedTheme] = useState<"dark" | "light">("light")
  const [isSitesExpanded, setIsSitesExpanded] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const targetMode = detectedTheme === "dark" ? "light" : "dark"

  const loadData = async () => {
    const loadedSettings = await ExtensionStorage.getDarkModeSettings()
    setSettings(loadedSettings)

    // Check system default as initial fallback
    if (typeof window !== "undefined" && window.matchMedia) {
      setDetectedTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    }

    // Query active tab hostname & detected theme
    if (chrome.tabs?.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.url) {
          try {
            const url = new URL(tab.url)
            setCurrentHost(url.hostname)
          } catch {
            setCurrentHost("")
          }
        }

        if (tab?.id) {
          chrome.tabs
            .sendMessage(tab.id, { type: "GET_PAGE_THEME" })
            .then((res) => {
              if (res?.nativeTheme) {
                setDetectedTheme(res.nativeTheme)
              }
            })
            .catch(() => {})
        }
      } catch (err) {
        console.error("[DarkModeModal] Failed to query tab:", err)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
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

  const handleToggleCurrentSite = async (enabled: boolean) => {
    if (!currentHost) return
    const updated = await ExtensionStorage.setSiteDarkMode(currentHost, enabled)
    setSettings(updated)

    if (chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_DARK_MODE", enabled }).catch(() => {})
      }
    }
  }

  const handleRemoveSite = async (hostname: string) => {
    const updated = await ExtensionStorage.removeEnabledSite(hostname)
    setSettings(updated)

    if (chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id && currentHost === hostname) {
        chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_DARK_MODE", enabled: false }).catch(() => {})
      }
    }
  }

  const handleResetDefaults = async () => {
    await updateSettings({
      darkPreset: "midnight",
      lightPreset: "pure-white",
      brightness: 100,
      contrast: 100,
      sepia: 0,
      grayscale: 0,
      preserveMedia: true,
      dimMediaInDark: false
    })
  }

  const isCurrentSiteActive = currentHost ? Boolean(settings.siteOverrides?.[currentHost]) : false

  // List of all currently enabled sites
  const enabledSites = Object.entries(settings.siteOverrides || {})
    .filter(([_, isEnabled]) => Boolean(isEnabled))
    .map(([hostname]) => hostname)
    .sort((a, b) => a.localeCompare(b))

  const visibleSites = isSitesExpanded ? enabledSites : enabledSites.slice(0, DEFAULT_VISIBLE_SITES)
  const remainingSitesCount = enabledSites.length - DEFAULT_VISIBLE_SITES

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900">
            {targetMode === "dark" ? (
              <Moon size={12} className="stroke-[2.5]" />
            ) : (
              <Sun size={12} className="stroke-[2.5]" />
            )}
          </div>
          <span>Smart Dark Mode</span>
        </div>
      }
      width="max-w-[360px]"
      contentClassName="p-3 flex flex-col gap-2.5"
    >
      {/* ── TOP SECTION: CURRENT WEBSITE STATUS & TOGGLE ── */}
      <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-850/80 shadow-2xs flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={14} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {currentHost || "Active Website"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="neutral">
                  {detectedTheme === "dark" ? "Dark Mode" : "Light Mode"}
                </Badge>
                <ArrowRight size={10} className="text-neutral-400 stroke-[2.5]" />
                <Badge variant="interactive">
                  {targetMode === "dark" ? "Force Dark" : "Force Light"}
                </Badge>
              </div>
            </div>
          </div>

          <Switch
            checked={isCurrentSiteActive}
            onChange={handleToggleCurrentSite}
            disabled={!currentHost}
            ariaLabel={`Toggle dark mode for ${currentHost || "current site"}`}
          />
        </div>
      </div>

      {/* ── ACTIVE SITES SECTION ── */}
      <div className="flex flex-col rounded-2xl bg-neutral-50 dark:bg-neutral-900 shadow-2xs overflow-hidden shrink-0">
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-100/60 dark:bg-neutral-850/60">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Active Sites
            </span>
            <Badge variant="neutral">
              {enabledSites.length}
            </Badge>
          </div>
        </div>

        {/* Tabulated Sites List */}
        {enabledSites.length === 0 ? (
          <div className="py-4 px-3 text-center flex flex-col items-center justify-center shrink-0">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              No websites enabled
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              Toggle the switch above to activate dark mode for this site
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100/70 dark:divide-neutral-850/50 shrink-0">
            {visibleSites.map((host) => {
              const isCurrent = host === currentHost
              return (
                <div
                  key={host}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50 transition-colors shrink-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe size={12} className="text-neutral-400 shrink-0" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {host}
                    </span>
                    {isCurrent && (
                      <Badge variant="interactive" className="shrink-0">
                        Current
                      </Badge>
                    )}
                  </div>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSite(host)}
                    title={`Disable for ${host}`}
                    aria-label={`Disable for ${host}`}
                    className="h-6 w-6 text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={12} className="stroke-[2.2]" />
                  </IconButton>
                </div>
              )
            })}
          </div>
        )}

        {/* Expand / Collapse Toggle ("See More" / "See Less") */}
        {enabledSites.length > DEFAULT_VISIBLE_SITES && (
          <div className="p-1.5 bg-neutral-100/40 dark:bg-neutral-850/40 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSitesExpanded(!isSitesExpanded)}
              className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 h-7"
            >
              {isSitesExpanded ? (
                <>
                  <span>See Less</span>
                  <ChevronUp size={12} className="stroke-[2.5]" />
                </>
              ) : (
                <>
                  <span>See More</span>
                  <span className="text-[10px]">({remainingSitesCount})</span>
                  <ChevronDown size={12} className="stroke-[2.5]" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── THEME CUSTOMIZATION & ADJUSTMENTS ACCORDION ── */}
      <div className="flex flex-col rounded-2xl bg-neutral-50 dark:bg-neutral-900 shadow-2xs overflow-hidden shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex items-center justify-between px-3 py-2 w-full text-left bg-neutral-100/60 dark:bg-neutral-850/60 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-none h-auto transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-neutral-500" />
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Theme Presets & Adjustments
            </span>
          </div>
          {showAdvancedSettings ? (
            <ChevronUp size={13} className="text-neutral-400 stroke-[2.5]" />
          ) : (
            <ChevronDown size={13} className="text-neutral-400 stroke-[2.5]" />
          )}
        </Button>

        {showAdvancedSettings && (
          <div className="p-3 flex flex-col gap-3">
            {/* Presets Grid */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 px-0.5">
                <Layers size={11} className="text-neutral-400" />
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                  {targetMode === "dark" ? "Dark Presets" : "Light Presets"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {targetMode === "dark"
                  ? DARK_PRESETS.map((preset) => {
                      const isSelected = settings.darkPreset === preset.id
                      return (
                        <Button
                          key={preset.id}
                          variant={isSelected ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => updateSettings({ darkPreset: preset.id })}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 h-auto text-left rounded-lg transition-all"
                        >
                          <span className={`w-2 h-2 rounded-full shadow-2xs shrink-0 ${preset.previewBg}`} />
                          <span className="text-xs font-bold truncate">{preset.name}</span>
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
                          className="flex items-center gap-1.5 px-2.5 py-1.5 h-auto text-left rounded-lg transition-all"
                        >
                          <span className={`w-2 h-2 rounded-full shadow-2xs shrink-0 ${preset.previewBg}`} />
                          <span className="text-xs font-bold truncate">{preset.name}</span>
                        </Button>
                      )
                    })}
              </div>
            </div>

            {/* Display Sliders */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1">
                  <Sliders size={11} className="text-neutral-400" />
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    Display Adjustments
                  </span>
                </div>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={handleResetDefaults}
                  title="Reset adjustments"
                  aria-label="Reset adjustments"
                  className="h-5 w-5"
                >
                  <RotateCcw size={10} className="stroke-[2.2]" />
                </IconButton>
              </div>

              {/* Brightness */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
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
                  className="h-1.5 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
                />
              </div>

              {/* Contrast */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
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
                  className="h-1.5 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
                />
              </div>

              {/* Warmth */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Warmth</span>
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">{settings.sepia}%</span>
                </div>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.sepia}
                  onChange={(e) => updateSettings({ sepia: Number(e.target.value) })}
                  className="h-1.5 p-0 border-none bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer accent-neutral-900 dark:accent-neutral-100"
                />
              </div>
            </div>

            {/* Media Protection */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center gap-1 px-0.5">
                <Shield size={11} className="text-neutral-400" />
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                  Media Protection
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5 px-0.5">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Preserve Media Colors
                </span>
                <Switch
                  size="sm"
                  checked={settings.preserveMedia}
                  onChange={(checked) => updateSettings({ preserveMedia: checked })}
                  ariaLabel="Toggle Preserve Media Colors"
                />
              </div>

              <div className="flex items-center justify-between py-0.5 px-0.5">
                <div className="flex items-center gap-1">
                  <Eye size={12} className="text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Dim Bright Images
                  </span>
                </div>
                <Switch
                  size="sm"
                  checked={settings.dimMediaInDark}
                  onChange={(checked) => updateSettings({ dimMediaInDark: checked })}
                  ariaLabel="Toggle Dim Bright Images"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default DarkModeSettingsModal

