from playwright.sync_api import sync_playwright
from pathlib import Path
import tempfile, hashlib, json, os, argparse, zipfile
root=Path(__file__).resolve().parents[1]
(root / "review").mkdir(exist_ok=True)
parser=argparse.ArgumentParser()
parser.add_argument('--archive', type=Path)
args=parser.parse_args()
with tempfile.TemporaryDirectory(prefix='compactdocs-unpacked-') as unpacked, sync_playwright() as p, tempfile.TemporaryDirectory(prefix='compactdocs-check-') as profile:
    runtime_root=root
    if args.archive:
        with zipfile.ZipFile(args.archive) as archive: archive.extractall(unpacked)
        runtime_root=Path(unpacked).resolve()
    ctx=p.chromium.launch_persistent_context(profile, executable_path=os.environ.get('COMPACTDOCS_BROWSER', '/opt/helium/chrome'),headless=True,args=['--no-sandbox',f'--disable-extensions-except={runtime_root}',f'--load-extension={runtime_root}'],viewport={'width':780,'height':800},device_scale_factor=2)
    page=ctx.new_page()
    fixture='''<!doctype html><html><head></head><body><div id="docs-chrome" style="width:780px"></div><div id="docs-editor" style="width:707px"><div id="kix-appview"><div class="navigation-widget navigation-widget-hidden"></div></div></div><script>window.refreshes=0;window.KX_resize=()=>{window.refreshes++;document.body.dataset.width=document.querySelector('#docs-editor').getBoundingClientRect().width;};</script></body></html>'''
    page.route('https://docs.google.com/**',lambda r:r.fulfill(body=fixture,content_type='text/html'))
    page.goto('https://docs.google.com/document/d/compactdocs-runtime-fixture/edit')
    page.wait_for_function('window.refreshes > 0')
    assert page.locator('html').get_attribute('class').find('compactdocs-hide-right')>=0
    assert page.locator('body').get_attribute('data-width')=='780'
    # The MAIN bridge must not expose isolated extension settings or storage.
    assert page.evaluate('typeof COMPACTDOCS_CSS')=='undefined'
    extid=''.join(chr(ord('a')+int(c,16)) for c in hashlib.sha256(str(runtime_root).encode()).hexdigest()[:32])
    popup=ctx.new_page();popup.goto(f'chrome-extension://{extid}/popup.html')
    popup.wait_for_function("!document.querySelector('#collapseTabs').disabled")
    for key in ['collapseTabs','hideRightPanel','fitToWindow']:
        assert popup.locator('#'+key).is_checked()
        popup.locator('#'+key).uncheck();popup.wait_for_function(f"!document.querySelector('#{key}').disabled")
        popup.locator('#'+key).check();popup.wait_for_function(f"!document.querySelector('#{key}').disabled")
    popup.locator('body').screenshot(path=str(root/'review/popup.png'))
    print(json.dumps({'installedExtension':extid,'mainWorldRefreshes':page.evaluate('window.refreshes'),'editorWidth':page.locator('body').get_attribute('data-width'),'popupSettings':'all three toggled successfully'}))
    ctx.close()
