## Description

Please describe the changes in this pull request and specify the micro-extension being added or updated.

- **Extension Name**: <!-- e.g., Font Finder Inspector -->
- **Extension ID**: <!-- e.g., font-finder -->
- **Extension Type**: [ ] `interactive` (DOM overlay/picker)  |  [ ] `background` (site rules / toggleable)
- **Category**: [ ] Typography | [ ] Color & Design | [ ] Accessibility | [ ] Developer | [ ] Utility

---

## What does this extension / change do?

<!-- Provide a concise description of functionality and user value -->

---

## Local Verification & Visual Proof

> **Note**: PRs adding new micro-extensions or UI features MUST include screenshots or a brief screen recording.

- [ ] Loaded unpacked extension in Chrome / Brave (`build/chrome-mv3-dev`)
- [ ] Tested Popup UI (cards, search, filter, pin/unpin)
- [ ] Tested on-page behavior on real websites
- [ ] Confirmed mutual exclusion works (opening tool closes any other active interactive tool)

### Screenshots / Screen Recording:
<!-- Attach screenshot or screen recording here -->

---

## Contributor Quality Checklist

- [ ] Code passes all tests: `npm test`
- [ ] Full validation build passes: `npm run validate`
- [ ] Follows Design System:
  - [ ] No hardcoded colors (uses CSS variables & design tokens from `style.css` / Tailwind)
  - [ ] Uses existing UI library components (`src/components/ui/`) instead of raw native unstyled elements
  - [ ] **NO sparkle or generative AI star icons** used anywhere in the UI
- [ ] Added / updated unit tests in `tests/`
- [ ] Correctly registered in `src/lib/registry.ts` with metadata, tags, and valid Lucide icon
