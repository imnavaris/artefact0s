import { createBook } from './models/book.js';
import { toGlyphPolygons } from './geometry.js';
import { GlyphStage } from './glyph-stage.js';

// Pose de camara por artefacto. El encuadre no es generico: cada pieza se
// compone para su propia vista, y rotX/rotY estan en grados.
const POSES = {
  book: { rotX: 46, rotY: -14, zoom: 120 },
};

const host = document.getElementById('stage');
const stage = new GlyphStage(host);

// La tipografia falla en silencio: se espera a que las fuentes esten listas y se
// mide el avance real de la celda antes de calcular la grilla.
await document.fonts.ready;
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-size:10px';
probe.style.fontFamily = "'Sligoil Micro',ui-monospace,'Cascadia Mono',Consolas,monospace";
probe.textContent = 'MMMMMMMMMM';
document.body.appendChild(probe);
const cellW = probe.getBoundingClientRect().width / 10;
probe.remove();
stage.setCellMetrics(cellW || 6, 10);

const corpus = await fetch('assets/texts/texts.json').then((r) => r.json());
const entry = corpus.texts.find((t) => t.piece === 'book');

const book = createBook();
const pose = POSES.book;
// Override de encuadre para ajustar la pose de cada pieza: ?rx=90&ry=180
const q = new URLSearchParams(location.search);
if (q.has('rx')) pose.rotX = parseFloat(q.get('rx'));
if (q.has('ry')) pose.rotY = parseFloat(q.get('ry'));
stage.camera.rotX = pose.rotX;
stage.camera.rotY = pose.rotY;
stage.camera.zoom = pose.zoom;
stage.setText(entry.excerpt);
stage.setPolygons(toGlyphPolygons(book.root));

const fit = () => {
  stage.resize(host.clientWidth, host.clientHeight);
  stage.fit();
};
fit();
window.addEventListener('resize', fit);

// Columna de lectura: el texto completo vive en el DOM desde el primer render.
document.getElementById('quote').textContent = entry.excerpt;
document.getElementById('attribution').textContent = entry.author
  ? `${entry.author}, ${entry.work}${entry.year ? ', ' + entry.year : ''}`
  : 'Sin atribucion: texto provisorio.';

window.__artefactos = { stage, book, corpus };
