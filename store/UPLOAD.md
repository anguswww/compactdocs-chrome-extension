# CompactDocs 1.4.5 uploads

1.4.5 changes no behaviour. It ships the new blue icon and toolbar popup, so the package must be uploaded as a new version: the Chrome Web Store reads the extension's toolbar and store icons from the package, and the version number must increase.

All changes are made in the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) under **CompactDocs**.

## 1. Package

Under **Package**, select **Upload new package** and choose `compactdocs-1.4.5.zip` (from `npm run package` or the GitHub release). Do not upload the store-assets ZIP as a package.

## 2. Store listing

Extract `compactdocs-1.4.5-store-assets.zip`. Under **Store listing**, then **Graphic assets**:

- **Store icon**: `icon-128.png` (the new blue icon).
- **Screenshots**: delete the four existing images, then upload these in order:
  1. `screenshots/01-hover-tabs.png`
  2. `screenshots/02-more-room.png`
  3. `screenshots/03-reclaim-space.png`
  4. `screenshots/04-three-settings.png`
- **Small promo tile**: `promotional/small-promo.png` (440 × 280).
- **Marquee promo tile**: `promotional/marquee-promo.png` (1400 × 560). Optional.

Select **Save draft**.

## 3. Submit

Check the preview, then select **Submit for review**. Listing images and the package are reviewed together. Creating a GitHub release does not submit or publish a Chrome Web Store update.
