# HANDOFF — Artefactos de memoria

Punto de reanudación. Última sesión de trabajo: 22/10/2026. Escrito: 24/10/2026. Actualizado: 24/10/2026, con el backlog de pulido que marcó el autor.

## Estado

La obra se sostiene y se recorre entera, pero **no está cerrada**. Las etapas 0 a 4 de `PLAN.md` están cerradas en lo técnico (pipeline, seis piezas, scroll, créditos, fuego de glifos, inscripción legible). Lo que sigue abierto es una ronda de pulido que toca el texto, el encuadre, el scroll, la navegación, tres de los seis modelos, y una auditoría de performance, código, estética y concepto.

Tratar el "cerrada" de `PLAN.md` como "cerrada en lo que estaba planificado", no como "lista para entregar".

## Cómo abrirla

```sh
python server.py --port 8011    # las tools asumen 8011; sin --port sirve 8000
node tools/cdp.mjs scroll all   # recorrido real, consola limpia
node tools/perf.mjs             # costo por cuadro
node tools/verify-nojs.mjs      # texto sin JavaScript
```

`vendor/` está commiteado: la obra abre sin npm. `npm install` falla en `G:` (el drive no soporta la extracción de tar).

## Evidencia (medida el 22/10/2026, no remedida)

| Check | Resultado |
|---|---|
| `cdp.mjs scroll all` | seis piezas en orden, 0→1, consola limpia, 37 muestras |
| `perf.mjs` | 59 fps, peor cuadro 69,8 ms, conversión 8,3 ms, raster 5,7 ms, 1.582 glifos, grilla 95 × 53 |
| `verify-nojs.mjs` | seis piezas, texto completo en el DOM |
| Silueta a p=1 | 3 × 1 celdas |
| Pañuelo a p=1 | triángulo con el vértice arriba |
| `slop_lint` | 0 bloqueantes |

Todo eso se midió en Chromium headless **sin GPU** y en un viewport de 1440 × 900. No dice nada del teléfono ni de una máquina con otro escalado.

## Bugs de fondo que invalidaban la verificación previa

Los tres ya están arreglados; quedan anotados porque explican por qué las mediciones de antes no valían:

1. `server.py` comparaba `self.path` completo: con `?piece=…` el documento llegaba **sin el corpus**. Las calibraciones previas midieron una página vacía.
2. Las secciones se medían con `getBoundingClientRect` + `scrollY`; al recargar, el navegador restaura el scroll y las medidas quedan mal. Ahora se mide con `offsetTop`.
3. El headless reporta `prefers-reduced-motion: reduce`. Se fuerza `no-preference` con `Emulation.setEmulatedMedia`.

## Backlog de pulido

Marcado por el autor el 24/10/2026. No está priorizado ni diseñado: es el inventario de lo que hay que resolver antes de entregar.

### 1. Texto y concepto

El corpus **no es pertinente todavía**. Cuatro de las seis citas son de Gelman y ninguna habla del objeto que le toca:

| Pieza | Autor | Obra | Año |
|---|---|---|---|
| El libro quemado | Gelman | *Bajo la lluvia ajena* | 1980 |
| El pañuelo | Gelman | *Hacia el sur* | 1982 |
| La silueta | Gelman | *Carta a mi madre* | 1989 |
| Las tijeras | Lihn | *A partir de Manhattan* | 1979 |
| Los pájaros | Gelman | *Bajo la lluvia ajena* | 1980 |
| El vuelo | Saer | *El río sin orillas* | 1991 |

- Elegir textos por **pertinencia al artefacto**, no por disponibilidad. Un poema sobre el mar no dice nada del pañuelo.
- Ampliar el repertorio: hay corpus del período sin tocar (poesía argentina de los 70 y 80, testimonios, documentos de organismos). Cada cita nueva se verifica con URL o edición y página.
- Revisar el concepto de cada pieza: hoy la relación objeto↔texto es asociativa y débil. Hay que poder decir en una línea por qué ese objeto y ese texto.
- Título y encuadre general de la obra: "Artefactos de memoria" ¿es el título que queda?

### 2. Encuadre, rotación y scroll

- **Encuadre de las seis piezas**: las poses de `POSES` se calibraron a ojo con capturas. No hay criterio medible. Hay que fijar uno (silueta legible, pieza centrada, márgenes parejos) y recalibrar.
- **Rotación**: pasó a libre (yaw sin tope, pitch ±90°) pero sin ninguna noción de reposo: la pieza queda donde la dejaste y no vuelve. Falta decidir si vuelve sola, si hay amortiguación, si el arrastre tiene inercia.
- **Scroll**: la animación va a escalones de 0,018 de estado. Se ve fluido a 59 fps en headless; en la máquina del autor se siente trabado, así que la medición no está capturando el problema real.
- **"Corregir toda la ecgación y el scroll"**: no sé qué es "ecgación". Lo interpreto como encuadre + rotación + scroll, pero hay que confirmarlo.

### 3. Navegación parallax con gravedad

Idea del autor, **sin diseñar**. Hoy el parallax es un `translate3d` de ±3 % atado al progreso de la sección: sigue al scroll, no tiene peso.

- Definir qué significa "gravedad": ¿la escena se hunde al bajar y sube al subir, con inercia? ¿los objetos caen y se acomodan? ¿el scroll mueve capas a distinta velocidad con retorno elástico?
- Definir el alcance: ¿sólo el escenario, o también la columna de lectura? (Mover el texto que se lee rompe la legibilidad.)
- Choca con `reduce-motion` y con la regla "el estado es función del progreso, sin memoria": una inercia real es estado acumulado. Hay que decidir si la excepción se acepta y se documenta.

### 4. Modelos

- **El pañuelo está mal**. El autor lo dice sin vueltas. Hoy es una capucha hemisférica con un nudo debajo del mentón y dos puntas: se lee, apenas, en la captura, y no se lee en movimiento. Hay que rehacerlo, no retocarlo.
- **Tijeras, pájaros y vuelo**: no se tocaron en la etapa 4 ni se revisaron contra la regla de legibilidad. Revisar con el mismo criterio que el libro.
- **Libro y silueta**: se rehicieron, pero sólo se verificaron en el estado inicial y final. Faltan los estados intermedios.
- Criterio faltante: no hay una prueba de "se lee como el objeto" más allá de mirar la captura. Conviene fijar una (silueta contra una referencia, o al menos un volcado en texto que se pueda leer).

### 5. Auditoría de performance

- Medir en **GPU real**, no headless: la medición actual es 59 fps con `--disable-gpu`.
- Encontrar el peor cuadro (69,8 ms): un frame perdido cada cierto tiempo se siente trabado aunque el promedio esté bien.
- Costo por pieza, no sólo del libro: `toGlyphPolygons` corre sobre el grafo entero y hay piezas más densas.
- Costo de las texturas canvas: se crean por pieza y por material, en el arranque. Medir el tiempo hasta la primera escena legible.
- Memoria: `setPolygons` reutiliza la malla, pero ¿se liberan las viejas?

### 6. Auditoría de código

- Duplicación: `tools/*.mjs` repiten el arranque de Chromium, las banderas de CDP y el perfil. Un módulo común.
- `src/main.js` tiene 400 líneas y mezcla arranque, scroll, arrastre, corpus, créditos y debug por query string. Separar.
- Los seis modelos repiten el patrón de texturas (`texMat`) y de `update(p)`. Revisar si hay un helper que falte.
- Estados imposibles: `debugP`, `POSES`, `fitCache`, `burn`. Documentar o sacar.
- Sin tests. El único control es mirar capturas. Al menos un test de `burn(p)` monótono y de `update(p)` puro por modelo.

### 7. Auditoría de estética

- Contraste real de la trama sobre el fondo (hoy está declarado en `DESIGN.md` como estimado, no medido).
- Densidad: grilla 95 × 53 con celda de 14 px. ¿Es la relación correcta entre legibilidad del poema y detalle del objeto?
- Jerarquía: la columna de lectura y la trama compiten. Revisar tamaño, peso y aire.
- El glow: ¿sigue siendo un recurso o ya es decoración?
- Revisar las seis piezas juntas: ¿se ven como una serie o como seis ejercicios?

### 8. Accesibilidad y dispositivos

- Teléfono real: la celda de 14 px y el arrastre táctil no se probaron en hardware.
- Lector de pantalla: el DOM está bien armado, pero no se escuchó con NVDA ni VoiceOver.
- Teclado: el arrastre es la única forma de girar. Falta una alternativa.

## Pendientes verificables (chicos)

| # | Qué | Por qué no está hecho |
|---|---|---|
| 1 | Número de verso de la cita de Lihn | Memoria Chilena sólo expone el fragmento; falta la edición Ganymedes. La cita lleva URL, no página. |
| 2 | Presentación / defensa del TP | No es código. |

## Cómo encarar la ronda

1. **Auditar primero** (performance con GPU, código, estética, concepto) y escribir hallazgos. Sin eso, cualquier cambio es a ciegas.
2. **Texto y concepto** después: el corpus define qué tiene que mostrar cada modelo. Elegir los textos antes de rehacer el pañuelo.
3. **Encuadre y scroll**, con criterio medible escrito antes de tocar las poses.
4. **Parallax con gravedad**, que necesita la decisión sobre estado acumulado.
5. **Modelos**, empezando por el pañuelo.
6. Verificación completa y recién ahí el cierre.

## Registro

- Repo del proyecto commiteado en `main`. El vault lo espeja archivo por archivo: cada cambio va en los dos.
- La carpeta real es `02 - Áreas/Universidad/…/TP - Final/02 - Artefactos de memoria`, no `01 - Proyectos`.
- Memoria durable en matumem, `app_id: artefactos-de-memoria`.
