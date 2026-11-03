# Verification history

These notes record earlier checks, starting on 2026-10-29. Numeric zoom results and test counts describe the builds checked at the time, not verification of the current native Fit implementation. Run the current checks and test the final package before release.

## Follow-up: collapsed gutter and pointer coordinates (2026-11-02)

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
- Viewports 640px and 1400px: pageless text reflows. Paged auto-fit responds to resizing. The initial pageless implementation showed 14px overflow at 640px. After the 1.2.1 gutter fix with Full text width, the narrow screenshot had no visible horizontal scrollbar. No extra sidebar gutter was present.
- Manual 75% zoom followed by resizing: preserved.
- Manual 75% in pageless followed by switching to pages: preserved after fixing zoom tracking across modes.
- Reopen tabs via View: sidebar remains open until manually collapsed.
- Switch between the two existing document tabs: navigation works. Collapse still works.
- Extension popup: each setting can be toggled independently. Disabling the right-panel setting restores its toggle. Disabling tabs compaction restores its button. Settings restored afterward.
- Preview-only URL without a zoom toolbar: rendered normally and scripts safely skip unavailable controls.
- Earlier paged document: auto-fit and sidebar removal checked again.

## Automated checks

Run `node --test tests/regression.test.cjs` (six tests): lost-style restoration, saved Fit startup, manual zoom, manifest script order, pageless with a stale page canvas, absent editor controls, and manual pageless zoom across a mode switch. Some tests cover multiple related assertions.

Run `node build-styles.mjs` after changing compact.css. Run syntax checks with `node --check content.js`, `node --check styles.js`, and `node --check popup.js`.

## Still unverified

Non-English interfaces and RTL, browser-level zoom, wide tables/images, comments/revision-history sidebars, printing, and offline reconnect. Current native-control labels target English. Those cases need dedicated documents or sessions before claiming support.

## Follow-up: pageless left space

Selected native View → Text width → Full on the TL;DR document. The previous pageless exception left a 73px collapsed-tabs offset. Removed that exception and checked that content and horizontal ruler share x=0 at a narrow viewport, while text retains Docs’ normal padding. Verified reload and narrow reflow, then reset the viewport override. Native text width is a user view preference. The extension does not force it on other documents.

## Version 1.3.0 hover overlays

Checked native full tabs list and tab selection in the overlay. Switching tabs can dismiss the overlay when Docs focuses the editor. Checked Keep opening and mouse exit auto-hide, Escape, and paged/pageless document geometry before/after opening overlays. The editor width, content x position and zoom remained identical after native layout initialization. The native app panel can remain mounted while hidden, avoiding unnecessary app reloads. A temporary duplicate paged test tab was closed. No text or text-width setting was changed.

Run `node --test tests/*.test.cjs` for nine tests including mouse transitions, delayed closing, keyboard access, Escape, and disabling hover access.


## Version 1.4.0 release candidate

Automated checks cover delayed hover opening, cancellation on short edge passes, panel transitions, keyboard and Escape access, disabling a pending reveal, browser exit, and focus inside an embedded app. The existing zoom and style-restoration checks also pass. `npm run package` runs the current test suite plus JavaScript syntax checks and creates an allowlisted release ZIP.

The final source was run on the user-approved live Google Docs document in the browser preview, with a local settings shim. The compact editor, tabs overlay and right rail were captured and visually inspected. Page and ruler alignment remained consistent. Upper and lower edge targets opened the intended panels on both sides. These checks do not verify installation, permissions or storage in the packaged extension. Do not treat the old 1.3.0 live results as verification of the 1.4.0 package.

Before submission, verify invisible full-height edge targets at the top, middle and bottom of both edges, keyboard focus outlines, edge-to-panel movement, readable tabs over dense document text, both fade directions, native menus, Keep iframe interaction, keyboard focus, reduced motion, print preview, and unchanged document geometry in paged and pageless mode. Check the popup and all settings from the packaged build.

## Version 1.4.1 native Fit

Automatic fitting now switches paged documents to Google Docs' native Fit zoom in windows up to 960px wide, instead of computing a percentage. Live signed-in captures in `review/` and measurements in `review/fit-live.json` record eight cases, all without editing document text:

- Wide start (1400px): zoom stayed 100% and the page bounds were unchanged.
- Automatic fit: resizing to 780px and then 620px switched the zoom to Fit and the page filled the available width at both sizes.
- Leaving the narrow window: widening back to 1400px restored the previous 100% zoom.
- User Fit in a wide window: then narrowing to 780px, the user-selected Fit was preserved rather than being treated as automatic, and an edit to the zoom field was left alone.
- Manual 75% at 620px: preserved and followed by no later override.

The suite had grown to 33 tests; they cover startup storage races, wide-window zoom ownership, native Fit selection, restoring the replaced zoom, making user Fit manual on trusted interactions, synthetic Enter retaining ownership, no blurring of the zoom field mid-edit, deferred restoration, sidebar changes not resetting manual zoom, and hover teardown after editor removal. All pass, along with syntax checks, and `npm run package` builds the allowlisted ZIP. This verifies source behavior with a local settings shim; it does not verify packaged installation or `chrome.storage` integration. Preview test tabs were closed afterwards.

## Version 1.4.2 stale Fit layout (2026-11-03)

Reproduced a stale native Fit size on the user-provided public paged document at 812 px: page bounds x=20.18 to 703.18, leaving an extra collapsed-tabs gutter on the right. A real browser resize corrected it, whereas synthetic window resize and reselecting Fit did not invalidate Docs' cached layout.

Added a small bundled MAIN-world bridge that coalesces layout-change notifications into one animation frame and invokes Docs' existing `KX_resize` entry point. It carries no data, reads no document content and leaves zoom ownership and the canvas/ruler coordinate origin unchanged. Missing or not-yet-initialized Docs is tolerated with bounded retries. No new permissions were added. If Google removes that entry point, the bridge safely stops refreshing; normal browser resizing remains available.

On a fresh reload with final source and a local settings shim, native Fit now produces page bounds x=20.62 to 775.62 at 812 px without resizing. At 780 px the bounds are x=20.43 to 743.93 and remain identical while the native tabs overlay is open. At 620 px the page is x=19.46 to 584.96, without horizontal editor overflow. Manual 75% remains 75% after resizing from 780 to 640 px. A click at x=300, y=420 places the caret at x=300, y=418. No document text or page settings were changed.

`npm run package` passes all 37 tests, syntax checks and ZIP allowlist validation. Added bridge checks cover coalescing, loading failures, bounded retries, editor teardown and avoiding mutation feedback loops. The final release ZIP was extracted and loaded in a temporary Helium profile and passes an intercepted offline Docs-domain fixture: isolated CSS and settings remain isolated, MAIN receives the resize request and sees the recovered editor width, and all three actual popup switches save and restore. Run with `uv run --with playwright python scripts/verify-runtime.py --archive dist/compactdocs-1.4.2.zip`; set `COMPACTDOCS_BROWSER` to a compatible Chromium binary if needed.

The live Docs checks verify final source; the installed-extension check uses a fixture. Packaged installation on signed-in live Docs, Workspace apps, printing and live pageless mode remain manual checks. The existing automated zoom, pageless, hover and popup coverage passes.
