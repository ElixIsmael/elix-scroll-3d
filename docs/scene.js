// elix-scroll-3d — a página que se abre em camadas.
//
// Segue a própria skill: cena procedural (zero modelo baixado), GSAP anima só um
// objeto de estado, o loop de render lê esse estado, câmera amostrada por
// comprimento de arco, tier medido em tempo de execução, e qualquer falha cai na
// versão estática, que já é uma página completa.

const html = document.documentElement;
const params = new URLSearchParams(location.search);
const STILL = params.has('still') ? Math.min(1, Math.max(0, parseFloat(params.get('still')) || 0)) : null;
const DEBUG = params.has('debug');
const CAPTURE = STILL !== null;

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
const ST_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';

// Proporção de referência dos renders estáticos (800x900). A câmera enquadra a
// cena como "object-fit: contain" nessa proporção, para o poster casar com o
// primeiro quadro e a troca ser invisível.
const REF_ASPECT = 800 / 900;
const BASE_FOV = 30;

const TIERS = [
  { name: 'low', dpr: 1, particles: 0, tex: 256, aa: false },
  { name: 'medium', dpr: 1.5, particles: 260, tex: 512, aa: true },
  { name: 'high', dpr: 2, particles: 600, tex: 1024, aa: true },
];

let teardown = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

function toStatic(reason) {
  if (teardown) { teardown(); teardown = null; }
  html.dataset.mode = 'static';
  console.info('[elix-scroll-3d] static version:', reason);
}

// Sem sinal, assume médio. Nunca alto por padrão, e nunca "celular = fraco".
function initialTier() {
  const cores = navigator.hardwareConcurrency;
  const mem = navigator.deviceMemory;
  if (cores === undefined && mem === undefined) return 1;
  if ((mem !== undefined && mem <= 2) || (cores !== undefined && cores <= 2)) return 0;
  if (cores >= 8 && (mem === undefined || mem >= 8)) return 2;
  return 1;
}

function cssVar(name) {
  return getComputedStyle(html).getPropertyValue(name).trim();
}

// ---------- arte das camadas, desenhada em código ----------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function textLines(ctx, x, y, w, rows, gap, h, color, alpha) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < rows; i++) {
    const lw = i === rows - 1 ? w * 0.55 : w * (0.86 + ((i * 37) % 13) / 100);
    roundRect(ctx, x, y + i * gap, Math.min(lw, w), h, h / 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLayer(kind, s, colors) {
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s * 2;
  const ctx = c.getContext('2d');
  const W = s, H = s * 2, R = s * 0.09, u = s / 100;

  if (kind === 'fallback') {
    roundRect(ctx, 0, 0, W, H, R);
    ctx.fillStyle = '#17152a';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colors.fallback;
    ctx.globalAlpha = 0.28;
    roundRect(ctx, 8 * u, 18 * u, 84 * u, 66 * u, 3 * u);
    ctx.fill();
    ctx.globalAlpha = 1;
    textLines(ctx, 8 * u, 96 * u, 70 * u, 2, 9 * u, 6 * u, colors.fallback, 0.75);
    textLines(ctx, 8 * u, 120 * u, 84 * u, 5, 6 * u, 2.6 * u, colors.fallback, 0.45);
    textLines(ctx, 8 * u, 160 * u, 84 * u, 4, 6 * u, 2.6 * u, colors.fallback, 0.45);
    ctx.restore();
  }

  if (kind === 'canvas') {
    roundRect(ctx, 0, 0, W, H, R);
    ctx.fillStyle = '#06161b';
    ctx.fill();
    ctx.save();
    ctx.clip();
    // chão em perspectiva
    ctx.strokeStyle = colors.canvas;
    ctx.lineWidth = Math.max(1, 0.35 * u);
    const hy = 52 * u;
    for (let i = 0; i <= 14; i++) {
      ctx.globalAlpha = 0.12 + (i / 14) * 0.3;
      const y = hy + Math.pow(i / 14, 1.8) * (H - hy);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
      ctx.globalAlpha = 0.22;
      ctx.beginPath(); ctx.moveTo(W / 2 + i * 2 * u, hy); ctx.lineTo(W / 2 + i * 22 * u, H); ctx.stroke();
    }
    // forma em arame
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(1, 0.5 * u);
    const cx = W / 2, cy = 112 * u, r = 26 * u;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * Math.abs(Math.cos((i / 6) * Math.PI)) + 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * Math.abs(Math.cos((i / 6) * Math.PI)) + 0.5, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  if (kind === 'poster') {
    // o poster cobre só a área da primeira dobra
    const x = 6 * u, y = 14 * u, w = 88 * u, h = 72 * u;
    roundRect(ctx, x, y, w, h, 3 * u);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffcf80');
    g.addColorStop(1, '#d9741f');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff1d6';
    ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.32, 9 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a3d0c';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.3, y + h * 0.5);
    ctx.lineTo(x + w * 0.52, y + h * 0.78);
    ctx.lineTo(x + w * 0.72, y + h * 0.58);
    ctx.lineTo(x + w, y + h * 0.9);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
    ctx.restore();
  }

  if (kind === 'html') {
    // fundo transparente: o texto flutua sobre o poster e o canvas
    textLines(ctx, 8 * u, 5 * u, 30 * u, 1, 0, 3 * u, colors.html, 0.9);
    textLines(ctx, 70 * u, 5 * u, 22 * u, 1, 0, 3 * u, colors.html, 0.5);
    textLines(ctx, 8 * u, 96 * u, 80 * u, 2, 10 * u, 7 * u, colors.html, 0.95);
    textLines(ctx, 8 * u, 122 * u, 84 * u, 4, 6 * u, 2.6 * u, colors.html, 0.6);
    ctx.fillStyle = colors.poster;
    roundRect(ctx, 8 * u, 152 * u, 38 * u, 10 * u, 5 * u);
    ctx.fill();
    ctx.strokeStyle = colors.html;
    ctx.lineWidth = Math.max(1, 0.5 * u);
    ctx.globalAlpha = 0.7;
    roundRect(ctx, 50 * u, 152 * u, 38 * u, 10 * u, 5 * u);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  return c;
}

// ---------- cena ----------

function buildScene(THREE, gsap) {
  const palco = document.getElementById('palco');
  const poster = palco.querySelector('.poster');
  const labels = [...palco.querySelectorAll('.etiqueta')];
  const hud = document.getElementById('hud');
  const hudTier = hud.querySelector('[data-hud="tier"]');
  const hudDpr = hud.querySelector('[data-hud="dpr"]');
  const hudFps = hud.querySelector('[data-hud="fps"]');

  let tierIndex = CAPTURE ? 2 : initialTier();
  const tier = () => TIERS[tierIndex];

  const canvas = document.createElement('canvas');
  palco.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: CAPTURE || tier().aa, alpha: true, powerPreference: 'high-performance',
    preserveDrawingBuffer: CAPTURE,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(BASE_FOV, REF_ASPECT, 0.1, 60);
  const root = new THREE.Group();
  scene.add(root);

  const colors = {
    html: cssVar('--camada-html'),
    poster: cssVar('--camada-poster'),
    canvas: cssVar('--camada-canvas'),
    fallback: cssVar('--camada-fallback'),
    accent: cssVar('--destaque'),
  };

  // Telefone: 1.6 x 3.2. Camada 0 na frente, 3 atrás, como numa página de verdade.
  const W = 1.6, H = 3.2;
  const kinds = ['html', 'poster', 'canvas', 'fallback'];
  const disposables = [];

  const outlineShape = new THREE.Shape();
  {
    const r = W * 0.09, x = -W / 2, y = -H / 2;
    outlineShape.moveTo(x + r, y);
    outlineShape.lineTo(x + W - r, y);
    outlineShape.quadraticCurveTo(x + W, y, x + W, y + r);
    outlineShape.lineTo(x + W, y + H - r);
    outlineShape.quadraticCurveTo(x + W, y + H, x + W - r, y + H);
    outlineShape.lineTo(x + r, y + H);
    outlineShape.quadraticCurveTo(x, y + H, x, y + H - r);
    outlineShape.lineTo(x, y + r);
    outlineShape.quadraticCurveTo(x, y, x + r, y);
  }
  const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlineShape.getPoints(8));
  const planeGeo = new THREE.PlaneGeometry(W, H);
  disposables.push(outlineGeo, planeGeo);

  const layers = kinds.map((kind, i) => {
    const tex = new THREE.CanvasTexture(drawLayer(kind, tier().tex, colors));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(planeGeo, mat);
    const lineMat = new THREE.LineBasicMaterial({ color: colors[kind], transparent: true, opacity: 0.5 });
    const line = new THREE.LineLoop(outlineGeo, lineMat);
    const g = new THREE.Group();
    g.add(mesh, line);
    g.renderOrder = 3 - i;
    mesh.renderOrder = 3 - i;
    root.add(g);
    disposables.push(tex, mat, lineMat);
    // explodir ao longo do vetor centróide do conjunto → centróide da peça
    return { g, mat, lineMat, closedZ: (1.5 - i) * 0.05, openZ: (1.5 - i) * 0.85 };
  });

  // moldura do clímax: a página remontada, contornada na cor de ação
  const frameMat = new THREE.LineBasicMaterial({ color: colors.accent, transparent: true, opacity: 0 });
  const frame = new THREE.LineLoop(outlineGeo, frameMat);
  frame.scale.set(1.06, 1.03, 1);
  frame.position.z = 0.12;
  root.add(frame);
  disposables.push(frameMat);

  // poeira: o alavanca mais barata de cortar por tier
  const maxParticles = TIERS[2].particles;
  const pos = new Float32Array(maxParticles * 3);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < maxParticles; i++) {
    pos[i * 3] = (rnd() - 0.5) * 12;
    pos[i * 3 + 1] = (rnd() - 0.5) * 9;
    pos[i * 3 + 2] = (rnd() - 0.5) * 10 - 1;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: colors.canvas, size: 0.025, transparent: true, opacity: 0.45, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  disposables.push(dustGeo, dustMat);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.15, 9.2),
    new THREE.Vector3(3.4, 0.9, 8.3),
    new THREE.Vector3(7.4, 1.5, 6.3),
    new THREE.Vector3(8.8, 0.8, 4.4),
    new THREE.Vector3(3.2, 0.4, 8.5),
    new THREE.Vector3(0, 0.1, 9.0),
  ]);
  curve.curveType = 'centripetal';

  // O estado que o GSAP anima. Nada do three.js é tocado pelo GSAP.
  const state = { cam: 0, explode: 0, dim: 0, h0: 0, h1: 0, h2: 0, h3: 0, frame: 0 };
  const last = { ...state };

  // vetores alocados uma vez e reaproveitados em todo quadro
  const _corner = new THREE.Vector3();
  const _target = new THREE.Vector3(0, 0, 0);

  let boxW = 0, boxH = 0;
  const labelW = [0, 0, 0, 0];
  let needsRender = true;

  function applyTier() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CAPTURE ? 1 : tier().dpr));
    dustGeo.setDrawRange(0, tier().particles);
    hudTier.textContent = tier().name;
    hudDpr.textContent = renderer.getPixelRatio().toFixed(1);
    needsRender = true;
  }

  function resize() {
    const r = palco.getBoundingClientRect();
    if (r.width === boxW && r.height === boxH) return;
    boxW = r.width;
    boxH = r.height;
    const aspect = boxW / boxH;
    camera.aspect = aspect;
    if (aspect >= REF_ASPECT) {
      camera.fov = BASE_FOV;
    } else {
      // mais estreito que a referência: abre o FOV vertical para manter a largura
      const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * REF_ASPECT);
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) / aspect));
    }
    camera.updateProjectionMatrix();
    renderer.setSize(boxW, boxH, false);
    // largura lida aqui, uma vez, e não a cada quadro
    labels.forEach((l, i) => { labelW[i] = l.offsetWidth; });
    needsRender = true;
  }

  function render() {
    const hs = [state.h0, state.h1, state.h2, state.h3];
    for (let i = 0; i < 4; i++) {
      const L = layers[i];
      L.g.position.z = L.closedZ + (L.openZ - L.closedZ) * state.explode;
      const k = 1 - state.dim * (1 - hs[i]) * 0.78;
      L.mat.opacity = k;
      L.lineMat.opacity = (0.35 + 0.65 * hs[i]) * k;
    }
    frameMat.opacity = state.frame;

    camera.position.copy(curve.getPointAt(state.cam));
    camera.lookAt(_target);
    renderer.render(scene, camera);

    // etiquetas em HTML sobre o canvas, presas ao canto de cada camada
    for (let i = 0; i < 4; i++) {
      _corner.set(-W / 2, H / 2, layers[i].g.position.z).project(camera);
      // alturas alternadas para camadas vizinhas não se sobreporem
      const x = Math.min(Math.max((_corner.x * 0.5 + 0.5) * boxW, 4), boxW - labelW[i] - 4);
      const y = (-_corner.y * 0.5 + 0.5) * boxH - 30 - (i % 2) * 32;
      const show = Math.max(0, (state.explode - 0.55) / 0.45);
      labels[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      // em caixa estreita as quatro não cabem: só a camada em foco ganha etiqueta
      const weight = boxW < 560 ? hs[i] : 0.45 + 0.55 * Math.max(hs[i], 1 - state.dim);
      labels[i].style.opacity = (show * weight).toFixed(3);
    }
  }

  function changed() {
    let c = false;
    for (const k in state) {
      if (state[k] !== last[k]) { last[k] = state[k]; c = true; }
    }
    return c;
  }

  // ---------- medição de quadro e ajuste de tier ----------
  let prevT = 0, samples = 0, acc = 0, idleSince = 0, slowWindows = 0, fastWindows = 0;
  function measure(t, rendered) {
    if (!rendered) {
      prevT = 0;
      if (!idleSince) idleSince = t;
      if (t - idleSince > 600) hudFps.textContent = 'idle · not rendering';
      return;
    }
    idleSince = 0;
    if (prevT) {
      acc += t - prevT;
      samples++;
    }
    prevT = t;
    if (samples < 45) return;
    const fps = 1000 / (acc / samples);
    samples = 0;
    acc = 0;
    hudFps.textContent = Math.round(fps) + ' fps';
    if (DEBUG) return;   // autoria: tier travado, para a medição não trocar a página sob o slider
    if (fps < 30) {
      slowWindows++;
      fastWindows = 0;
      if (slowWindows >= 2) {
        slowWindows = 0;
        if (tierIndex > 0) { tierIndex--; applyTier(); }
        else toStatic('sustained frame rate under 30 on the lowest tier');
      }
    } else if (fps > 57) {
      fastWindows++;
      slowWindows = 0;
      // sobe no máximo até alto, e só depois de três janelas boas seguidas
      if (fastWindows >= 3 && tierIndex < 2) { fastWindows = 0; tierIndex++; applyTier(); }
    } else {
      slowWindows = 0;
      fastWindows = 0;
    }
  }

  // ---------- loop: pausa fora da tela, renderiza só quando algo mudou ----------
  let raf = 0, running = false, onScreen = true, warmup = CAPTURE ? 0 : 45;
  function loop(t) {
    raf = 0;
    if (!running) return;
    const dirty = changed() || needsRender || warmup > 0;
    if (dirty) {
      render();
      needsRender = false;
      // o poster sai assim que o canvas tem um quadro; o aquecimento segue medindo
      if (warmup > 0) {
        warmup--;
        if (warmup === 43) palco.classList.add('pronto');
      }
    }
    measure(t, dirty);
    raf = requestAnimationFrame(loop);
  }
  function setRunning() {
    const want = onScreen && !document.hidden;
    if (want === running) return;
    running = want;
    hud.style.visibility = want ? '' : 'hidden';
    if (running && !raf) { prevT = 0; raf = requestAnimationFrame(loop); }
  }

  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(); });
  io.observe(document.getElementById('historia'));
  const onVisibility = () => setRunning();
  document.addEventListener('visibilitychange', onVisibility);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  ro.observe(palco);

  // contexto perdido: tenta restaurar, e cai no estático se não voltar
  let lostTimer = 0;
  const onLost = (e) => {
    e.preventDefault();
    running = false;
    lostTimer = setTimeout(() => toStatic('WebGL context lost and not restored'), 3000);
  };
  const onRestored = () => {
    clearTimeout(lostTimer);
    needsRender = true;
    setRunning();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  // ---------- a linha do tempo única ----------
  const scrubbed = !(DEBUG || CAPTURE);
  const tl = gsap.timeline({
    paused: !scrubbed,
    defaults: { duration: 1 },
    scrollTrigger: scrubbed
      ? { trigger: '#historia', start: 'top top', end: 'bottom bottom', scrub: 1 }
      : undefined,
  });
  tl.to(state, { explode: 0.3, cam: 0.18, ease: 'power2.out' })                 // saída rápida
    .to(state, { explode: 1, cam: 0.38, dim: 1, h0: 1, ease: 'sine.inOut' })    // meio lento
    .to(state, { cam: 0.5, h0: 0, h1: 1, ease: 'sine.inOut' })
    .to(state, { cam: 0.6, h1: 0, h2: 1, ease: 'sine.inOut' })
    .to(state, { cam: 0.7, h2: 0, h3: 1, ease: 'sine.inOut' })
    .to(state, { cam: 1, explode: 0, dim: 0, h3: 0, frame: 1, ease: 'power2.in' }); // chegada no CTA

  if (DEBUG) {
    const panel = document.getElementById('depuracao');
    const input = panel.querySelector('input');
    const out = panel.querySelector('output');
    panel.style.display = 'flex';
    panel.removeAttribute('aria-hidden');
    input.addEventListener('input', () => {
      tl.progress(parseFloat(input.value));
      out.textContent = Object.entries(state).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(' · ');
    });
  }

  applyTier();
  resize();

  if (CAPTURE) {
    tl.progress(STILL);
    render();
    html.dataset.capturado = '1';
  } else {
    setRunning();
  }

  return function dispose() {
    running = false;
    cancelAnimationFrame(raf);
    tl.scrollTrigger && tl.scrollTrigger.kill();
    tl.kill();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    clearTimeout(lostTimer);
    clearTimeout(resizeTimer);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    canvas.remove();
    palco.classList.remove('pronto');
    poster.style.opacity = '';
  };
}

async function start() {
  if (CAPTURE) html.classList.add('captura');
  html.dataset.mode = 'scene';

  const [THREE] = await Promise.all([
    import(THREE_URL),
    loadScript(GSAP_URL).then(() => loadScript(ST_URL)),
  ]);
  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  // reduced motion pode mudar com a página aberta: monta e desmonta junto
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (html.dataset.failed) return;
    html.dataset.mode = 'scene';
    try {
      teardown = buildScene(THREE, gsap);
    } catch (e) {
      html.dataset.failed = '1';
      toStatic(e.message);
    }
    return () => toStatic('reduced motion requested');
  });
  if (CAPTURE && !teardown) teardown = buildScene(THREE, gsap);
}

if (html.dataset.mode === 'scene' || CAPTURE) {
  start().catch((e) => {
    html.dataset.failed = '1';
    toStatic(e.message);
  });
}
