import { createGlyphScene, createGlyphOrthographicCamera } from 'glyphcss';

const CELL_W = 8;
const CELL_H = 14;

// Fuego volumetrico en 3D que envuelve la curvatura real de las paginas del libro
const FIRE = ' .,:;+*xX#%@';
const ASH = '.,\'`';
const FIRE_MAX = 36;
const NOISE = ' .:-=+*#%@';
const DISPERSE = ' .:-=+*#%@abcdefghijklmnopqrstuvwxyz';

const lerp = (a, b, t) => a + (b - a) * t;
const FIRE_COLORS = Array.from({ length: FIRE_MAX + 1 }, (_, h) => {
 const t = h / FIRE_MAX;
 const stops = [[80, 42, 14], [180, 96, 22], [235, 165, 38], [255, 225, 130], [255, 248, 220]];
 const f = t * (stops.length - 1);
 const i = Math.min(stops.length - 2, Math.floor(f));
 const k = f - i;
 const c = stops[i].map((v, j) => Math.round(lerp(v, stops[i + 1][j], k)));
 return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
});

function hash(r, c) {
 return Math.abs((r * 73856093) ^ (c * 19349663));
}

function isTvScreenCell(col) {
 if (typeof col !== 'string' || col.length !== 7 || col[0] !== '#') return false;
 const r = parseInt(col.slice(1, 3), 16);
 const b = parseInt(col.slice(5, 7), 16);
 return b - r >= 12;
}

export class GlyphStage {
 constructor(host, opts = {}) {
 this.host = host;
 this.text = '';
 this.lines = [];
 this.stream = '';
 this.burn = 0;
 this.scatter = 0;
 this.tvStatic = 0;
 this.tvTime = 0;
 this.extent = null;
 this.gd = null;
 this.heat = null;
 this.occ = null;
 this.cellW = CELL_W;
 this.cellH = CELL_H;
 this.cols = 80;
 this.rows = 24;
 this.cellAspect = CELL_H / CELL_W;
 this.camera = createGlyphOrthographicCamera({ rotX: 62, rotY: -20, zoom: 120 });
 this.handle = createGlyphScene(host, {
 camera: this.camera,
 cols: this.cols,
 rows: this.rows,
 cellAspect: this.cellAspect,
 mode: 'solid',
 glyphPalette: 'default',
 useColors: true,
 colorTolerance: 6,
 retainShade: true,
 depthEpsilon: 0.02,
 supersample: 1, // Supersample 1 para fluidez absoluta a 60 FPS sin tirones
 smoothShading: false,
 doubleSided: opts.doubleSided !== false,
 directionalLight: { direction: [0.45, 0.65, 0.8], intensity: 1.1 },
 ambientLight: { intensity: 0.55 },
 transformCells: (grid) => this.sculpt(grid),
 });
 }

 get output() { return this.handle.output; }

 setText(text) {
 this.lines = String(text || '')
 .split('\n')
 .map((line) => line.trim())
 .filter(Boolean)
 .map((line) => line.split(/\s+/).join('·'));
 this.text = text;
 this.stream = this.lines.join('·') + '·';
 }

 setBurn(value) {
 const b = value > 0 ? (value < 1 ? value : 1) : 0;
 if (b === 0) this.heat = null;
 this.burn = b;
 }

 setScatter(value) {
 this.scatter = Math.max(0, Math.min(1, value || 0));
 }

 setTvStatic(amp, now = 0) {
 this.tvStatic = Math.max(0, Math.min(1, amp || 0));
 this.tvTime = now || 0;
 }

 sculpt(grid) {
 let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
 for (let r = 0; r < grid.rows; r++) {
 for (let c = 0; c < grid.cols; c++) {
 const i = r * grid.cols + c;
 if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
 if (c < minC) minC = c;
 if (c > maxC) maxC = c;
 if (r < minR) minR = r;
 if (r > maxR) maxR = r;
 }
 }
 this.extent = maxC < 0 ? null : { minC, maxC, minR, maxR };
 this.gd = { cols: grid.cols, rows: grid.rows };
 if (!this.occ || this.occ.length !== grid.cols * grid.rows) this.occ = new Uint8Array(grid.cols * grid.rows);
 this.occ.fill(0);
 const stream = this.stream;
 let idx = 0;
 const tick = Math.floor(this.tvTime / 35);
 const e = this.extent;
 const barRow = e ? e.minR + (((this.tvTime * 0.015) % 1) * (e.maxR - e.minR + 1)) : 0;

 for (let r = 0; r < grid.rows; r++) {
 let wrote = false;
 for (let c = 0; c < grid.cols; c++) {
 const i = r * grid.cols + c;
 if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
 this.occ[i] = 1;
 const col = grid.color ? grid.color[i] : '';
 if (isTvScreenCell(col)) {
 if (this.tvStatic <= 0.02) {
 grid.char[i] = (r + c) % 6 === 0 ? '·' : '.';
 if (grid.color) grid.color[i] = '#222632';
 } else {
 const h = hash(r + tick * 17, c + tick * 31) % 1000 / 1000;
 const barDist = Math.abs(r - barRow);
 const hum = barDist < 2.8 ? (1 - barDist / 2.8) * 0.45 : 0;
 const v = Math.min(1, (Math.pow(h, 1.35) * 0.85 + hum) * this.tvStatic);
 const gIdx = Math.min(NOISE.length - 1, Math.floor(v * NOISE.length));
 grid.char[i] = NOISE[gIdx];
 if (grid.color) {
 const shade = Math.round(55 + v * 200);
 const hexS = shade.toString(16).padStart(2, '0');
 grid.color[i] = `#${hexS}${hexS}${Math.min(255, shade + 8).toString(16).padStart(2, '0')}`;
 }
 }
 continue;
 }
 if (!stream) continue;
 grid.char[i] = stream[idx % stream.length];
 idx++;
 wrote = true;
 }
 if (wrote && stream) idx = (idx + 3) % stream.length;
 }
 
 // Si la silueta se desvanece, sus letras se dispersan volando por la pantalla
 if (this.scatter > 0.02 && this.extent) {
 this.disperseCells(grid);
 }
 this.burnCells(grid);
 }

 disperseCells(grid) {
 const s = this.scatter;
 const { cols, rows } = grid;
 const tempChar = new Array(grid.char.length);
 const tempColor = grid.color ? new Array(grid.color.length) : null;
 
 for (let r = 0; r < rows; r++) {
 for (let c = 0; c < cols; c++) {
 const i = r * cols + c;
 if (!this.occ[i]) continue;
 const ch = grid.char[i];
 if (ch === ' ' || ch === '.' || ch === '·') continue;

 // Trayectoria de vuelo para cada letra individual
 const seed = (hash(r, c) % 1000) / 1000;
 const angle = -Math.PI * 0.5 + (seed - 0.5) * 1.8;
 const dist = Math.pow(s, 1.3) * (14 + seed * 22);
 const nr = Math.round(r + Math.sin(angle) * dist);
 const nc = Math.round(c + Math.cos(angle) * dist);

 if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
 const targetIdx = nr * cols + nc;
 tempChar[targetIdx] = ch;
 if (tempColor && grid.color) {
 tempColor[targetIdx] = grid.color[i];
 }
 }
 grid.char[i] = ' ';
 }
 }

 for (let i = 0; i < grid.char.length; i++) {
 if (tempChar[i]) {
 grid.char[i] = tempChar[i];
 if (grid.color && tempColor) grid.color[i] = tempColor[i];
 }
 }
 }

 // Foco de fuego adaptado a la forma del libro (dos alas que se abren)
 fireStep() {
 const e = this.extent;
 const g = this.gd;
 if (!e || !g || this.burn <= 0) return;
 const { cols, rows } = g;
 if (!this.heat || this.heat.length !== cols * rows) this.heat = new Uint8Array(cols * rows);
 const h = this.heat;
 const midC = (e.minC + e.maxC) / 2;
 const totalW = e.maxC - e.minC + 1;
 const totalH = e.maxR - e.minR + 1;

 for (let c = e.minC; c <= e.maxC; c++) {
 // El perfil del libro es en V: curvatura real de las hojas
 const relX = Math.abs(c - midC) / (totalW * 0.5);
 const wingCurve = Math.sin(relX * Math.PI * 0.5) * 2.8;
 const frontR = Math.round(e.minR + this.burn * totalH * 1.02 + wingCurve);
 const sr = Math.min(rows - 1, Math.max(0, frontR));
 if (this.occ && this.occ[sr * cols + c]) h[sr * cols + c] = FIRE_MAX;
 }

 for (let r = Math.min(rows - 1, e.maxR + 4); r >= Math.max(1, e.minR - 6); r--) {
 for (let c = e.minC; c <= e.maxC; c++) {
 const src = h[r * cols + c];
 if (!src) continue;
 const rnd = (Math.random() * 3) | 0;
 const dc = Math.min(e.maxC, Math.max(e.minC, c - rnd + 1));
 const cool = (Math.random() * 6) | 0;
 h[(r - 1) * cols + dc] = Math.max(0, src - cool);
 }
 }
 }

 burnCells(grid) {
 if (this.burn <= 0 || !this.extent) return;
 const e = this.extent;
 const { cols, rows } = grid;
 if (!this.heat || this.heat.length !== cols * rows) this.heat = new Uint8Array(cols * rows);
 const h = this.heat;
 const midC = (e.minC + e.maxC) / 2;
 const totalW = e.maxC - e.minC + 1;
 const totalH = e.maxR - e.minR + 1;

 for (let r = Math.max(0, e.minR - 8); r <= Math.min(rows - 1, e.maxR); r++) {
 for (let c = e.minC; c <= e.maxC; c++) {
 const relX = Math.abs(c - midC) / (totalW * 0.5);
 const wingCurve = Math.sin(relX * Math.PI * 0.5) * 2.8;
 const frontR = Math.round(e.minR + this.burn * totalH * 1.02 + wingCurve);
 if (r > frontR) continue;

 const i = r * cols + c;
 const hv = h[i];
 const occupied = this.occ[i] === 1;
 if (hv > 1) {
 grid.char[i] = FIRE[Math.min(FIRE.length - 1, Math.floor((hv / (FIRE_MAX + 1)) * FIRE.length))];
 if (grid.color) grid.color[i] = FIRE_COLORS[hv];
 } else if (occupied) {
 grid.char[i] = ASH[hash(r, c) % ASH.length];
 if (grid.color) grid.color[i] = '#a29a8c';
 }
 }
 }
 }

 setPolygons(polygons, render = true) {
 if (!this.mesh) {
 this.mesh = this.handle.add(polygons);
 } else {
 this.mesh.setPolygons(polygons);
 }
 if (render) this.handle.rerender();
 }

 fit(targetW = 0.86, targetH = 0.8) {
 const base = this.handle.getBaseResolution();
 this.handle.rerender();
 const e = this.extent;
 if (!e) return;
 const w = e.maxC - e.minC + 1;
 const h = e.maxR - e.minR + 1;
 if (!w || !h) return;
 const ratio = Math.min((targetW * base.cols) / w, (targetH * base.rows) / h);
 if (Math.abs(ratio - 1) < 0.03) return;
 this.camera.zoom *= ratio;
 this.handle.rerender();
 }

 fitCache = new Map();

 fitMultiState(key, statesPolys, targetW = 0.86, targetH = 0.8) {
 const base = this.handle.getBaseResolution();
 let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
 for (const polys of statesPolys) {
 this.setPolygons(polys, true);
 const e = this.extent;
 if (!e) continue;
 if (e.minC < minC) minC = e.minC;
 if (e.maxC > maxC) maxC = e.maxC;
 if (e.minR < minR) minR = e.minR;
 if (e.maxR > maxR) maxR = e.maxR;
 }
 if (maxC >= minC && maxR >= minR) {
 const w = maxC - minC + 1;
 const h = maxR - minR + 1;
 const ratio = Math.min((targetW * base.cols) / w, (targetH * base.rows) / h);
 if (Math.abs(ratio - 1) >= 0.03) this.camera.zoom *= ratio;
 }
 this.fitCache.set(key, this.camera.zoom);
 return this.camera.zoom;
 }

 resize(width, height) {
 this.cols = Math.max(20, Math.floor(width / this.cellW));
 this.rows = Math.max(10, Math.floor(height / this.cellH));
 this.handle.setOptions({ cols: this.cols, rows: this.rows, cellAspect: this.cellAspect });
 const base = this.handle.getBaseResolution();
 const pre = this.output;
 if (pre) {
 pre.style.width = base.cols * this.cellW + 'px';
 pre.style.height = base.rows * this.cellH + 'px';
 }
 }

 setCellMetrics(cellW, cellH) {
 this.cellW = cellW;
 this.cellH = cellH;
 this.cellAspect = cellH / cellW;
 }
}