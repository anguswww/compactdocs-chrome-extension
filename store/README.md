# Store submission files

Run `npm run assets:store` (or `npm run package:store`) to generate the four listing screenshots, both promotional tiles, store icon, SHA-256 manifest, and `dist/compactdocs-1.4.2-store-assets.zip` (with an identical `dist/compactdocs-store-assets.zip` convenience copy).

Requirements: [uv](https://docs.astral.sh/uv/) and Python 3.11+. Pillow is pinned in the script. After dependency installation, generation is fully offline and requires no browser or installed fonts.

- `screenshots/`: four 1280 × 800 RGB PNGs in the published listing's order.
- `listing-reference.json`: published headings, supporting copy, order, and reference image URLs.
- `promotional/`: separate 440 × 280 small promo and 1400 × 560 marquee, both RGB PNGs.
- `icon-128.png`: the existing transparent green store icon.
- `fonts/`: bundled IBM Plex Sans Regular and Medium and their SIL Open Font License.
- `sources/`: approved original document captures, measured layout metadata, and the published icon.
- `SCREENSHOTS.md`: source, font, and verification details.
- `asset-manifest.json`: output dimensions and hashes.
- `LISTING.md`, `PRIVACY.md`, `privacy.html`: existing listing and policy material.

The four screenshots retain the live listing's wording, branding placement, paired-image layouts, arrow, and crop geometry. Edit layout in `scripts/generate-store-assets.py`; keep copy aligned with `listing-reference.json`. Missing fonts, clipping text, accidental literal backslash-n sequences, and undersized captures fail explicitly. Source captures permit repeatable artwork without changing the reference document.

Upload the four numbered screenshots from the ZIP to replace the current listing images. Promotional tiles are separate optional uploads. Publication remains manual. Runtime packaging remains `npm run package`.

Support: angus.wwww@gmail.com

To refresh compact captures in a Docs browser session, activate the source extension with automatic numeric fitting disabled, load `scripts/prepare-store-capture.js`, and call `prepareCompactDocsCapture({width: 620})` at 620 × 900 CSS px, then the corresponding 780 px calls with `hover: false` and `hover: true`. Save the original viewport PNGs and the returned measurements in `sources/capture-metrics.json`, adding each source PNG’s SHA-256. The helper refreshes Docs’ internal layout, selects native Fit, closes menus, waits for fonts, and rejects excess gutters before returning measurements. See `SCREENSHOTS.md` for the source demonstration limits.

Run `uv run scripts/generate-store-assets.py --check` to verify tracked images and website copies without rewriting them. The release workflow regenerates and packages these images alongside the extension. See `UPLOAD.md` to choose the correct download.
