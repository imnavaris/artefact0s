// Fondo: grilla ASCII con siluetas humanas en memoria de los 30.000 desaparecidos.
// Proporciones anatómicas humanas reales: cabeza con rasgos y cabello, cuello corto natural,
// hombros y torso cubiertos con densas columnas de caracteres alfanuméricos (ASCII art forense).
// Fondo con trama de puntos tenues. Animación continua en reposo y revelación al scrollear.

const GLYPHS_HEAVY = ['@', '#', 'B', 'W', 'M', 'Q', '8', '&', '%', 'X', 'O', 'Z'];
const GLYPHS_MID   = ['w', 'q', 'd', 'b', 'k', 'h', 'm', 'p', 'u', 'x', 'z', 'c', 'o', 'a'];
const GLYPHS_LIGHT = ['1', 'l', 'i', '|', '/', '\\', '{', '}', '[', ']', '?', '!', '+', '*', '-', '='];

const ALL_CHARS = [
  ' ', '.', '·', ':', '-', '=', '+', '*', '?', '!',
  ...GLYPHS_LIGHT,
  ...GLYPHS_MID,
  ...GLYPHS_HEAVY
];

const ALPHAS = [0.12, 0.28, 0.50, 0.78];
const TW = 28;
const TH = 20;

function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const sm = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Generador de busto humano real con proporciones clásicas
function personBust(u, v, seed) {
  const headW = 0.32 + 0.04 * hash(seed, 1);
  const headH = 0.40 + 0.04 * hash(seed, 2);
  const headY = -0.42 + 0.03 * (hash(seed, 3) - 0.5);

  const hx = u / headW;
  const hy = (v - headY) / headH;
  const d2 = hx * hx + hy * hy;

  let lum = 0;

  // Cabello envolvente en cráneo
  const inHair = (v < headY + 0.1) && ((hx * hx) / 1.15 + Math.pow((hy + 0.08) / 1.1, 2) < 1.08);
  if (inHair) {
    lum = Math.max(lum, 0.70 + 0.22 * Math.sin(u * 16 + seed));
  }

  // Rostro con rasgos anatómicos esculpidos
  if (d2 < 1.0) {
    const nz = Math.sqrt(Math.max(0.08, 1 - 0.7 * hx * hx - 0.65 * hy * hy));
    let fLum = 0.44 + 0.48 * nz;

    // Cuencas oculares
    const eyeSpacing = 0.38 + 0.05 * hash(seed, 5);
    const ex = Math.abs(hx) - eyeSpacing;
    const ey = hy + 0.02;
    const eyeSocket = Math.exp(-(ex * ex) / 0.03 - (ey * ey) / 0.02);
    fLum -= 0.38 * eyeSocket;

    // Cejas
    const browArch = 0.04 * hash(seed, 6);
    const browY = hy + 0.14 + browArch * Math.cos(ex * 4.0);
    if (Math.abs(ex) < 0.25 && Math.abs(browY) < 0.04) fLum *= 0.35;

    // Nariz
    if (hy > -0.06 && hy < 0.26 && Math.abs(hx) < 0.16) {
      fLum += 0.22 * Math.exp(-(hx * hx) / 0.008) * sm(-0.06, 0.22, hy);
      if (hy > 0.18) fLum -= 0.28 * sm(0.18, 0.26, hy);
    }

    // Labios / boca
    const my = hy - 0.48;
    if (Math.abs(hx) < 0.26 && Math.abs(my) < 0.08) {
      if (Math.abs(my) < 0.024) fLum *= 0.32;
      else if (my > 0) fLum += 0.10 * (1 - Math.abs(hx) / 0.26);
    }

    const edge = 1 - sm(0.88, 1.0, d2);
    lum = Math.max(lum, clamp(fLum, 0.18, 0.95) * edge);
  }

  // Cuello CORTO y anatómicamente proporcionado
  const neckW = 0.20 + 0.03 * hash(seed, 7);
  const neckTop = headY + headH * 0.78;
  const neckBot = neckTop + 0.16;
  if (v >= neckTop && v <= neckBot && Math.abs(u) < neckW) {
    const nShade = 0.52 * (1 - 0.4 * Math.pow(u / neckW, 2));
    lum = Math.max(lum, nShade);
  }

  // Hombros y torso descendentes
  const shoulderW = 0.88 + 0.10 * hash(seed, 8);
  const shY = neckBot - 0.02 + 0.28 * Math.pow(Math.min(1, Math.abs(u) / shoulderW), 1.3);
  if (v >= shY && Math.abs(u) <= shoulderW) {
    const shL = sm(0, 0.08, v - shY) * (1 - sm(shoulderW * 0.8, shoulderW, Math.abs(u))) * 0.58;
    lum = Math.max(lum, shL);
  }

  return lum;
}

export function createBackground(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let cw = 8, ch = 14, dpr = 1, cols = 0, rows = 0, cwp = 8, chp = 14;
  let tilesX = 0, tilesY = 0, numTiles = 0;
  let tileOrder = null, tileRev = null;
  let mask = null, tileIdx = null;
  let atlas = null;
  const charMap = new Map();
  let prog = 0;

  function buildAtlas() {
    atlas = document.createElement('canvas');
    atlas.width = ALL_CHARS.length * cwp;
    atlas.height = ALPHAS.length * chp;
    const actx = atlas.getContext('2d');
    actx.font = `${chp}px 'Sligoil Micro',ui-monospace,monospace`;
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';

    ALL_CHARS.forEach((ch, cIdx) => {
      charMap.set(ch, cIdx);
      ALPHAS.forEach((alpha, aIdx) => {
        const y = aIdx * chp;
        actx.fillStyle = `rgba(200, 192, 175, ${alpha})`;
        actx.fillText(ch, (cIdx + 0.5) * cwp, y + chp * 0.5);
      });
    });
  }

  function resize(w, h, cellW = 8, cellH = 14) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = cellW;
    ch = cellH;
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

    for (let t = 0; t < numTiles; t++) {
      tileOrder[t] = hash(t, 77);
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
      const start = tileOrder[t] * 0.75;
      // Insinuación tenue de base + revelación fluida al scrollear
      const rev = sm(start, start + 0.22, prog);
      tileRev[t] = 0.20 + 0.80 * rev;
    }
  }

  function draw(now = 0) {
    if (!atlas || !mask) return;
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dotIdx = charMap.get('.') || 1;
    const tSec = now * 0.001;
    const glitchClock = Math.floor(now * 0.008);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const m = mask[i];
        const t = tileIdx[i];

        // Fondo matricial tenue de puntos
        if (m < 0.09) {
          if (r % 2 === 0 && c % 3 === 0) {
            ctx.drawImage(atlas, dotIdx * cwp, 0, cwp, chp, c * cwp, r * chp, cwp, chp);
          }
          continue;
        }

        const rev = tileRev[t];
        // Respiración sutil en reposo
        const breath = 1 + 0.07 * Math.sin(tSec * 1.6 + tileOrder[t] * 6.28);
        const intensity = clamp(m * rev * breath, 0, 1);
        if (intensity < 0.08) continue;

        // Selección de glifo alfanumérico denso como en la referencia
        let ch = ' ';
        const rSeed = hash(c, r, glitchClock % 97);
        if (intensity > 0.62) {
          const arr = GLYPHS_HEAVY;
          ch = arr[Math.floor(hash(c, r, 1) * arr.length)];
        } else if (intensity > 0.36) {
          const arr = GLYPHS_MID;
          ch = arr[Math.floor(hash(c, r, 2) * arr.length)];
        } else {
          const arr = GLYPHS_LIGHT;
          ch = arr[Math.floor(hash(c, r, 3) * arr.length)];
        }

        // Glitch sutil de memoria que late ocasionalmente
        if (rSeed > 0.985) {
          ch = GLYPHS_HEAVY[Math.floor(rSeed * GLYPHS_HEAVY.length)];
        }

        const cIdx = charMap.get(ch) || dotIdx;
        const al = Math.min(ALPHAS.length - 1, Math.floor(intensity * 4.2));
        const atlasY = al * chp;

        ctx.drawImage(atlas, cIdx * cwp, atlasY, cwp, chp, c * cwp, r * chp, cwp, chp);
      }
    }
  }

  return {
    resize,
    setProgress,
    draw,
    get progress() { return prog; }
  };
}
