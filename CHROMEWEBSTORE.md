# Chrome Web Store Listing: Extension Hub

**Last Updated:** August 29, 2026  
**Extension Name:** Extension Hub: All-in-One Micro-Extension Suite  
**Version:** 1.1.0  
**Category:** Productivity / Developer Tools  

---

## 1. Store Metadata

### Title
`Extension Hub: All-in-One Micro-Extension Suite` (46 / 75 chars)

### Summary
`A modular extension launcher featuring YouTube Music Switcher, Font Finder, Color Picker, and Website Dark Mode Forcer.` (122 / 132 chars)

### Detailed Description
Extension Hub is an all-in-one productivity suite and modular extension manager. Instead of installing dozens of separate browser extensions that slow down your browser, Extension Hub hosts a curated collection of micro-extensions inside a single lightweight, high-performance extension.

### Key Features

✦ **YouTube to YouTube Music Switcher:**
- **Player Timeline Switch Icon**: Injects a native YouTube Music switch button directly into YouTube video player controls.
- **Timestamp & Playlist Sync**: Jump from any YouTube song or video to YouTube Music with preserved playback timestamps (`&t=...s`) and playlist queue context.
- **Shorts & Keyboard Shortcut**: Works seamlessly on YouTube Shorts and supports `Shift+M` hotkey.

✦ **Interactive On-Demand Tools:**
- **Font Finder Inspector**: Hover and inspect typography across any webpage. View font family, rendered size, weight, line-height, letter-spacing, and copy CSS or Tailwind snippets.
- **Precision Color Picker**: Sample any pixel from your screen using the EyeDropper API. Automatically copy HEX, RGB, and HSL values to clipboard and maintain a saved palette history.

✦ **Always-Enabled Background Tools:**
- **Smart Dark / Light Mode Forcer**: Enforce high-contrast dark or light mode on any website. Smart media detection preserves photos, videos, and graphics without washed-out colors.

✦ **Customizable Hub & Extension Store:**
- **Pin Your Top Tools**: Choose your top 2, 5, 10+ favorite extensions to keep directly in the main popup for instant one-click access.
- **Search & Filter**: Quickly find any extension or tool across the catalog.
- **Multi-Criteria Sorting**: Sort extensions by number-wise index, most starred, or most liked.

---

## 2. Permissions Justification

| Permission | Justification |
|---|---|
| `storage` | Required to persist user's pinned extensions, saved color palettes, font inspection history, YouTube Music switcher settings, and dark mode preferences locally across sessions. |
| `tabs` | Required to query the active tab and communicate with page content scripts when launching interactive tools and switching playback. |
| `scripting` | Required to inject inspection overlays, switch buttons, and stylesheets on active web pages on user demand. |
| `activeTab` | Required to grant temporary script execution permissions on the currently focused tab when launching on-demand tools. |
| `host_permissions: ["http://*/*", "https://*/*"]` | Required for the YouTube Music Switcher, Font Finder, Color Picker, and Smart Dark Mode Forcer to inspect elements and inject player controls across web pages. |

---

## 3. Privacy & Data Disclosures

- **Single Purpose**: Provide a unified suite of productivity micro-tools (YouTube Music Switcher, Font Finder, Color Picker, Theme Forcer) inside a single extension.
- **Data Collection**: None. No personal data, telemetry, or browsing history is collected, tracked, or transmitted to any external server. All state is stored locally within browser storage.
- **Offline Capable**: All tools run 100% client-side inside the browser.

---

## 4. Version History

### Version 1.1.0 (Current Release)
- Added **YouTube to YT Music Redirector**:
  - Injected native YouTube Music switch button into the YouTube video player timeline controls (`.ytp-right-controls`).
  - Automatic timestamp synchronization (`&t=...s`) and playlist ID forwarding.
  - YouTube Shorts player integration.
  - Keyboard shortcut `Shift+M` support for rapid audio switching.
  - Hub popup settings modal with customizable navigation targets (same tab vs. new tab), auto-pause control, and instant URL converter.
- Upgraded extension registry and store categories.

### Version 1.0.0 (Initial Release)
- Modular Extension Hub architecture.
- Font Finder Inspector with live hover metrics, editable preview, and CSS/Tailwind export.
- Precision Pixel Color Picker with EyeDropper integration and saved palette manager.
- Smart Website Dark/Light Mode Forcer with media protection.
- Extension Catalog Store with search, category filters, and sorting (Number, Most Starred, Most Liked, A–Z).
- Monochrome Black & White design system with Satoshi typography.

