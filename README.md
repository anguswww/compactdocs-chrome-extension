# CompactDocs

Tile Google Docs to the left of your screen and work alongside another window. CompactDocs makes the narrow Docs window more usable by reclaiming sidebar space and fitting the page to the available width. Tile the browser using your operating system’s window controls; the extension adjusts the Docs layout inside it.

- Collapses document tabs using Docs’ native control when a document opens.
- Collapses the right Workspace panel through its native control and removes its outer rail.
- Removes the collapsed document-tabs gutter, keeping the page, caret, and ruler aligned.
- Fits the page to the reclaimed width by default; manual numeric zoom changes pause automatic fitting until reload.
- Offers independent switches in the toolbar popup, saved locally.
- No network requests, analytics, runtime dependencies, or document-content collection.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Reload any open Google Docs documents. Pin CompactDocs to access its settings.

Hover over the left edge of the window to reveal the full document-tabs panel, or the right edge of the window to reveal the Google side panel. The panels overlay the document and dismiss when you leave them. You can also use Tab/click to open and Escape to close. You can still reopen tabs through Google Docs’ View menu; the extension collapses them only once per page load. Turn off the right-panel setting in the popup to restore access to Calendar, Keep, and other panel apps.

## Scope and limitations

Targets `https://docs.google.com/document/d/*`. The collapse control is detected by its English accessible label; other interface languages may need additional labels. Google can change its internal class names, so sidebar selectors may need updates. Version 1.1 was verified in a signed-in Google Docs session in Helium: native panel collapse, removal of the 73px tabs gutter and 56px right rail, ruler alignment, and fit-to-window zoom. The optional fit setting changes only local view zoom. It does not change page size or document content. Pageless documents retain their native zoom.

## Development

After editing compact.css, run `node build-styles.mjs` to refresh the embedded styles. Run `node --test tests/*.test.cjs`, `node --check content.js`, and `node --check popup.js`, then reload the unpacked extension. In Docs, check initial collapse, manual reopening, right-panel removal, all popup settings, and narrow window resizing.


## Why 1.1 saves more space

Version 1.0 hid inner controls but left the outer right rail reserving width. Docs also retains a collapsed tabs gutter in its canvas layout. Version 1.1 activates the native collapse controls, offsets and expands the scroll viewport with its overlays together, and compensates for Docs’ built-in Fit calculation with a local numeric zoom. The sidebar widths are read from Docs’ own layout and updated on resize.

## Version 1.1.1

Layout styles are embedded with the content script and restored if removed from the page. This avoids a script running without its matching layout rules. Documents opening with a saved Fit zoom are normalized to a known view scale before fitting. Regression tests cover style restoration, Fit startup, manual zoom, and manifest script order. Both reported document layouts were checked in Helium without editing document content.

## Version 1.2.1

Pageless mode preserves native zoom while reclaiming the collapsed tabs gutter. For the widest pageless layout, choose View → Text width → Full; this is a native view preference. Manual zoom choices persist across a switch between pageless and pages. See [TESTING.md](TESTING.md) for live checks, remaining limitations, and the six regression tests.


## Version 1.3.0

The compact-sidebar switches now enable hover overlays: the left edge reveals the full native tabs/outline panel and the right edge reveals the native app rail and selected app. Fixed overlays and a stable editor viewport keep document position and zoom unchanged. Small edge buttons support hover, click, keyboard focus, and Escape. The extension keeps the native panels collapsed for layout purposes and never forces the Google Docs text-width preference.


## Version 1.4.0 release candidate

Replaces the protruding edge buttons with invisible hover targets along the full height of both window edges. A short hover delay avoids accidental reveals. Panels fade in and out, with reduced-motion support. The document tabs surface uses a translucent background that becomes more opaque on hover or keyboard focus. Text stays fully opaque. Keyboard focus shows an outline so the invisible targets remain accessible. The popup now has shorter labels and clearer descriptions.

Run `npm run package` to regenerate styles, run the tests and syntax checks, and create `dist/compactdocs-1.4.0.zip`. This uses Node.js and the system `zip` command. The package contains only the manifest, runtime scripts, popup and PNG icons. It excludes tests and store drafts.

Store copy is in [store/LISTING.md](store/LISTING.md). The privacy policy includes the support contact and still needs public hosting. See [store/SCREENSHOTS.md](store/SCREENSHOTS.md) for screenshot provenance. This candidate still needs final installed-package checks in Chrome before submission.
