import type {
  ExtensionCategory,
  ExtensionType,
  ExtensionManifestItem,
  CatalogSortBy,
  CatalogFilterOptions
} from "../types/registry"

export type {
  ExtensionCategory,
  ExtensionType,
  ExtensionManifestItem,
  CatalogSortBy,
  CatalogFilterOptions
}

export const EXTENSION_REGISTRY: ExtensionManifestItem[] = [
  {
    id: "font-finder",
    number: 1,
    name: "Font Finder Inspector",
    shortName: "Font Finder",
    description: "Hover and inspect any typography on the page. View font-family, size, weight, line-height, and copy CSS snippets.",
    category: "Typography",
    type: "interactive",
    icon: "Type",
    stars: 1240,
    likes: 3890,
    defaultPinned: true,
    defaultEnabled: true,
    tags: ["fonts", "typography", "css", "inspector", "text", "google-fonts"],
    isImplemented: true
  },
  {
    id: "color-picker",
    number: 2,
    name: "Pixel Color Picker & Palette",
    shortName: "Color Picker",
    description: "Sample any pixel on your screen with precision. Copy HEX, RGB, HSL values and build saved color palettes.",
    category: "Color & Design",
    type: "interactive",
    icon: "Pipette",
    stars: 1980,
    likes: 5420,
    defaultPinned: true,
    defaultEnabled: true,
    tags: ["color", "eyedropper", "hex", "rgb", "palette", "design"],
    isImplemented: true
  },
  {
    id: "css-picker",
    number: 3,
    name: "CSS Style & Tailwind Inspector",
    shortName: "CSS Picker",
    description: "Click any DOM element to instantly extract clean CSS rulesets, Tailwind classes, box-model metrics, and copy to clipboard.",
    category: "Developer",
    type: "interactive",
    icon: "CSS",
    stars: 2890,
    likes: 7420,
    defaultPinned: true,
    defaultEnabled: true,
    tags: ["css", "tailwind", "inspector", "styles", "developer"],
    isImplemented: true
  },
  {
    id: "figma-picker",
    number: 4,
    name: "HTML to Figma Vector Importer",
    shortName: "Figma Picker",
    description: "Capture elements or entire webpages into multi-layer Figma vectors. Direct canvas paste with ⌘+V preserving clip-paths and fonts.",
    category: "Color & Design",
    type: "interactive",
    icon: "Figma",
    stars: 3450,
    likes: 9120,
    defaultPinned: true,
    defaultEnabled: true,
    tags: ["figma", "vector", "svg", "clip-path", "design", "html2figma"],
    isImplemented: true
  },
  {
    id: "force-dark-mode",
    number: 5,
    name: "Smart Dark/Light Mode Forcer",
    shortName: "Force Dark/Light",
    description: "Automatically detect page theme and invert to opposite mode. Preserves media, images, and videos seamlessly.",
    category: "Accessibility",
    type: "background",
    icon: "Moon",
    stars: 2450,
    likes: 6810,
    defaultPinned: false,
    defaultEnabled: false,
    tags: ["dark-mode", "light-mode", "invert", "contrast", "theme", "night-shift"],
    isImplemented: true
  },
  {
    id: "page-ruler",
    number: 6,
    name: "Page Ruler & Dimension Guide",
    shortName: "Page Ruler",
    description: "Measure pixel distances, bounding boxes, paddings, and alignment guides across any website layout.",
    category: "Developer",
    type: "interactive",
    icon: "Ruler",
    stars: 840,
    likes: 2150,
    defaultPinned: false,
    defaultEnabled: false,
    tags: ["ruler", "measure", "dimensions", "pixels", "layout"],
    isImplemented: true
  },
  {
    id: "link-grabber",
    number: 7,
    name: "Media & Asset Grabber",
    shortName: "Media Grabber",
    description: "Scan, filter, preview, and download all images, SVGs, PNGs, and videos from the active tab with bulk download support.",
    category: "Utility",
    type: "interactive",
    icon: "Image",
    stars: 620,
    likes: 1470,
    defaultPinned: false,
    defaultEnabled: false,
    tags: ["media", "images", "svg", "png", "jpg", "download", "assets", "extractor"],
    isImplemented: true
  },
  {
    id: "yt-music-redirect",
    number: 8,
    name: "YouTube to YT Music Redirector",
    shortName: "YT Music Switcher",
    description: "Add a native YouTube Music switch button directly into YouTube video player controls. Jump straight to YouTube Music with preserved playback timestamps.",
    category: "Utility",
    type: "background",
    icon: "YtMusic",
    stars: 3780,
    likes: 9850,
    defaultPinned: true,
    defaultEnabled: true,
    tags: ["youtube", "yt-music", "music", "redirect", "video", "player", "controls", "audio", "timeline", "song"],
    isImplemented: true
  }
]

export type SortOption = "number" | "stars" | "likes" | "name"

export interface FilterCatalogOptions {
  category?: string
  query?: string
  sortBy?: SortOption
  starredIds?: string[]
  likedIds?: string[]
}

/**
 * Pure filter and sort utility for the micro-extension catalog.
 */
export function filterAndSortExtensions(
  extensions: ExtensionManifestItem[],
  options: FilterCatalogOptions = {}
): ExtensionManifestItem[] {
  const {
    category = "All",
    query = "",
    sortBy = "number",
    starredIds = [],
    likedIds = []
  } = options

  let list = [...extensions]

  // Category filter
  if (category !== "All") {
    list = list.filter((ext) => ext.category === category)
  }

  // Search query filter
  if (query.trim()) {
    const q = query.toLowerCase().trim()
    list = list.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.shortName.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.category.toLowerCase().includes(q) ||
        ext.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy === "number") {
      return a.number - b.number
    }
    if (sortBy === "stars") {
      const aStars = a.stars + (starredIds.includes(a.id) ? 1 : 0)
      const bStars = b.stars + (starredIds.includes(b.id) ? 1 : 0)
      return bStars - aStars
    }
    if (sortBy === "likes") {
      const aLikes = a.likes + (likedIds.includes(a.id) ? 1 : 0)
      const bLikes = b.likes + (likedIds.includes(b.id) ? 1 : 0)
      return bLikes - aLikes
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  return list
}

export function getExtensionById(id: string): ExtensionManifestItem | undefined {
  return EXTENSION_REGISTRY.find((ext) => ext.id === id)
}


