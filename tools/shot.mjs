// Captura el escenario ASCII de una pieza como PNG, para leer la obra como
// se ve y no como mascara de hashes.
//   node tools/shot.mjs <pieza> <salida.png> [rx] [ry] [p] [ancho] [alto]
import { execFileSync } from 'node:child_process';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';

const [piece = 'book', out = 'shot.png', rx = '', ry = '', p = '0', width = '1440', height = '900'] = process.argv.slice(2);

const params = [`piece=${piece}`, `p=${p}`];
if (rx !== '') params.push(`rx=${rx}`);
if (ry !== '') params.push(`ry=${ry}`);
const url = `http://127.0.0.1:${PORT}/?${params.join('&')}`;

execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=C:\\Users\\Usuario\\AppData\\Local\\Temp\\opencode\\chromeprofile',
  `--window-size=${width},${height}`,
  '--virtual-time-budget=6000',
  `--screenshot=${out}`,
  url,
], { stdio: ['ignore', 'ignore', 'ignore'] });

console.log(out);
