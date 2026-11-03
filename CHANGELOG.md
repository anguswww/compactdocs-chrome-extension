# Changelog

## 1.4.2

- Refresh Google Docs layout after reclaiming sidebar space, so native Fit does not retain a stale right-side gap on startup.
- Keep the existing shared canvas, ruler and pointer coordinate origin, manual zoom ownership, and hover layout.

## 1.4.1

- Use Google Docs' native Fit mode in narrow windows instead of calculated percentage zoom.
- Preserve manual numeric zoom and restore the previous zoom when automatic Fit is disabled or the window widens.
- Avoid interrupting edits in the zoom field.
- Keep preference changes made during startup instead of overwriting them with a stale storage response.
- Disable popup controls while settings load or save, and show accessible errors when storage fails.
- Dismiss hover overlays and hide their controls when the editor is removed.
- Rewrite release copy without prose semicolons.

## 1.4.0

- Invisible full-height hover targets replace protruding edge buttons.
- A short hover delay helps avoid accidental reveals. Leaving the window cancels pending reveals.
- Rounded document-tabs overlays use a translucent surface, with fully opaque text and a stronger background on hover or keyboard focus.
- Panels fade in and out, with reduced-motion support.
- Updated popup labels and descriptions for the three independent settings.
- Retains compact layout, page fitting, manual-zoom handling, and pageless native zoom.
- New green icon, genuine installed-package screenshots, landing page, privacy policy, and MIT license.
- CI validates packaging and syntax. Version tags publish release ZIPs and SHA-256 checksums. The website workflow maintains the `gh-pages` deployment branch.

Earlier implementation and verification notes are retained in [TESTING.md](TESTING.md).
