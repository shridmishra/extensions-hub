export type CaptureMode = "full" | "viewport" | "area" | "element"

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ScreenshotData {
  id: string
  dataUrl: string
  width: number
  height: number
  devicePixelRatio: number
  mode: CaptureMode
  title: string
  url: string
  timestamp: number
  fileSizeBytes?: number
}

export interface ScreenshotSettings {
  format: "png" | "jpeg"
  quality: number // 0 to 100 for jpeg
  scrollDelayMs: number
  hideFixedElements: boolean
  autocopy: boolean
}
