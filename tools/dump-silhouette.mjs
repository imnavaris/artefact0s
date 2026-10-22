// Vuelca la silueta de la escena ASCII a texto plano, para encuadrar las piezas.
//   node tools/dump-silhouette.mjs <salida.html> [paso]
// El <pre> del DOM lleva \r al final de cada fila: hay que sacarlo o aparece
// una columna fantasma en el borde derecho.
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const step = +(process.argv[3] || 2);
if (!file) {
  console.error('uso: node tools/dump-silhouette.mjs <salida.html> [paso]');
  process.exit(1);
}

const dom = readFileSync(file, 'utf8');
const at = dom.indexOf('class="glyph-output"');
if (at < 0) {
  console.error('no hay <pre class="glyph-output"> en el DOM');
  process.exit(1);
}
const open = dom.indexOf('>', at);
const close = dom.indexOf('</pre>', open);
const text = dom
  .slice(open + 1, close)
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/\r/g, '');

text.split('\n').forEach((row, r) => {
  if (r % step) return;
  const shape = row.replace(/ /g, '.').replace(/[^.]/g, '#').replace(/\.+$/, '');
  if (shape.trim()) console.log(String(r).padStart(3), shape);
});
