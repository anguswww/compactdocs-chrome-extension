# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==12.0.0"]
# ///
"""Offline, font-pinned store artwork and website images. Run with uv run (see store/README.md)."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import shutil
import zipfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / 'store'
SITE = ROOT / 'site/assets'
S = 2  # Artwork renders at 2x and is downsampled for crisp edges.

# The website's tokens (site/styles.css).
DESK, PAPER, INK, GRAPHITE = '#e9edf3', '#ffffff', '#121a33', '#4b556b'
RULE, COBALT, TINT = '#c7d0de', '#2b55d9', '#dce4fb'
FONT = STORE / 'fonts/Archivo.ttf'
OUTPUTS = []
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='Verify tracked images without writing files')
ARGS = parser.parse_args()


def font(size, weight=400, width=100):
    face = ImageFont.truetype(str(FONT), round(size * S), layout_engine=ImageFont.Layout.BASIC)
    face.set_variation_by_axes([weight, width])  # fvar order: wght, wdth.
    return face


HEAD = dict(weight=640, width=70)
LABEL = dict(weight=560, width=100)


def text(im, xy, value, size=24, color=INK, spacing=1.18, **axes):
    assert '\\n' not in value, 'Use a newline, not a literal backslash-n'
    im.info.setdefault('copy', []).append(value.replace('\n', ' '))
    draw = ImageDraw.Draw(im)
    face = font(size, **axes)
    bottom = xy[1]
    for i, line in enumerate(value.split('\n')):
        pos = (round(xy[0] * S), round((xy[1] + i * size * spacing) * S))
        box = draw.textbbox(pos, line, font=face)
        if box[0] < 0 or box[1] < 0 or box[2] > im.width - 24 * S or box[3] > im.height - 12 * S:
            raise ValueError(f'Text exceeds artwork bounds: {value!r}: {box}')
        draw.text(pos, line, font=face, fill=color)
        bottom = box[3] / S
    return bottom


def icon(size):
    # Rendered from assets/icon.svg; the extension and the store share one icon.
    return Image.open(ROOT / 'assets/icon-128.png').convert('RGBA').resize((size, size), Image.Resampling.LANCZOS)


def source(name):
    return Image.open(STORE / 'sources' / f'{name}.png').convert('RGB')


def window(im, name, box, radius=12, crop_top=0, shadow=True):
    """Place a capture in a bordered window, cropped from the top, never upscaled or padded."""
    x, y, w, h = (round(v * S) for v in box)
    src = source(name)
    if crop_top:
        src = src.crop((0, round(crop_top * src.width / 780), src.width, src.height))
    if src.width < w:
        raise ValueError(f'Capture {name} is too small; refusing to upscale')
    src = src.resize((w, round(src.height * w / src.width)), Image.Resampling.LANCZOS)
    if src.height < h:
        raise ValueError(f'Capture {name} is too short; refusing to add whitespace')
    r = radius * S
    if shadow:
        layer = Image.new('RGBA', im.size)
        ImageDraw.Draw(layer).rounded_rectangle((x + 12 * S, y + 28 * S, x + w - 12 * S, y + h + 10 * S), radius=r, fill=(18, 26, 51, 70))
        im.paste(Image.alpha_composite(im.convert('RGBA'), layer.filter(ImageFilter.GaussianBlur(20 * S))).convert('RGB'))
    mask = Image.new('L', (w, h))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    im.paste(src.crop((0, 0, w, h)), (x, y), mask)
    ImageDraw.Draw(im).rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=r, outline=RULE, width=S)


def ruler(im, x, y, w, start, end):
    """Window-width ruler with the visible page span in cobalt, as on the website."""
    d = ImageDraw.Draw(im)
    X, Y, W = x * S, y * S, w * S
    for i in range(51):
        tx = X + W * i / 50
        tall = i % 5 == 0
        d.line((tx, Y + (0 if tall else 8 * S), tx, Y + 14 * S), fill=GRAPHITE if i in (0, 50) else RULE, width=S)
    d.rectangle((X + W * start, Y + 11 * S, X + W * end, Y + 14 * S), fill=COBALT)


def canvas(w=1280, h=800, color=DESK):
    return Image.new('RGB', (w * S, h * S), color)


def wordmark(im, x, y, size=17, color=INK):
    mark = icon(round(size * 1.9) * S)
    im.paste(mark, (round((x - size * 0.3) * S), round((y - size * 0.45) * S)), mark)
    text(im, (x + size * 1.55, y), 'CompactDocs', size, color, weight=650, width=88)


def save(im, relative):
    if relative.startswith('screenshots/'):
        refs = json.loads((STORE / 'listing-reference.json').read_text())['screenshots']
        ref = next(r for r in refs if r['file'] == Path(relative).name)
        actual = im.info.get('copy', [])
        assert all(t in actual for t in [ref['headline'], *ref['labels']]), relative
    dest = STORE / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    if relative != 'icon-128.png':
        im = im.resize((im.width // S, im.height // S), Image.Resampling.LANCZOS)
    if ARGS.check:
        existing = Image.open(dest)
        if existing.size != im.size or existing.mode != im.mode or existing.tobytes() != im.tobytes():
            raise ValueError(f'Generated artwork is stale: {dest}')
    else:
        im.save(dest, optimize=True)
    OUTPUTS.append(dest)


def site_image(im, name, width):
    """Website copies: WebP, sized for 2x display. Compared by encoded bytes in --check."""
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    im.save(buffer, 'WEBP', quality=88, method=6)
    dest = SITE / name
    if ARGS.check:
        if not dest.exists() or dest.read_bytes() != buffer.getvalue():
            raise ValueError(f'Website image is stale: {dest}')
    else:
        dest.write_bytes(buffer.getvalue())
    return im.size


def validate_captures():
    records = json.loads((STORE / 'sources/capture-metrics.json').read_text())
    for name, record in records.items():
        path = STORE / 'sources' / f'{name}.png'
        if hashlib.sha256(path.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError(f'Capture {name} has changed without rechecking geometry')
        im = Image.open(path)
        viewport = record['viewport']
        if abs(im.height - im.width * viewport['height'] / viewport['width']) > 1:
            raise ValueError(f'Capture {name} does not match its recorded viewport')
        if name == 'default-780':
            continue
        left, right = record['gutters']['left'], record['gutters']['right']
        if min(left, right) < 0 or max(left, right) > 64 or abs(right - left) > 40:
            raise ValueError(f'Capture {name} has a clipped page or stale right gutter')
        if record['zoom'] != 'Fit' or record['fonts'] != 'loaded' or not record['nativeLayoutRefreshed']:
            raise ValueError(f'Capture {name} is not ready')
    return records


def span(record):
    page, width = record['page'], record['viewport']['width']
    return max(page['x'], 0) / width, min(page['x'] + page['width'], width) / width


def main():
    records = validate_captures()
    default = records['default-780']
    visible = round(100 * default['page']['visible'] / default['page']['width'])
    save(icon(128), 'icon-128.png')

    # 1. The hover reveal: the same window before and while pointing at the edge.
    im = canvas()
    text(im, (64, 58), 'Document tabs, one hover away.', 58, **HEAD)
    text(im, (64, 140), 'Tabs are revealed over the page when the pointer reaches the left edge.', 21, GRAPHITE)
    text(im, (64, 214), 'Hover over the left edge', 18, INK, **LABEL)
    text(im, (668, 214), 'Document tabs', 18, INK, **LABEL)
    window(im, 'fit-780', (64, 250, 548, 490), crop_top=114)
    window(im, 'fit-tabs-780', (668, 250, 548, 490), crop_top=114)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle(tuple(v * S for v in (64, 250, 70, 739)), radius=3 * S, fill=COBALT)
    save(im, 'screenshots/01-hover-tabs.png')

    # 2. The pitch: a narrow Docs window, tiled beside the headline.
    im = canvas()
    window(im, 'fit-620', (64, 64, 520, 736), crop_top=0, shadow=True)
    bottom = text(im, (664, 214), 'Google Docs,\nfitted to narrow\nwindows.', 80, spacing=0.98, **HEAD)
    text(im, (666, bottom + 30), 'Side panels are moved to the window edges.\nThe page is fitted to the available width.', 23, GRAPHITE, spacing=1.45)
    wordmark(im, 670, 690, 20)
    save(im, 'screenshots/02-more-room.png')

    # 3. Before and after, at the same window width, with measured page spans.
    im = canvas()
    text(im, (64, 58), 'More of the page, in the same window.', 58, **HEAD)
    text(im, (64, 140), f'Both windows are 780 pixels wide. Without CompactDocs, {visible}% of the page width is visible.', 21, GRAPHITE)
    text(im, (64, 214), 'Without CompactDocs', 18, GRAPHITE, **LABEL)
    text(im, (668, 214), 'With CompactDocs', 18, COBALT, weight=620, width=100)
    window(im, 'default-780', (64, 250, 548, 466), shadow=False)
    window(im, 'fit-780', (668, 250, 548, 466), shadow=False)
    ruler(im, 64, 734, 548, *span(default))
    ruler(im, 668, 734, 548, *span(records['fit-780']))
    save(im, 'screenshots/03-reclaim-space.png')

    # 4. Settings: the real popup over the fitted window.
    im = canvas()
    window(im, 'fit-620', (560, 64, 520, 736))
    bottom = text(im, (64, 214), 'Three settings,\nstored locally.', 64, spacing=1.0, **HEAD)
    text(im, (66, bottom + 30), 'Tabs, side panel and page fitting can\neach be enabled from the toolbar popup.', 22, GRAPHITE, spacing=1.45)
    popup = source('popup')  # Already 2x: 320 x 455 CSS px.
    px, py = 900 * S, 300 * S
    layer = Image.new('RGBA', im.size)
    ImageDraw.Draw(layer).rounded_rectangle((px + 10 * S, py + 24 * S, px + popup.width - 10 * S, py + popup.height + 8 * S), radius=14 * S, fill=(18, 26, 51, 90))
    im.paste(Image.alpha_composite(im.convert('RGBA'), layer.filter(ImageFilter.GaussianBlur(22 * S))).convert('RGB'))
    mask = Image.new('L', popup.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, popup.width - 1, popup.height - 1), radius=14 * S, fill=255)
    im.paste(popup, (px, py), mask)
    ImageDraw.Draw(im).rounded_rectangle((px, py, px + popup.width - 1, py + popup.height - 1), radius=14 * S, outline=RULE, width=S)
    save(im, 'screenshots/04-three-settings.png')

    # Promotional tiles: cobalt, with the icon's page-and-edges glyph.
    im = canvas(440, 280, COBALT)
    mark = icon(84 * S)
    im.paste(mark, (14 * S, 14 * S), mark)
    text(im, (30, 112), 'Google Docs,\nfitted to narrow\nwindows.', 40, '#ffffff', spacing=1.0, **HEAD)
    save(im, 'promotional/small-promo.png')
    im = canvas(1400, 560, COBALT)
    window(im, 'fit-620', (860, 72, 460, 488), radius=14, shadow=False)
    mark = icon(96 * S)
    im.paste(mark, (60 * S, 52 * S), mark)
    text(im, (150, 82), 'CompactDocs', 30, '#ffffff', weight=650, width=88)
    text(im, (80, 200), 'Google Docs, fitted\nto narrow windows.', 84, '#ffffff', spacing=1.0, **HEAD)
    save(im, 'promotional/marquee-promo.png')

    # Website images, from the same verified captures.
    for name, target in [('fit-780', 'docs-fit-780.webp'), ('fit-tabs-780', 'docs-tabs-780.webp'), ('default-780', 'docs-default-780.webp')]:
        size = site_image(source(name), target, 1120)
        assert size == (1120, 1292), (target, size)
    assert site_image(source('popup'), 'popup.webp', 640) == (640, 910)
    if ARGS.check:
        print(f'Verified {len(OUTPUTS)} assets and website images.')
        return
    shutil.copyfile(ROOT / 'assets/icon-128.png', SITE / 'icon-128.png')
    version = json.loads((ROOT / 'manifest.json').read_text())['version']
    target = ROOT / 'dist' / f'compactdocs-{version}-store-assets.zip'
    target.parent.mkdir(exist_ok=True)
    manifest = {str(p.relative_to(STORE)): {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'size': list(Image.open(p).size)} for p in OUTPUTS}
    (STORE / 'asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in OUTPUTS + [STORE / 'asset-manifest.json', STORE / 'SCREENSHOTS.md', STORE / 'listing-reference.json', STORE / 'sources/capture-metrics.json', STORE / 'UPLOAD.md']:
            entry = zipfile.ZipInfo(str(path.relative_to(STORE)), date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, path.read_bytes())
    shutil.copyfile(target, ROOT / 'dist/compactdocs-store-assets.zip')
    print(f'Generated {len(OUTPUTS)} assets: {target}')


if __name__ == '__main__':
    main()
