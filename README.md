# Artefactos de memoria

Seis objetos procedurales de la dictadura argentina, renderizados como arte ASCII: un libro que se quema, un pañuelo que se desata, una silueta que se borra, unas tijeras que cortan, una jaula que se cierra y una rampa que baja. La escena se rasteriza en un `<pre>` del DOM: **la obra es texto, literalmente**.

El texto que se lee es material real (poesía y literatura del período, citas breves con procedencia). **La interacción está en el texto, no en el modelo:** el scroll recorre la obra y el estado de cada pieza lo sigue; el arrastre sólo gira. No hay clic.

## Abrir

Con Python 3 instalado, ejecutar `iniciar.bat` en Windows, o desde esta carpeta:

```sh
python server.py
```

Abrir http://localhost:8000 . No requiere npm para visualizar la obra: los bundles y las fuentes están incluidos localmente. No abrir `index.html` con `file://`: utiliza módulos ES e interfaz HTTP local.

## Estructura

- `index.html`: documento, importmap (`three`, `motion`, `glyphcss`).
- `style.css`: sistema visual completo — tokens, tipografía, glow, retícula y layout.
- `DESIGN.md`: decisiones de diseño e interacción. Manda sobre `style.css`.
- `PLAN.md`: plan de ejecución por etapas, con el estado real.
- `AGENTS.md`: reglas del repo, trampas técnicas y comandos.
- `src/main.js`: arranque — fuente, corpus, artefacto, escena.
- `src/geometry.js`: conversor Three.js → `Polygon[]` de glyphcss, con color por cara.
- `src/glyph-stage.js`: escena glyphcss, grilla, esculpido del texto, encuadre.
- `src/models/`: los seis artefactos, procedurales.
- `assets/texts/texts.json`: corpus de citas. `status: "placeholder"` = relleno de desarrollo.
- `assets/fonts/`: Sligoil Micro (trama ASCII, SIL OFL 1.1) y Newsreader (lectura, SIL OFL).
- `vendor/`: Three.js, Motion y glyphcss empaquetados (ESM, minificados).
- `tools/dump-silhouette.mjs`: vuelca la silueta ASCII a texto plano, para encuadrar las piezas.
- `docs/`: plan técnico, fuentes, alcance y validación.

## Reconstruir los bundles

```sh
npm install
npm run build
```

`vendor/` está commiteado: la obra se abre sin npm. **Ojo:** `npm install` no funciona sobre el drive `G:` (extrae archivos de 0 bytes); instalar el toolchain en disco local y copiar `vendor/*.js` de vuelta.

## Estado

Etapa 1 del plan: el pipeline de render funciona de punta a punta (geometría → glyphcss → texto esculpido) y la columna de lectura está montada. Falta la legibilidad de las siluetas y el recorrido con scroll: ver `PLAN.md`.
