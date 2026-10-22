// Barrido de poses para encuadrar una pieza.
//   node tools/dump-sweep.mjs <pieza> "<rx,ry> <rx,ry> ..." [p]
// Imprime la silueta compacta de cada pose para elegir la mejor.
import { execFileSync } from 'node:child_process';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';

const [piece = 'book', poseList = '0,0', p = '0'] = process.argv.slice(2);

for (const pose of poseList.split(/\s+/).filter(Boolean)) {
  const [rx, ry] = pose.split(',');
  const url = `http://127.0.0.1:${PORT}/?piece=${piece}&rx=${rx}&ry=${ry}&p=${p}`;
  let html;
  try {
    html = execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      `--user-data-dir=${process.env.TEMP}\chromeprofile-${process.pid}`,
      '--window-size=1440,900',
      '--virtual-time-budget=6000',
      '--dump-dom', url,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    console.log(`# ${piece} rx=${rx} ry=${ry} -> ERROR`);
    continue;
  }

  const at = html.indexOf('class="glyph-output"');
  const open = html.indexOf('>', at);
  const close = html.indexOf('</pre>', open);
  if (at < 0 || close < 0) { console.log(`# ${piece} rx=${rx} ry=${ry} -> SIN PRE`); continue; }
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
  const w = maxC - minC + 1;
  const h = maxR - minR + 1;
  console.log(`### ${piece} rx=${rx} ry=${ry} | ${w}x${h} | col ${minC}-${maxC} row ${minR}-${maxR} | aspect ${(w / h).toFixed(2)}`);

  const step = Math.max(2, Math.round(h / 26));
  for (let r = 0; r < rows.length; r += step) {
    const shape = rows[r].replace(/ /g, '.').replace(/[^.]/g, '#').replace(/\.+$/, '').replace(/^\.+/, '');
    if (shape.trim()) console.log(shape);
  }
  console.log();
}
