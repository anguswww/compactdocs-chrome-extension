# CompactDocs

A small Chrome Manifest V3 extension for more Google Docs editing room, especially in a tiled window.

- Collapses document tabs using Docs’ native control when a document opens.
- Collapses the right Workspace panel through its native control and removes its outer rail.
- Removes the collapsed document-tabs gutter, keeping the page, caret, and ruler aligned.
- Fits the page to the reclaimed width by default; manual numeric zoom changes pause automatic fitting until reload.
- Offers independent switches in the toolbar popup, saved locally.
- No network requests, analytics, build tools, or document-content collection.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Reload any open Google Docs documents. Pin CompactDocs to access its settings.

You can reopen document tabs through Google Docs’ View menu; the extension collapses them only once per page load. Turn off the right-panel setting in the popup to restore access to Calendar, Keep, and other panel apps.

## Scope and limitations

Targets `https://docs.google.com/document/d/*`. The collapse control is detected by its English accessible label; other interface languages may need additional labels. Google can change its internal class names, so sidebar selectors may need updates. Version 1.1 was verified in a signed-in Google Docs session in Helium: native panel collapse, removal of the 73px tabs gutter and 56px right rail, ruler alignment, and fit-to-window zoom. The optional fit setting changes only local view zoom. It does not change page size or document content. Pageless documents retain their native zoom.

## Development

After editing compact.css, run `node build-styles.mjs` to refresh the embedded styles. Run `node --test tests/regression.test.cjs`, `node --check content.js`, and `node --check popup.js`, then reload the unpacked extension. In Docs, check initial collapse, manual reopening, right-panel removal, all popup settings, and narrow window resizing.


## Why 1.1 saves more space

Version 1.0 hid inner controls but left the outer right rail reserving width. Docs also retains a collapsed tabs gutter in its canvas layout. Version 1.1 activates the native collapse controls, offsets and expands the scroll viewport with its overlays together, and compensates for Docs’ built-in Fit calculation with a local numeric zoom. The sidebar widths are read from Docs’ own layout and updated on resize.

## Version 1.1.1

Layout styles are embedded with the content script and restored if removed from the page. This avoids a script running without its matching layout rules. Documents opening with a saved Fit zoom are normalized to a known view scale before fitting. Regression tests cover style restoration, Fit startup, manual zoom, and manifest script order. Both reported document layouts were checked in Helium without editing document content.

## Version 1.2.0

Pageless mode keeps its native scroll viewport and zoom rather than applying the paged-layout offset. Manual zoom choices persist across a switch between pageless and pages. See [TESTING.md](TESTING.md) for live checks, remaining limitations, and the six regression tests.
