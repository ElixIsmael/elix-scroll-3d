// Scroll progress without a library (references/choreography.md, "Without GSAP").
// Native scroll stays native: find-in-page, keyboard, and accessibility tooling
// keep working, and no smoothing library sits between the visitor and the page.

export const clamp01 = v => Math.min(1, Math.max(0, v));

// Frame-rate independent catch-up: the vanilla equivalent of a numeric scrub.
// rate 9 settles in roughly half a second. Starting point, tune by feel.
export const smooth = (current, target, dt, rate = 9) => current + (target - current) * (1 - Math.exp(-dt * rate));

// Progress of a tall section with a sticky stage, counted from its entry:
// 0 when its top reaches the bottom of the viewport, 1 when its bottom does.
// The stage sticks at innerHeight / height, so the scene is already forming
// when it pins and the first pinned screen is never empty.
export function entryProgress(section) {
  const r = section.getBoundingClientRect();
  return clamp01((innerHeight - r.top) / Math.max(1, r.height));
}

// Calls fn at most once per frame while the page scrolls or resizes.
export function onScrollFrame(fn) {
  let ticking = false;
  const run = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; fn(); });
  };
  addEventListener('scroll', run, { passive: true });
  addEventListener('resize', run);
  run();
  return () => { removeEventListener('scroll', run); removeEventListener('resize', run); };
}

// Starts heavy work (the 3D library, the scene, shader compilation) once the
// page has loaded and the browser is idle, or earlier if the section comes
// close. The idle path is skipped when the visitor asked to save data, so the
// download only happens if they actually scroll there.
export function whenIdleOrNear(section, start, { margin = '120% 0px', timeout = 2500 } = {}) {
  let started = false;
  const go = () => { if (!started) { started = true; start(); } };
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout }) : setTimeout(go, 1500));
  if (!navigator.connection?.saveData) {
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  }
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); go(); } }, { rootMargin: margin }).observe(section);
}
