# Extension Hub 🚀

An all-in-one modular micro-extension suite for Chromium browsers, built with **Plasmo (Manifest V3)**, **React 18**, **TypeScript**, and **Tailwind CSS**.

Extension Hub allows users to keep their favorite tools directly in the popup, toggle background extensions, and discover new tools from a rich catalog.

---

## 🛠️ Built-in Micro-Extensions

1. **Font Finder Inspector (Interactive Tool)**
   - Hover over any element to see font-family, font-size, font-weight, and line-height.
   - Click to lock the inspector, test typography in real-time, and copy CSS / Tailwind snippets.
   - Direct link to Google Fonts for any discovered font.

2. **Pixel Color Picker & Palette (Interactive Tool)**
   - EyeDropper API integration to pick any pixel color from the screen.
   - Automatically copies HEX code to clipboard.
   - Saves color history with HEX, RGB, and HSL conversions.

3. **Smart Website Dark/Light Mode Forcer (Always-Enabled Background Tool)**
   - Smart inverted filter for any website with high contrast.
   - Media protection: keeps images, videos, canvas, and graphics looking natural.
   - Easily toggled globally or per-site.

4. **Extensible Catalog (Scale to 100+ extensions)**
   - Search across all tools with keyword filtering.
   - Sort by:
     - **Number-wise** (`#01`, `#02`, `#03`...)
     - **Most Starred**
     - **Most Liked**
     - **A–Z Alphabetical**
   - Pin or unpin any extension to customize the main popup view.

---

## 🎨 Design System

- **Monochrome Theme**: Pure black-and-white minimalist design with dark & light modes.
- **Typography**: Satoshi font with Google Sans fallback and SF Mono for metrics.
- **Design Tokens**: Defined in `src/style.css` using CSS custom properties.
- **UI Components**: Fully custom `Button`, `IconButton`, `Input`, `Badge`, `Switch`, `Tabs`, `Modal`, `EmptyState`, `Tooltip`.

---

## 📦 Getting Started

### Development
```bash
npm install
npm run dev
```

Load the unpacked extension in Chrome from `build/chrome-mv3-dev`.

### Production Build
```bash
npm run build
```

The production-ready extension will be built to `build/chrome-mv3-prod`.
