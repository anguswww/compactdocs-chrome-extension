# Verification — 2026-10-29

## Follow-up — 2026-11-02: collapsed gutter and pointer coordinates

The initial editor-only correction failed in live Docs: it retained the internal
73px rail inset at `left: 0`. Moving only the editor left instead made clicks
land 73px left of the pointer. The synthetic fixture did not catch this because
Docs uses the ancestor appview as its pointer coordinate origin.

The final correction offsets and expands `#kix-appview`, keeping its editor,
ruler, canvases and carets together. Gutter-width tracking remains in use.
Verified the two user-provided paged and pageless documents in preview using the
final CSS and local source scripts with a settings shim. At an 800px viewport,
a click at x=300 placed the caret at x=301 in pageless and x=298 in pages
(character snapping), instead of x=226 with the editor-only correction. No text
was typed or document formatting changed.

Checked final CSS at 640px: pageless stays at 100% and reflows, paged auto-fit
selects 74% with page bounds x=19.7 to 607.7, and neither editor has horizontal
overflow. Both retain identical editor geometry while the tabs overlay is open.
At 800px the paged page fits at 94%, with bounds x=20.7 to 767.2. Docs' native
text padding and printed page margins remain. Build, all 13 tests, and syntax
checks pass. This verifies source behavior, not packaged extension installation
or chrome.storage integration. Preview test tabs were closed afterward.

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


## Version 1.4.0 release candidate

Automated checks cover delayed hover opening, cancellation on short edge passes, panel transitions, keyboard and Escape access, disabling a pending reveal, browser exit, and focus inside an embedded app. The existing zoom and style-restoration checks also pass. `npm run package` runs all 13 tests plus JavaScript syntax checks and creates an allowlisted release ZIP.

The final source was run on the user-approved live Google Docs document in the browser preview, with a local settings shim. The compact editor, tabs overlay and right rail were captured and visually inspected. Page and ruler alignment remained consistent. Upper and lower edge targets opened the intended panels on both sides. These checks do not verify installation, permissions or storage in the packaged extension. Do not treat the old 1.3.0 live results as verification of the 1.4.0 package.

Before submission, verify invisible full-height edge targets at the top, middle and bottom of both edges, keyboard focus outlines, edge-to-panel movement, readable tabs over dense document text, both fade directions, native menus, Keep iframe interaction, keyboard focus, reduced motion, print preview, and unchanged document geometry in paged and pageless mode. Check the popup and all settings from the packaged build.
