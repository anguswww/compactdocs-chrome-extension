# Asset provenance

The four 1280 × 800 screenshots and two promotional tiles use the website's design system: desk `#e9edf3`, ink `#121a33`, graphite `#4b556b`, rule `#c7d0de`, cobalt `#2b55d9`, and Archivo (variable; headings at weight 640, width 70). `listing-reference.json` records each image's headline and labels, and the listing image it replaces. The generator checks that copy is present.

1. `01-hover-tabs.png`: “Your tabs are one hover away.” The same window twice, with a cobalt edge marker on the closed view and the tabs overlay open on the other.
2. `02-more-room.png`: the 620 px window tiled left, “Google Docs, made for half a screen.” right.
3. `03-reclaim-space.png`: “Same window. More document.” Native 100% against CompactDocs at the same 780 px width, with rulers marking the measured visible page span.
4. `04-three-settings.png`: “Three switches. That’s the whole setup.” The real settings popup over the fitted window.

## Captures

`scripts/capture-docs.mjs` captures every source in `sources/` from the user-approved public [CompactDocs example document](https://docs.google.com/document/d/1tK9n3QfdXDl0SGw_8iidEQX0bsvrI9Ebxdb52ReTprw/edit) with the real unpacked extension loaded, at device scale 2. Compact captures run `scripts/prepare-store-capture.js`, which refreshes Docs’ layout, selects native Fit, closes menus, waits for fonts, and rejects gutters over 64 CSS px or uneven by more than 40 CSS px. The caret and the transient anonymous-viewer count are hidden. Document text is not edited.

- `fit-620.png`, `fit-780.png`: compact panels, native Fit, at 620 × 900 and 780 × 900 CSS px.
- `fit-tabs-780.png`: the same state with the left edge overlay revealed.
- `default-780.png`: no extension, native 100% zoom, tabs column open. Its measured page span gives the “59% of the page” figure.
- `popup.png`: the toolbar popup rendered from the unpacked extension.

`sources/capture-metrics.json` records the viewport, page bounds, gutters, zoom, and SHA-256 of each capture; generation refuses changed or unverified sources, wrong aspect ratios, upscaling, and blank padding.

The 1.4.4 runtime leaves about 20 CSS px on each side of the page at Fit in headless Chromium (overlay scrollbars).
