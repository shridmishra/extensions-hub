import React from "react"
import Modal from "../ui/Modal"
import Input from "../ui/Input"
import Button from "../ui/Button"
import IconButton from "../ui/IconButton"
import EmptyState from "../ui/EmptyState"
import { useHubStore } from "../../store/hub-store"
import { Search, X, Plus, Check, Play } from "lucide-react"
import { ExtensionIcon } from "./ExtensionIcon"
import HubLogo from "../ui/HubLogo"

interface ExtensionCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onLaunchExtension: (id: string) => void
}

const CATEGORIES = ["All", "Typography", "Color & Design", "Accessibility", "Developer", "Utility"]

export const ExtensionCatalogModal: React.FC<ExtensionCatalogModalProps> = ({
  isOpen,
  onClose,
  onLaunchExtension
}) => {
  const {
    searchQuery,
    setSearchQuery,
    catalogCategory,
    setCatalogCategory,
    pinnedIds,
    togglePin,
    getFilteredCatalogExtensions
  } = useHubStore()

  const extensions = getFilteredCatalogExtensions()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="All Extensions"
      width="max-w-[340px]"
      contentClassName="p-3.5 flex flex-col gap-3 min-h-0 overflow-y-auto hub-scrollbar"
    >
      {/* Search Input */}
      <div className="flex-shrink-0">
        <Input
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={13} />}
          actionRight={
            searchQuery ? (
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="h-5 w-5 p-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                aria-label="Clear search"
              >
                <X size={12} />
              </IconButton>
            ) : null
          }
        />
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-shrink-0">
        {CATEGORIES.map((cat) => {
          const isActive = catalogCategory === cat
          return (
            <Button
              key={cat}
              size="sm"
              variant={isActive ? "primary" : "secondary"}
              onClick={() => setCatalogCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all h-6 ${
                isActive
                  ? "shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-850 border-none hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {cat}
            </Button>
          )
        })}
      </div>

      {/* Minimal Extensions List */}
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar flex-1 pr-0.5 pt-1">
        {extensions.length === 0 ? (
          <EmptyState
            icon={<HubLogo size={18} className="fill-current text-neutral-400 dark:text-neutral-500" />}
            title="No extensions found"
            description="Try a different search keyword or category."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSearchQuery("")
                  setCatalogCategory("All")
                }}
              >
                Reset Filter
              </Button>
            }
          />
        ) : (
          extensions.map((ext) => {
            const isPinned = pinnedIds.includes(ext.id)
            return (
              <div
                key={ext.id}
                onClick={() => {
                  onClose()
                  onLaunchExtension(ext.id)
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/70 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 shadow-2xs hover:shadow-xs transition-all select-none cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-750 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <ExtensionIcon name={ext.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate leading-none">
                      {ext.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1 truncate leading-none">
                      {ext.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={isPinned ? "secondary" : "primary"}
                    onClick={() => togglePin(ext.id)}
                    className="h-6 text-[10px] px-2.5 font-bold"
                  >
                    {isPinned ? (
                      <span className="flex items-center gap-1">
                        <Check size={11} className="stroke-[3]" /> Pinned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus size={11} className="stroke-[3]" /> Pin
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
