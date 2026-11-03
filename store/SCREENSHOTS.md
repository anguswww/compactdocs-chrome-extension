# Asset provenance

The four 1280 × 800 screenshots match the live [Chrome Web Store listing](https://chromewebstore.google.com/detail/compactdocs/lilnjbpiikjfknobepdnlepjgalgdcfi) inspected on 3 November 2026. `listing-reference.json` records their published order, exact headings, supporting copy, and original image URLs. The generator preserves each image's composition and the published green icon. It does not add settings imagery or change marketing copy.

1. `01-hover-tabs.png`: “Your tabs are one hover away.” Two document crops, green edge marker and arrow, “Hover along the left edge” and “Document tabs”.
2. `02-more-room.png`: document left, “More room for Google Docs.” and “Made for side-by-side work.” right; no header branding.
3. `03-reclaim-space.png`: “Same window. More document.” with “Without CompactDocs” and “With CompactDocs”; no header branding.
4. `04-fit-your-window.png`: branding at top left, “Fits your window.” and “Docs' native Fit, automatically.” left, document right.

The document captures in `sources/` come from the user-approved public [CompactDocs example document](https://docs.google.com/document/d/1tK9n3QfdXDl0SGw_8iidEQX0bsvrI9Ebxdb52ReTprw/edit). Google Docs reported Helvetica Neue loaded; capture waited for `document.fonts.ready`. Original PNGs are retained for offline generation without a Google account or document access. Compact captures were refreshed after this review using `scripts/prepare-store-capture.js`; the helper requests Docs’ native `KX_resize()` after the panels collapse, then selects Fit and waits for rendering to settle.

- `default-780.png`: 780 × 900 CSS px viewport, native 100% zoom, tabs expanded.
- `fit-780.png`: same viewport, compact panels, native Fit selected.
- `fit-tabs-780.png`: same compact state with the left hover overlay revealed.
- `fit-620.png`: 620 × 900 CSS px viewport, compact panels, native Fit selected.
- `published-icon.png`: the existing 128 × 128 transparent icon downloaded from the listing.

The preview PNGs have a higher pixel density than their CSS viewport. Artwork scales down proportionally and crops the lower viewport. The hover image crops browser controls above the ruler, as in the published listing. Document text was not edited or retyped. The visible outline reflects the current document state.

The preview did not have an installed extension. This checkout's `styles.js`, `hover.js`, and `content.js` were injected with a default-settings shim and automatic numeric fitting disabled, then native Fit was selected explicitly. These are source demonstrations, not verification of the installed extension's automatic Fit implementation. The captures reproduce the native layout refresh from the 1.4.2 Fit fix. The 1.4.2 runtime is now included in this checkout and is packaged separately from the artwork.

Artwork uses the original listing’s proportional IBM Plex Sans Regular and Medium, bundled with its SIL Open Font License in `fonts/`. The original private repository’s `store/build_assets.py` establishes the font roles, sizes, colours, and 2× rendering. There are no host font paths or silent fallback fonts. Separate promotional tiles retain their existing copy and are not additional listing screenshots. `asset-manifest.json` records output dimensions and SHA-256 hashes.

## Capture geometry checks

`sources/capture-metrics.json` records the viewport, page bounds, font readiness, Fit state, and source hash for each compact capture. At 620 CSS px, the page spans 549.5 px with 19.36 px on the left and 51.14 px on the right. At 780 CSS px, it spans 707.5 px with 20.33 px left and 52.17 px right. The remaining gutter is the live Docs layout, including its scroll area. The page is not stretched or cropped sideways to conceal it.

Generation rejects unverified/changed source images, gutters over 64 CSS px, a left/right difference over 40 CSS px, wrong viewport aspect ratios, unloaded fonts, or a non-Fit zoom. It also rejects frames taller than their scaled source instead of adding blank padding. The helper refuses capture while the zoom menu is open. Hover capture preserves the same page geometry as the closed-panel capture.
