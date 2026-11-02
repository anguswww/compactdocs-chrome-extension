# Screenshot provenance

The existing images do not show the intended left-tiled workflow and should be replaced before publication. Capture a sharp desktop view with Google Docs tiled on the left and another window on the right, then capture relevant panel and settings details at a legible size. Do not upscale these existing images as a substitute for a higher-resolution capture.

The first three 1280 × 800 PNGs in `screenshots/` show the user-approved Google Docs document in a browser preview with no browser chrome. The document text and Google account avatar are visible. The user approved this document for public screenshots. The right panel capture shows the app rail and does not open Keep or display its contents.

The preview profile did not have CompactDocs installed. For these captures, the final 1.4.0 `styles.js`, `hover.js`, and `content.js` were executed directly in the live document page with a minimal local storage shim supplying the extension's default settings. This is a source-injected demonstration, not a test of the packaged extension or its permissions. It leaves the document content unchanged and is cleared on page reload.

- `01-compact-editor.png`: compact editor with panels closed.
- `02-document-tabs.png`: tabs revealed from the left edge.
- `03-side-panel.png`: app rail revealed from the right edge.

The page and ruler stay aligned across the three captures. The document was temporarily set to 100% zoom for capture and the preview zoom was restored afterward.

`04-settings.png` renders the final `popup.html` markup and CSS in a blank preview tab with the actual icon embedded as a data URL. The default checkboxes were set to checked without running `popup.js`. A neutral background, shadow, and 1.3× scale were added for presentation. It is a source-rendered illustration, not an installed extension popup capture. Review all images at full size before uploading.

`demo.html` is a separate synthetic development fixture. It uses sample text and a simplified page, and loads the extension CSS and hover script. It is not Google Docs and was not used for the screenshots.
