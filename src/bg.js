// Fondo: grilla ASCII con siluetas humanas unicas en memoria de los desaparecidos.
// Cada silueta varia en peinado, rasgos faciales, cuello y hombros.
// Fondo vacio puro sin letras distractoras.
const RAMPS = [
  ' ..::--==++**##%%@@',
  ' ..··::++**##WWMM@@',
  ' ..``\'\'^^~~**XX##@@',
  ' ..::;;??<<>>$$&&%%',
  ' ..,,::++==??SS88@@',
  ' ..··--++**##88%%@@'
];
const ALPHAS = [0.18, 0.32, 0.52, 0.75];
const TW = 28;
const TH = 20;
function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function personBust(u, v, seed) {
  const headW = 0.20 + 0.03 * hash(seed, 1);
  const headH = 0.27 + 0.04 * hash(seed, 2);
  const headY = -0.32 + 0.03 * (hash(seed, 3) - 0.5);
  const hx = u / headW;
  const hy = (v - headY) / headH;
  const d2 = hx * hx + hy * hy;
  let lum = 0;
  const hairVol = 1.05 + 0.18 * hash(seed, 5);
  const inHair = (v < headY + 0.12) && ((hx * hx) / (hairVol * hairVol) + Math.pow((hy + 0.08) / 1.05, 2) < 1.05);
  if (inHair) {
    lum = Math.max(lum, 0.45 + 0.25 * Math.sin(u * 22 + seed));
  }
  if (d2 < 1.0 && !(inHair && hy < -0.32)) {
    const nz = Math.sqrt(Math.max(0.05, 1 - 0.7 * hx * hx - 0.65 * hy * hy));
    let fLum = 0.38 + 0.55 * nz;
    const eyeSpacing = 0.36 + 0.06 * hash(seed, 6);
    const ex = Math.abs(hx) - eyeSpacing;
    const ey = hy + 0.05;
    const eyeSocket = Math.exp(-(ex * ex) / 0.035 - (ey * ey) / 0.02);
    fLum -= 0.32 * eyeSocket;
    const browArch = 0.03 * hash(seed, 7);
    const browY = hy + 0.18 + browArch * Math.cos(ex * 5.0);
    if (Math.abs(ex) < 0.22 && Math.abs(browY) < 0.045) fLum *= 0.42;
    if (hy > -0.08 && hy < 0.30 && Math.abs(hx) < 0.18) {
      fLum += 0.18 * Math.exp(-(hx * hx) / 0.009) * sm(-0.08, 0.25, hy);
      if (hy > 0.22) fLum -= 0.24 * sm(0.22, 0.30, hy);
    }
    const my = hy - 0.52;
    if (Math.abs(hx) < 0.28 && Math.abs(my) < 0.10) {
      if (Math.abs(my) < 0.026) fLum *= 0.35;
      else if (my > 0) fLum += 0.08 * (1 - Math.abs(hx) / 0.28);
    }
    if (hash(seed, 8) > 0.72 && Math.hypot(ex / 0.22, ey / 0.15) > 0.85 && Math.hypot(ex / 0.22, ey / 0.15) < 1.05) {
      fLum = 0.8;
    }
    const edge = 1 - sm(0.85, 1.0, d2);
    lum = Math.max(lum, clamp(fLum, 0.15, 0.95) * edge);
  }
  const neckW = 0.16 + 0.03 * hash(seed, 9);
  const neckTop = headY + headH * 0.72;
  const neckBot = 0.42;
  if (v >= neckTop && v <= neckBot && Math.abs(u) < neckW && d2 >= 0.9) {
    const nShade = 0.45 * (1 - 0.5 * Math.pow(u / neckW, 2));
    lum = Math.max(lum, nShade);
  }
  const shoulderW = 0.72 + 0.18 * hash(seed, 10);
  const shY = neckBot - 0.04 + 0.38 * Math.pow(Math.min(1, Math.abs(u) / shoulderW), 1.6);
  if (v >= shY && Math.abs(u) <= shoulderW) {
    const shL = sm(0, 0.08, v - shY) * (1 - sm(shoulderW * 0.75, shoulderW, Math.abs(u))) * 0.48;
    lum = Math.max(lum, shL);
  }
  return lum;
}
export function createBackground(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let cw = 8, ch = 14, dpr = 1, cols = 0, rows = 0, cwp = 8, chp = 14;
  let tilesX = 0, tilesY = 0, numTiles = 0;
  let tileOrder = null, tileRev = null, tileRamp = null;
  let mask = null, tileIdx = null;
  let atlas = null;
  let prog = 0;
  function buildAtlas() {
    atlas = document.createElement('canvas');
    atlas.width = RAMPS[0].length * cwp;
    atlas.height = RAMPS.length * ALPHAS.length * chp;
    const actx = atlas.getContext('2d');
    actx.font = `${chp}px 'Sligoil Micro',ui-monospace,monospace`;
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    RAMPS.forEach((ramp, rIdx) => {
      ALPHAS.forEach((alpha, aIdx) => {
        const y = (rIdx * ALPHAS.length + aIdx) * chp;
        actx.fillStyle = `rgba(185, 175, 155, ${alpha})`;
        for (let i = 0; i < ramp.length; i++) {
          actx.fillText(ramp[i], (i + 0.5) * cwp, y + chp * 0.5);
        }
      });
    });
  }
  function resize(w, h, cellW = 8, cellH = 14) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = cellW; ch = cellH;
    cwp = Math.round(cw * dpr);
    chp = Math.round(ch * dpr);
    cols = Math.ceil(w / cw);
    rows = Math.ceil(h / ch);
    canvas.width = cols * cwp;
    canvas.height = rows * chp;
    tilesX = Math.ceil(cols / TW);
    tilesY = Math.ceil(rows / TH);
    numTiles = tilesX * tilesY;
    tileOrder = new Float32Array(numTiles);
    tileRev = new Float32Array(numTiles);
    tileRamp = new Uint8Array(numTiles);
    for (let t = 0; t < numTiles; t++) {
      tileOrder[t] = hash(t, 77);
      tileRamp[t] = Math.floor(hash(t, 88) * RAMPS.length);
    }
    const total = cols * rows;
    mask = new Float32Array(total);
    tileIdx = new Int32Array(total);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const tx = Math.floor(c / TW);
        const ty = Math.floor(r / TH);
        const t = ty * tilesX + tx;
        tileIdx[i] = t;
        const u = ((c % TW) / (TW - 1)) * 2 - 1;
        const v = ((r % TH) / (TH - 1)) * 2 - 1;
        const seed = (tx * 73856093) ^ (ty * 19349663);
        mask[i] = personBust(u, v, seed);
      }
    }
    buildAtlas();
    setProgress(prog);
  }
  function setProgress(p) {
    prog = clamp(p, 0, 1);
    for (let t = 0; t < numTiles; t++) {
      const start = tileOrder[t] * 0.78;
      tileRev[t] = sm(start, start + 0.16, prog);
    }
  }
  function draw() {
    if (!atlas || !mask) return;
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rampLen = RAMPS[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const m = mask[i];
        if (m <= 0.05) continue;
        const t = tileIdx[i];
        const rev = tileRev[t];
        if (rev <= 0.01) continue;
        const intensity = clamp(m * rev * 0.95, 0, 1);
        if (intensity < 0.08) continue;
        const rIdx = tileRamp[t];
        const g = 1 + Math.min(rampLen - 2, Math.floor(intensity * (rampLen - 1)));
        const al = Math.min(ALPHAS.length - 1, Math.floor(intensity * 4.4));
        const atlasY = (rIdx * ALPHAS.length + al) * chp;
        ctx.drawImage(atlas, g * cwp, atlasY, cwp, chp, c * cwp, r * chp, cwp, chp);
      }
    }
  }
  return { resize, setProgress, draw, get progress() { return prog; } };
}
