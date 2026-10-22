# AGENTS.md — Artefactos de memoria

Reglas de trabajo del repo. Autoridad: `usuario-en-sesión` > este archivo > `DESIGN.md` (decisiones visuales ya tomadas) > `PLAN.md` (orden de ejecución) > `SKILL.md`.

El vault tiene su propio `AGENTS.md`; este archivo sólo aplica a la carpeta del proyecto.

## Qué es esta obra

Seis objetos (El libro quemado, El Pañuelo, La Silueta, Las Tijeras, Los Pájaros, El Vuelo) sobre la dictadura argentina, renderizados como arte ASCII. **La interactividad está en el texto, no en el modelo.** Es un dispositivo de lectura, no un juego: no hay clic, no hay recompensas, no hay partículas.

El texto que se lee es material real (poesía y literatura del período, citas breves con procedencia). Los textos con `status: "placeholder"` en `assets/texts/texts.json` son relleno de desarrollo: **la obra no se entrega con ellos**.

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
| Modelos | Los seis artefactos, procedurales | `src/models/*.js` |
| Servidor | Python stdlib: estático + API de textos | `server.py` |

## Mapa de archivos

```
index.html            documento, importmap (three / motion / glyphcss)
style.css             sistema visual completo (tokens, tipografía, glow, layout)
DESIGN.md             decisiones de diseño e interacción. Manda sobre style.css
PLAN.md               plan de ejecución por etapas
AGENTS.md             este archivo
src/main.js           bootstrap: fuente, corpus, artefacto, escena
src/geometry.js       conversor Three.js → Polygon[]
src/glyph-stage.js    escena glyphcss, grilla, esculpido, encuadre
src/models/*.js       los seis artefactos
src/ascii.js          OBSOLETO (renderer WebGL viejo) — borrar cuando la migración cierre
src/input.js          OBSOLETO (arcball viejo) — idem
assets/texts/         corpus de citas
assets/fonts/         Sligoil Micro (trama ASCII), Newsreader (lectura)
vendor/               bundles commiteados: three, motion, glyphcss
docs/                 plan técnico, fuentes, validación
```

## Reglas duras

1. **Nada de clic izquierdo.** Ningún handler de `click`/`pointerdown` sobre el escenario que dispare estado del modelo. La rueda hace scroll; el arrastre sólo gira.
2. **Nada de partículas.** Ni de fondo ni de estado. Si una escena necesita atmósfera, se resuelve con color, glifo o textura.
3. **El texto manda.** El bloque legible en el DOM es el contenido. La capa ASCII es la inscripción, no el mensaje.
4. **El estado es función del progreso.** `state = f(p)`, sin memoria ni acumuladores: subir deshace lo que bajar hizo.
5. **Cero extrapolación en el corpus.** Cada cita con autor, obra, año y edición/URL. Si no está verificado, `status: "placeholder"`.
6. **Cero颜色 inventados**: la paleta y la tipografía están fijadas en `DESIGN.md` y en los tokens de `style.css`.

## Decisiones técnicas que ya costaron sangre

No romperlas. Cada una tiene una razón y una trampa:

- **Ejes**: Three.js es Y-up, glyphcss es Z-up. El mapeo correcto es `(x, -z, y)`: una **rotación**. La reflexión `(x, z, y)` invierte la orientación de las caras y el objeto sale del reves.
- **Celda y `<pre>`**: el ancho del `<pre>` tiene que ser exactamente `cols × cellW` de la grilla que resolvió la escena (`handle.getBaseResolution()`). Si no, la última celda envuelve a la fila siguiente y aparece una franja vertical en el borde.
- **CSS de glyphcss**: la librería inyecta `.glyph-scene .glyph-output { font-family: monospace; font-size: inherit; line-height: 1 }`. Cualquier regla de la trama tiene que usar esa misma especificidad o mayor; `.glyph-output` solo no gana.
- **Celdas superpuestas**: las nueve hojas del libro están a menos de una celda de distancia. Sin `depthEpsilon` la trama hierve de z-fighting. Va en `0.02`.
- **Tipografía**: la fuente falla en silencio. El primer render espera `document.fonts.ready` y mide el avance real de la celda; si la fuente no cargó, se cae a `ui-monospace` con el mismo `font-size`.
- **Ejes de la cámara**: `rotX`/`rotY` están en **grados**. Cada artefacto tiene su propia pose en `POSES` (`src/main.js`); no hay una pose genérica.

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

## Vocabulario

- Identificadores, rutas, commits y comentarios de código: **inglés**.
- Documentación (`DESIGN.md`, `PLAN.md`, `AGENTS.md`, `README.md`): **español rioplatense**.
- Comentarios de código: sólo el porqué, una línea, en español.
