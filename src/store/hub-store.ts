import { create } from "zustand"
import {
  EXTENSION_REGISTRY,
  filterAndSortExtensions,
  type ExtensionManifestItem,
  type SortOption
} from "../lib/registry"
import { ExtensionStorage } from "../lib/storage"

export type { SortOption }

interface HubStoreState {
  pinnedIds: string[]
  starredIds: string[]
  likedIds: string[]
  backgroundEnabled: Record<string, boolean>
  searchQuery: string
  catalogCategory: string
  catalogSortBy: SortOption
  isCatalogOpen: boolean
  isSearchOpen: boolean
  
  // Actions
  loadAllState: () => Promise<void>
  togglePin: (id: string) => Promise<void>
  toggleStar: (id: string) => Promise<void>
  toggleLike: (id: string) => Promise<void>
  toggleBackground: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setCatalogCategory: (category: string) => void
  setCatalogSortBy: (sort: SortOption) => void
  setIsCatalogOpen: (open: boolean) => void
  setIsSearchOpen: (open: boolean) => void
  
  // Selectors
  getPinnedExtensions: () => ExtensionManifestItem[]
  getFilteredCatalogExtensions: () => ExtensionManifestItem[]
}

export const useHubStore = create<HubStoreState>((set, get) => ({
  pinnedIds: ["font-finder", "color-picker"],
  starredIds: [],
  likedIds: [],
  backgroundEnabled: {},
  searchQuery: "",
  catalogCategory: "All",
  catalogSortBy: "number",
  isCatalogOpen: false,
  isSearchOpen: false,

  loadAllState: async () => {
    const [pinned, starred, liked, bgEnabled] = await Promise.all([
      ExtensionStorage.getPinnedIds(),
      ExtensionStorage.getStarredIds(),
      ExtensionStorage.getLikedIds(),
      ExtensionStorage.getBackgroundEnabled()
    ])
    set({
      pinnedIds: pinned,
      starredIds: starred,
      likedIds: liked,
      backgroundEnabled: bgEnabled
    })
  },

  togglePin: async (id: string) => {
    const nextPinned = await ExtensionStorage.togglePin(id)
    set({ pinnedIds: nextPinned })
  },

  toggleStar: async (id: string) => {
    const nextStarred = await ExtensionStorage.toggleStarred(id)
    set({ starredIds: nextStarred })
  },

  toggleLike: async (id: string) => {
    const nextLiked = await ExtensionStorage.toggleLiked(id)
    set({ likedIds: nextLiked })
  },

  toggleBackground: async (id: string) => {
    const current = get().backgroundEnabled
    const nextState = !current[id]
    await ExtensionStorage.setBackgroundExtensionEnabled(id, nextState)
    set({
      backgroundEnabled: {
        ...current,
        [id]: nextState
      }
    })
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setCatalogCategory: (category: string) => set({ catalogCategory: category }),
  setCatalogSortBy: (sort: SortOption) => set({ catalogSortBy: sort }),
  setIsCatalogOpen: (open: boolean) => set({ isCatalogOpen: open }),
  setIsSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  getPinnedExtensions: () => {
    const { pinnedIds } = get()
    return EXTENSION_REGISTRY.filter((ext) => pinnedIds.includes(ext.id)).sort((a, b) => {
      return pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id)
    })
  },

  getFilteredCatalogExtensions: () => {
    const { searchQuery, catalogCategory, catalogSortBy, starredIds, likedIds } = get()
    return filterAndSortExtensions(EXTENSION_REGISTRY, {
      category: catalogCategory,
      query: searchQuery,
      sortBy: catalogSortBy,
      starredIds,
      likedIds
    })
  }
}))
