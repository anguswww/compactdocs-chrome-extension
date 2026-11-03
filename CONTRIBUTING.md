# Contributing and releasing

## Local checks

Use Node.js 24+ and system `zip` and `unzip`. No dependency installation is required.

```sh
npm test
npm run check
npm run package
```

Keep `styles.js` generated from `compact.css`. Do not hand-edit the generated string. `npm run build` refreshes it. Packaging tests verify the ZIP contains only runtime files, icons, and the license. Test live behaviour on an English Google Docs document before changing selectors or layout code. Never put private document contents in fixtures or screenshots.

## Publish a release

1. Update `manifest.json` and `package.json` to the same version, for example `1.4.2`.
2. Add the changes to `CHANGELOG.md`, run the checks, and commit through a reviewed pull request.
3. Once merged, tag the release commit and push the tag:

```sh
git switch main
git pull --ff-only
git tag -a v1.4.2 -m "CompactDocs 1.4.2"
git push origin v1.4.2
```

The Release workflow rejects a tag that does not match both package versions. It rebuilds, tests, checks syntax, validates the store artwork, and publishes the extension ZIP, a separate versioned store-assets ZIP, and `SHA256SUMS`. Store generation uses the approved captures and bundled fonts, with Pillow 12.0.0. Run `npm run assets:store` locally with uv, or run the generator in a Python environment with that Pillow version. This uses the built-in `GITHUB_TOKEN`, with write permission only on the release job. No personal access token is needed. Existing releases are not overwritten. Publishing here does not submit anything to the Chrome Web Store.

## Website

Edit `site/index.html`, `site/privacy.html`, and `site/styles.css` on `main`, not the generated branch. All assets are local and links work under the repository's Pages subpath. A push touching `site/` runs the Website workflow. It snapshots the site to `gh-pages` and prepares the Pages artifact.

GitHub Pages requires a public repository or a plan supporting private-repo Pages. Do not change repository visibility without the owner's approval. Once Pages is available, configure **Settings → Pages → Source: GitHub Actions**, then set the repository variable `PAGES_ENABLED` to `true` under **Settings → Secrets and variables → Actions → Variables**. Run the Website workflow manually for the first deployment. With `gh`:

```sh
gh api -X POST repos/anguswww/compactdocs-chrome-extension/pages -f build_type=workflow
gh variable set PAGES_ENABLED --body true --repo anguswww/compactdocs-chrome-extension
gh workflow run website.yml --repo anguswww/compactdocs-chrome-extension
```

If a Pages site already exists, edit its build type with `gh api -X PUT` instead of creating it. The workflow deliberately skips deployment while `PAGES_ENABLED` is unset, so unsupported private-repo Pages does not break the branch snapshot or release workflow.

Expected URLs after deployment:
- https://anguswww.github.io/compactdocs-chrome-extension/
- https://anguswww.github.io/compactdocs-chrome-extension/privacy.html

## Security and support

Report sensitive issues privately to angus.wwww@gmail.com. See [SECURITY.md](SECURITY.md). Source contributions are provided under the [MIT license](LICENSE).
