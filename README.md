# CompactDocs

A small Chrome Manifest V3 extension for more Google Docs editing room, especially in a tiled window.

- Collapses document tabs using Docs’ native control when a document opens.
- Hides the right Workspace app rail and its show/hide side-panel tab.
- Offers independent switches in the toolbar popup, saved locally.
- No network requests, analytics, build tools, or document-content collection.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Reload any open Google Docs documents. Pin CompactDocs to access its settings.

You can reopen document tabs using Google Docs’ own control; the extension collapses them only once per page load. Turn off the right-panel setting in the popup to restore access to Calendar, Keep, and other panel apps.

## Scope and limitations

Targets `https://docs.google.com/document/d/*`. The collapse control is detected by its English accessible label; other interface languages may need additional labels. Google can change its internal class names, so sidebar selectors may need updates. JavaScript syntax and extension packaging have been checked; the extension has not yet been verified in a signed-in Google Docs session. It does not change document zoom, page size, or document content.

## Development

No build step. Run `node --check content.js` and `node --check popup.js`, then reload the unpacked extension. In Docs, check initial collapse, manual reopening, right-panel removal, both popup settings, and narrow window resizing.
