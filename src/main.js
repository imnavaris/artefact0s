import { createBook } from './models/book.js';
import { createScarf } from './models/scarf.js';
import { createSilhouette } from './models/silhouette.js';
import { createScissors } from './models/scissors.js';
import { createBirds } from './models/birds.js';
import { createFlight } from './models/flight.js';
import { toGlyphPolygons, bounds } from './geometry.js';
import { GlyphStage } from './glyph-stage.js';

const PIECES = [
  { id: 'book', create: createBook, title: 'El libro quemado' },
  { id: 'scarf', create: createScarf, title: 'El pañuelo' },
  { id: 'silhouette', create: createSilhouette, title: 'La silueta' },
  { id: 'scissors', create: createScissors, title: 'Las tijeras' },
  { id: 'birds', create: createBirds, title: 'Los pájaros' },
  { id: 'flight', create: createFlight, title: 'El vuelo' },
];

const POSES = {
  book: { rotX: 70, rotY: 90, zoom: 120 },
  scarf: { rotX: 80, rotY: 90, zoom: 120 },
  silhouette: { rotX: 80, rotY: 90, zoom: 120 },
  scissors: { rotX: 60, rotY: 30, zoom: 120 },
  birds: { rotX: 40, rotY: 0, zoom: 120 },
  flight: { rotX: 20, rotY: 30, zoom: 120 },
};

const host = document.getElementById('stage');
const stage = new GlyphStage(host);

const errors = [];
addEventListener('error', (e) => errors.push(`${e.message} @ ${e.filename}:${e.lineno}`));
addEventListener('unhandledrejection', (e) => errors.push(`rejection: ${e.reason}`));

await document.fonts.ready;

let cellW = 8;

function measureCellMetrics() {
  const probe = document.createElement('span');
  const computedCellH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-h')) || 14;
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-size:${computedCellH}px`;
  probe.style.fontFamily = "'Sligoil Micro',ui-monospace,'Cascadia Mono',Consolas,monospace";
  probe.textContent = 'MMMMMMMMMM';
  document.body.appendChild(probe);
  cellW = probe.getBoundingClientRect().width / 10 || 8;
  probe.remove();
  stage.setCellMetrics(cellW, computedCellH);
}

measureCellMetrics();

const corpus = await fetch('assets/texts/texts.json').then((r) => r.json());
const quoteFor = (id) => corpus.texts.find((t) => t.piece === id);

const q = new URLSearchParams(location.search);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const models = new Map();
for (const piece of PIECES) models.set(piece.id, piece.create());

stage.resize(host.clientWidth, host.clientHeight);

for (const piece of PIECES) {
  const model = models.get(piece.id);
  const pose = poseOf(piece.id);
  stage.camera.rotX = pose.rotX;
  stage.camera.rotY = pose.rotY;
  stage.camera.zoom = pose.zoom;
  model.update(0);
  const polys0 = toGlyphPolygons(model.root);
  model.update(1);
  const polys1 = toGlyphPolygons(model.root);
  stage.fitMultiState(piece.id, [polys1, polys0]);
  model.update(0);
}

const FREEZE_LO = 0.05;
const FREEZE_HI = 0.85;

function progressOf(section) {
  return clamp((scrollY - section.top) / section.travel, 0, 1);
}

function stateOf(p) {
  return clamp((p - FREEZE_LO) / (FREEZE_HI - FREEZE_LO), 0, 1);
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

const sections = [...document.querySelectorAll('.piece')].map((el) => ({
  el,
  id: el.dataset.piece,
  p: 0,
  state: 0,
  top: 0,
  travel: 1,
}));

function measureSections() {
  for (const s of sections) {
    s.top = docTop(s.el);
    s.travel = Math.max(1, s.el.offsetHeight - innerHeight);
  }
}

function docTop(el) {
  let y = 0;
  let node = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return y;
}
measureSections();

function activeIndex() {
  const mid = scrollY + innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].top <= mid) idx = i;
  }
  return idx;
}

let current = -1;
const userAngles = new Map();

function applyPiece(index) {
  const section = sections[index];
  const pose = poseOf(section.id);
  const angles = userAngles.get(section.id) || { yaw: 0, pitch: 0 };
  yaw = angles.yaw;
  pitch = angles.pitch;

  stage.camera.rotX = pose.rotX + pitch;
  stage.camera.rotY = pose.rotY + yaw;
  stage.camera.zoom = stage.fitCache.get(section.id) ?? pose.zoom;

  const quote = quoteFor(section.id);
  stage.setText(quote ? (quote.inscription || quote.excerpt) : '');

  document.querySelectorAll('.piece').forEach((el) => el.classList.toggle('is-active', el === section.el));
  current = index;
  updateReadingColumn(section.id);
  redraw();
}

function redraw() {
  const section = sections[current];
  if (!section) return;
  const model = models.get(section.id);
  model.update(section.state);
  stage.setBurn(model.burn ? model.burn(section.state) : 0);
  stage.setPolygons(toGlyphPolygons(model.root));
}

const damped = new Map();
let last = performance.now();

function frame(now) {
  const dt = Math.min(1 / 20, (now - last) / 1000);
  last = now;

  const idx = debugPiece ? sections.findIndex((s) => s.id === debugPiece) : activeIndex();
  if (idx >= 0 && idx !== current) applyPiece(idx);

  const section = sections[current];
  if (!section) { requestAnimationFrame(frame); return; }
  let target = debugP !== null ? debugP : stateOf(progressOf(section));
  if (reduceMotion) target = Math.round(target * 3) / 3;
  const prev = damped.get(section.id) ?? target;
  const next = (reduceMotion || debugP !== null)
    ? target
    : prev + (target - prev) * (1 - Math.exp(-dt * 5));
  damped.set(section.id, next);

  if (Math.abs(next - section.state) > 0.018) {
    section.state = next;
    redraw();
    updateGlow(next);
  }
  updateParallax(progressOf(section));

  requestAnimationFrame(frame);
}

const GLOW_STEPS = [0.72, 0.86, 1];
let glowStep = -1;
function updateGlow(state) {
  const idx = state > 0.15 && state < 0.85 ? 2 : state > 0.02 ? 1 : 0;
  if (idx === glowStep) return;
  glowStep = idx;
  document.documentElement.style.setProperty('--glow', String(GLOW_STEPS[idx]));
}

let sceneEl = null;
function updateParallax(p) {
  if (reduceMotion) return;
  if (!sceneEl) sceneEl = host.querySelector('.glyph-scene');
  if (sceneEl) sceneEl.style.transform = `translate3d(0,${(p - 0.5) * 6}%,0)`;
}

let dragging = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let yaw = 0;
let pitch = 0;

host.addEventListener('pointerdown', (e) => {
  dragging = true;
  startX = lastX = e.clientX;
  startY = lastY = e.clientY;
  host.setPointerCapture(e.pointerId);
});

host.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  if (Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  yaw += dx * 0.25;
  if (Math.abs(yaw) > 3600) yaw -= Math.trunc(yaw / 360) * 360;
  pitch = clamp(pitch + dy * 0.12, -90, 90);
  userAngles.set(sections[current].id, { yaw, pitch });
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

window.addEventListener('keydown', (e) => {
  const target = e.target;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

  if (e.shiftKey && (e.key.startsWith('Arrow'))) {
    e.preventDefault();
    if (current < 0) return;
    const secId = sections[current].id;
    let angles = userAngles.get(secId) || { yaw: 0, pitch: 0 };
    if (e.key === 'ArrowLeft') angles.yaw -= 12;
    if (e.key === 'ArrowRight') angles.yaw += 12;
    if (e.key === 'ArrowUp') angles.pitch = clamp(angles.pitch - 8, -85, 85);
    if (e.key === 'ArrowDown') angles.pitch = clamp(angles.pitch + 8, -85, 85);
    userAngles.set(secId, angles);
    yaw = angles.yaw;
    pitch = angles.pitch;
    const pose = poseOf(secId);
    stage.camera.rotX = pose.rotX + pitch;
    stage.camera.rotY = pose.rotY + yaw;
    stage.handle.rerender();
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const milestones = [
      document.getElementById('threshold'),
      ...sections.map(s => s.el),
      document.getElementById('credits')
    ].filter(Boolean);

    const mid = scrollY + innerHeight * 0.35;
    let curIdx = 0;
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].getBoundingClientRect().top + scrollY <= mid) curIdx = i;
    }
    const targetIdx = clamp(curIdx + (e.key === 'ArrowRight' ? 1 : -1), 0, milestones.length - 1);
    milestones[targetIdx].scrollIntoView({ behavior: 'auto', block: 'start' });
  }
});

const fit = () => {
  measureCellMetrics();
  stage.resize(host.clientWidth, host.clientHeight);
  stage.fitCache.clear();
  measureSections();
  const section = sections[current];
  if (section) {
    const model = models.get(section.id);
    const pose = poseOf(section.id);
    const angles = userAngles.get(section.id) || { yaw: 0, pitch: 0 };
    yaw = angles.yaw;
    pitch = angles.pitch;
    stage.camera.rotX = pose.rotX;
    stage.camera.rotY = pose.rotY;
    stage.camera.zoom = pose.zoom;
    model.update(0);
    const polys0 = toGlyphPolygons(model.root);
    model.update(1);
    const polys1 = toGlyphPolygons(model.root);
    stage.fitMultiState(section.id, [polys1, polys0]);
    stage.camera.rotX = pose.rotX + pitch;
    stage.camera.rotY = pose.rotY + yaw;
    redraw();
  } else {
    stage.fit();
  }
};
window.addEventListener('resize', fit);

requestAnimationFrame(frame);

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

{
  const box = document.querySelector('.credits');
  if (box && !box.textContent.trim()) {
    box.innerHTML = corpus.texts.map((t) => `
      <div class="credits-item">
        <p class="credits-cite">${escapeHtml(t.excerpt)}</p>
        <p class="credits-meta">${escapeHtml(t.author)}${t.work ? ', ' + escapeHtml(t.work) : ''}${t.year ? ', ' + t.year : ''}. ${escapeHtml(t.source || '')}</p>
        <p class="credits-meta">${escapeHtml(t.license || '')}</p>
        ${t.inscription ? `<p class="credits-meta">Inscripción de la pieza: ${escapeHtml(t.inscription)}. ${escapeHtml(t.inscription_source || '')}</p>` : ''}
      </div>`).join('');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

if (debugPiece) {
  const debugSec = sections.find((s) => s.id === debugPiece);
  if (debugSec) {
    if (debugP === null) {
      debugSec.el.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      scrollTo(0, debugSec.top);
    }
  }
}

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
