# Extension Hub - Agent Guidelines & Rules

This document outlines mandatory coding conventions, UI/UX guidelines, and architectural standards for AI agents working in this repository.

---

## 1. UI Microcopy & Subtext Rules (High Priority)

### Minimal & High-Signal Microcopy
- **Eliminate Redundant Subtext**: Do **not** add secondary helper subtext or descriptions when the main title, toggle label, or button text is already self-explanatory (e.g., "Open in New Tab", "Preserve Timestamp", "Auto-Pause YouTube", "Player Timeline Button", "Smart Dark Mode").
- **Avoid Worthless Rephrasing**: Never use subtexts that simply repeat the heading in different words (e.g., heading: *"Auto-Pause YouTube"*, subtext: *"Pause current video before redirecting"*). In compact browser extension popups and modals, this creates visual clutter and wastes vertical space.
- **When Subtext IS Permitted**:
  1. **Non-obvious technical context**: When the behavior is genuinely ambiguous and cannot be conveyed by a concise title alone.
  2. **Dynamic live metrics & state**: E.g., dimensions (`1200 × 800 px`), element count (`14 nodes`), or active URL/hostname (`github.com`).
  3. **Input format instructions or error states**: Field constraints, format examples, or validation messages.
- **Reuse & Density**: Prioritize clean single-line rows, badges, or native tooltips for extra context rather than multi-line helper text.

---

## 2. Component & Styling Standards

### Always Use Project UI Components
- **Never use raw native HTML elements** (`<button>`, `<input>`, `<select>`, `<dialog>`) when a designated UI component exists in `src/components/ui/` (`Button`, `IconButton`, `Input`, `Switch`, `Badge`, `Modal`, `Tabs`, `Tooltip`, `EmptyState`).
- If an existing UI component lacks a specific visual variant or prop, update the component in `src/components/ui/` or pass Tailwind utility overrides via `className`—do not bypass the component library.

### Color Tokens & Global CSS
- **Never hardcode hex codes or raw color values** (e.g., `#1e293b`, `rgb(...)`, or arbitrary Tailwind classes like `bg-[#xxx]`) directly inside component files.
- Always use semantic design tokens and CSS variables configured in `globals.css` / Tailwind theme (e.g., `bg-neutral-50 dark:bg-neutral-900`, `text-neutral-900 dark:text-neutral-100`, `border-neutral-200 dark:border-neutral-800`).

### Iconography Rules
- **NO Sparkle / Generative Star Icons**: Never use sparkle icons, generative AI stars, or sparkle glyphs (e.g., `Sparkles`, `Sparkle`, `Stars`, `WandSparkles`, `AutoAwesome`) anywhere in the UI or assets.
- Use Lucide icons consistently (`lucide-react`) or dedicated SVG components from `src/components/icons/` / `src/components/ui/`.

### Typography, Font & Text Sizing Rules
- **NO Uppercase Fonts / Styling**: Never use `uppercase` Tailwind classes or `text-transform: uppercase` in UI components, buttons, or section headers. Use natural case (Sentence case or Title Case) rendered with Satoshi/sans-serif.
- **NO Monospaced Fonts on Letters**: Never use `font-mono` / monospaced fonts for regular alphabetic text, labels, titles, or descriptions.
- **Monospace Allowed for Numbers ONLY**: Monospaced font (`font-mono`) is strictly restricted to numeric metrics, dimensions (e.g., `1200 × 800`), font weights (e.g., `w700`), numeric counts (`#01`, `14`), percentages (`100%`), and hex color codes (`#FFFFFF`).
- **Minimum Text Size is 10px**: Never use text sizes below `10px` (e.g. `8px`, `9px`, `9.5px` are strictly forbidden).
- **Strict Even Increments Only**: All text sizes must strictly follow even pixel increments: `10px`, `12px` (`text-xs`), `14px` (`text-sm`), `16px` (`text-base`), `18px` (`text-lg`), `20px` (`text-xl`), `24px` (`text-2xl`), etc. Odd numbers (`11px`, `13px`, `15px`) and fractional sizes are forbidden.

### Extension Popups & Modal Sizing
- Extension popup viewport is standard `360px` width by `480px–520px` height.
- Modals should use `max-w-[340px]` to `max-w-[360px]` and constrain max height with internal scrolling (`hub-scrollbar` or `no-scrollbar`).
- Keep list rows compact with clean divider lines (`h-px bg-neutral-100 dark:bg-neutral-850`).

### Active Tool Banner & On-Page Overlays (`ActiveToolBanner`)
- **Always use `ActiveToolBanner`** (`src/components/ui/ActiveToolBanner`) for floating top active state indicators across all interactive on-page tools (Font Finder, Color Picker, Element Pickers, etc.).
- **Zero Brackets, Slashes, or Raw Dot Indicators**: Never format instructions inside parentheses `(...)` or slashes (`/`). Do not use raw bullet/pulse dots.
- **High-Signal Iconography**: Accompany tool titles and user instructions with clean Lucide icons (e.g., `Type`, `Pipette`, `MousePointer`).
- **Dedicated Exit Button**: Always include a proper clickable exit button with an `Esc` keycap badge and close icon rather than instructing users in plain text.
- **Props API**:
  ```tsx
  <ActiveToolBanner
    title="Font Finder"
    icon={<Type size={13} className="text-neutral-900 dark:text-neutral-100" />}
    instruction="Click element to inspect"
    instructionIcon={<MousePointer size={12} />}
    onClose={handleClose}
    isDarkMode={isDarkMode}
  />
  ```

### Floating Inspector Modals (`InspectorModal`)
- **Always use `InspectorModal`** (`src/components/ui/InspectorModal`) for bottom-right floating on-page inspector cards (Font Finder, CSS Inspector, Figma Picker, etc.).
- **No Redundant Footers**: Do NOT include footer text instructing users to press `Esc` or click elements in the modal; the top `ActiveToolBanner` already handles active status and instructions.
- **Compact Breadcrumb & Specs Header**: Use clean breadcrumbs (`<tag>`, dimensions, font name) separated by subtle bullet dots.
- **Props API**:
  ```tsx
  <InspectorModal
    icon={<CssIcon size={15} className="shrink-0" />}
    title="CSS & Tailwind"
    breadcrumbs={[
      { label: `<${styles.tagName.toLowerCase()}>`, isMono: false, isBold: false },
      { label: `${styles.dimensions.width} × ${styles.dimensions.height}`, isMono: true, isBold: false }
    ]}
    onClose={handleClose}
    isDarkMode={isDarkMode}
  >
    {/* Inspector Content */}
  </InspectorModal>
  ```

---

## 3. Architecture & State Management

- **Storage**: Use `ExtensionStorage` in `src/lib/storage.ts` for all Chrome Storage operations (`chrome.storage.sync` / `chrome.storage.local`).
- **Store**: Use Zustand store in `src/store/hub-store.ts` for global popup state (active tools, catalog modal, pinned items).
- **Interactive Tools Mutual Exclusion**: Only one interactive on-page tool (Figma layer picker, CSS inspector, Font finder, Color picker) can be active on a tab at any given time. Use `activateInteractiveTool(id)` before launching.
- **Messaging**: Always wrap `chrome.tabs.sendMessage` in catch handlers and fallback to scripting injection when necessary.

---

## 4. Verification & Testing

- Before completing tasks, verify TypeScript type compliance:
  ```bash
  npm run typecheck
  ```
- Run unit and integration tests:
  ```bash
  npm run test
  ```
