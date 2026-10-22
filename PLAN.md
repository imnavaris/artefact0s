# PLAN — Artefactos de memoria

Plan de ejecución para llevar el proyecto a su estado final. Por etapas, con verificación entre etapas: **ninguna etapa se da por cerrada sin evidencia ejecutada**.

Estado: Etapa 0 y Etapa 1 cerradas. Etapa 2 en curso: 2.1 y 2.2 hechas, 2.3 y 2.4 hechas, 2.5 con el corpus verificado.

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

### 2.1 Encuadre y silueta de cada pieza · CERRADA

**Diagnóstico original:** el modelo del libro apila **nueve hojas planas** separadas 0,032 unidades (≈0,65 celdas a zoom 120). Vista desde arriba o de frente, la hoja superior tapa a las demás y la forma se aplana en una masa: la lectura de "libro abierto" del renderer viejo venía de la luminancia de un render WebGL con luz de estudio, no de la geometría.

**Lo que se hizo:** se tomaron las opciones **A + C**. Las hojas quedaron separadas 0,05 unidades (una celda) y la bisagra del lomo se abrió a 0,52 radianes: con las tapas casi planas, la hoja de arriba tapaba a las demás. Las poses se calibraron por silueta, no por gusto.

**Método de trabajo por pieza:** volcar la silueta a texto plano (el `<pre>` del DOM, con `\r` eliminado) y leerla como una imagen; ajustar pose hasta que la silueta se lea. Quedaron como herramientas del repo:

| Herramienta | Qué hace |
|---|---|
| `tools/dump-pose.mjs` | Vuelca la silueta de una pieza con una pose concreta, como texto plano |
| `tools/dump-sweep.mjs` | Barre varias poses de una pieza y mide ancho, alto y filas partidas |
| `tools/find-pose.mjs` | Barre la grilla de poses y ordena por partedura: una pieza que se parte en dos lóbulos es la que se lee |
| `tools/shot.mjs` / `tools/shot-at.mjs` | Captura la obra en imagen, para leerla como se ve y no como máscara de hashes |
| `tools/silhouette-bbox.mjs` | Caja envolvente de la silueta y grilla resuelta |

**Criterio de cierre por pieza:** la silueta se identifica sin contexto en tres segundos, y a 200 % de zoom el texto sigue siendo la superficie, no un mosaico.

**Poses resultantes** (`POSES` en `src/main.js`, rotX/rotY en grados):

| Pieza | rotX | rotY | Por qué |
|---|---|---|---|
| book | 70 | 90 | El lomo queda al medio y las dos tapas se leen separadas |
| scarf | 20 | 30 | De tres cuartos: se ve la cabeza y el nudo |
| silhouette | 80 | 90 | La persona, de frente y completa |
| scissors | 60 | 30 | Las dos hojas abiertas se leen en diagonal |
| birds | 40 | 0 | La formación se ve entera |
| flight | 20 | 30 | El fuselaje y el ala se leen de perfil |

**Trampa encontrada:** el encuadre se mide sobre la grilla **resuelta**. Si se mide antes del `resize`, la grilla es la de 80×24 del default de glyphcss y la pieza queda diminuta.

### 2.2 Los seis modelos · CERRADA

Los seis modelos son ahora funciones puras del progreso: `update(p)` con un único número, sin estado interno, sin `toggle()` y sin movimiento dependiente del reloj.

| Pieza | p=0 | p=1 |
|---|---|---|
| book | libro intacto | quemado: las hojas de arriba se carbonizan, se encogen y se levantan |
| scarf | anudado en la cabeza | desplegado en el triángulo, con las puntas guardadas en el pliegue |
| silhouette | figura entera | la figura sale del encuadre hacia arriba; los relieves se ocultan |
| scissors | tijeras abiertas, película entera | tijeras cerradas y película cortada en dos |
| birds | pájaros libres | la jaula crece y se cierra sobre ellos |
| flight | rampa cerrada | rampa abajo |

- [x] Convertir cada uno y calibrar su pose (`POSES` en `src/main.js`).
- [x] Decidir el estado de cada pieza en función de `p`.
- [x] Borrar de los modelos los sistemas de partículas (fuego y brasas del libro).
- [x] Quitar de los modelos los `toggle()`.

**Trampa encontrada:** el pañuelo se leía como una lámina informe. El modelo anterior era una superficie paramétrica sin volumen; se rehízo como tela que envuelve una cabeza y se despliega en el triángulo. La caja del triángulo y la de la tela anudada tienen que ser casi la misma: si no, la pieza se sale de cuadro al desenlazarse.

### 2.3 Scroll continuo · CERRADA

- [x] Secciones de 150 vh por pieza, con 80 vh al cierre.
- [x] `p = clamp((scrollY − top) / (alto − viewport), 0, 1)`.
- [x] Estado amortiguado: `state += (target − state) · (1 − e^(−dt·5))`, con `dt` clampeado a 1/20 s.
- [x] El estado se congela fuera de `[0.05, 0.85]`.
- [x] Parallax del objeto entre −3 % y +3 %.
- [x] La columna de lectura **no** se anima.
- [x] Teclado: `ArrowRight`/`ArrowLeft` saltan al inicio de la pieza siguiente/anterior.

**Verificación ejecutada** (`tools/cdp.mjs scroll all`): las seis piezas aparecen en orden, cada una recorre su estado de 0 a 1 y vuelve a 0 al bajar; la columna muestra la cita de la pieza activa; la consola queda limpia.

**Sin JS:** las secciones se apilan como documento. La clase `.js` en `<html>` decide los 150 vh.

### 2.4 Rotación · CERRADA

- [x] Arrastre sobre el escenario: yaw ±35°, pitch ±12°, con tope elástico sin rebote.
- [x] La rotación se queda donde quedó.
- [x] `touch-action: pan-y` en el escenario.
- [x] `cursor: grab` / `grabbing`.

### 2.5 El texto · CERRADA

- [x] `assets/texts/texts.json`: seis citas reales con `id`, `piece`, `author`, `work`, `year`, `excerpt`, `source`, `license`.
- [x] Máximo 4 versos o 40 palabras por cita.
- [x] El bloque legible y la inscripción salen del **mismo** `excerpt`.
- [x] `server.py` sirve el corpus como archivo estático: no hay API, ni descarga remota, ni `refresh()`.
- [x] Borrados `assets/texts/poems.json` y `src/poetry.js`.

**Citas verificadas** (texto literal leído en la fuente, con URL y estado de permiso):

| Pieza | Autor | Obra | Año | Fuente de verificación |
|---|---|---|---|---|
| El libro quemado | Juan Gelman | Bajo la lluvia ajena | 1980 | Material de Lectura, UNAM, sección III |
| El pañuelo | Juan Gelman | Hacia el sur | 1982 | Material de Lectura, UNAM, «Otras partes» |
| La silueta | Juan Gelman | Carta a mi madre | 1989 | Multiversos |
| Las tijeras | Enrique Lihn | A partir de Manhattan | 1979 | Memoria Chilena, Biblioteca Nacional de Chile |
| Los pájaros | Juan Gelman | Bajo la lluvia ajena | 1980 | Material de Lectura, UNAM, sección I |
| El vuelo | Juan José Saer | El río sin orillas | 1991 | La Nación, fragmento del capítulo inicial |

Los créditos con la procedencia se arman solos desde el corpus (`#credits` en `index.html`).

---

## Etapa 3 — Cierre, créditos y entrega

- [x] Sección de **Créditos y fuentes**: por cita, autor, obra, edición o URL, año, estado de permiso. Después, licencias de código y tipografía y la aclaración de que los modelos son representaciones y no levantamientos técnicos.
- [ ] `README.md` al día: cómo abrir, cómo reconstruir `vendor/`.
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
