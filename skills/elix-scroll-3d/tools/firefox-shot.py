"""Screenshots in Firefox (Gecko) at chosen scroll positions, with Playwright.

    python <skill>/tools/firefox-shot.py <url> <out-dir> <width> <height> <y1,y2,...> [wait_ms]

Without a local install, the Playwright image works. It does not ship the Python
package, hence the pip step. Run from the project, so the captures land there:

    docker run --rm --network host -v "$PWD:/work" -v "<skill>/tools:/tools" -w /work \\
      mcr.microsoft.com/playwright/python:v1.47.0-jammy \\
      sh -c "pip -q install playwright==1.47.0 && python /tools/firefox-shot.py http://127.0.0.1:8000/ shots 390 844 0,800,1600"

Headless Firefox in a container usually has no WebGL at all, so this run doubles
as the no-WebGL check: the page must still read as complete, with no empty
stage and no pinned screen holding only a caption.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

url, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ys = [int(v) for v in sys.argv[5].split(',')]
wait = int(sys.argv[6]) if len(sys.argv) > 6 else 3000
os.makedirs(out, exist_ok=True)
logs = []
with sync_playwright() as p:
    browser = p.firefox.launch()
    page = browser.new_context(viewport={'width': w, 'height': h}, has_touch=w < 900).new_page()
    page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    page.goto(url)
    page.wait_for_timeout(wait)
    page.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
    for n, y in enumerate(ys):
        page.evaluate(f'window.scrollTo(0, {y})')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{out}/firefox-w{w}-{n:02d}-y{y}.jpg', type='jpeg', quality=80)
    info = page.evaluate("""() => ({ htmlClass: document.documentElement.className,
        scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })""")
    print(json.dumps(info))
    for line in logs[:25]:
        print('  ', line[:300])
    browser.close()
