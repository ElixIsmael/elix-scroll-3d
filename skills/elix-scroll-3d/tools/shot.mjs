// Screenshots of a scroll-driven page at chosen scroll positions and widths,
// through the Chrome DevTools Protocol. No dependencies (Node 22 or newer).
//
//   node <skill>/tools/shot.mjs <url> <out-dir> [options]
//
//   --widths 1440,390     viewport widths (phone widths get touch and mobile emulation)
//   --at 0,900,1800       scroll positions to capture, in px
//   --every 900           or: capture every N px down the whole page
//   --wait 2500           ms after load before the first capture (let intros finish)
//   --step 900            ms after each scroll before capturing (let smoothing settle)
//   --height 900          viewport height (default depends on the width)
//   --reduced             emulate prefers-reduced-motion: reduce
//   --nogl                start the browser with WebGL disabled (tests the fallback)
//   --eval "js"           run this in the page before the first capture
//   --smooth              keep CSS smooth scrolling (off by default, it skews captures)
//   --chrome /path        browser binary, or set CHROME_PATH
//
// Console errors, warnings, and uncaught exceptions are printed per width.
// WebGL here is usually SwiftShader, a software renderer: trust it for layout
// and composition, never for frame rate. Measure frame rate on real hardware.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out) { console.error('usage: node shot.mjs <url> <out-dir> [options]'); process.exit(2); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const has = k => args.includes('--' + k);
const widths = opt('widths', '1440').split(',').map(Number);
const wait = Number(opt('wait', '2500')), step = Number(opt('step', '900'));
const every = Number(opt('every', '0'));
const atList = opt('at', '0').split(',').map(Number);
const evalJs = opt('eval', '');
const chromeBin = opt('chrome', process.env.CHROME_PATH || 'google-chrome');
mkdirSync(out, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(chromeBin, [
  '--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--mute-audio', '--no-first-run',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
  ...(has('nogl') ? ['--disable-3d-apis', '--disable-webgl'] : []), 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
chrome.stderr.on('data', () => {});
chrome.on('error', e => { console.error(`could not start ${chromeBin}: ${e.message}`); process.exit(1); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0;
const pending = new Map(), logs = [];
for (let i = 0; i < 80 && !ws; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {}
  if (!ws) await sleep(150);
}
if (!ws) { console.error('no DevTools connection'); chrome.kill(); process.exit(1); }
await new Promise(r => ws.addEventListener('open', r, { once: true }));
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    logs.push(`[${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails; logs.push('[exception] ' + (d.exception?.description || d.text));
  } else if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level)) {
    logs.push(`[${msg.params.entry.level}] ${msg.params.entry.text} ${msg.params.entry.url || ''}`);
  }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
if (has('reduced')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const report = {};
for (const w of widths) {
  const h = Number(opt('height', '')) || (w < 600 ? 844 : w < 1000 ? 1024 : w >= 2500 ? 1440 : w >= 1900 ? 1080 : 900);
  const mobile = w < 900;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  logs.length = 0;
  await send('Page.navigate', { url });
  await sleep(wait);
  if (!has('smooth')) await evaluate("document.documentElement.style.scrollBehavior = 'auto'");
  if (evalJs) await evaluate(evalJs);
  const total = await evaluate('document.documentElement.scrollHeight');
  const stops = every ? Array.from({ length: Math.ceil(total / every) }, (_, i) => i * every) : atList;
  let n = 0;
  for (const y of stops) {
    await evaluate(`window.scrollTo(0, ${y})`);
    await sleep(step);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    writeFileSync(`${out}/w${w}-${String(n++).padStart(2, '0')}-y${y}.jpg`, Buffer.from(shot.result.data, 'base64'));
  }
  const probe = await evaluate(`(() => {
    const c = document.createElement('canvas');
    return { webgl: !!(c.getContext('webgl2') || c.getContext('webgl')), scrollWidth: document.documentElement.scrollWidth,
      innerWidth, height: document.documentElement.scrollHeight, htmlClass: document.documentElement.className };
  })()`);
  report[w] = { probe, logs: [...logs] };
  // a scrollWidth larger than innerWidth is horizontal overflow: something sticks out on that width
  console.log(`w${w}: ${JSON.stringify(probe)}`);
  for (const l of logs.slice(0, 25)) console.log('   ' + l.slice(0, 300));
}
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
ws.close(); chrome.kill();
process.exit(0);
