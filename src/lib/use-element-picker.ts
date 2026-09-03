import { useEffect, useRef, useState, useCallback } from "react"

export interface ElementPickerOptions {
  isActive: boolean
  isModalOpen?: boolean
  onPick?: (element: HTMLElement) => void
  filterElement?: (element: HTMLElement) => boolean
}

export function useElementPicker({
  isActive,
  isModalOpen = false,
  onPick,
  filterElement
}: ElementPickerOptions) {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Clear hover state when inactive or modal opens
  useEffect(() => {
    if (!isActive || isModalOpen) {
      setHoveredElement(null)
      setHoveredRect(null)
    }
  }, [isActive, isModalOpen])

  // Recalculate rect on scroll or resize
  useEffect(() => {
    if (!isActive || !hoveredElement || isModalOpen) return

    const updateRect = () => {
      if (hoveredElement && document.body.contains(hoveredElement)) {
        setHoveredRect(hoveredElement.getBoundingClientRect())
      } else {
        setHoveredElement(null)
        setHoveredRect(null)
      }
    }

    window.addEventListener("scroll", updateRect, { passive: true })
    window.addEventListener("resize", updateRect, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateRect)
      window.removeEventListener("resize", updateRect)
    }
  }, [isActive, hoveredElement, isModalOpen])

  const handleMouseMoveOverlay = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!overlayRef.current || isModalOpen) return

      // Temporarily toggle pointer-events to hit-test underlying webpage element
      overlayRef.current.style.setProperty("pointer-events", "none", "important")
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      overlayRef.current.style.setProperty("pointer-events", "auto", "important")

      if (!target || target.closest(".hub-extension-root") || target.id === "plasmo-shadow-container") {
        return
      }

      if (filterElement && !filterElement(target)) {
        return
      }

      if (target !== hoveredElement) {
        setHoveredElement(target)
        setHoveredRect(target.getBoundingClientRect())
      }
    },
    [hoveredElement, isModalOpen, filterElement]
  )

  const handleClickOverlay = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!overlayRef.current || isModalOpen) return

      e.preventDefault()
      e.stopPropagation()

      overlayRef.current.style.setProperty("pointer-events", "none", "important")
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      overlayRef.current.style.setProperty("pointer-events", "auto", "important")

      if (!target || target.closest(".hub-extension-root") || target.id === "plasmo-shadow-container") {
        return
      }

      if (filterElement && !filterElement(target)) {
        return
      }

      onPick?.(target)
      setHoveredElement(null)
      setHoveredRect(null)
    },
    [isModalOpen, onPick, filterElement]
  )

  const clearHover = useCallback(() => {
    setHoveredElement(null)
    setHoveredRect(null)
  }, [])

  // Calculate viewport-clamped pill positions
  const pillTop = hoveredRect
    ? hoveredRect.top < 68
      ? hoveredRect.bottom + 8
      : Math.max(68, hoveredRect.top - 26)
    : 0

  const pillLeft = hoveredRect
    ? Math.max(12, Math.min(window.innerWidth - 240, hoveredRect.left))
    : 0

  return {
    overlayRef,
    hoveredElement,
    hoveredRect,
    pillTop,
    pillLeft,
    handleMouseMoveOverlay,
    handleClickOverlay,
    clearHover
  }
}
