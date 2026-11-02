const STROKES = {
  A: [[0, 6, 1.6, 0, 2.4, 0, 4, 6], [0.7, 4, 3.3, 4]],
  B: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3], [0, 0, 2.5, 0, 3.5, 1, 3.5, 2, 2.5, 3]],
  C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]],
  D: [[0, 0, 0, 6, 2.5, 6, 4, 4.5, 4, 1.5, 2.5, 0, 0, 0]],
  E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]],
  F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
  G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3, 2, 3]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
  I: [[1, 0, 3, 0], [2, 0, 2, 6], [1, 6, 3, 6]],
  J: [[1.5, 0, 4, 0], [3, 0, 3, 5, 2, 6, 1, 6, 0, 5]],
  K: [[0, 0, 0, 6], [4, 0, 0, 3.6], [1.5, 2.25, 4, 6]],
  L: [[0, 0, 0, 6, 4, 6]],
  M: [[0, 6, 0, 0, 2, 3.5, 4, 0, 4, 6]],
  N: [[0, 6, 0, 0, 4, 6, 4, 0]],
  O: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]],
  Q: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], [2.4, 4.4, 4, 6.2]],
  R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3], [2.2, 3, 4, 6]],
  S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  T: [[0, 0, 4, 0], [2, 0, 2, 6]],
  U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]],
  V: [[0, 0, 2, 6, 4, 0]],
  W: [[0, 0, 1, 6, 2, 2, 3, 6, 4, 0]],
  X: [[0, 0, 4, 6], [4, 0, 0, 6]],
  Y: [[0, 0, 2, 3], [4, 0, 2, 3, 2, 6]],
  Z: [[0, 0, 4, 0, 0, 6, 4, 6]],
  0: [[1, 0, 2, 0, 3, 1, 3, 5, 2, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  1: [[0.5, 1, 1.5, 0, 1.5, 6], [0.5, 6, 2.5, 6]],
  2: [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]],
  3: [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1.5, 3], [3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  4: [[3, 6, 3, 0, 0, 4, 4, 4]],
  5: [[4, 0, 0, 0, 0, 3, 3, 3, 4, 4, 4, 5, 3, 6, 0, 6]],
  6: [[3.5, 0, 1.5, 0, 0, 1.5, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 1, 3, 0, 4]],
  7: [[0, 0, 4, 0, 1.5, 6]],
  8: [[1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3]],
  9: [[0.5, 6, 2.5, 6, 4, 4.5, 4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 4, 3]],
  ".": [[2, 6, 2, 6]],
  ',': [[2, 5.6, 1.5, 7]],
  "!": [[2, 0, 2, 4], [2, 6, 2, 6]],
  "?": [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 2, 3.5, 2, 4.2], [2, 6, 2, 6]],
  "-": [[1, 3, 3, 3]],
};
const RAMP = " .·░▒▓█";
const STAGGER = 0.16, JITTER = 0.22, ERODE = 0.32, FADE = 0.48, R = 0.5, RD = 0.6, GAP = 3;
const hash = (a, b) => { let h = Math.imul(a, 374761393) + Math.imul(b, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function seg(x, y, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; const k = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0; return Math.hypot(x - ax - k * dx, y - ay - k * dy) - (dx && dy ? RD : R); }
function normUpper(s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); }
export class Dissolve {
  constructor(el, { seed = 3, align = "left" } = {}) {
    this.el = el; this.seed = seed;
    this.rawText = el.textContent.trim();
    el.setAttribute("aria-label", this.rawText);
    el.textContent = "";
    this.pre = document.createElement("pre");
    this.pre.className = "dissolve-art";
    this.pre.setAttribute("aria-hidden", "true");
    el.appendChild(this.pre);
    const clean = normUpper(this.rawText);
    const words = clean.split(/\s+/).filter(Boolean);
    let linesStr = [clean];
    if (clean.length > 9 && words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      linesStr = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
    }
    this.cols = 58;
    this.rows = linesStr.length > 1 ? 17 : 10;
    this.baked = this.bakeLines(linesStr, align);
    this.val = new Float32Array(this.cols * this.rows);
    this.dust = new Float32Array(this.cols * this.rows);
    this.t = -1; this.mode = "in";
    this.set(0, "in");
  }
  bakeLines(linesStr, align) {
    const { cols, rows } = this;
    const glyph = (ch) => STROKES[ch] || (ch === " " ? [] : STROKES["?"]);
    const span = (g) => {
      const xs = g.flatMap((p) => p.filter((_, i) => i % 2 === 0));
      return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 2.2];
    };
    const charList = linesStr.map((s) => [...s]);
    const wide = (w, u) => w.reduce((a, ch) => a + Math.round(2 * u * (span(glyph(ch))[1] - span(glyph(ch))[0])) + Math.max(2, Math.round(GAP * u)), 0) - Math.max(2, Math.round(GAP * u)) + 4 * u * R;
    const bandH = (rows - 2) / charList.length;
    let unit = Math.min(0.85, (bandH - 1) / (6 + 2 * R));
    while (unit > 0.36 && Math.max(...charList.map((w) => wide(w, unit))) > cols - 3) unit -= 0.02;
    const gap = Math.max(1, Math.round(GAP * unit));
    const cover = new Float32Array(cols * rows);
    const slot = new Int8Array(cols * rows);
    let globalSlot = 0;
    charList.forEach((w, lineIdx) => {
      const y0 = 1 + lineIdx * bandH + (bandH - 6 * unit) * 0.4;
      const lineW = wide(w, unit);
      let pen = align === "right" ? Math.max(1, Math.round(cols - lineW - 2)) : Math.round(2 * unit * R + 1);
      const rStart = Math.max(0, Math.floor(lineIdx * bandH));
      const rEnd = Math.min(rows, Math.ceil((lineIdx + 1) * bandH + 1));
      const centres = [];
      for (const ch of w) {
        const g = glyph(ch);
        const [lo, hi] = span(g);
        const width = Math.round(2 * unit * (hi - lo));
        centres.push({ x: pen + width / 2, s: globalSlot++ });
        if (g.length) {
          for (let r = rStart; r < rEnd; r++) {
            for (let c = Math.max(0, pen - 2); c < Math.min(cols, pen + width + 2); c++) {
              let hit = 0;
              for (let j = 0; j < 3; j++) {
                for (let i = 0; i < 3; i++) {
                  const gx = lo + (c + (i + 0.5) / 3 - pen) / (2 * unit), gy = (r + (j + 0.5) / 3 - y0) / unit;
                  let d = 9;
                  for (const p of g) for (let k = 0; k + 3 < p.length; k += 2) d = Math.min(d, seg(gx, gy, p[k], p[k + 1], p[k + 2], p[k + 3]));
                  if (d <= 0) hit++;
                }
              }
              cover[r * cols + c] = Math.max(cover[r * cols + c], hit / 9);
            }
          }
        }
        pen += width + gap;
      }
      for (let r = rStart; r < rEnd; r++) {
        for (let c = 0; c < cols; c++) {
          let best = centres[0] ? centres[0].s : 0, bestD = Infinity;
          for (const ct of centres) { const d = Math.abs(ct.x - c); if (d < bestD) { bestD = d; best = ct.s; } }
          slot[r * cols + c] = best;
        }
      }
    });
    return { cover, slot, maxSlot: Math.max(1, globalSlot) };
  }
  splat(x, y, d) {
    const c = Math.round(x), r = Math.round(y);
    if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
      const idx = r * this.cols + c;
      if (d > this.dust[idx]) this.dust[idx] = d;
    }
  }
  set(t, mode = "in") {
    t = Math.round(Math.min(1, Math.max(0, t)) * 200) / 200;
    if (t === this.t && mode === this.mode) return;
    this.t = t; this.mode = mode;
    if (t <= 0.005) {
      this.pre.textContent = "";
      this.el.style.opacity = "0";
      return;
    }
    this.el.style.opacity = "1";
    const { cols, rows, baked, val, dust, seed } = this;
    dust.fill(0);
    const totalSpan = baked.maxSlot * STAGGER + JITTER + ERODE + 0.65;
    if (mode === "out") {
      const tau = (1 - t) * totalSpan;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          const a = baked.cover[k];
          let v = 0;
          if (a > 0) {
            const go = baked.slot[k] * STAGGER + hash(k, seed) * JITTER;
            const e = (tau - go) / ERODE;
            if (e <= 0) v = a;
            else if (a <= 0.3 || hash(k, seed + 7) > 0.5) v = a * (1 - ease(e));
            else if (e < 1) v = a * (1 - 0.5 * Math.max(0, e));
            else {
              const age = tau - go - ERODE, life = 0.5 + 0.35 * hash(k, seed + 57);
              if (age < life) {
                const vx = 0.6 + 1.4 * hash(k, seed + 31), vy = 0.3 + 0.6 * hash(k, seed + 83);
                this.splat(c + 0.5 + vx * age, r + vy * age + 4 * age * age, 0.55 * (1 - 0.7 * age / life));
              }
            }
          }
          val[k] = v;
        }
      }
    } else {
      const tau = t * (baked.maxSlot * STAGGER + JITTER + FADE + 0.25);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          const b = baked.cover[k];
          let v = 0;
          if (b > 0) {
            const land = baked.slot[k] * STAGGER + hash(k, seed + 977) * JITTER;
            if (tau >= land) {
              v = b * (b > 0.3 ? 0.4 + 0.6 * ease((tau - land) / FADE) : ease((tau - land) / FADE));
            } else if (b > 0.3 && hash(k, seed + 9) < 0.6) {
              const life = 0.45 + 0.35 * hash(k, seed + 211), f = (land - tau) / life;
              if (f < 1 && f > 0) {
                const q = f * f, th = 6.283 * hash(k, seed + 401), d = 0.9 + 1.4 * hash(k, seed + 613);
                this.splat(c + 1.8 * d * Math.cos(th) * q, r + d * Math.sin(th) * q, 0.22 + 0.38 * (1 - f));
              }
            }
          }
          val[k] = v;
        }
      }
    }
    const outLines = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const m = Math.max(val[r * cols + c], dust[r * cols + c]);
        line += RAMP[Math.min(RAMP.length - 1, Math.round(m * (RAMP.length - 1)))];
      }
      outLines.push(line.replace(/\s+$/, ""));
    }
    this.pre.textContent = outLines.join("\n");
  }
}
export class DissolveText {
  constructor(el, { seed = 19 } = {}) {
    this.el = el; this.seed = seed;
    this.text = el.textContent.trim();
    el.setAttribute("aria-label", this.text);
    this.span = document.createElement("span");
    this.span.setAttribute("aria-hidden", "true");
    el.textContent = "";
    el.appendChild(this.span);
    this.t = -1;
    this.set(0);
  }
  set(t) {
    t = Math.round(Math.min(1, Math.max(0, t)) * 100) / 100;
    if (t === this.t) return;
    this.t = t;
    if (t <= 0.01) { this.span.textContent = ""; this.el.style.opacity = "0"; return; }
    this.el.style.opacity = String(Math.min(1, t * 1.4));
    if (t >= 0.98) { this.span.textContent = this.text; return; }
    const len = this.text.length;
    let out = "";
    for (let i = 0; i < len; i++) {
      const ch = this.text[i];
      if (ch === " ") { out += " "; continue; }
      const thr = (i / Math.max(1, len)) * 0.55 + hash(i, this.seed) * 0.25;
      const loc = (t - thr) / 0.25;
      if (loc <= 0) out += " ";
      else if (loc >= 1) out += ch;
      else out += RAMP[Math.min(RAMP.length - 1, Math.floor(loc * RAMP.length))];
    }
    this.span.textContent = out;
  }
}
