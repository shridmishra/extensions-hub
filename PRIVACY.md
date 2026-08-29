# Privacy Policy for Extension Hub

**Last Updated:** August 29, 2026

Extension Hub ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding user data, permissions, and storage for the **Extension Hub: All-in-One Micro-Extension Suite** browser extension.

---

## 1. Single Purpose & Overview

Extension Hub is designed to provide a unified, modular suite of client-side developer and productivity micro-tools (including YouTube to YouTube Music Switcher, Font Finder Inspector, Pixel Color Picker, and Smart Website Dark Mode Forcer) within a single lightweight extension.

**Core Privacy Principle:** All operations and data processing run **100% locally on your device**. We do not collect, track, store, or transmit your personal data, browsing history, or keystrokes to any remote server or third party.

---

## 2. What Data We Collect & Store

Extension Hub only stores minimal configuration data locally on your device to make the extension functional and retain your personal preferences across browser sessions:

| Feature / Data | Purpose | Storage Mechanism | Transmitted Remotely? |
|---|---|---|---|
| **Pinned Extensions & Favorites** | Remembers your pinned micro-extensions in the main popup | `chrome.storage.local` | ❌ No (Local only) |
| **YouTube Switcher Preferences** | Saves auto-pause setting and preferred navigation target (same tab vs. new tab) | `chrome.storage.local` | ❌ No (Local only) |
| **Saved Color Palettes** | Stores colors captured via the Pixel Color EyeDropper | `chrome.storage.local` | ❌ No (Local only) |
| **Dark Mode Preferences** | Remembers enabled dark/light theme presets and per-site exclusions | `chrome.storage.local` | ❌ No (Local only) |

We **do not** collect or log:
- Personally Identifiable Information (name, email, IP address)
- Browsing history, visited URLs, or search history
- Passwords, form inputs, or financial information
- Audio, video, or keystrokes

---

## 3. Permissions Justification

Extension Hub requests only the minimal browser permissions required for its features:

- **`storage`**: Used exclusively to save your tool preferences, pinned extensions, and saved color palettes locally using `chrome.storage.local`.
- **`tabs`**: Used to identify the active tab when you launch on-demand inspection tools (Font Finder, Color Picker, CSS Inspector) or when switching video playback from YouTube to YouTube Music.
- **`scripting` & `activeTab`**: Used to inject on-demand inspection overlays and stylesheet helpers onto the webpage you are currently viewing only when you explicitly activate a tool.
- **`host_permissions` (`http://*/*`, `https://*/*`)**: Required for the YouTube Music Switcher (on `youtube.com` and `music.youtube.com`), Smart Dark Mode theme forcer, and inspection tools to operate across target web pages.

---

## 4. Third-Party Services & Analytics

- **No Remote Servers:** Extension Hub does not communicate with external analytics servers, telemetry tracking services, or third-party APIs.
- **No Advertisements:** Extension Hub contains no advertising networks, trackers, or monetization SDKs.
- **No Obfuscated Code:** All code is packaged locally within the extension bundle and adheres to Manifest V3 standards.

---

## 5. Data Sharing & Sale

We do **not** sell, rent, monetize, trade, or share any user data with third parties under any circumstances.

---

## 6. Data Retention & User Control

All stored data resides in your browser's local extension storage:
- **Persistent Storage:** Your settings remain saved until you modify them or uninstall the extension.
- **Data Deletion:** You can delete all extension data at any time by uninstalling Extension Hub via `chrome://extensions` or clearing browser extension storage.

---

## 7. Changes to This Policy

We may update this Privacy Policy to reflect changes in our features or compliance requirements. Any updates will be posted in this document and reflected with an updated revision date.

---

## 8. Contact & Support

If you have any questions, suggestions, or concerns regarding this Privacy Policy or Extension Hub, please contact:

- **Developer:** Shridhar Mishra
- **Email:** [shridmishra00@gmail.com](mailto:shridmishra00@gmail.com)
- **Repository & Issues:** [https://github.com/shridmishra/extension-hub](https://github.com/shridmishra/extension-hub)
