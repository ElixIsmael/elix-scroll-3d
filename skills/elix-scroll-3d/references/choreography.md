# Scroll choreography

## Standard architecture

Fixed canvas covering the viewport, HTML sections scrolling over it. **The 3D
does not scroll. The content does.** Scroll position becomes a number that
commands the scene.

```html
<div class="stage">
  <canvas id="scene"></canvas>   <!-- position: fixed, inset: 0, z-index: 0 -->
  <div class="content">          <!-- position: relative, z-index: 1 -->
    <section>...</section>
    <section>...</section>
  </div>
</div>
```

The canvas never moves. Sections scroll normally, so the browser keeps native
scrolling, native find-in-page, and native accessibility.

## Single timeline

One GSAP timeline with `scrub` drives everything. Never independent animations
that can drift apart from each other.

```js
const state = { progress: 0, cameraT: 0, explode: 0, reveal: 0 };

gsap.timeline({
  scrollTrigger: {
    trigger: '.stage',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,            // numeric, not true: adds smoothing
  },
})
  .to(state, { cameraT: 0.4, ease: 'power2.out' })
  .to(state, { explode: 1, ease: 'power1.inOut' })
  .to(state, { cameraT: 1, ease: 'power2.in' });
```

`scrub: true` binds the animation rigidly to the scroll position and reads as
mechanical. A numeric value is the catch-up duration in seconds and is what makes
the motion feel physical. Starting point: 0.5 to 1.5, adjust by feel.

## Animation and rendering are separate

GSAP animates a plain state object. The render loop reads that state and applies
it to the scene.

```js
function render() {
  camera.position.copy(curve.getPointAt(state.cameraT));
  lid.position.y = state.explode * 0.8;
  renderer.render(scene, camera);
}
```

**Never let GSAP write directly into 3D object properties.** The moment anything
else touches the same property, two systems fight over it and the result depends
on execution order. Keeping GSAP on a state object also makes the whole scene
inspectable and drivable from a debug slider.

## Camera on a curve

The detail that is usually omitted: **sample by arc length, not by raw
parameterization.**

A curve's raw parameter `t` is not distributed evenly along its length. Control
points cluster where the curve bends, so a camera moving at constant `t` speeds
up and slows down on its own through curved segments. That reads as a bug, and
worse, it fights whatever pacing the easing was supposed to express.

In Three.js the distinction is in the method name:

| Method | Parameterization | Use |
|--------|-----------------|-----|
| `getPoint(t)` | Raw | Avoid for camera motion |
| `getPointAt(u)` | Arc length | Correct for camera motion |
| `getTangent(t)` | Raw | Avoid |
| `getTangentAt(u)` | Arc length | Correct |

```js
const curve = new THREE.CatmullRomCurve3(points);
curve.curveType = 'centripetal';   // avoids overshoot at sharp control points

const position = curve.getPointAt(state.cameraT);
const tangent = curve.getTangentAt(state.cameraT);
```

Pacing belongs in the timeline easing, where it is intentional and adjustable.
Not in an artifact of the curve geometry, where it is invisible and untunable.

For look direction, aim slightly ahead along the curve rather than at a fixed
point, or the camera appears to drag:

```js
const lookAhead = curve.getPointAt(Math.min(state.cameraT + 0.02, 1));
camera.lookAt(lookAhead);
```

## Pacing

Constant speed from start to finish leaves the middle empty. The visitor arrives
at the interesting part with no sense of having travelled.

The shape that works:

| Phase | Motion | Purpose |
|-------|--------|---------|
| Departure | Fast | Establishes that scrolling drives the scene |
| Middle | Slow | Content breathes, text is readable, detail is legible |
| Arrival | Accelerating into resolution | Lands on the climax, which is the CTA |

Express this with easing per timeline segment, not by changing scroll distances.

## Embedded animation driven by scroll

When the model ships usable clips, drive the mixer from a time computed from
progress, never from frame delta.

```js
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(clip);
action.play();
action.paused = true;             // scroll owns the time, not the clock

function render() {
  action.time = state.progress * clip.duration;
  mixer.update(0);                // 0 delta: we set time explicitly
  renderer.render(scene, camera);
}
```

`mixer.update(delta)` advances by wall clock, which means the animation runs
forward regardless of scroll direction. Setting `action.time` makes it run
forward and backward with the scroll, which is what the visitor expects.

## Text synchronized, not glued

Text blocks sit still, in a comfortable reading position, timed to scene
progress. They do not travel with the animated element.

| Approach | Result |
|----------|--------|
| Text follows the moving object | Unreadable, especially on a phone. The eye cannot track and read at once. |
| Text fixed, opacity and position timed to progress | Readable, and still feels connected |

The sense of following comes from synchronization, not from moving the text.

```js
gsap.timeline({ scrollTrigger: { /* same trigger */ scrub: 1 } })
  .to('.caption-1', { opacity: 1, y: 0 })
  .to('.caption-1', { opacity: 0 }, '+=0.3')
  .to('.caption-2', { opacity: 1, y: 0 });
```

**All text lives in HTML above the canvas.** Never rendered into a texture.
Reasons: sharpness at any size and pixel ratio, indexing by search engines, and
screen reader access. See [fallback-seo.md](fallback-seo.md).

## Authoring tool

Build this early. It pays for itself within the first hour.

```js
const debug = document.querySelector('#scrub');   // <input type="range" min=0 max=1 step=0.001>
debug.addEventListener('input', (e) => {
  timeline.progress(parseFloat(e.target.value));
});
```

Tuning poses by dragging a slider is qualitatively different from scrolling the
page repeatedly to reach the same moment. Add a readout of the current state
values so poses can be recorded as numbers.

Gate it behind a query parameter so it never ships enabled.

## Limits

- Never hijack scroll to the point where the visitor loses control of the page.
- There is always a clear path to the footer without watching the entire animation.
- Scroll distance must stay proportionate. A scene that needs six viewport heights
  to advance is a scene that will be abandoned.
- Momentum scrolling libraries that replace native scroll break find-in-page,
  keyboard scrolling, and accessibility tooling. Use them only with a specific
  reason, and test what they broke.

## Render loop

| Rule | Reason |
|------|--------|
| Pause when the scene leaves the viewport | Rendering something nobody sees burns battery |
| Pause when the tab is hidden | Use `visibilitychange` |
| No object allocation inside the loop | Every `new THREE.Vector3()` per frame feeds the garbage collector, which is what causes periodic stutter |
| Render on demand when idle | If nothing changed, do not render |
| Cap pixel ratio | See [mobile.md](mobile.md). Most common cause of frame rate collapse. |

```js
const _v = new THREE.Vector3();     // allocated once, reused every frame

let running = false;
const io = new IntersectionObserver(([entry]) => {
  running = entry.isIntersecting;
  if (running) loop();
});
io.observe(canvas);

document.addEventListener('visibilitychange', () => {
  running = !document.hidden && isInView;
  if (running) loop();
});
```
