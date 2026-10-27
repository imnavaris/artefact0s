import { createGlyphScene, createGlyphOrthographicCamera } from 'glyphcss';

const CELL_W = 8;   // px de avance de la celda (se recalibra con la fuente real)
const CELL_H = 14;  // px de alto de línea

// El fuego se simula con glifos, no con partículas: el frente de llama y la
// ceniza que deja atrás.
const FLAME = '^/\\|*~"';
const ASH = ".,";

// Ruido determinista por celda: el frente de fuego no puede ser una recta.
function wobble(c) {
  return Math.sin(c * 0.83) * 1.4 + Math.sin(c * 0.27 + 1.7) * 2.1;
}

function hash(r, c) {
  return Math.abs((r * 73856093) ^ (c * 19349663));
}

// Escenario ASCII: una escena de glyphcss que escribe en un unico <pre>.
export class GlyphStage {
  constructor(host, opts = {}) {
    this.host = host;
    this.text = '';
    this.lines = [];
    this.stream = '';
    this.burn = 0;
    this.extent = null;
    this.cellW = CELL_W;
    this.cellH = CELL_H;
    this.cols = 80;
    this.rows = 24;
    this.cellAspect = CELL_H / CELL_W;
    this.camera = createGlyphOrthographicCamera({ rotX: 62, rotY: -20, zoom: 120 });
    this.handle = createGlyphScene(host, {
      camera: this.camera,
      cols: this.cols,
      rows: this.rows,
      cellAspect: this.cellAspect,
      mode: 'solid',
      glyphPalette: 'default',
      useColors: true,
      colorTolerance: 24,
      retainShade: true,
      depthEpsilon: 0.02,
      supersample: 2,
      // Sin sombreado suave: multiplica por siete el costo del raster
      // (52,8 ms contra 9,5) y solo cambia el 0,07 % de los pixeles. Ademas
      // contradice la referencia de la obra: el glifo se elige por layout, no
      // por brillo medio.
      smoothShading: false,
      doubleSided: opts.doubleSided !== false,
      directionalLight: { direction: [0.4, 0.6, 0.7], intensity: 0.45 },
      ambientLight: { intensity: 0.75 },
      transformCells: (grid) => this.sculpt(grid),
    });
  }

  get output() { return this.handle.output; }

  // La inscripcion se arma por versos: las palabras se separan con un punto
  // medio y cada verso es una linea, para que se lea como poema.
  setText(text) {
    this.lines = String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).join('·'));
    this.text = text;
    this.stream = this.lines.join('·') + '·';
  }

  // Avance de la quema: lo usa el frente de fuego de la inscripcion.
  setBurn(value) {
    this.burn = value > 0 ? (value < 1 ? value : 1) : 0;
  }

  // Pintar el texto sobre la silueta: cada celda ocupada recibe un caracter.
  sculpt(grid) {
    let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const i = r * grid.cols + c;
        if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
      }
    }
    this.extent = maxC < 0 ? null : { minC, maxC, minR, maxR };
    const stream = this.stream;
    if (!stream) return;
    let idx = 0;
    for (let r = 0; r < grid.rows; r++) {
      let wrote = false;
      for (let c = 0; c < grid.cols; c++) {
        const i = r * grid.cols + c;
        if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
        grid.char[i] = stream[idx % stream.length];
        idx++;
        wrote = true;
      }
      if (wrote) idx = (idx + 3) % stream.length;
    }
    this.burnCells(grid);
  }

  // El frente de fuego avanza desde el borde superior de la silueta: delante,
  // llama; detras, ceniza. Donde llega el fuego, el poema se consume.
  burnCells(grid) {
    if (this.burn <= 0 || !this.extent) return;
    const e = this.extent;
    const rows = e.maxR - e.minR + 1;
    for (let r = e.minR; r <= e.maxR; r++) {
      for (let c = e.minC; c <= e.maxC; c++) {
        const i = r * grid.cols + c;
        if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
        const d = e.minR + this.burn * rows * 1.05 + wobble(c) - r;
        if (d <= 0) continue;
        const isAsh = d > 4;
        grid.char[i] = isAsh
          ? ASH[hash(r, c) % ASH.length]
          : FLAME[hash(r, c) % FLAME.length];
        if (grid.color) {
          grid.color[i] = isAsh ? '#9e9688' : '#d99b26';
        }
      }
    }
  }

  // La malla se reutiliza: recrearla en cada cambio de estado cuesta un
  // pico de 86 ms. `setPolygons` sobre la misma malla solo cambia los datos.
  setPolygons(polygons, render = true) {
    if (!this.mesh) {
      this.mesh = this.handle.add(polygons);
    } else {
      this.mesh.setPolygons(polygons);
    }
    if (render) {
      this.handle.rerender();
    }
  }

  // Ajustar el zoom para que el objeto entre en la grilla en los dos ejes.
  // El ajuste es de dois renders, no de cinco: iterar cinco veces costaba un
  // pico de 86 ms en cada cambio de pieza.
  fit(targetW = 0.72, targetH = 0.82) {
    const base = this.handle.getBaseResolution();
    this.handle.rerender();
    const e = this.extent;
    if (!e) return;
    const w = e.maxC - e.minC + 1;
    const h = e.maxR - e.minR + 1;
    if (!w || !h) return;
    const ratio = Math.min((targetW * base.cols) / w, (targetH * base.rows) / h);
    if (Math.abs(ratio - 1) < 0.03) return;
    this.camera.zoom *= ratio;
    this.handle.rerender();
  }

  // Zoom final por pieza. El encuadre de una pieza no cambia con el scroll:
  // se calcula una vez y se reutiliza, para no pagar dos renders extra cada
  // vez que el scroll cambia de pieza.
  fitCache = new Map();

  fittedZoom(key, targetW = 0.72, targetH = 0.82) {
    if (!this.fitCache.has(key)) {
      this.fit(targetW, targetH);
      this.fitCache.set(key, this.camera.zoom);
    } else {
      const zoom = this.fitCache.get(key);
      this.camera.zoom = zoom;
      this.handle.rerender();
    }
    return this.camera.zoom;
  }

  fitMultiState(key, statesPolys, targetW = 0.72, targetH = 0.80) {
    const base = this.handle.getBaseResolution();
    let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
    for (const polys of statesPolys) {
      this.setPolygons(polys, true);
      const e = this.extent;
      if (!e) continue;
      if (e.minC < minC) minC = e.minC;
      if (e.maxC > maxC) maxC = e.maxC;
      if (e.minR < minR) minR = e.minR;
      if (e.maxR > maxR) maxR = e.maxR;
    }
    if (maxC >= minC && maxR >= minR) {
      const w = maxC - minC + 1;
      const h = maxR - minR + 1;
      const ratio = Math.min((targetW * base.cols) / w, (targetH * base.rows) / h);
      if (Math.abs(ratio - 1) >= 0.03) {
        this.camera.zoom *= ratio;
      }
    }
    this.fitCache.set(key, this.camera.zoom);
    return this.camera.zoom;
  }

  resize(width, height) {
    this.cols = Math.max(20, Math.floor(width / this.cellW));
    this.rows = Math.max(10, Math.floor(height / this.cellH));
    this.handle.setOptions({ cols: this.cols, rows: this.rows, cellAspect: this.cellAspect });
    // La escena puede ajustar la grilla: el <pre> tiene que medir exactamente
    // lo que la escena resolvio, o la ultima celda envuelve a la fila siguiente.
    const base = this.handle.getBaseResolution();
    const pre = this.output;
    if (pre) {
      pre.style.width = base.cols * this.cellW + 'px';
      pre.style.height = base.rows * this.cellH + 'px';
    }
  }

  // La tipografia falla en silencio: se mide el avance real antes de pintar.
  setCellMetrics(cellW, cellH) {
    this.cellW = cellW;
    this.cellH = cellH;
    this.cellAspect = cellH / cellW;
  }
}
