// Reporta la caja envolvente de la silueta y la grilla resuelta.
//   node tools/silhouette-bbox.mjs <salida.html>
import { readFileSync } from 'node:fs';

const dom = readFileSync(process.argv[2], 'utf8');
const at = dom.indexOf('class="glyph-output"');
const open = dom.indexOf('>', at);
const close = dom.indexOf('</pre>', open);
const text = dom.slice(open + 1, close)
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
console.log('grid rows', rows.length, 'cols', rows[0].length);
console.log('silhouette col', minC, '-', maxC, ' row', minR, '-', maxR);
console.log('width', maxC - minC + 1, 'height', maxR - minR + 1);
console.log('touch right edge:', maxC >= rows[0].length - 1);
console.log('touch left edge:', minC <= 0);
