// Captures store/website source images from the public example document with the
// real unpacked extension loaded. Requires Playwright and a Chromium build that
// still honours --load-extension. See store/README.md.
//   CHROMIUM=/path/to/chromium node scripts/capture-docs.mjs
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = join(ROOT, 'store/sources');
const DOC = 'https://docs.google.com/document/d/1tK9n3QfdXDl0SGw_8iidEQX0bsvrI9Ebxdb52ReTprw/edit?tab=t.0';
const helper = readFileSync(join(ROOT, 'scripts/prepare-store-capture.js'), 'utf8');
const HEIGHT = 900;

async function open(width, withExtension) {
  const profile = mkdtempSync(join(tmpdir(), 'compactdocs-capture-'));
  const args = ['--headless=new', '--hide-scrollbars=false'];
  if (withExtension) args.push('--disable-features=DisableLoadExtensionCommandLineSwitch',
    `--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`);
  const context = await chromium.launchPersistentContext(profile, {
    headless: true, executablePath: process.env.CHROMIUM, args,
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width, height: HEIGHT }, deviceScaleFactor: 2,
  });
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(DOC, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('.canvas-first-page', { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(6000);
  // Hide the transient anonymous-viewer count; it reflects other open sessions.
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = '#docs-presence-container{visibility:hidden!important}';
    document.head.append(style);
  });
  await page.mouse.move(width / 2, HEIGHT - 40);
  return { context, page, cleanup: () => rmSync(profile, { recursive: true, force: true }) };
}

const metrics = {};
async function save(page, name, record) {
  const path = join(SOURCES, `${name}.png`);
  const png = await page.screenshot({ path });
  metrics[name] = { ...record, source: DOC, sha256: createHash('sha256').update(png).digest('hex') };
  console.log(name, JSON.stringify(record.gutters ?? {}));
}

for (const width of [620, 780]) {
  const { context, page, cleanup } = await open(width, true);
  await page.evaluate(helper); // Trusted Types forbid script tags.
  const flat = await page.evaluate(w => window.prepareCompactDocsCapture({ width: w }), width);
  await page.waitForTimeout(800);
  await save(page, `fit-${width}`, flat);
  if (width === 780) {
    const hover = await page.evaluate(w => window.prepareCompactDocsCapture({ width: w, hover: true }), width);
    await page.waitForTimeout(900);
    await save(page, 'fit-tabs-780', hover);
  }
  await context.close(); cleanup();
}

{
  const { context, page, cleanup } = await open(780, false);
  const record = await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = '.kix-cursor{visibility:hidden!important}';
    document.head.append(style);
    document.querySelector('.kix-appview-editor').scrollTop = 0;
    const page = document.querySelector('.canvas-first-page').getBoundingClientRect();
    return { viewport: { width: innerWidth, height: innerHeight }, zoom: document.querySelector('#zoomSelect input').value,
      page: { x: page.left, width: page.width, visible: Math.min(page.right, innerWidth) - Math.max(page.left, 0) } };
  });
  await page.waitForTimeout(500);
  await save(page, 'default-780', record);
  await context.close(); cleanup();
}

{
  // The settings popup, rendered from the unpacked extension at its natural size.
  const profile = mkdtempSync(join(tmpdir(), 'compactdocs-popup-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: true, executablePath: process.env.CHROMIUM, ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--headless=new', '--disable-features=DisableLoadExtensionCommandLineSwitch',
      `--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`],
    deviceScaleFactor: 2,
  });
  // Unpacked extension IDs derive from the SHA-256 of their absolute path.
  const id = [...createHash('sha256').update(ROOT).digest('hex').slice(0, 32)]
    .map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.waitForFunction(() => !document.querySelector('#collapseTabs').disabled);
  await page.locator('body').screenshot({ path: join(SOURCES, 'popup.png') });
  await context.close(); rmSync(profile, { recursive: true, force: true });
}

writeFileSync(join(SOURCES, 'capture-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
