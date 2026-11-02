import { createGlyphScene, createGlyphOrthographicCamera } from "glyphcss";
const CELL_W = 8;
const CELL_H = 14;
const FIRE = " .,:;+*xX#%@";
const ASH = ".,\x27`";
const FIRE_MAX = 36;
const NOISE = " .:-=+*#%@";
const lerp = (a, b, t) => a + (b - a) * t;
const FIRE_COLORS = Array.from({ length: FIRE_MAX + 1 }, (_, h) => {
  const t = h / FIRE_MAX;
  const stops = [[90, 46, 16], [185, 92, 20], [235, 158, 34], [255, 220, 120], [255, 246, 215]];
  const f = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(f));
  const k = f - i;
  const c = stops[i].map((v, j) => Math.round(lerp(v, stops[i + 1][j], k)));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
});
function hash(r, c) {
  return Math.abs((r * 73856093) ^ (c * 19349663));
}
function isTvScreenCell(col) {
  if (typeof col !== "string" || col.length !== 7 || col[0] !== "#") return false;
  const r = parseInt(col.slice(1, 3), 16);
  const b = parseInt(col.slice(5, 7), 16);
  return b - r >= 12;
}
export class GlyphStage {
  constructor(host, opts = {}) {
    this.host = host;
    this.text = "";
    this.lines = [];
    this.stream = "";
    this.burn = 0;
    this.scatter = 0;
    this.tvStatic = 0;
    this.tvTime = 0;
    this.extent = null;
    this.gd = null;
    this.heat = null;
    this.occ = null;
    this.colTop = null;
    this.colBot = null;
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
      mode: "solid",
      glyphPalette: "default",
      useColors: true,
      colorTolerance: 6,
      retainShade: true,
      depthEpsilon: 0.02,
      supersample: 1,
      smoothShading: false,
      doubleSided: opts.doubleSided !== false,
      directionalLight: { direction: [0.45, 0.65, 0.8], intensity: 1.15 },
      ambientLight: { intensity: 0.58 },
      transformCells: (grid) => this.sculpt(grid),
    });
  }
  get output() { return this.handle.output; }
  setText(text) {
    this.lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split(/\s+/).join("·"));
    this.text = text;
    this.stream = this.lines.join("·") + "·";
  }
  setBurn(value) {
    const b = value > 0 ? (value < 1 ? value : 1) : 0;
    if (b === 0 && this.heat) this.heat.fill(0);
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
    const { cols, rows } = grid;
    let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
    if (!this.colTop || this.colTop.length !== cols) {
      this.colTop = new Int16Array(cols);
      this.colBot = new Int16Array(cols);
    }
    this.colTop.fill(32767);
    this.colBot.fill(-1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (grid.char[i] === " " || grid.depth[i] === -Infinity) continue;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (r < this.colTop[c]) this.colTop[c] = r;
        if (r > this.colBot[c]) this.colBot[c] = r;
      }
    }
    this.extent = maxC < 0 ? null : { minC, maxC, minR, maxR };
    this.gd = { cols, rows };
    if (!this.occ || this.occ.length !== cols * rows) this.occ = new Uint8Array(cols * rows);
    this.occ.fill(0);
    const stream = this.stream;
    let idx = 0;
    const tick = Math.floor(this.tvTime / 32);
    const e = this.extent;
    const barRow = e ? e.minR + (((this.tvTime * 0.0008) % 1) * (e.maxR - e.minR + 1)) : 0;
    for (let r = 0; r < rows; r++) {
      let wrote = false;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (grid.char[i] === " " || grid.depth[i] === -Infinity) continue;
        this.occ[i] = 1;
        const col = grid.color ? grid.color[i] : "";
        if (isTvScreenCell(col)) {
          if (this.tvStatic <= 0.02) {
            grid.char[i] = (r + c) % 6 === 0 ? "·" : ".";
            if (grid.color) grid.color[i] = "#2c3347";
          } else if (this.tvStatic < 0.16) {
            const midR = e ? (e.minR + e.maxR) * 0.5 : rows * 0.5;
            const band = Math.max(0.8, (this.tvStatic / 0.16) * (e ? (e.maxR - e.minR) * 0.42 : 8));
            const dR = Math.abs(r - midR);
            if (dR <= band) {
              const h = (hash(r + tick * 17, c + tick * 31) % 1000) / 1000;
              const v = Math.min(1, (1 - dR / band) * 0.9 + h * 0.35);
              grid.char[i] = NOISE[Math.min(NOISE.length - 1, Math.floor(v * NOISE.length))];
              const sh = Math.round(90 + v * 165).toString(16).padStart(2, "0");
              if (grid.color) grid.color[i] = `#${sh}${sh}ff`;
            } else {
              grid.char[i] = ".";
              if (grid.color) grid.color[i] = "#2c3347";
            }
          } else {
            const h = (hash(r + tick * 17, c + tick * 31) % 1000) / 1000;
            const barDist = Math.abs(r - barRow);
            const hum = barDist < 2.8 ? (1 - barDist / 2.8) * 0.45 : 0;
            const v = Math.min(1, (Math.pow(h, 1.3) * 0.86 + hum) * Math.min(1, (this.tvStatic - 0.1) / 0.5));
            const gIdx = Math.min(NOISE.length - 1, Math.floor(v * NOISE.length));
            grid.char[i] = NOISE[gIdx];
            if (grid.color) {
              const shade = Math.round(58 + v * 197);
              const hexS = shade.toString(16).padStart(2, "0");
              grid.color[i] = `#${hexS}${hexS}${Math.min(255, shade + 10).toString(16).padStart(2, "0")}`;
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
    if (this.scatter > 0.005 && this.extent) {
      this.disperseCells(grid);
    }
    this.burnCells(grid);
  }
  disperseCells(grid) {
    const s = this.scatter;
    const e = this.extent;
    const { cols, rows } = grid;
    const midC = (e.minC + e.maxC) * 0.5;
    const halfW = Math.max(1, (e.maxC - e.minC) * 0.5);
    const spanR = Math.max(1, e.maxR - e.minR);
    const tempChar = new Array(grid.char.length);
    const tempColor = grid.color ? new Array(grid.color.length) : null;
    const maxSpan = Math.max(cols, rows) * 1.18;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this.occ[i]) continue;
        const ch = grid.char[i];
        if (ch === " ") continue;
        const h1 = (hash(r, c) % 1000) / 1000;
        const h2 = (hash(c + 19, r + 47) % 1000) / 1000;
        const relY = (r - e.minR) / spanR;
        const relEdge = Math.min(1, Math.abs(c - midC) / halfW);
        const releaseAt = relY * 0.24 + (1 - relEdge) * 0.16 + h1 * 0.14;
        if (s <= releaseAt) {
          tempChar[i] = ch;
          if (tempColor && grid.color) tempColor[i] = grid.color[i];
          grid.char[i] = " ";
          continue;
        }
        const flight = Math.min(1, (s - releaseAt) / Math.max(0.18, 0.92 - releaseAt));
        const dirX = (c >= midC ? 1 : -1) * (0.35 + relEdge * 0.85) + (h1 - 0.5) * 0.9;
        const dirY = -0.55 - (1 - relY) * 0.65 + (h2 - 0.5) * 0.7;
        const dist = Math.pow(flight, 1.35) * maxSpan * (0.65 + 0.65 * h2);
        const swirl = Math.sin(flight * 6.0 + h1 * 6.28) * 3.5 * flight;
        const nr = Math.round(r + dirY * dist + swirl);
        const nc = Math.round(c + dirX * dist * 1.35 - swirl);
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const targetIdx = nr * cols + nc;
          tempChar[targetIdx] = ch;
          if (tempColor && grid.color) tempColor[targetIdx] = grid.color[i];
        }
        grid.char[i] = " ";
      }
    }
    for (let i = 0; i < grid.char.length; i++) {
      if (tempChar[i]) {
        grid.char[i] = tempChar[i];
        if (grid.color && tempColor) grid.color[i] = tempColor[i];
      }
    }
  }
  fireStep() {
    const e = this.extent;
    const g = this.gd;
    if (!e || !g || this.burn <= 0 || !this.colTop) return;
    const { cols, rows } = g;
    if (!this.heat || this.heat.length !== cols * rows) this.heat = new Uint8Array(cols * rows);
    const h = this.heat;
    const midC = (e.minC + e.maxC) * 0.5;
    const halfW = Math.max(1, (e.maxC - e.minC) * 0.5);
    for (let c = e.minC; c <= e.maxC; c++) {
      const topR = this.colTop[c];
      const botR = this.colBot[c];
      if (botR < topR) continue;
      const relX = Math.min(1, Math.abs(c - midC) / halfW);
      const colBurn = Math.max(0, Math.min(1, this.burn * 1.35 - (1 - relX) * 0.36));
      if (colBurn <= 0.01) continue;
      const colH = Math.max(1, botR - topR);
      const frontR = Math.min(botR, topR + Math.round(colBurn * colH));
      for (let dr = -1; dr <= 1; dr++) {
        const sr = Math.min(rows - 1, Math.max(0, frontR + dr));
        if (this.occ && this.occ[sr * cols + c]) {
          h[sr * cols + c] = Math.round(FIRE_MAX * Math.min(1, 0.55 + colBurn * 0.65));
        }
      }
    }
    for (let r = Math.min(rows - 1, e.maxR + 2); r >= Math.max(1, e.minR - 4); r--) {
      for (let c = e.minC; c <= e.maxC; c++) {
        const src = h[r * cols + c];
        if (!src) continue;
        const rnd = (Math.random() * 3) | 0;
        const dc = Math.min(e.maxC, Math.max(e.minC, c - rnd + 1));
        const inBook = this.occ && this.occ[(r - 1) * cols + dc];
        const cool = inBook ? ((2 + Math.random() * 5) | 0) : ((7 + Math.random() * 9) | 0);
        h[(r - 1) * cols + dc] = Math.max(0, src - cool);
      }
    }
  }
  burnCells(grid) {
    if (this.burn <= 0 || !this.extent || !this.colTop) return;
    const e = this.extent;
    const { cols, rows } = grid;
    if (!this.heat || this.heat.length !== cols * rows) this.heat = new Uint8Array(cols * rows);
    const h = this.heat;
    const midC = (e.minC + e.maxC) * 0.5;
    const halfW = Math.max(1, (e.maxC - e.minC) * 0.5);
    for (let c = e.minC; c <= e.maxC; c++) {
      const topR = this.colTop[c];
      const botR = this.colBot[c];
      if (botR < topR) continue;
      const relX = Math.min(1, Math.abs(c - midC) / halfW);
      const colBurn = Math.max(0, Math.min(1, this.burn * 1.35 - (1 - relX) * 0.36));
      if (colBurn <= 0.01) continue;
      const colH = Math.max(1, botR - topR);
      const frontR = Math.min(botR, topR + Math.round(colBurn * colH));
      const minTongueR = Math.max(0, topR - Math.min(3, Math.ceil(colBurn * 3.5)));
      for (let r = minTongueR; r <= frontR; r++) {
        const i = r * cols + c;
        const hv = h[i];
        const occupied = this.occ[i] === 1;
        const distToFront = frontR - r;
        if (!occupied && r < topR) {
          if (hv > 10 && distToFront <= 4) {
            grid.char[i] = FIRE[Math.min(FIRE.length - 1, Math.floor((hv / (FIRE_MAX + 1)) * FIRE.length))];
            if (grid.color) grid.color[i] = FIRE_COLORS[hv];
          }
          continue;
        }
        if (!occupied) continue;
        if (distToFront <= 4 && hv > 2) {
          const fIdx = Math.min(FIRE.length - 1, Math.max(2, Math.floor((hv / (FIRE_MAX + 1)) * FIRE.length)));
          grid.char[i] = FIRE[fIdx];
          if (grid.color) grid.color[i] = FIRE_COLORS[Math.min(FIRE_MAX, hv + 4)];
        } else if (distToFront <= 8 && hv > 4) {
          grid.char[i] = FIRE[Math.min(6, Math.floor((hv / FIRE_MAX) * 7))];
          if (grid.color) grid.color[i] = "#d99b26";
        } else {
          grid.char[i] = ASH[hash(r, c) % ASH.length];
          if (grid.color) grid.color[i] = "#9e9484";
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
      pre.style.width = base.cols * this.cellW + "px";
      pre.style.height = base.rows * this.cellH + "px";
    }
  }
  setCellMetrics(cellW, cellH) {
    this.cellW = cellW;
    this.cellH = cellH;
    this.cellAspect = cellH / cellW;
  }
}
