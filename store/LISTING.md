# Chrome Web Store listing

## Name
CompactDocs

## Short description (82 characters, matches the manifest description)
Make more room in Google Docs with compact side panels and optional page fitting.

## Detailed description
Tile Google Docs to the left and keep another window alongside it. CompactDocs gives your document more room in that narrow window by reducing sidebar clutter and fitting the page to the available width.

Tile your browser window using your operating system’s window controls. CompactDocs adapts the Docs layout inside it.

CompactDocs collapses the document tabs and right side panel to reclaim space. Hover anywhere along the left or right edge of the window to reveal the panels over your document. The edge targets stay invisible until focused with the keyboard. You can also click or focus an invisible edge target and press Escape to close the panel.

Choose which panels to compact and whether to fit the page to the available width. Your choices are saved locally. Page fitting uses Google Docs' native Fit mode in narrow windows. A manual numeric zoom change pauses automatic fitting. Pageless documents keep their native zoom.

CompactDocs runs on Google Docs document pages. It uses the page interface to adjust the layout and view zoom. It does not collect document content or send data to a server. Google Docs interface changes or non-English labels may affect compatibility.

Google Docs is a trademark of Google LLC. CompactDocs is an independent extension and is not affiliated with or endorsed by Google.

## Suggested category
Workflow & Planning. Confirm the available category in the submission dashboard.

## Language
English

## Support contact
angus.wwww@gmail.com

## Single purpose
Reclaim editing space in Google Docs by compacting its side panels and optionally fitting the page to the available width.

## Permission justification

**storage**: Save the three popup preferences locally and apply them when a Google Docs document opens.

**Google Docs document URL access** (`https://docs.google.com/document/d/*`): Run the extension on document pages to find and operate the native panel controls, apply compact layout styles, and adjust the local view zoom when fitting is enabled. This scope excludes other websites and the Docs home page.

**Remote code**: No. Extension code and styles are bundled with the extension.

## Privacy disclosure guidance

The extension processes the Google Docs page interface locally to locate controls and adjust the layout. It stores the user's three settings in Chrome local extension storage. It does not collect or transmit document content, use analytics, or make network requests. Review the final packaged code and dashboard data-use categories before submitting. Local processing still requires accurate disclosure.

Publish the accompanying privacy policy at a stable public URL and provide that URL in the dashboard. The support contact is angus.wwww@gmail.com. Confirm the effective date before publication. Do not claim a reviewed data-use category or certification without checking the dashboard and final code.

## Publication checklist

- [ ] Test the final packaged version in Chrome with a disposable sample Google Doc, including both panel overlays, keyboard access, all settings, narrow windows, manual zoom, and pageless mode.
- [x] Replace outdated screenshots with fresh installed 1.4.0 captures, including the left-positioned narrow editor, actual popup, and explicit edge-hover explanation. See `SCREENSHOTS.md` for provenance and limits.
- [x] Prepare five 1280 × 800 RGB screenshots and one optional hover alternative. Choose five for upload.
- [x] Prepare the green store icon and matching 16, 32, 48 and 128 pixel runtime PNGs.
- [ ] Enable GitHub Pages on a supported visibility/plan, verify https://anguswww.github.io/compactdocs-chrome-extension/privacy.html is public, and enter it in the dashboard.
- [ ] Verify permission justifications and privacy answers against the final package, including locally processed page data.
- [x] Package the extension files, excluding tests, store drafts, and unrelated files. Version 1.4.1 is packaged in `dist/compactdocs-1.4.1.zip`.
- [ ] Enter the listing copy, support contact, category, and other dashboard details. Review all fields and imagery before submitting.

References: [Supplying images](https://developer.chrome.com/docs/webstore/images), [Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies), [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
