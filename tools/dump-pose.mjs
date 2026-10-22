// Vuelca la silueta de una pieza con una pose concreta.
//   node tools/dump-pose.mjs <pieza> <rx> <ry> [p] [zoom]
// Sirve para encuadrar: se prueba una pose y se lee la silueta como imagen.
import { execFileSync } from 'node:child_process';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';

const [piece = 'book', rx = '46', ry = '-14', p = '0'] = process.argv.slice(2);

const params = [`piece=${piece}`, `p=${p}`];
if (rx !== '' && rx !== undefined) params.push(`rx=${rx}`);
if (ry !== '' && ry !== undefined) params.push(`ry=${ry}`);
const url = `http://127.0.0.1:${PORT}/?${params.join('&')}`;
const html = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--user-data-dir=${process.env.TEMP}\chromeprofile-${process.pid}`,
  '--window-size=1440,900',
  '--virtual-time-budget=9000',
  '--dump-dom', url,
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

const at = html.indexOf('class="glyph-output"');
const open = html.indexOf('>', at);
const close = html.indexOf('</pre>', open);
const rows = html.slice(open + 1, close)
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/\r/g, '')
  .split('\n');

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
console.log(`# ${piece} rx=${rx} ry=${ry} p=${p} | grid ${rows[0].length}x${rows.length} | silueta col ${minC}-${maxC} row ${minR}-${maxR} (${maxC - minC + 1}x${maxR - minR + 1})`);

const step = 2;
const raw = process.env.RAW === '1';
for (let r = 0; r < rows.length; r += step) {
  if (raw) {
    if (rows[r].trim()) console.log(String(r).padStart(3), rows[r].replace(/\s+$/, ''));
    continue;
  }
  const shape = rows[r].replace(/ /g, '.').replace(/[^.]/g, '#').replace(/\.+$/, '');
  if (shape.trim()) console.log(String(r).padStart(3), shape.replace(/^\.+/, ''));
}
