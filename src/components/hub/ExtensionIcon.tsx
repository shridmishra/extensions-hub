import React from "react"
import {
  Type,
  Pipette,
  Moon,
  Sun,
  Ruler,
  Link,
  LayoutGrid,
  Layers,
  Code,
  FileCode,
  Terminal,
  Compass,
  Palette,
  Eye,
  Sliders,
  Maximize2,
  Box,
  Music,
  Headphones,
  Disc,
  Image as ImageIcon
} from "lucide-react"
import {
  FigmaIcon,
  CssIcon,
  YtMusicIcon,
  YouTubeIcon
} from "../icons"

interface ExtensionIconProps {
  name: string
  size?: number
  className?: string
}

export const ExtensionIcon: React.FC<ExtensionIconProps> = ({
  name,
  size = 16,
  className
}) => {
  switch (name) {
    case "Figma":
      return <FigmaIcon size={size} className={className} />
    case "CSS":
    case "Css":
    case "Css3":
      return <CssIcon size={size} className={className} />
    case "YtMusic":
    case "YouTubeMusic":
    case "YTMusic":
      return (
        <YtMusicIcon
          size={typeof size === "number" ? Math.round(size * 1.15) : size}
          className={className}
        />
      )
    case "YouTube":
      return <YouTubeIcon size={size} className={className} />
    case "Type":
      return <Type size={size} className={className} />
    case "Pipette":
      return <Pipette size={size} className={className} />
    case "Moon":
      return <Moon size={size} className={className} />
    case "Sun":
      return <Sun size={size} className={className} />
    case "Ruler":
      return <Ruler size={size} className={className} />
    case "Link":
      return <Link size={size} className={className} />
    case "Image":
    case "ImageIcon":
    case "Media":
      return <ImageIcon size={size} className={className} />
    case "LayoutGrid":
      return <LayoutGrid size={size} className={className} />
    case "Palette":
      return <Palette size={size} className={className} />
    case "Eye":
      return <Eye size={size} className={className} />
    case "Sliders":
      return <Sliders size={size} className={className} />
    case "Maximize2":
      return <Maximize2 size={size} className={className} />
    case "Code":
      return <Code size={size} className={className} />
    case "Layers":
      return <Layers size={size} className={className} />
    case "FileCode":
      return <FileCode size={size} className={className} />
    case "Terminal":
      return <Terminal size={size} className={className} />
    case "Compass":
      return <Compass size={size} className={className} />
    case "Music":
      return <Music size={size} className={className} />
    case "Headphones":
      return <Headphones size={size} className={className} />
    case "Disc":
      return <Disc size={size} className={className} />
    default:
      return <Box size={size} className={className} />
  }
}

