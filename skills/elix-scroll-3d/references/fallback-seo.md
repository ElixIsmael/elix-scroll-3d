# Fallback, accessibility, and indexing

A canvas is opaque to search engines, screen readers, translation tools, and
find-in-page. Everything that matters must exist outside it.

## Content in real HTML

Every piece of text content exists in the HTML, never only drawn into the scene.

| Content | Where it lives |
|---------|---------------|
| Headings, body copy, captions | HTML above the canvas |
| Calls to action | Real `<a>` or `<button>` elements |
| Product names, specifications, prices | HTML |
| Labels attached to 3D points | HTML positioned over the canvas |

Test: disable WebGL and read the page. If the argument no longer holds, the
content is trapped in the canvas.

Second test: view the rendered HTML source. What is not there is what Google does
not have. A crawler executing JavaScript still needs the text to end up in the
DOM, and the sooner it is there, the more reliably it is indexed.

## Protecting the LCP

**The 3D canvas must never be the LCP element.**

Sequence:

1. Server or static HTML delivers heading, copy, and a poster image
2. The poster image is the LCP candidate and is optimized as such
3. The scene initializes behind or beneath the poster
4. When the scene is ready, cross-fade the poster out

The poster must be a real render of the scene's opening frame, not a placeholder.
Two benefits: the transition is invisible, and the page is already correct before
any JavaScript runs.

Reserve the canvas dimensions in CSS so nothing shifts when it mounts. Layout
shift here is measured directly by CLS. Thresholds in [budget.md](budget.md).

## Reduced motion

`prefers-reduced-motion` is a stated accessibility need, not a performance
signal. For people with vestibular disorders, camera motion through a 3D space is
a symptom trigger.

**A slower animation is not the accommodation.** The accommodation is an
equivalent static version that communicates the same content.

| Motion preference | What is served |
|-------------------|---------------|
| No preference | Full scroll-driven scene |
| Reduce | Static renders at the key moments, with the same captions, revealed on scroll as ordinary fades or with no animation at all |

Build the variants with `gsap.matchMedia`, which handles setup and teardown when
the preference changes:

```js
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const tl = gsap.timeline({ scrollTrigger: { /* ... */ scrub: 1 } });
  // full choreography
  return () => tl.kill();
});

mm.add('(prefers-reduced-motion: reduce)', () => {
  showStaticSequence();
  return () => teardownStatic();
});
```

The content parity requirement is the point: the reduced version must carry the
same information, including whatever the mechanic was demonstrating. If the
animation was the argument, the static version needs to make that argument in
images and text.

## Keyboard

- Every interactive element reachable by Tab, in a sensible order
- Visible focus indicator, never removed without a replacement
- The scene must not trap focus
- Any information available only by dragging the scene must also be available
  another way
- Standard keyboard scrolling still works, which is another reason not to replace
  native scroll

## No WebGL, or loading failure

Both must have defined behavior. Neither is rare: WebGL is disabled by policy on
some managed devices, blocked by some privacy configurations, and unavailable
when the GPU driver is blocklisted.

```js
function canRenderScene() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

if (!canRenderScene()) {
  showStaticSequence();
}
```

Cover, at minimum:

| Failure | Behavior |
|---------|----------|
| No WebGL | Static sequence, no error shown to the visitor |
| Model fetch fails | Static sequence, and log it for yourself |
| Context lost | Listen for `webglcontextlost`, prevent default, attempt restore, fall back after a failed attempt |
| Slow network | Poster stays until ready. Never an empty canvas. |
| `saveData` enabled | Treat as an explicit request. Serve static. |

The visitor should never see a broken state, an error message, or an empty
rectangle. They see the static version, which was always a complete page.

## Structured data

If the scene presents a product, the product exists in structured data
independently of the scene. The canvas contributes nothing to a rich result.

## Verification

| Check | Method |
|-------|--------|
| Content present without JavaScript | Disable JavaScript, read the page |
| Content present without WebGL | Disable WebGL, read the page |
| Reduced motion path works | Toggle the OS setting, reload |
| Keyboard path works | Tab through without touching the mouse |
| LCP is not the canvas | Lighthouse, or the web-vitals library, and read which element it names |
| No layout shift on mount | Watch CLS while the scene initializes |
