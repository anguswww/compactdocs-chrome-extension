# Store submission files

Run `npm run assets:store` (or `npm run package:store`) to generate the four listing screenshots, both promotional tiles, store icon, SHA-256 manifest, and `dist/compactdocs-<version>-store-assets.zip` (with an identical `dist/compactdocs-store-assets.zip` convenience copy).

Requirements: [uv](https://docs.astral.sh/uv/) and Python 3.11+. Pillow is pinned in the script. After dependency installation, generation is fully offline and requires no browser or installed fonts.

- `screenshots/`: four 1280 × 800 RGB PNGs in upload order.
- `listing-reference.json`: headings, supporting copy, order, and the listing images they replace.
- `promotional/`: separate 440 × 280 small promo and 1400 × 560 marquee, both RGB PNGs.
- `icon-128.png`: the blue store icon, rendered from `assets/icon.svg`.
- `fonts/`: bundled Archivo variable font and its SIL Open Font License.
- `sources/`: document and popup captures with measured layout metadata.
- `SCREENSHOTS.md`: source, font, and verification details.
- `asset-manifest.json`: output dimensions and hashes.
- `LISTING.md`, `PRIVACY.md`, `privacy.html`: existing listing and policy material.

The generator also writes the website's WebP images in `site/assets/`. Edit layout in `scripts/generate-store-assets.py`; keep copy aligned with `listing-reference.json`. Missing fonts, clipping text, accidental literal backslash-n sequences, and undersized captures fail explicitly. Source captures permit repeatable artwork without changing the reference document.

Upload the four numbered screenshots from the ZIP to replace the current listing images. Promotional tiles are separate optional uploads. Publication remains manual. Runtime packaging remains `npm run package`.

Support: angus.wwww@gmail.com

To refresh captures, run `CHROMIUM=/path/to/chromium node scripts/capture-docs.mjs` with Playwright available (`npm i --no-save playwright`). The browser must still honour `--load-extension` (Chromium, not branded Chrome). It loads this checkout as an unpacked extension, captures all sources, and rewrites `sources/capture-metrics.json`. Then regenerate the artwork. See `SCREENSHOTS.md`.

Run `uv run scripts/generate-store-assets.py --check` to verify tracked images and website copies without rewriting them. The release workflow regenerates and packages these images alongside the extension. See `UPLOAD.md` to choose the correct download.

Font layout explicitly uses Pillow’s BASIC engine, so installing optional shaping libraries does not change the generated typography between macOS and Linux. CI checks decoded pixels rather than PNG compression bytes.
