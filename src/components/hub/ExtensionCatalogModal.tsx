import React from "react"
import Modal from "../ui/Modal"
import Input from "../ui/Input"
import Button from "../ui/Button"
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
      contentClassName="p-3.5 flex flex-col gap-3 max-h-[460px]"
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
              <button
                onClick={() => setSearchQuery("")}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            ) : null
          }
        />
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto hub-scrollbar pb-0.5 flex-shrink-0">
        {CATEGORIES.map((cat) => {
          const isActive = catalogCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setCatalogCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-2xs"
                  : "bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Minimal Extensions List */}
      <div className="flex flex-col gap-2 overflow-y-auto hub-scrollbar flex-1 pr-0.5 pt-1">
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
                className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] hover:border-neutral-300 dark:hover:border-neutral-700 transition-all select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0">
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

                <div className="flex items-center gap-1.5 shrink-0">
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
