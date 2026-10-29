# Verification — 2026-10-29

Tested in Helium with signed-in Google Docs. Document text was not edited. The TL;DR document was left in pageless mode at 100% zoom, with all CompactDocs options enabled. Temporary viewport overrides were reset and the preview test tab was closed.

## Live checks

- Pages → pageless → pages → pageless: layout follows the mode. Manual zoom is preserved. Follow-up 1.2.1 verifies pageless content/ruler coordinates and removes its retained collapsed-tabs gutter.
- Pageless reload: native 100% zoom is preserved and both sidebar controls remain hidden.
- Viewports 640px and 1400px: pageless text reflows; paged auto-fit responds to resizing. The initial pageless implementation showed 14px overflow at 640px. After the 1.2.1 gutter fix with Full text width, the narrow screenshot had no visible horizontal scrollbar. No extra sidebar gutter was present.
- Manual 75% zoom followed by resizing: preserved.
- Manual 75% in pageless followed by switching to pages: preserved after fixing zoom tracking across modes.
- Reopen tabs via View: sidebar remains open until manually collapsed.
- Switch between the two existing document tabs: navigation works; collapse still works.
- Extension popup: each setting can be toggled independently; disabling the right-panel setting restores its toggle; disabling tabs compaction restores its button. Settings restored afterward.
- Preview-only URL without a zoom toolbar: rendered normally and scripts safely skip unavailable controls.
- Earlier paged document: auto-fit and sidebar removal checked again.

## Automated checks

Run `node --test tests/regression.test.cjs` (six tests): lost-style restoration, saved Fit startup, manual zoom, manifest script order, pageless with a stale page canvas, absent editor controls, and manual pageless zoom across a mode switch. Some tests cover multiple related assertions.

Run `node build-styles.mjs` after changing compact.css. Run syntax checks with `node --check content.js`, `node --check styles.js`, and `node --check popup.js`.

## Still unverified

Non-English interfaces and RTL, browser-level zoom, wide tables/images, comments/revision-history sidebars, printing, and offline reconnect. Current native-control labels target English. Those cases need dedicated documents or sessions before claiming support.

## Follow-up: pageless left space

Selected native View → Text width → Full on the TL;DR document. The previous pageless exception left a 73px collapsed-tabs offset. Removed that exception and checked that content and horizontal ruler share x=0 at a narrow viewport, while text retains Docs’ normal padding. Verified reload and narrow reflow, then reset the viewport override. Native text width is a user view preference; the extension does not force it on other documents.

## Version 1.3.0 hover overlays

Checked native full tabs list and tab selection in the overlay; switching tabs can dismiss the overlay when Docs focuses the editor. Checked Keep opening and mouse exit auto-hide, Escape, and paged/pageless document geometry before/after opening overlays. The editor width, content x position and zoom remained identical after native layout initialization. The native app panel can remain mounted while hidden, avoiding unnecessary app reloads. A temporary duplicate paged test tab was closed. No text or text-width setting was changed.

Run `node --test tests/*.test.cjs` for nine tests including mouse transitions, delayed closing, keyboard access, Escape, and disabling hover access.
