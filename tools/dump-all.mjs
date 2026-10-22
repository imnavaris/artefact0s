// Vuelca la silueta de cada pieza a texto plano, para encuadrar las seis.
//   node tools/dump-all.mjs <carpeta-salida> [p] [ancho] [alto]
// Usa Chromium headless de Playwright (no requiere npm en el proyecto).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';
const outDir = process.argv[2] || '.';
const p = process.argv[3] ?? '0';
const width = process.argv[4] || '1440';
const height = process.argv[5] || '900';
const pieces = ['book', 'scarf', 'silhouette', 'scissors', 'birds', 'flight'];

mkdirSync(outDir, { recursive: true });

for (const piece of pieces) {
  const url = `http://127.0.0.1:${PORT}/?piece=${piece}&p=${p}`;
  const html = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${process.env.TEMP}\chromeprofile-${process.pid}`,
    `--window-size=${width},${height}`,
    '--virtual-time-budget=9000',
    '--dump-dom', url,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

  const file = join(outDir, `${piece}.html`);
  writeFileSync(file, html, 'utf8');

  const at = html.indexOf('class="glyph-output"');
  const open = html.indexOf('>', at);
  const close = html.indexOf('</pre>', open);
  const text = html.slice(open + 1, close)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\r/g, '');

  const rows = text.split('\n');
  let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
  rows.forEach((row, ri) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === ' ') continue;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
      if (ri < minR) minR = ri;
      if (ri > maxR) maxR = ri;
    }
  });

  console.log(`=== ${piece}  grid ${rows[0].length}x${rows.length}  silueta col ${minC}-${maxC} row ${minR}-${maxR}  (${maxC - minC + 1}x${maxR - minR + 1})`);

  const step = 2;
  for (let r = 0; r < rows.length; r += step) {
    const shape = rows[r].replace(/ /g, '.').replace(/[^.]/g, '#').replace(/\.+$/, '');
    if (shape.trim()) console.log(String(r).padStart(3), shape);
  }
  console.log();
}
