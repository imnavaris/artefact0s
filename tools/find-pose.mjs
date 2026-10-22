// Busca la pose en que una pieza se lee mejor: puntua la silueta por
// bifurcacion (cuantas filas se parten en dos lóbulos) y por aspecto.
//   node tools/find-pose.mjs <pieza> [p]
import { execFileSync } from 'node:child_process';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';

const [piece = 'book', p = '0'] = process.argv.slice(2);

const rxs = [];
for (let rx = 20; rx <= 120; rx += 20) rxs.push(rx);
const rys = [];
for (let ry = -60; ry <= 120; ry += 30) rys.push(ry);

const results = [];
for (const rx of rxs) {
  for (const ry of rys) {
    const url = `http://127.0.0.1:${PORT}/?piece=${piece}&rx=${rx}&ry=${ry}&p=${p}`;
    let html;
    try {
      html = execFileSync(CHROME, [
        '--headless=new', '--disable-gpu', '--no-sandbox',
        `--user-data-dir=${process.env.TEMP}\chromeprofile-${process.pid}`,
        '--window-size=1440,900',
        '--virtual-time-budget=5000',
        '--dump-dom', url,
      ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch { continue; }

    const at = html.indexOf('class="glyph-output"');
    if (at < 0) continue;
    const open = html.indexOf('>', at);
    const close = html.indexOf('</pre>', open);
    const rows = html.slice(open + 1, close)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\r/g, '')
      .split('\n');

    let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
    const runs = [];
    rows.forEach((row, ri) => {
      let c = 0;
      while (c < row.length) {
        if (row[c] === ' ') { c++; continue; }
        const start = c;
        while (c < row.length && row[c] !== ' ') c++;
        runs.push({ r: ri, c0: start, c1: c - 1 });
        if (start < minC) minC = start;
        if (c - 1 > maxC) maxC = c - 1;
        if (ri < minR) minR = ri;
        if (ri > maxR) maxR = ri;
      }
    });
    if (!runs.length) continue;

    // Filas con dos lóbulos separados: es lo que hace que un libro se lea
    // como libro (dos tapas con el lomo al medio) y no como una masa.
    const perRow = new Map();
    for (const run of runs) perRow.set(run.r, (perRow.get(run.r) || 0) + 1);
    const split = [...perRow.values()].filter((n) => n >= 2).length;

    const w = maxC - minC + 1;
    const h = maxR - minR + 1;
    results.push({ rx, ry, w, h, split, fill: +(runs.length / (w * h)).toFixed(2) });
  }
}

results.sort((a, b) => (b.split - a.split) || (b.fill - a.fill));
for (const r of results.slice(0, 20)) {
  console.log(`rx=${String(r.rx).padStart(3)} ry=${String(r.ry).padStart(4)} | ${r.w}x${r.h} | filas partidas ${r.split} | relleno ${r.fill}`);
}
