# Screenshot provenance

The current store plates use genuine captures of the installed 1.4.0 extension in a dedicated Chrome for Testing profile. The previous source-injected demonstration images were replaced. The user supplied and approved the document for public marketing screenshots. No document text or page settings were edited. Captures contain page content only, without browser chrome or a signed-in account avatar.

- `screenshots/01-side-by-side.png`: a narrow Docs view positioned on the left, with a short explanation of side-by-side work.
- `screenshots/02-reclaim-space.png`: default Docs and CompactDocs at the same 780 px viewport width.
- `screenshots/03-hover-tabs.png`: the genuine rounded 1.4.0 native tabs overlay.
- `screenshots/04-fit-your-window.png`: a 620 px viewport, automatically fitted at 70% view zoom.
- `screenshots/05-your-settings.png`: actual installed extension popup, captured at 2× device pixel ratio and cropped to its three settings.
- `alternatives/06-hover-access.png`: closed/open comparison with an annotation identifying the invisible full-height edge target. The green edge line is an annotation, not an extension control.

Each plate is a 1280 × 800 RGB PNG. The first five are the default upload set; the alternative can replace 03. The Chrome Web Store accepts up to five screenshots.

Live checks confirmed 89% auto-fit at 780 px and 70% at 620 px, identical page bounds and zoom before/after hover, pointer-exit dismissal, keyboard focus and Escape, and all three popup switches. Fresh anonymous captures do not verify signed-in Workspace apps. The right-panel feature is represented in accurate copy and the actual setting, not a fabricated signed-in screenshot. See `../TESTING.md` for historical checks and remaining manual cases.

`demo.html` remains a synthetic local development fixture, not a Google Docs screenshot or evidence of installed-package verification. Marketing images do not replace final browser testing of the release ZIP.
