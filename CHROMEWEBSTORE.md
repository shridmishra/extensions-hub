# Chrome Web Store Listing: Extensions Hub

> **Last Updated:** August 29, 2026  
> **Extension Name:** Extensions Hub: All-in-One Micro-Extension Suite  
> **Version:** 1.0.0  
> **Category:** Productivity (Secondary: Developer Tools)  

---

## 1. Store Listing Metadata

### Extension Name [REQUIRED]
```
Extensions Hub: All-in-One Micro-Extension Suite
```
*(47 / 75 characters)*

### Short Description [REQUIRED]
```
A modular extensions launcher featuring YouTube Music Switcher, Font Finder, Color Picker, and Website Dark Mode Forcer.
```
*(123 / 132 characters)*

### Detailed Description [REQUIRED]
*(Copy and paste the plain text below into the Chrome Web Store Developer Console. CWS does not render markdown headers, so clean line breaks and bullet characters `•` are used.)*

```
Extensions Hub is an all-in-one productivity suite and modular extension manager. Instead of installing dozens of separate browser extensions that clutter your toolbar and slow down your browser, Extensions Hub hosts a curated collection of high-performance micro-extensions inside a single lightweight popup.

FEATURES

• YouTube to YouTube Music Switcher
  - Timeline Switch Button: Injects a native YouTube Music switch icon directly into the YouTube video player controls.
  - Timestamp & Playlist Sync: Jump from any YouTube song or video to YouTube Music with preserved playback timestamps (&t=...s) and playlist context.
  - Shorts & Hotkey Support: Works on YouTube Shorts and supports Shift+M keyboard shortcut for instant audio switching.
  - Custom Settings: Choose navigation target (same tab or new tab), toggle auto-pause, and convert URLs instantly.

• Font Finder Typography Inspector
  - Hover over any element to inspect rendered font family, font size, weight, line-height, letter-spacing, and colors.
  - Copy CSS rulesets and Tailwind CSS utility classes with one click.
  - Live editable preview box to test typography tweaks on the fly.

• Pixel Color Picker & Palette Builder
  - Sample any pixel on your screen with precision using the native EyeDropper API.
  - Automatically copy HEX, RGB, and HSL values to clipboard.
  - Maintain a saved palette history for your design projects.

• Smart Website Dark/Light Mode Forcer
  - Enforce clean, high-contrast dark or light mode on any website.
  - Intelligent media detection preserves photos, videos, canvas, and graphics without washed-out colors.
  - Multiple presets: High Contrast Dark, Soft Charcoal, Light Mode Invert, and Warm Night Shift.

• CSS Style & Box Model Inspector
  - Click any DOM element to extract computed styles, box model dimensions (margin, padding, border), and Tailwind classes.

• HTML to Figma Vector Importer
  - Capture web elements or entire layouts as clean vector layers and paste directly onto your Figma canvas.

• Customizable Hub & Store
  - Pin your top favorite micro-extensions for instant one-click access.
  - Search and filter tools by category (Typography, Design, Developer, Accessibility, Utility).
  - Sort by number, stars, likes, or alphabetically.

HOW TO USE

1. Click the Extensions Hub icon in your Chrome toolbar.
2. Launch any interactive micro-extension (Font Finder, Color Picker, CSS Inspector) by clicking its card or using its shortcut.
3. On YouTube, look for the YouTube Music icon in the video player control bar (or press Shift+M) to jump straight to YouTube Music at the exact timestamp.
4. Pin or reorder your favorite tools to customize your launcher.

PRIVACY & PERMISSIONS

• 100% Client-Side: All tools run completely offline inside your browser. No remote servers, no telemetry, and no third-party analytics.
• Zero Data Collection: Extensions Hub never collects, stores, or transmits your personal information or browsing history.
• Local Storage Only: Preferences (pinned tools, saved palettes, dark mode toggles) are stored locally in your browser via chrome.storage.local.

PERMISSIONS EXPLAINED

• "Storage" — Used to save your pinned tools, dark mode preferences, and saved palettes locally on your device.
• "Tabs" — Used to query the active tab when activating on-demand inspection tools and switching video playback.
• "Scripting" & "Active Tab" — Used to inject inspection overlays and stylesheets on the active tab only when you trigger a tool.
• "Host Permissions" — Required for the YouTube Music Switcher and Dark Mode theme forcer to run on target pages.

SUPPORT & FEEDBACK

Found a bug or have a suggestion for a new micro-extension?
• Email: shridmishra00@gmail.com
• GitHub: https://github.com/shridmishra/extensions-hub

Version 1.0.0 — Initial official launch featuring YouTube Music Switcher, Font Finder Inspector, Pixel Color Picker, CSS & Tailwind Inspector, HTML to Figma Vector Importer, Smart Dark Mode Forcer, and custom launcher.
```

### Category [REQUIRED]
- **Primary Category:** `Productivity`
- **Secondary Category:** `Developer Tools`

### Single Purpose Statement [REQUIRED]
```
Provides a unified modular launcher for client-side productivity and developer micro-tools including YouTube Music redirection, font inspection, color picking, and dark mode.
```

### Primary Language [REQUIRED]
```
English
```

---

## 2. Graphics & Promotional Assets

All required graphics are generated in high resolution inside the [`store-assets/`](file:///Users/shrid/Repos/projects/extension-hub/store-assets) directory:

| Asset | Dimensions | Status | Location / Filename |
|---|---|---|---|
| **Store Icon** [REQUIRED] | 128×128 PNG | ✅ Ready | `store-assets/icon-128x128.png` |
| **Screenshot 1: Hub & Catalog** [REQUIRED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-1-hub-1280x800.png` |
| **Screenshot 2: YouTube Switcher** [RECOMMENDED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-2-ytmusic-1280x800.png` |
| **Screenshot 3: DevTools Suite** [RECOMMENDED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-3-devtools-1280x800.png` |
| **Small Promo Tile** [RECOMMENDED] | 440×280 PNG | ✅ Ready | `store-assets/small-promo-tile-440x280.png` |
| **Marquee Promo Banner** [RECOMMENDED] | 1400×560 PNG | ✅ Ready | `store-assets/marquee-promo-tile-1400x560.png` |

---

## 3. Permissions Justification

| Permission | Type | User-Facing Feature & Plain-English Justification |
|---|---|---|
| `storage` | `permissions` | Required to save user preferences (pinned tools, YouTube Switcher settings, saved color palettes, and dark mode toggles) locally on the device using `chrome.storage.local`. |
| `tabs` | `permissions` | Required to detect the active tab when the user launches interactive tools (Font Finder, Color Picker, CSS Picker) and to switch video URLs to YouTube Music. |
| `scripting` | `permissions` | Required to inject inspection overlays, element highlight outlines, and styling helpers into the active tab on user demand. |
| `activeTab` | `permissions` | Required to grant temporary script execution permissions on the currently focused tab when launching on-demand tools from the popup. |
| `http://*/*`, `https://*/*` | `host_permissions` | Required for the YouTube Music Switcher (on `youtube.com` and `music.youtube.com`), Smart Dark Mode Forcer, and on-demand DOM inspection tools to interact with web pages. |

---

## 4. Privacy & Data Use Disclosures

### Data Collection Audit

**Does the extension collect user data?** No.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|---|---|---|---|---|
| Personally identifiable info | No | No | None | No |
| Health info | No | No | None | No |
| Financial info | No | No | None | No |
| Authentication info | No | No | None | No |
| Personal communications | No | No | None | No |
| Location | No | No | None | No |
| Web history | No | No | None | No |
| User activity | No | No | None | No |
| Website content | No | No | None | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## 5. Privacy Policy

- **Privacy Policy File:** [`PRIVACY.md`](file:///Users/shrid/Repos/projects/extension-hub/PRIVACY.md)
- **Privacy Policy URL:** `https://github.com/shridmishra/extensions-hub/blob/main/PRIVACY.md`

---

## 6. Distribution & Pricing

- **Visibility:** Public
- **Geographic Regions:** All regions (Worldwide)
- **Pricing:** Free
- **Target Audience:** General Public & Web Developers

---

## 7. Developer Info

- **Publisher / Developer Name:** Shridhar Mishra
- **Contact Email:** `shridmishra00@gmail.com`
- **Support URL:** `https://github.com/shridmishra/extensions-hub/issues`
- **Homepage URL:** `https://github.com/shridmishra/extensions-hub`

---

## 8. Version History

| Version | Date | Changes | Status |
|---|---|---|---|
| **1.0.0** | 2026-08-29 | Initial official Chrome Web Store launch: Modular extension registry, YouTube to YouTube Music Switcher, Font Finder, Color Picker, CSS Picker, HTML to Figma Importer, Smart Dark Mode, and customizable popup launcher. | **Ready for Submission** |

---

## 9. Submission ZIP Package

- **Package Location:** `build/chrome-mv3-prod.zip`
- **Package Size:** ~970 KB (Well below 2GB / 10MB limit)
- **Build Command:** `npm run package`
- **Verification Command:** `npm run validate`
