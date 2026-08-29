/**
 * Injects a temporary, sleek floating pill toast into the active page DOM
 * notifying the user that a color was sampled and copied to clipboard.
 */
export function injectColorToast(pickedHex: string, pickedRgb: string, name: string) {
  const existing = document.getElementById("hub-color-toast-overlay")
  if (existing) existing.remove()

  const toast = document.createElement("div")
  toast.id = "hub-color-toast-overlay"
  toast.style.cssText = `
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 8px 14px 8px 10px !important;
    background: #09090b !important;
    color: #ffffff !important;
    border-radius: 9999px !important;
    box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.45), 0 4px 12px -2px rgba(0, 0, 0, 0.25) !important;
    font-family: 'Geist Mono', -apple-system, system-ui, monospace !important;
    animation: hubToastIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    user-select: none !important;
    -webkit-font-smoothing: antialiased !important;
  `

  toast.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap');
      @keyframes hubToastIn {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    </style>
    <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: ${pickedHex}; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 0 0 1px rgba(0,0,0,0.5); flex-shrink: 0;"></div>
    <div style="display: flex; align-items: center; gap: 6px; line-height: 1;">
      <span style="font-family: 'Geist Mono', monospace; font-weight: 600; font-size: 12px; letter-spacing: -0.01em; color: #fafafa; font-feature-settings: 'tnum' 1;">${pickedHex}</span>
      <span style="color: rgba(255,255,255,0.3); font-size: 10px;">•</span>
      <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">${name}</span>
    </div>
    <span style="color: rgba(255,255,255,0.25); font-size: 10px; line-height: 1;">•</span>
    <div style="display: flex; align-items: center; gap: 4px; line-height: 1;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span style="color: #a1a1aa; font-size: 10px; font-weight: 500; letter-spacing: -0.01em;">Copied</span>
    </div>
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.transition = "opacity 0.2s ease, transform 0.2s ease"
    toast.style.opacity = "0"
    toast.style.transform = "translateY(6px)"
    setTimeout(() => toast.remove(), 200)
  }, 2800)
}
