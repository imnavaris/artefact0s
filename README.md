# Artefactos de memoria

Seis objetos procedurales de la última dictadura cívico-militar argentina, renderizados como cuerpos tipográficos en arte ASCII: un libro que se quema, un pañuelo que se desata, una silueta que se vacía, unas tijeras que cortan, una jaula que se cierra y una rampa que baja. La escena se rasteriza en un `<pre>` del DOM: **la obra es texto, literalmente**.

El texto que se lee es material real (poesía, literatura y documentos históricos argentinos del período, citas breves con procedencia verificada). **La interacción está en el texto, no en el modelo:** el scroll recorre la obra y el estado de cada pieza lo sigue; el arrastre (o `Shift + Flechas`) sólo gira la vista. No hay clic.

## Abrir

Con Python 3 instalado, ejecutar `iniciar.bat` en Windows, o desde esta carpeta:

```sh
python server.py
```

Abrir http://localhost:8000 . No requiere npm para visualizar la obra: los bundles y las fuentes están incluidos localmente, y `index.html` incluye el corpus pre-renderizado (`python server.py --bake`) para que también pueda desplegarse directamente como sitio estático en Netlify. No abrir `index.html` con `file://`: utiliza módulos ES e interfaz HTTP.

## Estructura

- `index.html`: documento semántico con enlace de salto, sección `00 Umbral`, las seis piezas pre-renderizadas, colofón de créditos e importmap (`three`, `glyphcss`).
- `style.css`: sistema visual completo: tokens monocromos, `@property --glow`, tipografía, retícula y layout responsive.
- `DESIGN.md`: decisiones de diseño e interacción. Manda sobre `style.css`.
- `PLAN.md`: plan de ejecución por etapas, con el estado real.
- `HANDOFF.md`: estado actual de cierre y evidencia de verificación.
- `AGENTS.md`: reglas del repo, decisiones técnicas y comandos.
- `src/main.js`: arranque: medición de celda, corpus, encuadre multi-estado, scroll, arrastre y accesibilidad de teclado.
- `src/geometry.js`: conversor Three.js a `Polygon[]` de glyphcss, con piso de luminancia monocroma WCAG AA.
- `src/glyph-stage.js`: escena glyphcss, grilla, esculpido continuo del poema y frente de fuego en glifos.
- `src/models/`: los seis artefactos procedurales (`book.js`, `scarf.js`, `silhouette.js`, `scissors.js`, `birds.js`, `flight.js` y `shared.js`).
- `assets/texts/texts.json`: corpus de seis citas argentinas verificadas, con procedencia y permiso.
- `assets/fonts/`: Sligoil Micro (trama ASCII, SIL OFL 1.1) y Newsreader (lectura, SIL OFL).
- `vendor/`: Three.js y glyphcss empaquetados (ESM, minificados).
- `tools/`: herramientas de encuadre y verificación por CDP (`verify-nojs.mjs`, `cdp.mjs`, `perf.mjs`, etc.).
- `docs/VALIDACION.md`: los criterios de cierre de la obra y la evidencia medida.
- `LICENSE.md`: licencias de código, tipografía y textos de la obra.

## Reconstruir los bundles

```sh
npm install
npm run build
```

`vendor/` está commiteado: la obra se abre sin npm. **Nota:** `npm install` no funciona sobre el drive `G:` (extrae archivos de 0 bytes); si se necesita reconstruir `vendor/`, instalar el toolchain en disco local y copiar `vendor/*.js` de vuelta.

## Estado

Obra cerrada y auditada bajo `/antislop`. Las seis piezas se renderizan en paleta monocroma de papel (`#8e8678` a `#ebe4d6`, contraste >= 5.08:1) con único acento ocre en las brasas del libro (`#d99b26`), sin filtración de caracteres `@%#*+=`, con corpus literario argentino verificado y layout responsive validado en desktop (`1440 × 900`) y mobile (`375 × 812`).
