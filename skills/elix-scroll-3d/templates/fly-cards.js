// Interface fly-in (references/presets.md, preset 7).
//
// Real DOM cards start floating in perspective beside a hero block and land in
// their slots of the real interface as the page scrolls. The cards are the
// interface itself, not copies: text stays sharp at any pixel ratio, their state
// keeps updating while they float, and no WebGL is involved.
//
// Markup contract:
//   - each card is laid out in its final slot by ordinary CSS (grid, list)
//   - each card has exactly one inner wrapper (card.firstElementChild); the
//     entrance opacity goes there, so it never fights a CSS transition on the card
//   - no ancestor between the cards and the hero clips overflow
//   - the destination sits directly under the hero, with no section heading in
//     between, because the flight crosses whatever is in that gap
//
// Every number below is a starting point taken from one production page, not a
// benchmark. Tune it with the page in front of you.

const clamp01 = v => Math.min(1, Math.max(0, v));
const range = (p, a, b) => clamp01((p - a) / (b - a));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// One pose per card, in slot order (here a 3 by 2 grid, left to right, top to bottom).
// side: -1 left of the text, 1 right of it.
// u: 0 at the outer edge of the side zone, 1 next to the text.
// v: 0 at the top of the text block, 1 at its bottom.
// s: scale while floating. Keep it at or below 1: the card is rasterized at full
//    size and shrunk, never blown up from a small raster.
// rx, ry, rz: tilt in degrees, turned toward the text. d: depth, weights the
//    pointer parallax from 0 to 1.
export const SIX_CARDS = [
  { side: -1, u: 0.78, v: 0.03, s: 0.8, rx: -5, ry: 20, rz: -2.5, d: 1 },
  { side: -1, u: 0.1, v: 0.5, s: 0.68, rx: 3, ry: 27, rz: 2, d: 0.55 },
  { side: 1, u: 0.72, v: 0.07, s: 0.78, rx: -4, ry: -19, rz: 2.5, d: 0.9 },
  { side: -1, u: 0.62, v: 0.97, s: 0.74, rx: 6, ry: 16, rz: -1, d: 0.8 },
  { side: 1, u: 0.14, v: 0.55, s: 0.66, rx: 2, ry: -26, rz: -2, d: 0.5 },
  { side: 1, u: 0.66, v: 0.95, s: 0.74, rx: 6, ry: -15, rz: 1.5, d: 0.85 },
];

export function createFlyCards({
  cards,                       // elements in slot order, one pose each
  text,                        // the hero block the cards float around
  lines = 'h1, p',             // inline text inside `text`: its real line width bounds the side zones
  blocks = '.btn',             // block elements inside `text` that also bound them
  poses = SIX_CARDS,
  minWidth = 1100,             // below this viewport width the cards stay in their slots
  maxComposition = 1560,       // width the composition may span on very large screens, px
  gap = 40,                    // clearance between the text and a side zone, px
  minZone = 0.58,              // narrowest usable side zone, as a fraction of the card width
  landAt = 0.56,               // cards land when the slots' center reaches this fraction of the viewport height
  smoothing = 9,               // scroll catch-up rate; higher is snappier, lower is floatier
  stagger = 0.02,              // per card, in progress units
  bob = 6,                     // idle float amplitude, px
  parallax = [14, 9],          // pointer parallax at full depth, px (x, y)
  lift = 48,                   // the entrance rises from this far below, px
  floatingClass = 'floating',  // toggled on each card while it floats, for shadow and sheen
} = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia(`(min-width: ${minWidth}px)`);
  const noop = { prepare() {}, enter() {}, refresh() {}, destroy() {} };
  if (reduced || !cards?.length || !text) return noop;

  const off = new AbortController();
  let L = { on: false }, p = 1, mx = 0, my = 0, tmx = 0, tmy = 0;
  let raf = 0, last = 0, enterAt = -1, measured = false;

  function textBounds() {
    // the block is wider than its lines: measure the lines themselves
    let l = Infinity, r = -Infinity;
    const rg = document.createRange();
    text.querySelectorAll(lines).forEach(el => {
      rg.selectNodeContents(el);
      for (const b of rg.getClientRects()) if (b.width) { l = Math.min(l, b.left); r = Math.max(r, b.right); }
    });
    text.querySelectorAll(blocks).forEach(el => {
      const b = el.getBoundingClientRect(); l = Math.min(l, b.left); r = Math.max(r, b.right);
    });
    const t = text.getBoundingClientRect();
    return { l, r, top: t.top, bottom: t.bottom };
  }

  function measure() {
    // measure the untransformed layout: the slots are the truth
    cards.forEach(c => { c.style.transform = ''; c.firstElementChild.style.opacity = ''; c.classList.remove(floatingClass); });
    measured = true;
    const vw = document.documentElement.clientWidth, sy = scrollY;
    const rects = cards.map(c => c.getBoundingClientRect());
    const cw = rects[0].width;
    const tb = textBounds();
    const comp = Math.min(vw, maxComposition);
    const outer = (vw - comp) / 2 + Math.max(24, comp * 0.03);
    const zoneW = Math.min(tb.l - gap - outer, vw - outer - (tb.r + gap));
    if (!wide.matches || cards.length > poses.length || zoneW < cw * minZone) { L = { on: false }; return; }
    const top = tb.top + sy + 6, h = Math.max(220, tb.bottom - tb.top - 12);
    const items = cards.map((el, i) => {
      const f = poses[i], r = rects[i];
      const s = Math.min(f.s, (zoneW * 0.98) / cw);
      const w = cw * s;
      const zl = f.side < 0 ? outer : vw - outer - zoneW;
      const u = f.side < 0 ? f.u : 1 - f.u;
      const cx = zl + w / 2 + u * Math.max(0, zoneW - w);
      const cy = top + f.v * h;
      return { el, inner: el.firstElementChild, f, s, dx: cx - (r.left + r.width / 2), dy: cy - (r.top + sy + r.height / 2) };
    });
    let gTop = Infinity, gBottom = -Infinity;
    rects.forEach(r => { gTop = Math.min(gTop, r.top + sy); gBottom = Math.max(gBottom, r.bottom + sy); });
    const start = Math.max(0, tb.top + sy - innerHeight * 0.25);
    const end = Math.max(start + 260, (gTop + gBottom) / 2 - innerHeight * landAt);
    L = { on: true, items, start, end };
  }

  const target = () => (L.on ? clamp01((scrollY - L.start) / (L.end - L.start)) : 1);

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!L.on) return;
    const pt = target();
    p += (pt - p) * (1 - Math.exp(-dt * smoothing));
    if (Math.abs(pt - p) < 0.0004) p = pt;
    mx += (tmx - mx) * (1 - Math.exp(-dt * 3.5));
    my += (tmy - my) * (1 - Math.exp(-dt * 3.5));
    const t = now / 1000, te = enterAt < 0 ? -1 : t - enterAt;
    let active = false;
    L.items.forEach((it, i) => {
      const { el, inner, f } = it;
      // Vertical travel is nearly linear, so on screen the card barely moves and
      // waits while the interface rises to meet it. Moving to its column, the
      // tilt, and the scale happen late. One eased curve for everything makes
      // the card ride up with the hero and then race across the content.
      const u = range(p, i * stagger, 0.88 + i * stagger);
      const kv = 1 - (0.8 * u + 0.2 * easeInOut(u));
      const k = 1 - easeInOut(range(p, 0.25 + i * stagger, 0.9 + i * stagger));
      const en = te < 0 ? 0 : easeOut(range(te, 0.12 + i * 0.07, 1.1 + i * 0.07));
      if (k < 0.0004 && kv < 0.0004 && (en >= 1 || te < 0)) {
        // settled: no transform at all, so the final state is crisp and fully interactive
        if (el.style.transform) { el.style.transform = ''; inner.style.opacity = ''; el.classList.remove(floatingClass); }
        return;
      }
      active = true;
      const tx = it.dx * k + mx * parallax[0] * f.d * k;
      const ty = it.dy * kv + Math.sin(t * 0.9 + i * 1.7) * bob * k + my * parallax[1] * f.d * k + (1 - en) * lift * k;
      const sc = (1 + (it.s - 1) * k) * (1 - (1 - en) * 0.05 * k);
      const rx = (f.rx - my * 4 * f.d) * k, ry = (f.ry + mx * 5 * f.d) * k, rz = f.rz * k;
      el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const op = 1 - k * (1 - en);
      inner.style.opacity = op < 0.999 ? op.toFixed(3) : '';
      el.classList.toggle(floatingClass, k > 0.05);
    });
    if (active) raf = requestAnimationFrame(frame);
  }

  const kick = () => { if (!raf && L.on) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const refresh = () => { measure(); p = target(); kick(); };

  addEventListener('scroll', kick, { passive: true, signal: off.signal });
  // phones resize on every address bar change; without floating cards only the width matters
  let rt = 0, lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW && !L.on) return;
    lastW = innerWidth;
    clearTimeout(rt); rt = setTimeout(refresh, 120);
  }, { signal: off.signal });
  document.fonts?.ready.then(() => { if (!off.signal.aborted) refresh(); });
  addEventListener('load', refresh, { once: true, signal: off.signal });
  if (fine) addEventListener('pointermove', e => {
    tmx = (e.clientX / innerWidth) * 2 - 1; tmy = (e.clientY / innerHeight) * 2 - 1;
    if (p < 1) kick();
  }, { passive: true, signal: off.signal });

  return {
    // after the cards exist: measures, and keeps floating cards hidden until enter()
    prepare() { measure(); p = target(); if (L.on) { last = performance.now(); frame(last); } },
    // when the intro is over: the floating cards fade in at their poses
    enter() { if (!measured) measure(); p = target(); enterAt = performance.now() / 1000; kick(); },
    // after a layout change that moves the slots
    refresh,
    destroy() {
      off.abort(); cancelAnimationFrame(raf); raf = 0;
      cards.forEach(c => { c.style.transform = ''; c.firstElementChild.style.opacity = ''; c.classList.remove(floatingClass); });
    },
  };
}
