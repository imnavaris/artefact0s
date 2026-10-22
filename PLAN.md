# PLAN — Artefactos de memoria

Plan de ejecución para llevar el proyecto a su estado final. Por etapas, con verificación entre etapas: **ninguna etapa se da por cerrada sin evidencia ejecutada**.

Estado: Etapa 0 y Etapa 1 cerradas. Etapa 2 abierta.

El diseño y la interacción ya están decididos y documentados en `DESIGN.md`; este documento no los re-discute, los ejecuta. Las reglas del repo están en `AGENTS.md`.

---

## 0. Principio rector y sus consecuencias técnicas

La obra es un dispositivo de lectura sobre la dictadura. La interactividad vive en el texto; el objeto es la superficie donde el texto se inscribe.

Tres consecuencias que gobiernan todo lo demás:

1. **El scroll es el único verbo con estado.** No hay clic, no hay toggle, no hay botón. El estado de cada pieza es `f(p)`, donde `p` es el progreso local de la sección.
2. **El texto real es el contenido.** La columna de lectura tiene el texto completo en el DOM desde el primer render; la capa ASCII es la inscripción.
3. **Ninguna recompensa por interactuar.** Sin hover con glow, sin contadores, sin "revelá el secreto". Si algo se puede tocar, es porque carga información.

---

## Etapa 0 — Herramienta y cadena de build · CERRADA

**Objetivo:** que `glyphcss` entre al proyecto sin CDN y sin obligar a instalar nada para ver la obra.

| # | Tarea | Archivo | Hecho |
|---|---|---|---|
| 0.1 | Instalar `glyphcss@0.3.1` como dependencia | `package.json` | ✔ |
| 0.2 | Empaquetar `three`, `motion`, `glyphcss` en un bundle ESM por vendor | `build.mjs` | ✔ |
| 0.3 | Declarar `glyphcss` en el importmap del documento | `index.html` | ✔ |
| 0.4 | `vendor/glyphcss.js` commiteado (777 KB) | `vendor/` | ✔ |
| 0.5 | Publicar `Newsreader` (OFL) para la columna de lectura | `assets/fonts/` | ✔ |

**Verificación:** `GET /vendor/glyphcss.js` → 200; la página carga sin errores de consola.

**Trampa documentada:** `npm install` **no funciona en `G:`** — el drive deja los archivos de tar en 0 bytes. El toolchain se instala en disco local (`C:\Users\Usuario\AppData\Local\Temp\opencode\artefactos-build`) y sólo se copia `vendor/*.js` de vuelta. `vendor/` va commiteado: la obra tiene que abrirse sin npm.

---

## Etapa 1 — El pipeline de render · CERRADA

**Objetivo:** que una pieza se renderice de punta a punta con glyphcss, con el texto esculpido sobre la silueta.

| # | Tarea | Archivo | Hecho |
|---|---|---|---|
| 1.1 | Conversor Three.js → `Polygon[]` con color por cara | `src/geometry.js` | ✔ |
| 1.2 | Mapeo de ejes Y-up → Z-up | `src/geometry.js` | ✔ |
| 1.3 | Centrado del objeto en el origen | `src/geometry.js` | ✔ |
| 1.4 | Escena glyphcss: grilla, esculpido, encuadre | `src/glyph-stage.js` | ✔ |
| 1.5 | Esculpido del texto sobre las celdas ocupadas | `src/glyph-stage.js` | ✔ |
| 1.6 | Medición del avance real de la celda tras `document.fonts.ready` | `src/main.js` | ✔ |
| 1.7 | Columna de lectura con el texto en el DOM | `index.html`, `style.css` | ✔ |
| 1.8 | Sistema visual completo (tokens, tipografía, glow, layout) | `style.css` | ✔ |

**Verificación ejecutada:**
- El libro produce **19.312 triángulos**, bbox sano (4,0 × 2,8 × 2,0 unidades).
- La grilla resuelta es 133 × 80; el `<pre>` mide 779,30 × 800 px = exactamente `cols × cellW` (sin desfasaje).
- El texto esculpido aparece en las celdas ocupadas: el dump del DOM muestra el párrafo en español repetido sobre la silueta.
- Consola del navegador limpia; sin 404.

**Fallos encontrados y resueltos (no volver a tropezar):**

| Síntoma | Causa | Resolución |
|---|---|---|
| La página salía sin CSS ni modelos | Los archivos en disco se llamaban `… (1).js` / `style (1).css` | Renombrados 14 archivos |
| Trama a 20 px en vez de 10 | El CSS de glyphcss (`.glyph-scene .glyph-output`, especificidad 0,2,0) le ganaba a `.glyph-output` | Usar el selector `.glyph-scene .glyph-output` |
| Objeto al revés | El mapeo `(x, z, y)` es una reflexión (det −1): invierte las normales | Rotación `(x, −z, y)` |
| Trama que hierve de rayas | Las 9 hojas del libro están a menos de una celda de distancia | `depthEpsilon: 0.02` + `supersample: 2` |
| Franja vertical en el borde derecho | Falsa alarma: era el `\r` del fin de línea en el DOM | Ninguna: el `<pre>` está bien dimensionado |
| El objeto se salía de cuadro | No estaba centrado en el origen y el fit miraba sólo el ancho | `center()` en el conversor + fit en ambos ejes |

**Limitación abierta:** la silueta del libro todavía se lee como masa y no como libro abierto. La causa está identificada (ver Etapa 2.1) y **no** es un fallo del pipeline.

---

## Etapa 2 — Legibilidad y las seis piezas · ABIERTA

**Objetivo:** que las seis piezas se lean como lo que son, con su estado propio, y que el scroll recorra la obra.

### 2.1 Encuadre y silueta de cada pieza · primera tarea

**Diagnóstico:** el modelo del libro apila **nueve hojas planas** separadas 0,032 unidades (≈0,65 celdas a zoom 120). Vista desde arriba o de frente, la hoja superior tapa a las demás y la forma se aplana en una masa: la lectura de "libro abierto" del renderer viejo venía de la luminancia de un render WebGL con luz de estudio, no de la geometría.

Opciones, en orden de preferencia:

| # | Opción | Coste | Riesgo |
|---|---|---|---|
| A | Separar las hojas ≥1 celda (0,05 unidades) y marcar las primeras N con material de carbonización | Bajo: 2 números en `src/models/book.js` | El libro engorda; hay que recomponer la pose |
| B | Quitar las hojas intermedias y modelar el lomo + 3 hojas | Medio: reescritura del modelo | Pierde la accumulating de páginas |
| C | Cambiar la pose para ver el arco de perfil (el libro de canto, no de plano) | Muy bajo: un `rotX`/`rotY` | Puede no leerse |
| D | Cambiar el modo de glyphcss a `ink` (silueta + contornos) para piezas que lo necesiten | Bajo | Pierde el color por cara |

**Método de trabajo por pieza:** volcar la silueta a texto plano (el `<pre>` del DOM, con `\r` eliminado) y leerla como una imagen; ajustar pose hasta que la silueta se lea. El script de volcado queda como herramienta del repo (`tools/dump-silhouette.mjs`), porque sin ver la silueta en texto no se encuadra nada.

**Criterio de cierre por pieza:** la silueta se identifica sin contexto en tres segundos, y a 200 % de zoom el texto sigue siendo la superficie, no un mosaico.

### 2.2 Los seis modelos

`book`, `scarf`, `silhouette`, `scissors`, `birds`, `flight` están escritos y funcionan con Three.js. Falta:

- [ ] Convertir cada uno y calibrar su pose (`POSES` en `src/main.js`).
- [ ] Decidir el estado de cada pieza en función de `p` (qué se quema, qué se desata, qué se borra, qué se corta, qué se enjaula, qué se abre).
- [ ] Borrar de los modelos los sistemas de partículas que ya no aplican (fuego y brasas del libro; en `src/models/book.js` están marcados con `userData.asciiSkip`).
- [ ] Quitar de los modelos los `toggle()`: con el clic eliminado no tienen disparador.

### 2.3 Scroll continuo

- [ ] Secciones de 150 vh por pieza, con un umbral de 40 vh al principio y 80 vh al cierre (`DESIGN.md` §El scroll es el lector).
- [ ] `p = clamp((scrollY − top) / (alto − viewport), 0, 1)`.
- [ ] Estado amortiguado: `state += (target − state) · (1 − e^(−dt·5))`, con `dt` clampeado a 1/20 s.
- [ ] El estado se congela fuera de `[0.05, 0.85]` para que cada pieza tenga aire de lectura.
- [ ] Parallax del objeto entre −3 % y +3 %; el fondo, como máximo 12 px en todo el recorrido.
- [ ] La columna de lectura **no** se anima: se pega, se lee, se suelta.
- [ ] Teclado: `ArrowRight`/`ArrowLeft` saltan al inicio de la pieza siguiente/anterior.

### 2.4 Rotación

- [ ] Arrastre sobre el escenario: yaw ±35°, pitch ±12°, con tope elástico sin rebote.
- [ ] La rotación se queda donde quedó: no hay auto-rotación ni retorno a la pose inicial.
- [ ] `touch-action: pan-y` en el escenario, para que en el teléfono el dedo vertical scrollee y el horizontal gire.
- [ ] `cursor: grab` / `grabbing`. Se elimina el `crosshair`.

### 2.5 El texto

- [ ] `assets/texts/texts.json`: seis citas reales con `id`, `piece`, `author`, `work`, `year`, `excerpt`, `source`, `license`.
- [ ] Máximo 4 versos o 40 palabras por cita, lo que sea menor.
- [ ] El bloque legible y la inscripción salen del **mismo** `excerpt`: una sola fuente de verdad por pieza.
- [ ] `server.py`: reemplazar `/api/poems` por `/api/texts`; eliminar el corpus de Bécquer y su `refresh()` contra Gutenberg.
- [ ] Borrar `assets/texts/poems.json` y `src/poetry.js`.

---

## Etapa 3 — Cierre, créditos y entrega

- [ ] Sección de **Créditos y fuentes** (pedida explícitamente): por cita, autor, obra, edición o URL, año, verso o página, estado de permiso. Después, licencias de código y tipografía (Sligoil Micro — OFL 1.1 —, Three.js — MIT —, Newsreader — OFL —) y la aclaración de que los modelos son representaciones y no levantamientos técnicos. Absorber `docs/FUENTES.md` sin duplicarlo.
- [ ] `README.md` al día: cómo abrir, cómo reconstruir `vendor/`, la advertencia de que los placeholders no se entregan.
- [ ] Borrar `src/ascii.js` y `src/input.js` (renderer e input viejos). ✔ Hecho en la Etapa 1.
- [ ] `docs/PLAN.md`, `docs/VALIDACION.md` y `docs/validacion.json` describían el pipeline WebGL: borrados. Falta reescribir los criterios de validación de la obra nueva (Etapa 3).
- [ ] Repo de entrega: `git init` dentro de la carpeta del proyecto, con `node_modules/` y artefactos de build fuera del índice.
- [ ] Registro en el vault: entrada en `01 - Proyectos/INDEX.md` y commit en el repo del vault.

### Accesibilidad (checklist de cierre)

- [ ] Todo el texto existe en el DOM desde el primer render; `Ctrl+F` y el lector de pantalla funcionan sin JS.
- [ ] La capa ASCII lleva `aria-hidden="true"`.
- [ ] Sin JS, las secciones se apilan como documento.
- [ ] Foco visible: `outline: 2px solid #d99b26; outline-offset: 3px`. Ningún `outline: none`.
- [ ] `prefers-reduced-motion`: `p` crudo sin amortiguación, parallax en cero, arrastre sin inercia, estados en 4 escalones, `--glow` fijo.

### Rendimiento

- [ ] Un solo nodo de texto para la capa esculpida; actualizar con `nodeValue`, nunca reemplazando spans.
- [ ] `--glow` se actualiza **sólo** en los umbrales de estado, no por frame.
- [ ] El estado se recalcula sólo si cambió `p` o hubo arrastre.
- [ ] Por encima de ~25.000 glifos, celda de 8 × 12 px en vez de 6 × 10.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La silueta de las piezas no se lee | Alta | Alto | Etapa 2.1 es la primera tarea y tiene método medible (silueta en texto plano) |
| `glyphcss` es pre-1.0 y puede romper la API | Media | Alto | `vendor/` commiteado: la obra no depende de npm ni de la red en runtime |
| Citas con copyright sin permiso | Media | Alto (legal y ético) | Citas breves con procedencia y aviso; el aviso de copyright va una vez, al pie |
| La obra se lee como "juego" | Baja | Muy alto | La prohibition está escrita en `DESIGN.md` §Lo que la obra no hace: sin clic, sin recompensas, sin partículas |
| El drive `G:` rompe `npm install` | Ya pasó | Medio | Toolchain en disco local; `vendor/` commiteado |

---

## Decisiones que ya no se re-discuten

- glyphcss renderiza **100 %** de la obra. Three.js queda como biblioteca de geometría.
- La rueda hace scroll; el zoom desaparece.
- La rotación por arrastre se queda **por ahora**; no hay auto-rotación.
- Sin clic izquierdo, en ningún lugar.
- Los textos de Bécquer se borran. El corpus es real.
- La inscripción del pañuelo es un fragmento del corpus, no "NUNCA MÁS".
- Galería y configuración quedan como **dirección futura** en `DESIGN.md`, no como plan.
