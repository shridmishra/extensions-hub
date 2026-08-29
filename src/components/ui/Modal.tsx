import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import IconButton from "./IconButton"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  showCloseButton?: boolean
  width?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  contentClassName,
  showCloseButton = true,
  width = "max-w-[360px]"
}) => {
  const [portalContainer, setPortalContainer] = useState<Element | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setPortalContainer(null)
      return
    }

    const getContainer = () => {
      if (typeof document === "undefined") return null
      const hosts = document.querySelectorAll("plasmo-csui")
      for (const host of Array.from(hosts)) {
        if (host.shadowRoot) {
          const root = host.shadowRoot.querySelector(".hub-extension-root")
          if (root) return root
        }
      }
      return document.body
    }

    setPortalContainer(getContainer())
  }, [isOpen])

  if (!isOpen || !portalContainer) return null

  const isShadowRoot = portalContainer.classList.contains("hub-extension-root")
  const positionClass = isShadowRoot ? "absolute" : "fixed"

  return createPortal(
    <div
      className={cn(
        positionClass,
        "hub-extension-root inset-0 z-[2147483647] flex items-center justify-center p-2.5 bg-black/60 dark:bg-black/80 backdrop-blur-[2px] animate-hub-fade-in select-none font-sans max-h-full overflow-hidden"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full rounded-2xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xl animate-scale-in flex flex-col max-h-[calc(100vh-20px)] max-h-[490px] overflow-hidden",
          width,
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/80 dark:bg-neutral-850/60 flex-shrink-0 rounded-t-2xl">
            <div className="min-w-0 pr-2">
              {title && (
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-50 truncate tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <IconButton
                size="sm"
                variant="ghost"
                onClick={onClose}
                title="Close (Esc)"
                aria-label="Close"
                tooltipPosition="bottom-left"
              >
                <X size={14} className="stroke-[2.5]" />
              </IconButton>
            )}
          </div>
        )}

        <div className={cn("p-4 overflow-y-auto min-h-0 flex-1 hub-scrollbar", contentClassName)}>
          {children}
        </div>
      </div>
    </div>,
    portalContainer
  )
}

export default Modal
