# DESIGN — Artefactos de memoria

Documento de trabajo del sistema visual y de interacción. Fija lo decidido y marca lo que sigue abierto. Manda sobre `style.css` y sobre cualquier propuesta de UI; si el código actual dice otra cosa, el código está viejo.

Estado: el corpus de Bécquer (`assets/texts/poems.json`, 74 rimas de Gutenberg 53552) queda fuera. Son placeholders. La obra cita poesía y literatura argentina del período, breve y con procedencia.

---

## La interactividad está en el texto

La obra es un dispositivo de lectura sobre la dictadura y sobre lo que no se terminó de decir. El objeto 3D no es el contenido: es la superficie donde el texto se inscribe. Por eso el gesto que la obra pide es leer y avanzar, no tocar cosas.

Consecuencias operativas:

- El scroll es la única interacción con estado. Atraviesa las seis piezas y cada pieza es una función de su progreso local.
- El arrastre gira. Nada más.
- No hay clic izquierdo. Ningún `click` sobre el escenario, ningún toggle, ningún borrado por arrastre.
- La rueda hace scroll. El zoom se elimina.
- No hay partículas, ni fuegos artificiales de píxeles, ni sonidos de confirmación. El fuego del libro quemado es de glifos: el frente de llama son caracteres (`^/\|*~"`) y la ceniza son otros (`.,`); no hay chispas ni humo.

### Lo que la obra no hace

- No da recompensa por interactuar: no hay hover con glow, no hay contador, no hay "revelá el secreto".
- No tiene estados booleanos. `disappeared: true` desaparece como concepto: la silueta se borra porque el scroll llegó ahí, no porque alguien la apagó.
- No pide permiso ni explica los gestos con un cartel de instrucciones. La primera pantalla muestra texto y un objeto que se mueve con el scroll; eso enseña el gesto sin tutorial.
- No usa el vocabulario de app: badges, chips, numeración ornamental de piezas, skeletons, spinners, toasts. VS-020 aplica directo: nada de "01 —".

**VS-023** prohíbe añadir glow sin pedido explícito: acá el glow está pedido por el usuario como parte del renderer, y la prohibición de partículas también es suya. Queda asentado. **VS-032** prohíbe parallax sin pedido: acá está pedido, con el límite de la sección Movimiento. Fuera de esas dos excepciones, el Atlas manda.

---

## El scroll es el lector

Un solo recorrido vertical. El escenario (capa ASCII) queda fijo al costado; el texto vive en una columna que se pega, se lee y se suelta. La pieza siguiente no entra hasta que la anterior terminó su estado.

```
scroll ↓                                            escenario
┌──────────────────────────────────────────────────────────────┐
│ 00  umbral              40vh    sin objeto, el título         │
├──────────────────────────────────────────────────────────────┤
│ 01  el libro quemado   150vh    p .05→.75  se quema           │
│ 02  el pañuelo         150vh    p .10→.70  se desata          │
│ 03  la silueta         150vh    p .20→.85  se borra           │
│ 04  las tijeras        150vh    p .20→.70  corta              │
│ 05  los pájaros        150vh    p .20→.85  la jaula se cierra │
│ 06  el vuelo           150vh    p .20→.80  la rampa baja      │
├──────────────────────────────────────────────────────────────┤
│ 07  cierre              80vh    créditos y fuentes            │
└──────────────────────────────────────────────────────────────┘
```

`p` es el progreso local de la sección: `clamp((scrollY - top) / (alto - viewport), 0, 1)`. Antes de `p = 0.05` y después de `p = 0.85` el estado se congela, para que el principio y el final de cada pieza tengan aire de lectura.

### La columna de lectura

Cada sección mide 150vh y contiene un bloque de texto `position: sticky; top: 22vh`. El bloque entra con el scroll, se queda quieto mientras `p` avanza y sale solo cuando arranca la sección siguiente. No se desvanece: se va de cuadro.

Prohibido animar la entrada y la salida del bloque de texto. Un fade a mitad de lectura es una interrupción, y un fade idéntico para todo es exactamente VS-026.

**Regla dura: el parallax y la inercia no tocan la columna de lectura.** El texto legible se mueve a la velocidad exacta del scroll, punto. Lo que tiene parallax es el objeto y el fondo.

### El estado es una función del progreso

`state = f(p)`, sin memoria y sin acumuladores. Subir deshace lo que bajar hizo: el libro vuelve a quemarse hacia atrás, el pañuelo se anuda, la silueta se rearma. Eso convierte al scroll en un scrubbing honesto y elimina la clase de bugs donde un estado queda pegado.

Suavizado: `state += (target - state) * (1 - Math.exp(-dt * 5))`, con `dt` clampeado a `1/20 s`. La diferencia entre el scroll y el estado no debe superar los 150 ms percibidos. Si el usuario frena, el objeto frena en menos de un cuarto de segundo.

### Rotación por arrastre

- `pointerdown` sobre el escenario, `setPointerCapture`, y recién a los 4 px de movimiento se considera arrastre. Un clic sin desplazamiento no hace absolutamente nada.
- Horizontal: yaw sin tope — la pieza da vueltas completas. Vertical: pitch, ±90°. Sin rebote: la rotación se queda donde quedó. Decisión del autor (22/10/2026): los topes impedían mirar la pieza por todos sus ángulos.
- Al soltar, la rotación se queda donde quedó. No vuelve sola a la pose inicial: el rebote automático es gesto de juguete.
- `touch-action: pan-y` en el escenario. En táctil, el dedo vertical scrollea y el horizontal gira. Sin esto, el arrastre se come el scroll y la obra se vuelve inusable en teléfono.
- Cursor `grab` / `grabbing`. Se elimina el `crosshair` actual.

### Dos textos, una fuente

El bloque legible y la inscripción sobre el objeto salen del mismo string del corpus. Una sola fuente de verdad por pieza: `cita_id`. La excepción es el pañuelo, cuya inscripción es «NUNCA MÁS» y tiene su entrada propia en el corpus.

- Bloque legible: texto real en el DOM, `blockquote` con `cite`. Es el que se lee y el que encuentra el buscador del navegador.
- Texto esculpido: los mismos caracteres, en el mismo orden, mapeados sobre la superficie del objeto por layout de glifo, no por brillo medio. Las palabras se separan con `·` y cada verso arranca en una fila: la superficie tiene que leerse como poema, no como ruido. Decisión del autor (22/10/2026).
- La capa esculpida es imagen, no contenido: `aria-hidden="true"` y opacidad 0.68 (≈5.7:1 sobre el fondo). Nunca baja de 0.55 (4.15:1) mientras sea visible. Cuando el estado la destruye, se van los glifos, no la opacidad: un texto que se atenúa se lee como un slider de brillo.

---

## Tipografía: dos oficios distintos

El texto legible no es monoespaciado y no puede serlo. VS-010. Y la capa ASCII sí, porque es la obra.

| Rol | Familia | Tamaño / interlínea | Tracking |
|---|---|---|---|
| Título de obra (umbral) | Newsreader 400 | 40 / 48 | `-0.01em` |
| Título de pieza | Newsreader 400 | 36 / 44 | `-0.01em` |
| Cita (cuerpo de lectura) | Newsreader 400 | 20 / 32 | `0` |
| Atribución, créditos, aviso | Newsreader 400 | 16 / 24 | `0` |
| Capa ASCII | Sligoil Micro | 10 / 10 | `0` |

Newsreader en los dos extremos de la jerarquía, a propósito: la obra es un aparato de lectura y la diferencia entre título y cuerpo la hacen el tamaño y la medida, no una segunda familia decorativa. Newsreader está en la lista de display del workspace y tiene ejes ópticos, así que a 36 px no se lee como un serif de catálogo.

Se elimina la tipografía actual del `h1`: Inter Display Thin embebida en base64, 200, mayúscula, `letter-spacing: .34em`. Juntas, eso es Inter (prohibida en este harness) más VS-013, jerarquía construida con mayúsculas espaciadas.

Capa ASCII: `font-kerning: none`, `font-variant-ligatures: none`, `font-feature-settings: "liga" 0, "calt" 0`, `white-space: pre`. Sin eso, una ligadura corre la grilla un carácter y la obra se parte.

**Verificar antes de fijar la grilla**: el avance de Sligoil Micro tiene que ser constante. No lo pude medir (fontTools no está instalado y no instalo dependencias para un dato). Si el avance no es uniforme o falta el archivo, la capa ASCII cae a `ui-monospace, "Cascadia Mono", Consolas, monospace` con el mismo `font-size`. Falla conocida y documentada por ASCII Logo: la tipografía falla en silencio. El primer render espera `document.fonts.ready` y mide una celda antes de pintar.

La capa ASCII no está sujeta a VS-011: sus 10 px no son lectura, son trama, y van `aria-hidden`.

### Medida y márgenes

- Cita: `max-width: 62ch`, tope duro `660px`. En 20 px de Newsreader eso cae entre 58 y 64 caracteres por línea, dentro de los 45–75 del workspace. Si la medición real da más de 660 px, se recorta a 640.
- Retícula desktop (1280 / 1440 de referencia): escenario 0–55%, columna de texto desde 55% con `max-width: 560px`, margen derecho 48 px, gutter 48 px. La asimetría es deliberada: el ojo va del objeto al texto y vuelve.
- Debajo de 1100 px: escenario sticky arriba (46vh), texto abajo, padding 32 px. Debajo de 720 px: escenario 42vh, texto a 18/28, padding 24 px, `max-width: none`.
- Baseline 8 px: todos los espaciados en múltiplos de 8 (8, 16, 24, 32, 48). Márgenes exteriores 24–48 px.

### Cómo se titula cada pieza

Título en caja de oración, no mayúsculas: «El libro quemado», no «EL LIBRO QUEMADO». Sin número de pieza, sin barra, sin punto medio, sin año al lado del título. La fecha y el autor van en la atribución de la cita, que es de donde vienen.

Debajo del título, en el mismo bloque: la cita y su procedencia. Nada entre los dos.

No encontré en el Atlas ninguna regla sobre cómo titular una obra ni sobre numerar secciones. Lo de arriba es decisión de este proyecto, no cita.

### Procedencia de la cita en pantalla

La atribución no compite con el verso. Va después, separada por 24 px verticales y una marca de 24 × 1 px en `#d99b26` (`::before` inline-block), en 16/24 y `#94a3b8` (7.62:1). Formato:

```
El libro quemado
[4 versos como máximo]

▬ Juan Gelman, Carta a mi madre, 1980
```

- Máximo 4 versos o 40 palabras por pieza, lo que sea menor. Sin poemas completos.
- Obra y año en bastardilla; autor en redonda; `cite` con la URL o la edición en el HTML, invisible en pantalla.
- El aviso de copyright no va pegado a cada cita: va una vez, al pie del bloque, en 16/24 y `#94a3b8`: «Fragmentos citados con fines de estudio. Procedencia completa en Créditos.»
- La inscripción del pañuelo dice «NUNCA MÁS»: es la consigna de las Madres de Plaza de Mayo y es lo que tiene que leerse. El fragmento verificado de Gelman sigue en la columna de lectura. Decisión del autor (22/10/2026), que reemplaza la anterior.

No hay convención de aviso de copyright en el Atlas. Lo anterior es decisión editorial, apoyada en la familia Editorial (colofón y créditos de revista monográfica).

---

## Color: tres roles y nada más

| Token | Hex | Rol | Contraste sobre `#0b0c10` |
|---|---|---|---|
| `--bg` | `#0b0c10` | fondo único | — |
| `--ink` | `#f1f5f9` | texto legible | 17.84:1 |
| `--ink-2` | `#94a3b8` | atribución, créditos, aviso | 7.62:1 |
| `--paper` | `#cfc7b8` | glifos de la obra | 11.65:1 |
| `--ash` | `#6b655c` | glifo apagado dentro de la obra (no es texto) | 3.39:1 |
| `--accent` | `#d99b26` | foco, marca de atribución, progreso | 8.07:1 |
| `--hairline` | `#2e3342` | filetes de 1 px, no delimitan controles | 1.55:1 |

Sobre el punto más claro del radial de fondo (`#141211`) los ratios bajan apenas: `#f1f5f9` 17.05:1, `#cfc7b8` 11.13:1, `#94a3b8` 7.28:1, `#d99b26` 7.71:1. Todo sigue holgado.

El fondo es el Canvas Base del workspace (`#0d0e12`) bajado dos pasos por canal. Un near-black puro (`#000`) se come el halo del glow y deja la trama flotando en el vacío; dos pasos alcanzan para que la luz tenga dónde caer sin volverlo gris.

Dos tintas, y la diferencia es funcional: `#f1f5f9` es fría y brillante, es el aparato de lectura; `#cfc7b8` es cálida y más apagada, es la obra. Nunca se cruzan. Si el texto legible tomara el tono papel, la obra y el aparato se confunden; si la trama tomara el blanco frío, se lee como una terminal en vez de una página.

`#d99b26` es el único acento. Marca dónde está el foco, dónde empieza una atribución y cuánto del recorrido se hizo. Nada más lleva color. Se descartan Cobalt, Emerald y Crimson del workspace: son colores de estado de interfaz, y acá un rojo de error o un verde de validación no significan nada. `#64748b` (Muted Ink) no se usa para texto: 4.11:1 no llega a AA y en el radial baja a 3.92:1. Queda para filetes si hiciera falta.

---

## Glow: CSS sobre glifos, no bloom

El glow se hace sobre la capa de texto, no por post-proceso de píxeles. Tres sombras apiladas: un filo corto que separa el glifo del fondo, un halo ámbar medio y una caída ancha.

```css
.stage-glyphs {
  color: var(--paper);
  font-size: 10px;
  line-height: 10px;
  text-shadow:
    0 0 1px rgba(207, 199, 184, 0.45),
    0 0 7px rgba(217, 155, 38, calc(0.16 * var(--glow))),
    0 0 16px rgba(217, 155, 38, calc(0.07 * var(--glow)));
}
```

`text-shadow` **no tiene spread**: recibe offset-x, offset-y, blur y color. Si hiciera falta spread, se hace con `box-shadow` en un contenedor, y no con la sombra del texto. Que no exista el cuarto parámetro es la razón por la que el glow se regula con `blur` y alfa.

`--glow` va de `0` a `1` y se actualiza **sólo en los umbrales de estado**, no en cada frame del scroll. Repintar tres sombras sobre 20 000 glifos a 60 fps es la forma más rápida de tirar la obra a 12 fps en Chromium sobre Windows.

Costo y alternativa: por encima de ~12 000 glifos, se cambia el `text-shadow` por un filtro de capa, que hace una sola pasada sobre el alfa:

```css
.stage-glyphs--dense {
  text-shadow: none;
  filter: drop-shadow(0 0 1px rgba(207, 199, 184, 0.35))
          drop-shadow(0 0 6px rgba(217, 155, 38, 0.18));
}
```

El bloom propiamente dicho —que las zonas más claras brillen más que las oscuras— necesita separar la trama en dos o tres capas de brillo, cada una en su `<pre>` con sombra propia. Duplica o triplica los nodos de texto. Queda como opción medida: si el objeto se ve chato y el profiler marca ≥55 fps, se parte en capas; si no, glow uniforme. El Atlas no tiene ninguna técnica llamada bloom ni una receta de glow por texto: esto es de este proyecto, con el modelo de crestas de Plasma Líquido como única ascendencia conceptual.

### Por qué el glow no toca el texto legible

VS-015: no se sacrifica lectura por atmósfera. A 20 px, un halo detrás de un serif corta el contraste en los remates, y el ojo lo paga en la tercera línea. El texto legible tiene contraste, tamaño y medida; la atmósfera es del objeto. Son dos capas con dos reglas.

---

## Fondo: nada que aparente acabado

Un radial muy bajo, que simula la luz que el objeto derrama sobre la superficie donde está apoyado. Nada más.

```css
.stage::before {
  content: "";
  position: fixed;
  inset: 0;
  background: radial-gradient(
    1100px 760px at 46% 44%,
    rgba(217, 155, 38, 0.045),
    rgba(11, 12, 16, 0) 68%
  );
  pointer-events: none;
}
```

Sin grano, sin scanlines, sin aberración cromática, sin viñeta, sin ruido SVG. La trama de glifos ya es textura; sumarle una segunda textura es el «grano para aparentar acabado» que el Atlas prohíbe. La viñeta sobre near-black no hace nada visible y cuesta una capa de composición.

Consulté Noise Texture y la descarté: su propia nota avisa que con `slope: 0.15` el ruido queda casi negro, y acá además no hay nada que justifique ensuciar el fondo. Retrocomputación declara scanlines y aberración; se usan sólo como idea de monocromo de fósforo, que es lo que sostiene la trama en una sola tinta.

---

## Movimiento

```css
--ease: cubic-bezier(0.23, 1, 0.32, 1);
```

| Qué | Duración | Propiedades |
|---|---|---|
| Foco y hover de enlaces de créditos | 160 ms | `color`, `outline-color` |
| Cambio de `--glow` en umbral de estado | 300 ms | `--glow` (registrada con `@property`) |
| Seguimiento del estado al scroll | sin `transition`: damping exponencial a 5/s | — |
| Parallax del objeto | 0 ms, atado a `p` (sin suavizado propio) | `translate3d` |
| Interfaz de navegación entre piezas | 240 ms | `opacity` |

Nunca `transition: all`. VS-027. Nunca `ease-in`. Nunca dos elementos distintos con el mismo fade y el mismo desplazamiento: VS-026. El texto no se anima; el objeto sí. Esa asimetría es el sistema.

Parallax del objeto: `translateY` entre `-3%` y `+3%` de su alto, es decir como máximo ±32 px en 1080 de alto. El fondo se mueve como máximo 12 px en el recorrido completo. Más que eso y el objeto deja de estar en un lugar para estar flotando.

`scroll-behavior: auto` siempre. El `smooth` nativo pelea con la rueda y duplica la inercia.

### Movimiento reducido

`@media (prefers-reduced-motion: reduce)`:

- `p` se usa crudo, sin damping: el estado salta con el scroll.
- Parallax en cero: el objeto no se desplaza, sólo cambia de estado.
- El arrastre no tiene inercia ni tope elástico.
- Los estados se aplican en 4 escalones (0, .33, .66, 1) en vez de interpolar, para que no haya morphing continuo.
- `--glow` fijo en 1, sin transición.
- Ninguna rotación ociosa (hoy hay una deriva temporal en el loop).

VS-035. Esto no es opcional ni un extra de fin de sprint.

---

## Accesibilidad

Todo el texto existe en el DOM desde el primer render. Nada se inyecta al scrollear, así que Ctrl+F, el lector de pantalla y el modo lectura funcionan sin tocar el JS.

Estructura por pieza:

```html
<section aria-labelledby="t-01">
  <h2 id="t-01">El libro quemado</h2>
  <blockquote cite="https://…">
    <p>…</p>
    <footer>Juan Gelman, <i>Carta a mi madre</i>, 1980</footer>
  </blockquote>
</section>
```

- `aria-live` apagado. El cambio de estado es visual y no se anuncia: interrumpir la lectura para avisar que el libro se quemó sería peor que no avisar.
- La capa ASCII lleva `aria-hidden="true"`. El objeto no se describe: la obra no narra su propia forma. Lo que se ofrece es el texto.
- Sin JS: las secciones se apilan como documento, con todo el texto legible y sin escenario. El escenario se monta desde `.js .stage`.
- Foco: `outline: 2px solid #d99b26; outline-offset: 3px`. Sobre el fondo, 8.07:1, muy por encima del 3:1 de componentes. Sin `outline: none` en ningún lado.
- Teclado: `Tab` recorre enlace de salto → citas → créditos. `ArrowDown`/`ArrowUp`/`PageDown`/`PageUp`/`Home`/`End` scrollean nativo. `ArrowRight`/`ArrowLeft` saltan al inicio de la pieza siguiente o anterior, como atajo: es la única forma de navegar pieza a pieza sin arrastrar la rueda 900vh.
- El arrastre no tiene equivalente de teclado y no lo necesita: no carga información. Si la rotación revelara contenido, tendría que tenerlo; gira sólo la pose.
- Zoom 200%: la columna pasa al layout apilado y la grilla ASCII baja de densidad (celda mínima 8 px), sin recortar texto. Requiere sacar el `overflow: hidden` actual del `body`.
- Nada de `title="…"` como tooltip. Si hace falta explicar un control, se explica con texto visible.

Números medidos con la fórmula de luminancia relativa de WCAG 2.2 sobre los hex de arriba. No hay estimaciones: 17.84, 11.65, 8.07, 7.62, 5.87 (`#b0854e`, si alguna vez se usa como ámbar apagado), 4.11 (`#64748b`, descartado para texto), 1.55 (`#2e3342`, filete).

---

## Presupuesto de la capa ASCII

La grilla se define en píxeles, no en columnas: `--cell-w: 6px; --cell-h: 10px`. En 1440 × 900 eso da 240 × 90, 21 600 glifos; en 2560 × 1440, 426 × 144, 61 344. Por encima de ~25 000 glifos se sube la celda a 8 × 12 (la densidad baja y el objeto se lee más grande; en pantallas grandes no se nota).

Un solo nodo de texto para la capa esculpida. Actualizar un nodo por frame con `nodeValue`, nunca reemplazar spans. Si el render necesita tres capas de brillo, son tres nodos, no tres mil.

El loop ya tiene un techo de 32 ms; se mantiene. El estado se recalcula sólo si cambió `p` o si hubo arrastre. El `dt` se clampea a `1/20` (Plasma Líquido), y el tamaño de celda se decide una vez por `resize`, no por frame.

---

## Direcciones futuras

**Galería.** Índice navegable de las seis piezas: título, primera línea de la cita, y un cuadro de la trama en su estado inicial. Es la puerta de entrada para quien no quiere atravesar 900vh de scroll, y la tabla de contenidos para volver a una pieza. Sin miniaturas ilustradas, sin tarjetas con sombra: una lista tipográfica con la trama a la izquierda. Por decidir: si la trama del índice es una captura del estado inicial (barata, honesta) o un render vivo por pieza (caro en CPU, seis loops).

**Configuración.** Cuatro ajustes y ninguno más: densidad de grilla (celda 6/8/10 px), tipografía de lectura (Newsreader y la que se sume como alternativa serif), contraste (normal / alto: `--paper` a `#e0d9cc` y `--bg` a `#07080b`), movimiento (auto / reducido). Persistencia en `localStorage`. Se descarta el selector de temas: un aparato de memoria no es un producto con apariencias. Por decidir: si el contraste alto también cambia el glow (bajarlo) o lo deja igual.

**Créditos y fuentes.** Resuelto en la Etapa 3 (`PLAN.md`). El colofón es la última sección del scroll (80 vh), no una página aparte: el recorrido no se alarga y la obra cierra en el mismo documento. Lleva, por cada cita, autor, obra, año, la edición o dirección donde se consultó y el estado de permiso; después, licencias de código y tipografía (Sligoil Micro, Ariel Martín Pérez / Velvetyne, SIL OFL 1.1; Three.js, MIT), el contexto histórico consultado y la aclaración de que los modelos son representaciones, no levantamientos técnicos. El material de `docs/FUENTES.md` quedó absorbido ahí y el archivo se borró: las fuentes viven en la obra, una sola vez.

Falta decidir también: si la galería y la configuración viven en la misma página al final del scroll o en rutas separadas. La obra pierde si la configuración aparece antes del cierre.

---

## Referencias del Atlas

Operación tomada, operación descartada, licencia y fecha. Las ocho familias viven en `atlas-visual/data/atlas.json` y no tienen nota propia, así que no hay wikilink para ellas: van por nombre de entrada.

- `[[Sistema Visual/Referencias/Efectos 3D/ascii-logo|ASCII Logo]]` — tomado: elección de glifo por layout y no por brillo medio; atlas de 95 glifos; aviso de que la tipografía falla en silencio (de ahí la espera de `document.fonts.ready` y la medición de celda). Descartado: render por WebGL/canvas, remuestreo a 60 fps, el loader del demo. Licencia: MIT (código). Commit `75ab3a67b3a30c16d00deadad17cfb8a8e342eed`, consultado 2026-10-11.
- `[[Sistema Visual/Referencias/Efectos de imagen/dither-ascii-effect|Dither / ASCII Effect Pro]]` — tomado: los modos `threshold` y `edges` como referencia para el borde del corte de las tijeras y la pérdida de glifo de la silueta. Descartado: los 24 modos, `crt_scan`, `flow` (las partículas están prohibidas por el usuario). Licencia: no declarada en la nota; no se copia código, sólo criterio. Fecha de consulta: no registrada en la nota.
- `[[Sistema Visual/Componentes/Efectos de imagen/ASCII Art]]` — tomado: la idea de escalones de densidad (charset por nivel de luz) para la rampa de glifos. Descartado: pipeline de Canvas 2D, `typewriter` y `matrix` (animar el texto que se lee lo convierte en efecto), `fade`. Licencia: no declarada en la nota.
- `[[Sistema Visual/Técnicas/Plasma Líquido 01]]` — tomado: `dt` clampeado a `1/20`, techo de resolución, y el modelo de glow por crestas (`smoothstep(0.10, 0.80, abs(f))`) como umbral para que `--glow` salte por escalones. Descartado: viñeta, dither de cierre ±0.5/255 y todo el aparato de shader. Licencia: no declarada en la nota.
- `[[Sistema Visual/Componentes/Texturas y patrones/Noise Texture]]` — consultada y descartada: `feTurbulence`, `frequency 0.4`, `octaves 6`, `slope 0.15` queda casi negro según la propia nota, y el fondo no necesita grano. Licencia: no declarada.
- **Anti-Diseño Tipográfico** (`atlas-visual/data/atlas.json`) — tomado: filetes de 1 px y radios en cero (no hay una sola esquina redondeada en la obra). Descartado: monoespaciada en todo el cuerpo (VS-010), los acentos `#00ff88` / `#00ccff` / `#ffaa00`, el fondo `#050505` y la sombra dura `3px 3px 0`. La sombra dura convierte la página en afiche.
- **Invierno Eslavo** (ídem) — tomado: la ventana ámbar `#B0854E` como ascendencia del ámbar del glow (`#d99b26` viene del workspace, no de acá). Descartado: cielo `#324E6A`, fachada `#4E4C4E`, nieve `#CEC9CE`, y su relación acento/fondo de 2.59:1, que está por debajo de AA y no se hereda.
- **Retrocomputación** (ídem, sin ficha) — tomado: el monocromo de fósforo como principio (una sola tinta para toda la trama; el color no identifica objetos). Descartado: scanlines y aberración cromática: agregan acabado sin agregar sentido.
- **Net.Art** (ídem) — tomado: ASCII como formato de texto crudo, la obra literalmente en el DOM y visible en el código fuente. Descartado: databending y glitch como estética.
- **Editorial** (ídem) — tomado: tipografía display escultórica para el título y la estructura de colofón para créditos. Descartado: grilla de revista, columnas justificadas, folios.
- **Neobrutalismo Gráfico** (ídem) — tomado: nada estructural; el `letter-spacing` negativo del display se probó y se descartó (a `-0.05em`, Newsreader cierra los remates a 36 px). Descartado: borde negro continuo, sombra desplazada sin desenfoque, tipografía gruesa.
- **Brutalismo Web Crudo** (ídem) — tomado: la idea de documento expuesto sin cromo. Descartado: fondo `#eee`, Times New Roman, estructura de tabla.
- **Paleta y tipografía del workspace** (`.stitch/DESIGN.md`) — tomado: Canvas Base, Primary Ink, Secondary Ink, Signal Ochre, Structural Hairline; Newsreader como display; baseline de 4/8, márgenes 24–48 px, viewport 1280/1440, cuerpo ≥16 px, medida 45–75 caracteres. Descartado: JetBrains Mono / Fira Code para cualquier rol (Fira Code está prohibida en este harness y mono para cuerpo es VS-010), y los colores de estado Cobalt / Emerald / Amber / Crimson. Se respeta la prueba de especificidad: sin animación, sin glow y sin trama, la composición sigue teniendo jerarquía por tamaño, medida y peso.

### Lo que el Atlas no tiene

Declarado para que nadie lo invente después: no hay técnica de bloom, ni receta de glow sobre texto, ni regla de titulación de obra, ni convención de numeración de secciones, ni escala de espaciado más allá del baseline, ni guía de cómo mostrar un aviso de copyright, ni criterio sobre sincronizar texto DOM con geometría 3D. Todo eso se decidió acá y se puede discutir.
