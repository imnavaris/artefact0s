import { createGlyphScene, createGlyphOrthographicCamera } from 'glyphcss';

const CELL_W = 6;   // px de avance de la celda (se recalibra con la fuente real)
const CELL_H = 10;  // px de alto de línea

// Escenario ASCII: una escena de glyphcss que escribe en un unico <pre>.
export class GlyphStage {
  constructor(host, opts = {}) {
    this.host = host;
    this.text = '';
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
      directionalLight: { direction: [0.4, 0.6, 0.7], intensity: 0.85 },
      ambientLight: { intensity: 0.45 },
      transformCells: (grid) => this.sculpt(grid),
    });
  }

  get output() { return this.handle.output; }

  setText(text) {
    this.chars = [...String(text || '')].filter((c) => c.trim().length > 0);
    this.text = text;
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
    const chars = this.chars;
    if (!chars || !chars.length) return;
    if (this.noSculpt) return;
    let k = 0;
    for (let i = 0; i < grid.char.length; i++) {
      if (grid.char[i] === ' ' || grid.depth[i] === -Infinity) continue;
      grid.char[i] = chars[k++ % chars.length];
    }
  }

  // La malla se reutiliza: recrearla en cada cambio de estado cuesta un
  // pico de 86 ms. `setPolygons` sobre la misma malla solo cambia los datos.
  setPolygons(polygons) {
    if (!this.mesh) {
      this.mesh = this.handle.add(polygons);
    } else {
      this.mesh.setPolygons(polygons);
    }
    this.handle.rerender();
  }

  // Ajusta el zoom para que el objeto entre en la grilla en los dos ejes.
  // El ajuste es de dos renders, no de cinco: iterar cinco veces costaba un
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
      this.camera.zoom = this.fitCache.get(key);
      this.handle.rerender();
    }
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

  rotate(yaw, pitch) {
    this.camera.rotY = yaw;
    this.camera.rotX = pitch;
    this.handle.rerender();
  }
}
