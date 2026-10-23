# Tools

Verification helpers for the checklist in
[references/checklist.md](../references/checklist.md).
They capture what the page looks like at each scroll position; they do not
measure performance.

| Tool | Engine | Use it to check |
|------|--------|-----------------|
| `shot.mjs` | Chromium, through the DevTools Protocol, no dependencies (Node 22+) | Every scroll state at several widths, reduced motion (`--reduced`), WebGL disabled (`--nogl`), horizontal overflow, console errors |
| `firefox-shot.py` | Firefox, through Playwright | Gecko layout, and usually the no-WebGL path, since headless Firefox in a container has no WebGL |

`<skill>` below is this skill's folder (for example `~/.claude/skills/elix-scroll-3d`).
Run from the project, so the captures land there.

```bash
# phone and desktop, the whole page in 800 px steps
CHROME_PATH=/path/to/chrome node <skill>/tools/shot.mjs http://127.0.0.1:8000/ shots --widths 390,1440 --every 800 --wait 3000

# the moments that matter on a pinned section, with motion reduced
node <skill>/tools/shot.mjs http://127.0.0.1:8000/ shots --widths 1440 --at 2400,2900,3400 --reduced
```

Software WebGL (SwiftShader) renders correctly and slowly: a scene that crawls
here can be fine on a phone, and one that runs here proves nothing about a
phone. Frame rate, heat, and memory come from real hardware, per
[references/mobile.md](../references/mobile.md).
