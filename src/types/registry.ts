export type ExtensionCategory =
  | "Typography"
  | "Color & Design"
  | "Accessibility"
  | "Developer"
  | "Utility"

export type ExtensionType = "interactive" | "background"

export interface ExtensionManifestItem {
  id: string
  number: number
  name: string
  shortName: string
  description: string
  category: ExtensionCategory
  type: ExtensionType
  icon: string
  stars: number
  likes: number
  defaultPinned: boolean
  defaultEnabled: boolean
  tags: string[]
  isImplemented: boolean
}

export type CatalogSortBy = "number" | "name" | "stars" | "likes"

export interface CatalogFilterOptions {
  category?: string
  query?: string
  sortBy?: CatalogSortBy
  starredIds?: string[]
}
