---
type: registro
---

# HANDOFF: Artefactos de memoria

Punto de reanudación. Última sesión de trabajo: 27/10/2026.

## Estado

La obra está **cerrada, verificada y lista para entrega y despliegue estático (Netlify / servidor local)**. Se ejecutó la auditoría integral `/antislop` (18 hallazgos H-01 a H-18) y se aplicaron los 5 bloques quirúrgicos de reingeniería:

1. **Corpus literario e histórico argentino pertinente y verificado** (`assets/texts/texts.json`, `server.py`, `index.html`):
   - Se reemplazaron las repeticiones de Gelman y los poemas sin correspondencia con el objeto por seis fragmentos verificados del período con relación 1 a 1 con cada artefacto:
     - `book` (*El libro quemado*): Juan Gelman, *Bajo la lluvia ajena (notas al pie de una derrota)*, 1980.
     - `scarf` (*El pañuelo*): Juan Gelman, *Hacia el sur* («Otras partes»), 1982, con inscripción en trama `NUNCA MÁS` (Informe CONADEP, 1984 / Madres de Plaza de Mayo).
     - `silhouette` (*La silueta*): Rodolfo Walsh, *Carta abierta de un escritor a la Junta Militar*, 1977.
     - `scissors` (*Las tijeras*): María Elena Walsh, *Desventuras en el País-Jardín-de-Infantes*, 1979.
     - `birds` (*Los pájaros*): Paco Urondo, *Poemas de la cárcel (Villa Devoto)*, 1973.
     - `flight` (*El vuelo*): Néstor Perlongher, *Cadáveres*, 1984.
   - `server.py` escapa con `html.escape()` todos los campos, formatea `<footer>Autor, <i>Obra, Año</i></footer>`, inyecta `cite="URL"` en cada `<blockquote>`, convierte las URLs de `#credits` en enlaces `<a href="...">` reales navegables con `Tab` e incorpora el flag `--bake` para dejar `index.html` pre-renderizado en disco (despliegue directo en Netlify sin requerir Python en producción).
2. **Motor `sculpt()` sin filtración de caracteres `@%#*+=` y encuadre multi-estado** (`src/glyph-stage.js`):
   - Se eliminó el corte prematuro por fila en `sculpt(grid)` cuando la inscripción tiene más de un verso: el 100 % de las celdas ocupadas recibe caracteres del poema (`leakedAsciiCount = 0` en las 6 piezas).
   - Se incorporó `fitMultiState(key, [polys1, polys0])` para calcular el zoom de cada pieza sobre la caja envolvente combinada entre `p = 0` y `p = 1`, evitando recortes cuando crece la jaula en `birds`, cae la cinta en `scissors` o se despliega `scarf`.
3. **Paleta estrictamente monocroma de papel con piso WCAG AA y único acento brasa** (`src/geometry.js`, `src/models/*.js`, `src/glyph-stage.js`):
   - Se eliminaron todos los colores pastel/arcoíris y las texturas oscuras ilegibles (`1.02:1`).
   - `clampPaperColor` en `src/geometry.js` e iluminación calibrada en `src/glyph-stage.js` garantizan que todo glifo renderizado sobre `#0b0c10` tenga un contraste mínimo medido de `5.08:1` a `13.32:1` (`0` spans por debajo de `4.5:1`), reservando `#d99b26` exclusivamente para el frente de brasa del libro quemado.
4. **Reingeniería escultórica y optimización geométrica de los 6 modelos** (`src/models/*.js`):
   - `scarf.js`: se eliminó la esfera negra interna (`1.02:1`) y se reconstruyó el pañuelo con capucha envolvente, nudo frontal y dos puntas en `p = 0`, desplegándose en el triángulo emblemático en `p = 1`.
   - `silhouette.js`: se corrigió la condición invertida de los relieves (`p < 0.68`) para que el volumen anatómico esté presente en `p = 0` y se vacíe hacia `p = 1` dejando la huella perimetral del Siluetazo (`1327` glifos legibles en lugar de 3 caracteres).
   - `birds.js`: se redujo la geometría de `24.080` a `6.128` triángulos (`convMs` bajó de `14.7 ms` a `4.1 ms`).
   - `scissors.js` y `flight.js`: se redujeron triángulos a `2.056` y `1.464` respectivamente, mejorando la lectura del corte de la cinta de celuloide y la apertura de la rampa trasera del Skyvan.
5. **Sección `00 Umbral`, accesibilidad de teclado y layout mobile sin colisión** (`index.html`, `style.css`, `src/main.js`, `package.json`, `build.mjs`):
   - Se agregó `<a class="skip-link" href="#main-content">Saltar al texto</a>` y `<header class="threshold" id="threshold">` con `<h1>Artefactos de memoria</h1>`.
   - Se resolvió la superposición mobile en `< 1100px` y `< 720px`: `.stage` fijo arriba (`44vh` / `40vh`) con `background: var(--bg); z-index: 10; border-bottom: 1px solid var(--hairline)`, `.column` con `margin-top` correspondiente y `.piece-inner` con `top: calc(44vh + 16px)` (`overlapsStage: false`, `horizontalOverflow: false` en `375 × 812`).
   - Se independizó `yaw`/`pitch` por pieza en `userAngles`, se preservó la rotación al redimensionar la ventana, se sincronizó `?piece=<id>` con el scroll de la columna de lectura y se sumó rotación accesible por teclado con `Shift + Flechas`.
   - Se eliminó la dependencia muerta `motion` (`package.json`, `build.mjs`, `index.html`, `LICENSE.md`, `vendor/motion.js`).

## Cómo abrir y verificar

```sh
python server.py --bake         # pre-renderiza citas y créditos en index.html
python server.py --port 8011    # servidor local para herramientas CDP (sin --port usa 8000)
node tools/verify-nojs.mjs      # verifica las 6 piezas y textos con JS deshabilitado
node tools/cdp.mjs scroll all   # recorre toda la obra de 0 a 1 y verifica consola limpia
node tools/perf.mjs             # mide conversión, raster y FPS en scroll continuo
```

## Evidencia ejecutada (27/10/2026)

| Verificación | Resultado medido |
|---|---|
| `node tools/verify-nojs.mjs` | `piezas: 6`, `claseJs: false`, `hayEscenario: false`, textos completos en el DOM (`134` a `231` caracteres por cita) |
| `node tools/cdp.mjs scroll all` | `416` frames, 6 piezas recorridas en orden (`0 -> 1`), `--glow` dinámico (`0.72` / `0.86` / `1`), `CONSOLA: limpia` |
| `node tools/perf.mjs` | `58.6 fps` en scroll continuo, conversión `10.3 ms` (libro) y `0.9 a 5.3 ms` (resto de piezas), `1.582` glifos, grilla `95 × 53` |
| Contraste WCAG AA en `<pre>` | Mínimo medido `5.08:1` (brasa) y `5.48:1` a `13.32:1` (papel monocromo); `0` spans bajo `4.5:1` en las 6 piezas |
| Filtración de glifos (`sculpt`) | `leakedAsciiCount: 0` en todas las piezas y estados (`p = 0`, `0.5`, `1`) |
| Mobile `375 × 812` | `stageBottom: 324.8px`, `pieceInnerTop: 336.8px`, `overlapsStage: false`, `horizontalOverflow: false` (`docWidth: 360 <= 375`) |
