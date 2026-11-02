# Store submission files

- `LISTING.md` contains the listing text, support contact and permission explanations.
- `PRIVACY.md` contains the privacy policy.
- `privacy.html` is the same policy as a standalone web page, ready for public hosting.
- `SCREENSHOTS.md` records screenshot sources and verification limits.
- `screenshots/` contains captured images when available.
- `../assets/icon-128.png` is the store icon.
- `../dist/compactdocs-1.4.0.zip` is the extension package.

Support: angus.wwww@gmail.com

Host `privacy.html` at a stable public HTTPS URL and enter that URL in the store dashboard. A local file path cannot serve as the public policy URL.

Run `npm run package` from the project root if runtime files change. Review the final ZIP in Chrome before submission. Screenshot capture from source does not replace installed extension testing.
