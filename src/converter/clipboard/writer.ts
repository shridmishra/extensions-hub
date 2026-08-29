import type { IRDocument } from "../../types/ir"
import { convertIRToSvg } from "../svg/serializer"
import { serializeIRForClipboard } from "../index"

/**
 * Writes rich multi-format clipboard data so that pressing Cmd+V in Figma
 * immediately pastes native editable layers directly onto the canvas.
 */
export async function copyDirectToFigmaClipboard(doc: IRDocument): Promise<boolean> {
  const svgString = convertIRToSvg(doc)
  const htmlWrapper = `<meta charset="utf-8"><!--StartFragment-->${svgString}<!--EndFragment-->`
  const _jsonString = serializeIRForClipboard(doc)

  if (typeof window !== "undefined" && typeof window.focus === "function") {
    try {
      window.focus()
    } catch {}
  }

  // 1. Try modern Clipboard API with multi-MIME types
  try {
    if (navigator.clipboard && typeof navigator.clipboard.write === "function") {
      const htmlBlob = new Blob([htmlWrapper], { type: "text/html" })
      const textBlob = new Blob([svgString], { type: "text/plain" })

      const clipboardItem = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob
      })

      await Promise.race([
        navigator.clipboard.write([clipboardItem]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Clipboard write timeout")), 1200)
        )
      ])
      return true
    }
  } catch (_err) {}

  // 2. Reliable execCommand('copy') fallback with focused element
  try {
    let copySuccessful = false
    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault()
      if (event.clipboardData) {
        event.clipboardData.setData("text/html", htmlWrapper)
        event.clipboardData.setData("text/plain", svgString)
        copySuccessful = true
      }
    }

    document.addEventListener("copy", handleCopy, true)

    if (document.body) {
      const tempTextArea = document.createElement("textarea")
      tempTextArea.value = svgString
      tempTextArea.style.position = "fixed"
      tempTextArea.style.left = "-9999px"
      tempTextArea.style.top = "-9999px"
      tempTextArea.style.opacity = "0"
      tempTextArea.setAttribute("aria-hidden", "true")
      document.body.appendChild(tempTextArea)
      tempTextArea.focus()
      tempTextArea.select()

      document.execCommand("copy")
      tempTextArea.remove()
    } else {
      document.execCommand("copy")
    }

    document.removeEventListener("copy", handleCopy, true)

    if (copySuccessful) {
      return true
    }
  } catch (_err) {}

  // 3. Plain text SVG fallback
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await Promise.race([
        navigator.clipboard.writeText(svgString),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Clipboard writeText timeout")), 1000)
        )
      ])
      return true
    }
  } catch (_err) {}

  return false
}
