# HANDOFF — Artefactos de memoria

Punto de reanudación. Última sesión de trabajo: 22/10/2026. Handoff escrito: 24/10/2026.

## Estado

Obra terminada y en entrega: seis piezas, scroll que las recorre, corpus real verificado, colofón con créditos. Etapas 0 a 4 de `PLAN.md` cerradas. Árbol limpio en `main` (último commit `2136e45`).

Lo que falta es **presentación del TP**, no código, más dos verificaciones que no se pueden hacer desde acá (teléfono real y lector de pantalla).

## Cómo abrirla

```sh
python server.py --port 8011    # las tools asumen 8011; sin --port sirve 8000
node tools/cdp.mjs scroll all   # recorrido real, consola limpia
node tools/perf.mjs             # costo por cuadro
node tools/verify-nojs.mjs      # texto sin JavaScript
```

`vendor/` está commiteado: la obra abre sin npm. `npm install` falla en `G:` (el drive no soporta la extracción de tar).

## Evidencia de la última verificación

| Check | Resultado |
|---|---|
| `cdp.mjs scroll all` | seis piezas en orden, 0→1, consola limpia, 37 muestras |
| `perf.mjs` | 59 fps, peor cuadro 69,8 ms, conversión 8,3 ms, raster 5,7 ms, 1.582 glifos, grilla 95 × 53 |
| `verify-nojs.mjs` | seis piezas, texto completo en el DOM |
| Silueta a p=1 | 3 × 1 celdas (antes seguía entera) |
| Pañuelo a p=1 | triángulo con el vértice arriba |
| `slop_lint` | 0 bloqueantes |

## Qué se hizo en la Etapa 4

Pedido del autor después de ver la obra. Detalle por tarea en `PLAN.md`; acá el resumen.

- **Inscripción legible**: palabras separadas por `·`, un verso por fila. El texto de la trama se lee como poema.
- **Trama más grande**: celda de 14 px. La grilla bajó a 95 × 53: ése es el precio de la legibilidad.
- **Fuego de glifos** (sin partículas, la regla dura se mantiene): el frente de llama son caracteres `^/\|*~"` y la ceniza `.,`. El modelo declara el avance con `burn(p)` y el motor lo pinta sobre la superficie, consumiendo el poema detrás del frente.
- **El libro se quema de verdad**: tres materiales por hoja (papel, brasa, carbón), escalonado, con encogimiento y curvatura progresivos.
- **La silueta se borra en el sitio**: ya no sale del encuadre; se aplasta hasta ser una línea.
- **El pañuelo se lee**: capucha sobre la cabeza con la cara a la vista, nudo bajo el mentón, dos puntas; al desplegar, el triángulo. Pose recalibrada a `rotX 80 / rotY 90`.
- **«NUNCA MÁS»** como inscripción del pañuelo, con procedencia en `assets/texts/texts.json`. El poema de Gelman sigue en la columna de lectura.
- **Rotación libre**: yaw sin tope, pitch ±90°, sin rebote.
- **Scroll fluido**: medidas de sección cacheadas, umbral de reconstrucción 0,018, malla del libro 26×20 → 18×14.
- **Colofón limpio**: sin licencias ni contexto histórico. Las licencias viven en `LICENSE.md` (la OFL exige que viajen con la fuente).

## Bugs de fondo que invalidaban la verificación anterior

No volver a tropezar. Están también en `AGENTS.md`.

1. `server.py` comparaba `self.path` completo: con `?piece=…` el documento llegaba **sin el corpus**. Todas las calibraciones de la sesión previa midieron una página vacía.
2. Las secciones se medían con `getBoundingClientRect` + `scrollY`; al recargar, el navegador restaura el scroll y las medidas quedan mal. Ahora se miden con `offsetTop`.
3. El headless reporta `prefers-reduced-motion: reduce`: se medía el camino de cuatro escalones, no el que ve la gente. Se fuerza `no-preference` con `Emulation.setEmulatedMedia`.

## Pendiente

| # | Qué | Por qué no está hecho |
|---|---|---|
| 1 | Verificación en teléfono real | Sólo hay viewport simulado. La celda de 14 px y el arrastre táctil no se probaron en hardware. |
| 2 | Lector de pantalla | El DOM está (`aria-hidden` en la capa esculpida, texto real en `blockquote`), pero no se escuchó con NVDA/VoiceOver. |
| 3 | Número de verso de la cita de Lihn | Memoria Chilena sólo expone el fragmento; la edición Ganymedes no se consultó. La cita lleva URL, no página. |
| 4 | Presentación / defensa del TP | No es código. |

## Ajustes posibles si el autor pide otra vuelta

- La celda de 14 px dejó la grilla en la mitad de celdas: la silueta perdió resolución. 12 px es el punto medio.
- El frente de fuego vive en el espacio de la grilla: si se gira el libro mientras se quema, la llama queda arriba del cuadro (pegada a la silueta, no a las páginas).
- El pañuelo anudado es la lectura más discutible de las seis: la capucha y el nudo funcionan en la captura, pero probablemente pidan otra pasada.

## Registro

- Repo del proyecto commiteado en `main`. El vault lo espeja archivo por archivo: cada cambio va en los dos.
- La carpeta real es `02 - Áreas/Universidad/…/TP - Final/02 - Artefactos de memoria`, no `01 - Proyectos`.
- Memoria durable en matumem, `app_id: artefactos-de-memoria`.
