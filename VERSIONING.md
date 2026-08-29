# Versioning & Release Guidelines 🏷️

Extensions Hub strictly adheres to [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH`) for repository releases and Chrome Web Store deployments.

---

## 📌 Version Format

Versions follow the format:

$$\text{MAJOR}.\text{MINOR}.\text{PATCH}$$

- **MAJOR** version when making incompatible architecture changes, breaking storage migrations, or major platform redesigns.
- **MINOR** version when adding a new micro-extension, introducing new categories, or adding backwards-compatible functionality to core subsystems.
- **PATCH** version when making backwards-compatible bug fixes, UI styling polish, accessibility tweaks, or performance optimizations.

---

## 🌐 Chrome Web Store & Manifest V3 Rules

Chrome Web Store requires extension version strings in `package.json` / `manifest.json` to follow these constraints:
1. Composed of 1 to 4 dot-separated integers (e.g. `1.1.0` or `1.1.0.1`).
2. Each integer must be between $0$ and $65,535$.
3. New releases submitted to the Chrome Web Store must have a strictly greater version number than the currently published release.

---

## 🔢 Micro-Extension Catalog Numbers vs Hub Version

- **Hub Version (`package.json`)**: Tracks the release version of the entire extension suite (e.g., `v1.1.0`).
- **Extension Number (`src/lib/registry.ts`)**: Every micro-extension has a permanent, sequential integer identifier (`#01`, `#02`, `#03`...). Catalog numbers are immutable once assigned and do NOT change across version bumps.

---

## 🚀 Release Workflow

1. **Update `package.json`**:
   ```json
   {
     "version": "1.2.0"
   }
   ```
2. **Update `CHANGELOG.md`**:
   Document all changes under the new version header with the release date.
3. **Run Validation Suite**:
   ```bash
   npm run validate
   ```
4. **Create Git Tag**:
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0: Added JSON Formatter micro-extension"
   git push origin v1.2.0
   ```
5. **Package for Chrome Web Store**:
   ```bash
   npm run package
   ```
   The production zip bundle will be generated in the `build/` directory ready for deployment.
