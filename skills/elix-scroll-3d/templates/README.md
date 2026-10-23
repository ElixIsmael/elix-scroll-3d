# Templates

Starting code taken from a production page and generalized. Copy a file into the
project and adapt it: these are starting points, not a library, and every number
in them is an adjustable starting point.

| File | What it gives you | Preset |
|------|-------------------|--------|
| `fly-cards.js` | Real DOM cards floating in perspective beside a hero, landing in their slots of the real interface as the page scrolls | 7. Interface fly-in |
| `stage.js` | A Three.js stage: transparent canvas, native antialiasing, pixel budget, loop only while visible, one adaptive step down, preparation before reveal, soft points material | 8. Constellation, and any procedural scene |
| `scroll.js` | Progress counted from section entry, frame-rate independent smoothing, one callback per frame, idle or near loading | Both |

## Interface fly-in: wiring

```js
import { createFlyCards } from './fly-cards.js';

const fly = createFlyCards({
  cards: [...document.querySelectorAll('.people > li')],   // slot order
  text: document.querySelector('.hero-inner'),
  lines: '.hero-title, .hero-sub',
  blocks: '.btn',
});
fly.prepare();                     // right after the cards are rendered
intro.finished.then(fly.enter);    // or call fly.enter() at once when there is no intro
```

CSS the cards need:

```css
.card { perspective: 1100px; }                     /* only if the card flips; the flight carries its own */
.card.floating .card-face { box-shadow: 0 30px 60px -24px rgba(0, 0, 0, .85); }
.card-face::after {                                /* a faint sheen while floating */
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(120deg, rgba(255, 255, 255, .07), transparent 42%);
  opacity: 0; transition: opacity .5s ease;
}
.card.floating .card-face::after { opacity: 1; }
```

Below `minWidth` the cards never float. Give them an ordinary entrance there
(a staggered fade up when the list enters the viewport) so the phone still gets
motion without a flight across the content.

## Stage: skeleton of a scene

```js
import * as THREE from 'three';
import { createStage, softPointsMaterial } from './stage.js';
import { entryProgress, onScrollFrame, smooth, whenIdleOrNear } from './scroll.js';

whenIdleOrNear(section, async () => {
  const stage = createStage(canvas);
  const points = new THREE.Points(geometry, softPointsMaterial());
  stage.scene.add(points);
  stage.onResize = ({ h, dpr }) => {
    points.material.uniforms.uScale.value = (h * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2)));
  };
  stage.onDegrade = () => { dust.visible = false; };
  let p = 0, target = 0;
  onScrollFrame(() => { target = entryProgress(section); });
  stage.update = (t, dt) => { p = smooth(p, target, dt, 6); /* pose the scene from p */ };
  await stage.prepare();
  canvas.classList.add('on');      /* fade the canvas in now that the first frame exists */
});
```
