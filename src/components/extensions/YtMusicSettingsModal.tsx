import React, { useEffect, useState } from "react"
import Modal from "../ui/Modal"
import Switch from "../ui/Switch"
import Input from "../ui/Input"
import Button from "../ui/Button"
import Tooltip from "../ui/Tooltip"
import {
  ExtensionStorage,
  DEFAULT_YT_MUSIC_SETTINGS,
  type YtMusicSettings
} from "../../lib/storage"
import { copyToClipboard } from "../../lib/utils"
import {
  Music,
  ExternalLink,
  Copy,
  Check,
  Clock,
  ListMusic,
  Play,
  Tv,
  ArrowRight
} from "lucide-react"
import YtMusicIcon from "../ui/YtMusicIcon"

interface YtMusicSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const YtMusicSettingsModal: React.FC<YtMusicSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<YtMusicSettings>(DEFAULT_YT_MUSIC_SETTINGS)
  const [testUrl, setTestUrl] = useState("")
  const [convertedUrl, setConvertedUrl] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      ExtensionStorage.getYtMusicSettings().then((loaded) => {
        setSettings(loaded)
      })
    }
  }, [isOpen])

  const handleUpdateSetting = async <K extends keyof YtMusicSettings>(
    key: K,
    value: YtMusicSettings[K]
  ) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await ExtensionStorage.setYtMusicSettings({ [key]: value })

    // Also update background enabled registry if toggling 'enabled'
    if (key === "enabled") {
      await ExtensionStorage.setBackgroundExtensionEnabled("yt-music-redirect", Boolean(value))
    }
  }

  // Handle URL converter input
  const handleUrlChange = (url: string) => {
    setTestUrl(url)
    if (!url.trim()) {
      setConvertedUrl("")
      return
    }

    try {
      let videoId = ""
      let listId = ""
      let timeParam = ""

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
        
        if (parsed.searchParams.has("v")) {
          videoId = parsed.searchParams.get("v") || ""
        } else if (parsed.pathname.includes("/shorts/")) {
          const match = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/)
          if (match) videoId = match[1]
        } else if (parsed.hostname === "youtu.be") {
          videoId = parsed.pathname.replace("/", "")
        }

        listId = parsed.searchParams.get("list") || ""
        timeParam = parsed.searchParams.get("t") || ""
      }

      if (videoId) {
        let res = `https://music.youtube.com/watch?v=${videoId}`
        if (timeParam && settings.preserveTimestamp) res += `&t=${timeParam}`
        if (listId && settings.preservePlaylist) res += `&list=${listId}`
        setConvertedUrl(res)
      } else {
        setConvertedUrl("")
      }
    } catch {
      setConvertedUrl("")
    }
  }

  const handleCopyConverted = async () => {
    if (!convertedUrl) return
    await copyToClipboard(convertedUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1500)
  }

  const handleOpenConverted = () => {
    if (!convertedUrl) return
    window.open(convertedUrl, "_blank")
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <YtMusicIcon size={18} className="shrink-0" />
          <span>YouTube Music Switcher</span>
        </div>
      }
      width="max-w-[350px]"
      contentClassName="p-3.5 flex flex-col gap-3 min-h-0 overflow-y-auto hub-scrollbar"
    >
      {/* Main Switch: Enable on YouTube */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-850/80 shadow-2xs">
        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
          Player Timeline Button
        </span>
        <Switch
          checked={settings.enabled}
          onChange={(checked) => handleUpdateSetting("enabled", checked)}
          ariaLabel="Toggle YouTube Player Button"
        />
      </div>

      {/* Configuration Options */}
      <div className="flex flex-col gap-2 rounded-2xl p-2.5 bg-neutral-50 dark:bg-neutral-900 shadow-2xs">
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 px-0.5">
          Behavior & Sync
        </span>

        {/* Option 1: Open in Same Tab vs New Tab */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Open in New Tab
          </span>
          <Switch
            size="sm"
            checked={settings.openInNewTab}
            onChange={(checked) => handleUpdateSetting("openInNewTab", checked)}
            ariaLabel="Toggle Open in New Tab"
          />
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-850" />

        {/* Option 2: Preserve Playback Timestamp */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-neutral-400" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Preserve Timestamp
            </span>
          </div>
          <Switch
            size="sm"
            checked={settings.preserveTimestamp}
            onChange={(checked) => handleUpdateSetting("preserveTimestamp", checked)}
            ariaLabel="Toggle Preserve Timestamp"
          />
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-850" />

        {/* Option 3: Preserve Playlist Context */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <ListMusic size={13} className="text-neutral-400" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Preserve Playlist
            </span>
          </div>
          <Switch
            size="sm"
            checked={settings.preservePlaylist}
            onChange={(checked) => handleUpdateSetting("preservePlaylist", checked)}
            ariaLabel="Toggle Preserve Playlist"
          />
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-850" />

        {/* Option 4: Auto-pause Video */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <Play size={13} className="text-neutral-400" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Auto-Pause YouTube
            </span>
          </div>
          <Switch
            size="sm"
            checked={settings.autoPause}
            onChange={(checked) => handleUpdateSetting("autoPause", checked)}
            ariaLabel="Toggle Auto Pause"
          />
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-850" />

        {/* Option 5: Prefer Song Version (Studio Audio) */}
        <div className="flex items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <Music size={13} className="text-neutral-400" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Prefer Song Version
            </span>
          </div>
          <Switch
            size="sm"
            checked={settings.preferSongVersion}
            onChange={(checked) => handleUpdateSetting("preferSongVersion", checked)}
            ariaLabel="Toggle Prefer Song Version"
          />
        </div>
      </div>


      {/* Quick URL Converter / Launcher */}
      <div className="flex flex-col gap-2 rounded-2xl p-2.5 bg-neutral-100/70 dark:bg-neutral-850/70 shadow-2xs">
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 px-0.5">
          Quick Link Converter
        </span>
        <Input
          placeholder="Paste YouTube Video / Shorts URL..."
          value={testUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          icon={<Tv size={13} />}
          className="text-xs h-8"
        />


        {convertedUrl && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-2xs">
            <span className="text-[10px] font-sans text-neutral-600 dark:text-neutral-300 truncate">
              {convertedUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyConverted}
                className="h-6 px-2 text-[10px] font-bold"
              >
                {isCopied ? <Check size={11} className="stroke-[3] text-emerald-500" /> : <Copy size={11} />}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenConverted}
                className="h-6 px-2 text-[10px] font-bold flex items-center gap-1"
              >
                <span>Go</span>
                <ExternalLink size={10} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Note */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-[10px] text-neutral-500 dark:text-neutral-400">
        <span>Instant Keyboard Shortcut:</span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-neutral-750 font-sans text-[10px] font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs">
          Shift + M
        </kbd>
      </div>
    </Modal>
  )
}

export default YtMusicSettingsModal

