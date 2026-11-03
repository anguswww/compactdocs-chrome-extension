# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==12.0.0"]
# ///
"""Offline, font-pinned store artwork. Run with uv run (see store/README.md)."""
from pathlib import Path
import hashlib
import json
import zipfile
import argparse
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / 'store'
S = 2
BG, INK, MUTED, GREEN = '#f6f7f5', '#153e35', '#52675e', '#18765b'
OUTPUTS = []
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='Verify tracked images without writing files')
ARGS = parser.parse_args()


def font(size, bold=False):
    filename = 'IBMPlexSans-Medium.ttf' if bold else 'IBMPlexSans-Regular.ttf'
    return ImageFont.truetype(str(STORE / 'fonts' / filename), round(size * S))


def text(im, xy, value, size=24, color=INK, bold=False, spacing=1.18):
    assert '\\n' not in value, 'Use a newline, not a literal backslash-n'
    im.info.setdefault('copy', []).append(value.replace('\n', ' '))
    draw = ImageDraw.Draw(im)
    face = font(size, bold)
    for i, line in enumerate(value.split('\n')):
        pos = (round(xy[0] * S), round((xy[1] + i * size * spacing) * S))
        box = draw.textbbox(pos, line, font=face)
        if box[0] < 0 or box[1] < 0 or box[2] > im.width - 24 * S or box[3] > im.height - 12 * S:
            raise ValueError(f'Text exceeds artwork bounds: {value!r}: {box}')
        draw.text(pos, line, font=face, fill=color)


def icon(size):
    return Image.open(STORE / 'sources/published-icon.png').convert('RGBA').resize(
        (size, size), Image.Resampling.LANCZOS)


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


def plate(title=None):
    im = Image.new('RGB', (1280 * S, 800 * S), BG)
    mark = icon(32 * S)
    im.paste(mark, (56 * S, 34 * S), mark)
    text(im, (96, 40), 'CompactDocs', 17, bold=True)
    if title:
        text(im, (64, 104), title, 43, bold=True)
    return im


def capture(im, name, box, crop_top=0):
    x, y, w, h = (round(v * S) for v in box)
    src = Image.open(STORE / 'sources' / f'{name}.png').convert('RGB')
    if crop_top:
        src = src.crop((0, round(crop_top * src.width / 780), src.width, src.height))
    if src.width < w:
        raise ValueError(f'Capture {name} is too small; refusing to upscale')
    src = src.resize((w, round(src.height * w / src.width)), Image.Resampling.LANCZOS)
    # Never add blank canvas to make an undersized capture fill its frame.
    if src.height < h:
        raise ValueError(f'Capture {name} is too short; refusing to add whitespace')
    card = src.crop((0, 0, w, h))
    mask = Image.new('L', (w, h))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=9 * S, fill=255)
    shadow = Image.new('RGBA', im.size)
    ImageDraw.Draw(shadow).rounded_rectangle((x, y + 8 * S, x + w, y + h + 8 * S), radius=10 * S, fill=(16, 34, 27, 24))
    im.paste(Image.alpha_composite(im.convert('RGBA'), shadow.filter(ImageFilter.GaussianBlur(14 * S))).convert('RGB'))
    im.paste(card, (x, y), mask)


def validate_captures():
    records = json.loads((STORE / 'sources/capture-metrics.json').read_text())
    for name in ['fit-620', 'fit-780', 'fit-tabs-780']:
        record = records[name]
        path = STORE / 'sources' / f'{name}.png'
        if hashlib.sha256(path.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError(f'Capture {name} has changed without rechecking geometry')
        left, right = record['gutters']['left'], record['gutters']['right']
        if min(left, right) < 0 or max(left, right) > 64 or abs(right - left) > 40:
            raise ValueError(f'Capture {name} has a clipped page or stale right gutter')
        if record['zoom'] != 'Fit' or record['fonts'] != 'loaded' or not record['nativeLayoutRefreshed']:
            raise ValueError(f'Capture {name} is not ready')
        im = Image.open(path)
        viewport = record['viewport']
        expected_height = im.width * viewport['height'] / viewport['width']
        if abs(im.height - expected_height) > 1:
            raise ValueError(f'Capture {name} does not match its recorded viewport')


def main():
    validate_captures()
    save(icon(128), 'icon-128.png')
    # Match the four live listing images: copy, geometry, and upload order.
    im = plate('Your tabs are one hover away.')
    text(im, (64, 184), 'Hover along the left edge', 20, GREEN, True)
    text(im, (664, 184), 'Document tabs', 20, GREEN, True)
    capture(im, 'fit-780', (64, 250, 552, 418), crop_top=114)
    capture(im, 'fit-tabs-780', (664, 250, 552, 418), crop_top=114)
    d = ImageDraw.Draw(im)
    d.line(tuple(v * S for v in (64, 252, 64, 666)), fill=GREEN, width=3 * S)
    d.line(tuple(v * S for v in (199, 220, 67, 307)), fill=GREEN, width=2 * S)
    d.polygon([(x * S, y * S) for x, y in [(66, 309), (71, 294), (80, 305)]], fill=GREEN)
    save(im, 'screenshots/01-hover-tabs.png')
    im = Image.new('RGB', (1280 * S, 800 * S), BG)
    capture(im, 'fit-620', (64, 104, 620, 636))
    text(im, (780, 285), 'More room for\nGoogle Docs.', 46, bold=True, spacing=1.15)
    text(im, (782, 414), 'Made for side-by-side work.', 21, MUTED)
    save(im, 'screenshots/02-more-room.png')
    im = Image.new('RGB', (1280 * S, 800 * S), BG)
    text(im, (64, 104), 'Same window. More document.', 43, bold=True)
    text(im, (64, 205), 'Without CompactDocs', 18, MUTED)
    text(im, (664, 205), 'With CompactDocs', 18, GREEN, True)
    capture(im, 'default-780', (64, 244, 552, 496))
    capture(im, 'fit-780', (664, 244, 552, 496))
    save(im, 'screenshots/03-reclaim-space.png')
    im = plate()
    capture(im, 'fit-620', (596, 104, 620, 636))
    text(im, (64, 279), 'Fits your\nwindow.', 48, bold=True, spacing=1.13)
    text(im, (66, 412), "Docs' native Fit, automatically.", 21, MUTED)
    save(im, 'screenshots/04-fit-your-window.png')
    for (w, h), name in [((440, 280), 'small-promo'), ((1400, 560), 'marquee-promo')]:
        im = Image.new('RGB', (w * S, h * S), INK)
        small = w == 440
        mark = icon((72 if small else 110) * S)
        im.paste(mark, (30 * S, 24 * S) if small else (72 * S, 70 * S), mark)
        text(im, (30, 116) if small else (230, 85), 'CompactDocs', 36 if small else 76, '#ffffff', True)
        text(im, (30, 177) if small else (76, 270), 'A little more room\nto write.' if small else 'A little more room to write.', 25 if small else 54, '#d8ed87')
        if not small:
            text(im, (80, 425), 'Compact panels for Google Docs.', 28, '#ffffff')
        save(im, f'promotional/{name}.png')
    for source, destination in [
        ('screenshots/02-more-room.png', ROOT / 'site/assets/01-side-by-side.png'),
        ('screenshots/01-hover-tabs.png', ROOT / 'site/assets/06-hover-access.png'),
        ('screenshots/01-hover-tabs.png', STORE / 'alternatives/06-hover-access.png'),
    ]:
        source_path = STORE / source
        if ARGS.check:
            if source_path.read_bytes() != destination.read_bytes():
                raise ValueError(f'Website or alternate artwork is stale: {destination}')
        else:
            shutil.copyfile(source_path, destination)
    if ARGS.check:
        print(f'Verified {len(OUTPUTS)} assets and website copies.')
        return
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
