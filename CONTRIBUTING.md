# Contributing to Extensions Hub 🤝

Thank you for your interest in contributing to **Extensions Hub**! Extensions Hub is an open-source, modular micro-extension platform for Chromium browsers built with **Plasmo (Manifest V3)**, **React 18**, **TypeScript**, and **Tailwind CSS**.

We welcome contributions of all kinds: new micro-extensions, performance optimizations, bug fixes, accessibility improvements, and documentation updates.

---

## 📋 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [Getting Started](#-getting-started)
3. [How to Create a New Micro-Extension](#-how-to-create-a-new-micro-extension)
4. [Architecture & Design System Rules](#-architecture--design-system-rules)
5. [Testing & Quality Assurance](#-testing--quality-assurance)
6. [Git Commit & Branch Conventions](#-git-commit--branch-conventions)
7. [Submitting a Pull Request](#-submitting-a-pull-request)

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and collaborative in all issues, pull requests, and discussions.

---

## 🚀 Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/YOUR_USERNAME/extensions-hub.git
cd extensions-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Load the Extension into Chromium Browser (Chrome / Brave / Edge / Arc)
1. Open your browser and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the directory: `extensions-hub/build/chrome-mv3-dev`.
5. Pin **Extensions Hub** in your browser toolbar.

---

## 🛠️ How to Create a New Micro-Extension

We provide a built-in scaffolding CLI tool that creates all necessary files, types, unit tests, and registers your extension automatically in seconds.

### Step 1: Run the Scaffolding CLI
```bash
npm run create:extension
```
Or pass CLI flags directly:
```bash
npm run create:extension -- --name "JSON Formatter" --type interactive --category "Developer" --icon "Code"
```

### Step 2: Understand Extension Types

Extension Hub supports two primary architectural extension types:

| Type | Description | File Location | Example |
| :--- | :--- | :--- | :--- |
| **`interactive`** | On-page DOM inspector, element picker, or floating tool that triggers on user request. Operates with **mutual exclusion** (activating one tool auto-dismisses other active tools). | `src/contents/<id>.tsx` | Font Finder, Color Picker, CSS Picker |
| **`background`** | Site-wide rules, redirectors, styling overrides, or automation rules that can be toggled on/off globally or per-site. | `src/contents/<id>.ts` | YT Music Switcher, Dark Mode Forcer |

### Step 3: Implement Your Feature Logic

- **Interactive Extensions** (`src/contents/<id>.tsx`):
  - Injected as a React content script with Shadow DOM style isolation.
  - Listens to activation messages from the popup or storage events.
  - Automatically respects mutual exclusion via `activateInteractiveTool(id)`.
- **Background / Content Rule Extensions** (`src/contents/<id>.ts`):
  - Watches `hub_background_enabled` storage state.
  - Applies DOM transformations or redirect rules cleanly when enabled, and removes them when disabled.
- **Custom Modals / Hub Settings** (`src/components/extensions/`):
  - If your extension has custom settings, build its modal under `src/components/extensions/<Name>Modal.tsx`.

### Step 4: Verify Registry Metadata (`src/lib/registry.ts`)

Ensure your extension entry in `src/lib/registry.ts` has:
- A unique, sequential positive `number`
- A unique lowercase kebab-case `id`
- Valid `category` (`Typography`, `Color & Design`, `Accessibility`, `Developer`, `Utility`)
- Meaningful `tags` for search indexing
- A valid Lucide icon name matching `src/components/hub/ExtensionIcon.tsx`
- `isImplemented: true`

---

## 🎨 Architecture & Design System Rules

To maintain high visual quality, consistency, and stability, all contributions MUST adhere to these strict rules:

### 1. 🚫 NEVER Use Sparkle or Generative AI Star Icons
- Do **NOT** use `Sparkles`, `Sparkle`, `Stars`, `WandSparkles`, `AutoAwesome`, or any 4-point/multi-point generative star icons anywhere in the UI or assets.
- Use clear, utilitarian icons representing the actual feature (e.g., `Type`, `Pipette`, `Code`, `Layers`, `Moon`, `Ruler`, `Music`).

### 2. 🧩 Always Use Project UI Components (Never Use Raw Native HTML Elements)
- Always import and use components from `src/components/ui/`:
  - `<Button>` instead of `<button>`
  - `<IconButton>` for icon-only action buttons
  - `<Input>` instead of `<input>`
  - `<Badge>` for status labels and tags
  - `<Switch>` for toggle switches
  - `<Modal>` for dialog overlays
  - `<Tabs>` for segmented controls
  - `<EmptyState>` for empty query states
- If a UI component needs styling adjustments or new variants, pass `className` overrides or extend the component in `src/components/ui/`.

### 3. 🎨 Never Hardcode Colors in Components
- Never use hardcoded hex values (`#1e293b`), rgb values, inline color styles, or arbitrary Tailwind values (`bg-[#xxx]`) directly inside components.
- Use semantic CSS variables and design tokens defined in `src/style.css` and Tailwind classes (`bg-white dark:bg-[#09090b]`, `text-neutral-900 dark:text-neutral-100`, `border-neutral-200 dark:border-neutral-800`).

### 4. 🔒 Respect Interactive Mutual Exclusion
- Interactive tools that inspect or overlay the DOM must participate in mutual exclusion so users don't have multiple overlapping pickers active simultaneously.
- Register your storage key in `INTERACTIVE_TOOLS` in `src/lib/storage.ts`.

---

## 🧪 Testing & Quality Assurance

Every submission must pass all automated validation checks before merging. We do not accept broken, untested, or non-functional extensions.

### Run Unit Tests
```bash
npm test
```

### Run Full Pre-PR Validation (Tests + Production Build)
```bash
npm run validate
```

### What the Test Suite Checks:
1. **Registry Schema & Integrity** (`tests/registry.test.ts`):
   - Validates unique IDs, sequential numbers, allowed categories, and valid metadata.
2. **Implementation Completeness** (`tests/extensions-completeness.test.ts`):
   - Ensures all extensions marked `isImplemented: true` have working content scripts.
3. **Design System & Linter Guard** (`tests/design-lint.test.ts`):
   - Scans codebase for forbidden sparkle icons and validates UI component exports.
4. **Hub Store & Catalog Filtering** (`tests/hub-store.test.ts`):
   - Tests search queries, category filters, and sorting algorithms.
5. **Color & Design Token Detector** (`tests/color-detector.test.ts`):
   - Enforces color parsing rules and palette integrity.

---

## 🌿 Git Commit & Branch Conventions

### Branch Naming
- Features: `feat/extension-name` (e.g. `feat/json-formatter`)
- Bug Fixes: `fix/popup-overflow`
- Documentation: `docs/readme-updates`

### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat(extension-id): add json formatter micro-extension`
- `fix(yt-music): resolve timestamp resume issue on live streams`
- `docs: update contributor setup instructions`
- `test(registry): add test coverage for new categories`

---

## 📤 Submitting a Pull Request

1. Push your branch to your forked repository:
   ```bash
   git push origin feat/my-extension
   ```
2. Open a Pull Request against `main` on the upstream repository.
3. Fill out the provided **Pull Request Template**:
   - Provide a description of your micro-extension.
   - Attach **visual proof** (screenshot or screen recording) showing the extension working locally.
   - Complete the Contributor Checklist.
4. Maintainers will review your PR and provide feedback or merge once all checks pass!
