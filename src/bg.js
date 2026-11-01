// Fondo: grilla ASCII con siluetas humanas unicas en memoria de los desaparecidos.
// Cada silueta varia en contextura, forma de cabeza, hombros y peinado/rasgos.
// Los caracteres de cada silueta son unicos y no tienen parpadeo ni letras distractoras.

const RAMPS = [
 ' ..::--==++**##%%@@',
 ' ..,,--__::;;II11||',
 ' ..``\'\'^^~~**XX##@@',
 ' ..::;;??<<>>$$&&%%',
 ' ..,,::++==??SS88@@',
 ' ..::--++**##WWMM@@'
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

function personBust(u, v, tSeed) {
 const headW = 0.22 + 0.1 * hash(tSeed, 1);
 const headH = 0.3 + 0.12 * hash(tSeed, 2);
 const headY = -0.38 + 0.08 * (hash(tSeed, 3) - 0.5);
 
 const hx = u / headW;
 const hy = (v - headY) / headH;
 const d = hx * hx + hy * hy;
 let head = d < 1 ? 1 - sm(0.65, 1, d) : 0;

 const hairStyle = hash(tSeed, 4);
 if (hairStyle > 0.4 && v < headY && Math.abs(u) < headW * 1.25) {
 head = Math.max(head, 0.85 * (1 - sm(0, headW * 1.3, Math.abs(u))));
 }

 const neckW = 0.08 + 0.05 * hash(tSeed, 5);
 const neckTop = headY + headH * 0.55;
 const neckBottom = neckTop + 0.26;
 const neck = (Math.abs(u) < neckW && v >= neckTop && v <= neckBottom)
 ? 1 - sm(neckW * 0.6, neckW, Math.abs(u))
 : 0;

 const shoulderW = 0.72 + 0.24 * hash(tSeed, 6);
 const shoulderSlope = 0.4 + 0.35 * hash(tSeed, 7);
 const shY = neckBottom - 0.04 + shoulderSlope * Math.pow(Math.min(1, Math.abs(u) / shoulderW), 1.7);
 const sh = (v >= shY && Math.abs(u) <= shoulderW)
 ? sm(0, 0.08, v - shY) * (1 - sm(shoulderW * 0.78, shoulderW, Math.abs(u)))
 : 0;

 return Math.max(head, neck, sh);
}

export function createBackground(canvas) {
 const ctx = canvas.getContext('2d', { alpha: false });
 let cw = 8, ch = 14, dpr = 1, cols = 0, rows = 0, cwp = 8, chp = 14;
 let atlas = null, mask = null, tileIdx = null, thr = null, tileRev = null, tileRamp = null, tiles = 0;
 let prog = 0, lastKey = '';

 function buildAtlas() {
 cwp = Math.round(cw * dpr);
 chp = Math.round(ch * dpr);
 const maxChars = RAMPS[0].length;
 atlas = document.createElement('canvas');
 atlas.width = cwp * maxChars;
 atlas.height = chp * ALPHAS.length * RAMPS.length;
 const a = atlas.getContext('2d');
 a.textBaseline = 'middle';
 a.textAlign = 'center';
 a.font = `${ch * dpr}px 'Sligoil Micro',ui-monospace,Consolas,monospace`;

 for (let rIdx = 0; rIdx < RAMPS.length; rIdx++) {
 const currentRamp = RAMPS[rIdx];
 for (let al = 0; al < ALPHAS.length; al++) {
 const yBase = (rIdx * ALPHAS.length + al) * chp;
 for (let g = 1; g < currentRamp.length; g++) {
 a.fillStyle = `rgba(165,172,192,${ALPHAS[al]})`;
 a.fillText(currentRamp[g], g * cwp + cwp / 2, yBase + chp / 2 + dpr * 0.5);
 }
 }
 }
 }

 function resize(w, h, cellW, cellH) {
 cw = cellW || cw;
 ch = cellH || ch;
 dpr = Math.min(2, window.devicePixelRatio || 1);
 buildAtlas();
 cols = Math.ceil(w / cw) + 1;
 rows = Math.ceil(h / ch) + 1;
 canvas.width = cols * cwp;
 canvas.height = rows * chp;
 mask = new Float32Array(cols * rows);
 tileIdx = new Int32Array(cols * rows);

 const tcols = Math.ceil((cols + TW) / TW) + 1;
 const trows = Math.ceil(rows / TH) + 1;
 tiles = tcols * trows;
 thr = new Float32Array(tiles);
 tileRev = new Float32Array(tiles);
 tileRamp = new Uint8Array(tiles);

 for (let t = 0; t < tiles; t++) {
 thr[t] = hash(t % tcols, (t / tcols) | 0, 77);
 tileRamp[t] = Math.floor(hash(t, 99) * RAMPS.length) % RAMPS.length;
 }

 for (let r = 0; r < rows; r++) {
 const tr = (r / TH) | 0;
 const off = tr & 1 ? TW >> 1 : 0;
 for (let c = 0; c < cols; c++) {
 const i = r * cols + c;
 const tc = ((c + off) / TW) | 0;
 const tIndex = tr * tcols + tc;
 tileIdx[i] = tIndex;

 const u = (((c + off) % TW) / TW) * 2 - 1;
 const v = ((r % TH) / TH) * 2 - 1;
 const m = personBust(u, v, tIndex * 31);
 if (m > 0) {
 const grain = (hash(c, r, tIndex % 17) - 0.5) * 0.22;
 const lit = 0.58 + 0.32 * (1 - Math.abs(u)) + grain;
 mask[i] = m * clamp(lit, 0.35, 1);
 } else {
 mask[i] = 0;
 }
 }
 }
 lastKey = '';
 }

 function setProgress(p) { prog = clamp(p, 0, 1); }

 function draw() {
 if (!atlas) return;
 const key = prog.toFixed(3);
 if (key === lastKey) return;
 lastKey = key;

 for (let t = 0; t < tiles; t++) {
 tileRev[t] = sm(0, 1, (prog - thr[t] * 0.82) / 0.16);
 }

 ctx.fillStyle = '#060607';
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 const rampLen = RAMPS[0].length;
 for (let r = 0; r < rows; r++) {
 for (let c = 0; c < cols; c++) {
 const i = r * cols + c;
 const m = mask[i];
 if (m <= 0) continue;

 const t = tileIdx[i];
 const rev = tileRev[t];
 if (rev <= 0.01) continue;

 const intensity = clamp(m * rev * 0.95, 0, 1);
 if (intensity < 0.05) continue;

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