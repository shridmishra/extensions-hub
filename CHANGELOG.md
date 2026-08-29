# Changelog 📝

All notable changes to **Extension Hub** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-29

### Added
- **Open-Source Contribution Framework**:
  - Interactive scaffolding CLI generator (`scripts/create-extension.mjs` via `npm run create:extension`).
  - Starter templates for interactive (`templates/interactive-extension.template.tsx`) and background (`templates/background-extension.template.ts`) extensions.
  - Automated test suites:
    - `tests/registry.test.ts` (schema and metadata integrity)
    - `tests/extensions-completeness.test.ts` (content script existence check)
    - `tests/design-lint.test.ts` (anti-pattern detection: no sparkle icons, valid UI components)
    - `tests/hub-store.test.ts` (filtering & sorting logic)
    - `tests/color-detector.test.ts` (color parsing & token enforcement)
  - GitHub community templates (`.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`).
  - Comprehensive documentation (`CONTRIBUTING.md`, `ARCHITECTURE.md`, `VERSIONING.md`).
- **YouTube to YT Music Redirector**:
  - Integrated timeline switch button directly into YouTube video player controls with timestamp preservation and playlist sync.
- **Pure Filter & Sort Utilities**:
  - Modularized catalog filtering and search algorithm into pure functions in `src/lib/registry.ts`.

### Changed
- Streamlined `package.json` scripts with `npm test`, `npm run validate`, and `npm run create:extension`.
- Improved catalog status tracking with explicit `isImplemented` metadata.

---

## [1.0.0] - 2026-08-15

### Added
- **Initial Core Release of Extension Hub**:
  - Plasmo Manifest V3 modular architecture.
  - Minimalist monochrome design system with dark and light theme support.
  - Dynamic 2-column square tiles grid with pin/unpin customization.
  - Full catalog discovery modal with keyword search and category filters.
  - **Font Finder Inspector** (`#01`): Typography inspector with CSS copying and Google Fonts direct links.
  - **Pixel Color Picker & Palette** (`#02`): EyeDropper API integration with HEX/RGB/HSL conversion and color history.
  - **CSS Style & Tailwind Inspector** (`#03`): DOM style extractor and Tailwind converter.
  - **HTML to Figma Importer** (`#04`): Multi-layer vector capture and canvas clipboard integration.
  - **Smart Dark/Light Mode Forcer** (`#05`): Inverted theme engine with media protection.
