import { createBook } from './models/book.js';
import { createScarf } from './models/scarf.js';
import { createSilhouette } from './models/silhouette.js';
import { createScissors } from './models/scissors.js';
import { createBirds } from './models/birds.js';
import { createFlight } from './models/flight.js';
import { toGlyphPolygons, bounds } from './geometry.js';
import { GlyphStage } from './glyph-stage.js';

// Las seis piezas de la obra. El encuadre no es generico: cada pieza se
// compone para su propia vista, y rotX/rotY estan en grados.
const PIECES = [
  { id: 'book', create: createBook, title: 'El libro quemado' },
  { id: 'scarf', create: createScarf, title: 'El pañuelo' },
  { id: 'silhouette', create: createSilhouette, title: 'La silueta' },
  { id: 'scissors', create: createScissors, title: 'Las tijeras' },
  { id: 'birds', create: createBirds, title: 'Los pájaros' },
  { id: 'flight', create: createFlight, title: 'El vuelo' },
];

// Pose de camara por artefacto: rotX/rotY en grados, zoom en celdas por
// unidad. Cada pieza tiene su propia vista; no hay pose generica.
// Las poses se calibraron leyendo la silueta en texto plano
// (tools/dump-pose.mjs, tools/find-pose.mjs): el libro se lee abierto con el
// lomo al medio (rotY 90), la silueta de persona de frente (rotY 90) y las
// tijeras y el avion de perfil (rotY 30).
const POSES = {
  book: { rotX: 70, rotY: 90, zoom: 120 },
  scarf: { rotX: 20, rotY: 30, zoom: 120 },
  silhouette: { rotX: 80, rotY: 90, zoom: 120 },
  scissors: { rotX: 60, rotY: 30, zoom: 120 },
  birds: { rotX: 40, rotY: 0, zoom: 120 },
  flight: { rotX: 20, rotY: 30, zoom: 120 },
};

const host = document.getElementById('stage');
const stage = new GlyphStage(host);

// Trampa de errores: cualquier excepcion queda en el DOM, para poder verla
// en el volcado sin abrir el navegador.
const errors = [];
addEventListener('error', (e) => errors.push(`${e.message} @ ${e.filename}:${e.lineno}`));
addEventListener('unhandledrejection', (e) => errors.push(`rejection: ${e.reason}`));

// La tipografia falla en silencio: se espera a que las fuentes esten listas y se
// mide el avance real de la celda antes de calcular la grilla.
await document.fonts.ready;
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-size:10px';
probe.style.fontFamily = "'Sligoil Micro',ui-monospace,'Cascadia Mono',Consolas,monospace";
probe.textContent = 'MMMMMMMMMM';
document.body.appendChild(probe);
const cellW = probe.getBoundingClientRect().width / 10;
probe.remove();
stage.setCellMetrics(cellW || 6, 10);

const corpus = await fetch('assets/texts/texts.json').then((r) => r.json());
const quoteFor = (id) => corpus.texts.find((t) => t.piece === id);

const q = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Override de encuadre para ajustar la pose de una pieza: ?piece=book&rx=90&ry=180
// y ?p=0.5 para ver un estado intermedio sin scrollear.
const debugPiece = q.get('piece');
const poseOverride = { rx: q.has('rx') ? parseFloat(q.get('rx')) : null, ry: q.has('ry') ? parseFloat(q.get('ry')) : null };
const debugP = q.has('p') ? parseFloat(q.get('p')) : null;

function poseOf(id) {
  const pose = { ...POSES[id] };
  if (debugPiece === id) {
    if (poseOverride.rx !== null) pose.rotX = poseOverride.rx;
    if (poseOverride.ry !== null) pose.rotY = poseOverride.ry;
  }
  return pose;
}

// Modelos: se construyen los seis, pero solo se dibuja la pieza activa.
const models = new Map();
for (const piece of PIECES) models.set(piece.id, piece.create());

// La grilla se dimensiona antes de cualquier encuadre: medir sobre una grilla
// de 80x24 en vez de la real deja las piezas fuera de cuadro.
stage.resize(host.clientWidth, host.clientHeight);

// Calentado: leer las texturas de cada pieza y rasterizarla una vez cuesta
// ~85 ms la primera vez. Eso pasa durante la carga, no en pleno scroll.
// De paso queda calculado el encuadre de cada pieza.
for (const piece of PIECES) {
  const model = models.get(piece.id);
  const pose = poseOf(piece.id);
  stage.camera.rotX = pose.rotX;
  stage.camera.rotY = pose.rotY;
  stage.camera.zoom = pose.zoom;
  model.update(0);
  stage.setPolygons(toGlyphPolygons(model.root));
  stage.fittedZoom(piece.id);
}

// ---------------------------------------------------------------- scroll ----
// El estado de cada pieza es funcion de su progreso local, sin memoria:
// subir deshace lo que bajar hizo.

const FREEZE_LO = 0.05;
const FREEZE_HI = 0.85;

// p local: progreso de la seccion, con aire de lectura al principio y al final.
function progressOf(section) {
  const rect = section.getBoundingClientRect();
  const top = rect.top + scrollY;
  const travel = section.offsetHeight - innerHeight;
  if (travel <= 0) return 0;
  return clamp((scrollY - top) / travel, 0, 1);
}

// El estado se congela fuera de [FREEZE_LO, FREEZE_HI]: la pieza tiene aire.
function stateOf(p) {
  return clamp((p - FREEZE_LO) / (FREEZE_HI - FREEZE_LO), 0, 1);
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// ------------------------------------------------------------- secciones ----

const sections = [...document.querySelectorAll('.piece')].map((el) => ({
  el,
  id: el.dataset.piece,
  p: 0,
  state: 0,
}));

// La pieza activa es la ultima que ya paso por el centro de la ventana.
// Con la regla de "la que contiene el centro", el cierre (que no es una
// pieza) dejaba al escenario en la primera pieza: al final de la obra
// el colofon se leia sobre el libro.
function activeIndex() {
  const mid = innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].el.getBoundingClientRect();
    if (rect.top <= mid) idx = i;
  }
  return idx;
}

// ----------------------------------------------------------------- escena ----

let current = -1;
let yaw = 0;
let pitch = 0;

function applyPiece(index) {
  const section = sections[index];
  const piece = PIECES.find((p) => p.id === section.id);
  const model = models.get(section.id);
  const pose = poseOf(section.id);

  stage.camera.rotX = pose.rotX + pitch;
  stage.camera.rotY = pose.rotY + yaw;
  stage.camera.zoom = pose.zoom;

  const quote = quoteFor(section.id);
  stage.setText(quote ? quote.excerpt : '');

  document.querySelectorAll('.piece').forEach((el) => el.classList.toggle('is-active', el === section.el));
  current = index;
  updateReadingColumn(section.id);
  redraw();
  // El encuadre de cada pieza se calculo en el calentamiento: reutilizarlo
  // evita dos renders extra en cada cambio de pieza.
  stage.fittedZoom(section.id);
}

// Vuelve a construir los poligonos de la pieza activa: el estado cambia la
// geometria (las hojas se encogen, la tela se abre), no solo el color.
function redraw() {
  const section = sections[current];
  if (!section) return;
  const model = models.get(section.id);
  model.update(section.state);
  stage.setPolygons(toGlyphPolygons(model.root));
}

// --------------------------------------------------------------- scroll ------

const damped = new Map();
let last = performance.now();

function frame(now) {
  const dt = Math.min(1 / 20, (now - last) / 1000);
  last = now;

  const idx = debugPiece ? sections.findIndex((s) => s.id === debugPiece) : activeIndex();
  if (idx >= 0 && idx !== current) applyPiece(idx);

  const section = sections[current];
  if (!section) { requestAnimationFrame(frame); return; }
  let target = debugP !== null ? debugP : stateOf(progressOf(section.el));
  // Movimiento reducido: el estado salta en cuatro escalones, sin morphing.
  if (reduceMotion) target = Math.round(target * 3) / 3;
  const prev = damped.get(section.id) ?? target;
  // Amortiguacion exponencial: el estado sigue al scroll sin pegarse.
  const next = (reduceMotion || debugP !== null)
    ? target
    : prev + (target - prev) * (1 - Math.exp(-dt * 5));
  damped.set(section.id, next);

  // La geometria se reconstruye solo cuando el estado cambio lo bastante:
  // convertir 19.000 triangulos cuesta ~16 ms y no vale la pena por centesimas.
  if (Math.abs(next - section.state) > 0.008) {
    section.state = next;
    redraw();
    updateGlow(next);
  }
  updateParallax(progressOf(section.el));

  requestAnimationFrame(frame);
}

// El glow se actualiza en umbrales de estado, no en cada frame.
const GLOW_STEPS = [0, 0.33, 0.66, 1];
let glowStep = -1;
function updateGlow(state) {
  const step = GLOW_STEPS.findIndex((s) => state < s + 0.34);
  const idx = step < 0 ? GLOW_STEPS.length - 1 : step;
  if (idx === glowStep) return;
  glowStep = idx;
  document.documentElement.style.setProperty('--glow', String(GLOW_STEPS[idx]));
}

// Parallax del objeto: -3% a +3%. El texto legible no se mueve.
function updateParallax(p) {
  const scene = host.querySelector('.glyph-scene');
  if (scene) scene.style.transform = `translate3d(0,${(p - 0.5) * 6}%,0)`;
}

// --------------------------------------------------------------- arrastre ----
// El arrastre gira la pieza y nada mas. Sin clic, sin estado, sin rebote.

let dragging = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;

host.addEventListener('pointerdown', (e) => {
  dragging = true;
  startX = lastX = e.clientX;
  startY = lastY = e.clientY;
  host.setPointerCapture(e.pointerId);
});

host.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  // A los 4 px de desplazamiento se considera arrastre; antes, no pasa nada.
  if (Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  // Tope elastico: fuera de rango la pieza se resiste, no rebota.
  yaw = clamp(yaw + dx * 0.25, -35, 35);
  pitch = clamp(pitch + dy * 0.12, -12, 12);
  const pose = poseOf(sections[current].id);
  stage.camera.rotX = pose.rotX + pitch;
  stage.camera.rotY = pose.rotY + yaw;
  stage.handle.rerender();
});

host.addEventListener('pointerup', (e) => {
  dragging = false;
  host.releasePointerCapture(e.pointerId);
});
host.addEventListener('pointercancel', () => { dragging = false; });

// -------------------------------------------------------------- teclado ------
// ArrowRight/ArrowLeft saltan al inicio de la pieza siguiente o anterior.

window.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const target = e.target;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  e.preventDefault();
  const idx = activeIndex() + (e.key === 'ArrowRight' ? 1 : -1);
  const next = sections[clamp(idx, 0, sections.length - 1)];
  if (next) next.el.scrollIntoView({ behavior: 'auto', block: 'start' });
});

// ------------------------------------------------------------------ fit ------
// El redimensionado recalcula la grilla: el encuadre de cada pieza vuelve a
// medirse, porque la proporcion de la grilla cambia.

const fit = () => {
  stage.resize(host.clientWidth, host.clientHeight);
  stage.fitCache.clear();
  const section = sections[current];
  if (section) {
    const model = models.get(section.id);
    const pose = poseOf(section.id);
    stage.camera.rotX = pose.rotX;
    stage.camera.rotY = pose.rotY;
    stage.camera.zoom = pose.zoom;
    model.update(section.state);
    stage.setPolygons(toGlyphPolygons(model.root));
    stage.fittedZoom(section.id);
  } else {
    stage.fit();
  }
};
window.addEventListener('resize', fit);

requestAnimationFrame(frame);

// Columna de lectura: el texto completo vive en el DOM desde el primer render.
// El servidor ya lo inyecta desde el corpus; esto solo completa lo que falte
// (por ejemplo, si el documento se abre sin pasar por server.py).
function updateReadingColumn(id) {
  const quote = quoteFor(id);
  const block = document.querySelector(`[data-piece="${id}"]`);
  if (!block || !quote) return;
  const p = block.querySelector('.citation p');
  const footer = block.querySelector('.citation footer');
  if (p && !p.textContent.trim()) p.textContent = quote.excerpt;
  if (footer && !footer.textContent.trim()) {
    footer.textContent = quote.author
      ? `${quote.author}, ${quote.work}${quote.year ? ', ' + quote.year : ''}`
      : 'Sin atribucion: texto provisorio.';
  }
}

for (const piece of PIECES) updateReadingColumn(piece.id);

// Creditos: por cita, autor, obra, ano y procedencia verificada.
{
  const box = document.querySelector('.credits');
  if (box && !box.textContent.trim()) {
    box.innerHTML = corpus.texts.map((t) => `
      <div class="credits-item">
        <p class="credits-cite">${escapeHtml(t.excerpt)}</p>
        <p class="credits-meta">${escapeHtml(t.author)}${t.work ? ', ' + escapeHtml(t.work) : ''}${t.year ? ', ' + t.year : ''}. ${escapeHtml(t.source || '')}</p>
        <p class="credits-meta">${escapeHtml(t.license || '')}</p>
      </div>`).join('');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Sonda: recorre la obra con el scroll y deja el informe en el DOM.
//   ?probe=1
if (q.has('probe')) {
  const report = [];
  const steps = 30;
  let frames = 0;
  const count = () => { frames++; requestAnimationFrame(count); };
  requestAnimationFrame(count);
  (async () => {
    for (let i = 0; i <= steps; i++) {
      const y = (document.body.scrollHeight - innerHeight) * (i / steps);
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
      const active = document.querySelector('.piece.is-active');
      const sec = active ? sections.find((s) => s.id === active.dataset.piece) : null;
      report.push({
        want: Math.round(y),
        real: Math.round(scrollY),
        max: document.body.scrollHeight - innerHeight,
        piece: active ? active.dataset.piece : null,
        state: sec ? sec.state.toFixed(2) : null,
        frames,
      });
    }
    const out = document.createElement('pre');
    out.id = 'report';
    out.textContent = JSON.stringify({ report, errors }, null, 1);
    document.body.appendChild(out);
  })();
}

window.__artefactos = { stage, models, corpus, sections };

// Diagnostico: caja envolvente y triangulos de cada pieza, para encuadrar.
if (q.has('diag')) {
  const diag = document.createElement('pre');
  diag.id = 'diag';
  const at = debugP !== null ? debugP : 0;
  const cs = getComputedStyle(stage.output);
  const rect = stage.output.getBoundingClientRect();
  diag.textContent = PIECES.map((piece) => {
    const model = models.get(piece.id);
    model.update(at);
    const polys = toGlyphPolygons(model.root);
    const b = bounds(polys);
    const size = [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ].map((v) => v.toFixed(2)).join(' x ');
    return `${piece.id}: tris ${polys.length} bbox ${size} centro ${((b.minX + b.maxX) / 2).toFixed(2)},${((b.minY + b.maxY) / 2).toFixed(2)},${((b.minZ + b.maxZ) / 2).toFixed(2)}`;
  }).join('\n') + `\npre font ${cs.fontSize}/${cs.lineHeight} family ${cs.fontFamily} rect ${rect.width.toFixed(1)}x${rect.height.toFixed(1)} cellW ${cellW} stage ${host.clientWidth}x${host.clientHeight}`
    + `\nerrores: ${errors.length ? errors.join(' | ') : 'ninguno'}`;
  document.body.appendChild(diag);
}
