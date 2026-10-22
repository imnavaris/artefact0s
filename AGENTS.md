# AGENTS.md — Artefactos de memoria

Reglas de trabajo del repo. Autoridad: `usuario-en-sesión` > este archivo > `DESIGN.md` (decisiones visuales ya tomadas) > `PLAN.md` (orden de ejecución) > `SKILL.md`.

El vault tiene su propio `AGENTS.md`; este archivo sólo aplica a la carpeta del proyecto.

## Qué es esta obra

Seis objetos (El libro quemado, El Pañuelo, La Silueta, Las Tijeras, Los Pájaros, El Vuelo) sobre la dictadura argentina, renderizados como arte ASCII. **La interactividad está en el texto, no en el modelo.** Es un dispositivo de lectura, no un juego: no hay clic, no hay recompensas, no hay partículas.

El texto que se lee es material real: seis citas de poesía y literatura del período, con procedencia y permiso anotados en `assets/texts/texts.json`. Ese archivo es la **única fuente de verdad**: `server.py` lo inyecta en el documento para que el texto exista aunque no haya JavaScript. Un texto con `status: "placeholder"` es relleno de desarrollo: **la obra no se entrega con ellos**.

## Cómo se abre

```sh
python server.py          # o iniciar.bat en Windows
# http://localhost:8000
```

No requiere npm para visualizar: `vendor/` está commiteado. npm sólo hace falta para **reconstruir** `vendor/`.

## Stack

| Capa | Qué | Dónde |
|---|---|---|
| Geometría | Three.js como **biblioteca de geometría únicamente**. No hay renderer WebGL. | `vendor/three.js` |
| Raster | glyphcss: `Polygon[]` → texto en un `<pre>` del DOM | `vendor/glyphcss.js` |
| Puente | Three.js `BufferGeometry` → `Polygon[]` con color por cara | `src/geometry.js` |
| Escena | Escena glyphcss + esculpido del texto sobre la grilla | `src/glyph-stage.js` |
| Modelos | Los seis artefactos, procedurales. Cada uno es `update(p)`: una función pura del progreso. | `src/models/*.js` |
| Servidor | Python stdlib: estático, e inyecta el corpus en el documento | `server.py` |

## Mapa de archivos

```
index.html            documento, importmap (three / motion / glyphcss)
style.css             sistema visual completo (tokens, tipografía, glow, layout)
DESIGN.md             decisiones de diseño e interacción. Manda sobre style.css
PLAN.md               plan de ejecución por etapas
AGENTS.md             este archivo
src/main.js           bootstrap: fuente, corpus, seis piezas, scroll, arrastre
src/geometry.js       conversor Three.js → Polygon[]
src/glyph-stage.js    escena glyphcss, grilla, esculpido, encuadre
src/models/*.js       los seis artefactos
assets/texts/         corpus de citas (fuente de verdad del texto)
assets/fonts/         Sligoil Micro (trama ASCII), Newsreader (lectura)
vendor/               bundles commiteados: three, motion, glyphcss
tools/                encuadre y verificación: siluetas, poses, capturas, costo
docs/VALIDACION.md    criterios de cierre de la obra y cómo se miden
```

## Reglas duras

1. **Nada de clic izquierdo.** Ningún handler de `click`/`pointerdown` sobre el escenario que dispare estado del modelo. La rueda hace scroll; el arrastre sólo gira.
2. **Nada de partículas.** Ni de fondo ni de estado. Si una escena necesita atmósfera, se resuelve con color, glifo o textura.
3. **El texto manda.** El bloque legible en el DOM es el contenido. La capa ASCII es la inscripción, no el mensaje.
4. **El estado es función del progreso.** `state = f(p)`, sin memoria ni acumuladores: subir deshace lo que bajar hizo.
5. **Cero extrapolación en el corpus.** Cada cita con autor, obra, año y edición/URL. Si no está verificado, `status: "placeholder"`.
6. **Cero colores inventados**: la paleta y la tipografía están fijadas en `DESIGN.md` y en los tokens de `style.css`.

## Decisiones técnicas que ya costaron sangre

No romperlas. Cada una tiene una razón y una trampa:

- **Ejes**: Three.js es Y-up, glyphcss es Z-up. El mapeo correcto es `(x, -z, y)`: una **rotación**. La reflexión `(x, z, y)` invierte la orientación de las caras y el objeto sale del reves.
- **Celda y `<pre>`**: el ancho del `<pre>` tiene que ser exactamente `cols × cellW` de la grilla que resolvió la escena (`handle.getBaseResolution()`). Si no, la última celda envuelve a la fila siguiente y aparece una franja vertical en el borde.
- **CSS de glyphcss**: la librería inyecta `.glyph-scene .glyph-output { font-family: monospace; font-size: inherit; line-height: 1 }` con especificidad 0,2,0. La trama usa **0,3,0** (`.stage .glyph-scene .glyph-output`): si no, el `font-size: inherit` gana y la trama sale a 20 px en vez de 10, y todo el encuadre cambia.
- **Celdas superpuestas**: las nueve hojas del libro están a menos de una celda de distancia. Sin `depthEpsilon` la trama hierve de z-fighting. Va en `0.02`.
- **Tipografía**: la fuente falla en silencio. El primer render espera `document.fonts.ready` y mide el avance real de la celda; si la fuente no cargó, se cae a `ui-monospace` con el mismo `font-size`.
- **Ejes de la cámara**: `rotX`/`rotY` están en **grados**. Cada artefacto tiene su propia pose en `POSES` (`src/main.js`); no hay una pose genérica. Para calibrar una pose sin tocar código: `?piece=book&rx=90&ry=180`.
- **El encuadre se mide sobre la grilla resuelta**: `stage.resize()` tiene que correr antes de `stage.fit()`. Si se mide antes, la grilla es la de 80×24 del default de glyphcss y la pieza queda diminuta.
- **El sombreado suave no vale lo que cuesta**: `smoothShading: true` multiplica por siete el costo del raster (52,8 ms contra 9,5) y solo cambia el 0,07 % de los píxeles. Va en `false`.
- **Sin JavaScript el texto tiene que estar en el DOM**: por eso `server.py` inyecta el corpus en `index.html`. El JS solo completa lo que falta.
- **`rAF` no corre en headless con `--dump-dom`**: para verificar de verdad, usar el CDP de `tools/cdp.mjs`, que sí ejecuta la página con cuadros reales.
- **El perfil de Chromium es persistente**: `tools/cdp.mjs` deja la caché activada, y el navegador puede servir un módulo viejo del disco. La herramienta desactiva la caché por CDP; si se agrega otra, hacer lo mismo.
- **La pieza activa es la última que pasó por el centro**: el cierre (que no es una pieza) no puede dejar al escenario en la primera pieza. Con la regla de "la sección que contiene el centro", el colofón se leía sobre el libro.
- **Las fuentes viven en la obra**: la sección de créditos del documento es el único lugar donde están las referencias. `docs/FUENTES.md` se absorbió ahí y se borró; no volver a duplicarlas en un documento aparte.


## Comandos

```sh
npm install && npm run build   # re-bundlea vendor/ (three, motion, glyphcss)
python server.py               # sirve en :8000
```

**`npm install` falla en `G:`.** El drive no soporta la extracción de tar de npm (deja archivos de 0 bytes). Instalar el toolchain en disco local (`C:\Users\Usuario\AppData\Local\Temp`) y copiar sólo `vendor/*.js` de vuelta. `vendor/` va commiteado: la obra tiene que abrirse sin npm.

## Checks antes de cerrar

- El navegador no tira errores de consola y no hay pedidos 404 (el `index.html`, `style.css`, `src/*`, `vendor/*`, `assets/*`).
- La trama se ve en el escenario, con la tipografía de lectura en la columna.
- `python .agents/scripts/slop_lint.py` no aplica (no es un documento del vault), pero `PLAN.md`, `DESIGN.md` y `AGENTS.md` no llevan prosa de IA.
- Todo texto nuevo del corpus tiene procedencia verificada.
- La obra se recorre entera: `node tools/cdp.mjs scroll all` (las seis piezas, cada una de 0 a 1, consola limpia).
- Sin JavaScript: `node tools/verify-nojs.mjs` (seis piezas apiladas, texto completo en el DOM).
- El costo por cuadro: `node tools/perf.mjs` (fps en scroll continuo y peor cuadro).

## Herramientas

Todas usan el Chromium que ya trae Playwright en la máquina
(`C:\Users\Usuario\AppData\Local\ms-playwright\chromium-1248`); no piden npm
ni instalación. El servidor tiene que estar corriendo en el puerto 8011 para
las que hablan con la página.

| Herramienta | Para qué |
|---|---|
| `tools/dump-pose.mjs <pieza> [rx] [ry] [p]` | Volca la silueta en texto plano, para leerla como imagen |
| `tools/dump-sweep.mjs <pieza> "<rx,ry> ..." [p]` | Barre poses y mide la silueta de cada una |
| `tools/find-pose.mjs <pieza> [p]` | Ordena la grilla de poses por partedura: una pieza partida en dos lóbulos es la que se lee |
| `tools/shot.mjs <pieza> <salida.png> [rx] [ry] [p]` | Captura la pieza en imagen |
| `tools/shot-at.mjs <salida.png> <scrollY>` | Captura la obra en una posición del recorrido |
| `tools/silhouette-bbox.mjs <salida.html>` | Caja envolvente de la silueta y grilla resuelta |
| `tools/cdp.mjs scroll all` | Recorre la obra con scroll real y reporta estado, glow y consola |
| `tools/cdp.mjs eval "<expr>"` | Evalúa una expresión en la página viva |
| `tools/verify-nojs.mjs` | Verifica la obra con la ejecución de scripts deshabilitada |
| `tools/perf.mjs` | Mide conversión, render, fps y peor cuadro |
| `tools/compare-raster.mjs` / `compare-shade.mjs` | Compara opciones del raster en imagen y en costo |

## Vocabulario

- Identificadores, rutas, commits y comentarios de código: **inglés**.
- Documentación (`DESIGN.md`, `PLAN.md`, `AGENTS.md`, `README.md`): **español rioplatense**.
- Comentarios de código: sólo el porqué, una línea, en español.
