// A Three.js stage that stays cheap and sharp (references/budget.md,
// references/choreography.md).
//
// - Transparent canvas: the page background shows through, so a patterned
//   background never reveals the canvas edge as a seam.
// - Native antialiasing and no post-processing. An EffectComposer renders into
//   a target without multisampling, which is what makes edges look pixelated,
//   and bloom on top reads as glow everywhere.
// - Pixel ratio capped at 2 and by a pixel budget.
// - The loop runs only while the canvas is near the viewport and the tab is visible.
// - One adaptive step down if the first frames run slow.
// - prepare() compiles shaders and draws the first frame before the canvas is shown.
//
// Map "three" with an importmap or a bundler. Numbers are starting points, not
// measurements.
import * as THREE from 'three';

export function createStage(canvas, {
  fov = 32, near = 0.1, far = 100,
  maxPixels = 3.6e6,   // drawing buffer budget, device pixels
  minFps = 45,         // below this, sustained over the sampling window, step down once
} = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);

  const stage = {
    renderer, scene, camera, w: 0, h: 0, dpr: 1, scale: 1, reduced,
    update: null,      // (t, dt) => void, every frame, before rendering
    onResize: null,    // ({ w, h, dpr }) => void, after the drawing buffer changes
    onDegrade: null,   // () => void, after the one step down: drop decorative layers here
  };

  function resize(force = false) {
    const box = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width)), h = Math.max(1, Math.round(box.height));
    if (!force && w === stage.w && h === stage.h) return false;
    stage.w = w; stage.h = h;
    const base = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(maxPixels / (w * h)));
    stage.dpr = base >= 1 ? Math.max(1, base * stage.scale) : base;
    renderer.setPixelRatio(stage.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.onResize?.({ w, h, dpr: stage.dpr });
    return true;
  }

  let running = false, visible = false, raf = 0, last = 0, t = 0, samples = 0, acc = 0, sampled = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; t += dt;
    resize();
    stage.update?.(t, dt);
    renderer.render(scene, camera);
    // skip the warm-up frames, then average a window; one step down at most
    if (!sampled && ++samples > 30) {
      acc += dt;
      if (samples === 120) {
        sampled = true;
        if (acc / 90 > 1 / minFps) {
          stage.scale = 0.75;
          resize(true);
          stage.onDegrade?.();
        }
      }
    }
    if (reduced) stop();          // reduced motion: one static frame, redrawn on resize
  }
  function start() { if (running || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // draw once without starting the loop, for a state change while idle
  stage.render = () => { resize(); stage.update?.(t, 0); renderer.render(scene, camera); };
  stage.start = start;

  // compile every material and draw the first frame, so the reveal does not stutter
  stage.prepare = async () => {
    resize(true);
    stage.update?.(0, 0);
    try { await renderer.compileAsync(scene, camera); } catch {}
    renderer.render(scene, camera);
    stage.ready = true;
    new ResizeObserver(() => { if (resize() && !running) stage.render(); }).observe(canvas.parentElement);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { rootMargin: '100px 0px' })
      .observe(canvas.parentElement);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    return stage;
  };

  return stage;
}

// Point sprites with a soft edge and normal blending: overlapping points do not
// add up to a glow. A ShaderMaterial skips the output color space conversion
// unless the shader includes it, which is why the last line matters.
export function softPointsMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uScale: { value: 400 }, uFocus: { value: 12 }, uRange: { value: 6 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float aSize; attribute float aAlpha;
      uniform float uScale, uFocus, uRange;
      varying vec3 vColor; varying float vBlur; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float depth = max(0.1, -mv.z);
        vBlur = clamp(abs(depth - uFocus) / uRange, 0.0, 1.0);
        vColor = color; vAlpha = aAlpha;
        gl_PointSize = max(1.5, aSize * uScale / depth * (1.0 + vBlur * 0.7));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vBlur; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = (1.0 - smoothstep(0.5 - mix(0.08, 0.34, vBlur), 0.5, d)) * mix(1.0, 0.4, vBlur) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }`,
  });
}
// uScale for softPointsMaterial: device pixels per world unit at distance 1.
// Set it in onResize: (h * dpr) / (2 * tan(fov / 2)).
