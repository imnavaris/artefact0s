# VALIDACIÓN — Artefactos de memoria

Los criterios de cierre de la obra y la forma de medirlos. Los comandos corren desde la carpeta del proyecto; los que hablan con la página necesitan el servidor en el puerto 8011 (`python server.py --port 8011`).

## Automáticos

| # | Criterio | Cómo se mide | Comando | Resultado |
|---|---|---|---|---|
| V1 | La obra se recorre entera: las seis piezas en orden y cada una de 0 a 1 | Recorrido con scroll real; se lee la pieza activa y su estado | `node tools/cdp.mjs scroll all` | seis piezas en orden, estados 0 → 1 y de vuelta a 0, consola limpia |
| V2 | Sin JavaScript el texto sigue en el DOM | Se deshabilita la ejecución de scripts y se cuentan piezas y caracteres visibles | `node tools/verify-nojs.mjs` | 6 piezas, 189 a 246 caracteres visibles por pieza, sin escenario |
| V3 | Costo por cuadro | fps en scroll continuo y peor cuadro | `node tools/perf.mjs` | 57,6 fps, peor cuadro 75,7 ms, 2.957 glifos, grilla 133 × 74 |
| V4 | Consola sin errores y sin pedidos 404 | Salida del recorrido | `node tools/cdp.mjs scroll all` | consola limpia |
| V5 | Cada modelo es `update(p)`: sin estado interno, sin `toggle()`, sin partículas | Lectura de `src/models/*.js` | — | los seis cumplen |

## Corpus

| # | Criterio | Cómo se lee | Estado |
|---|---|---|---|
| C1 | Seis citas reales | `assets/texts/texts.json`, campo `status` | las seis en `verified` |
| C2 | Cada cita con autor, obra, año, edición o URL y estado de permiso | campos `author`, `work`, `year`, `source`, `license` | completos en las seis |
| C3 | Máximo 4 versos o 40 palabras por cita | campo `excerpt` | la más larga, El vuelo, tiene 35 palabras; ningún fragmento pasa de 4 versos |

## A revisar a mano

- **Sin clic**: ningún handler de `click` que dispare estado del modelo; el arrastre sólo gira.
- **Sin partículas**: ningún modelo genera partículas, ni de fondo ni de estado.
- **El estado es función del progreso**: al subir, la pieza vuelve al estado anterior (`state = f(p)`).
- **Foco visible**: `:focus-visible` con `outline: 2px solid var(--accent)` (`#d99b26`) y `outline-offset: 3px`. Ningún `outline: none` en el repo.
- **Movimiento reducido**: el estado salta en cuatro escalones sin amortiguación, el parallax queda en cero y el arrastre no tiene inercia.
- **Las siluetas se leen**: `node tools/dump-pose.mjs <pieza>` vuelca la silueta en texto plano; tiene que identificarse en tres segundos.
- **Créditos**: la sección de créditos del documento lleva, por cita, autor, obra, año, edición o URL y estado de permiso; después, licencias de código y tipografía, y la aclaración de que los modelos son representaciones y no levantamientos técnicos.

## Límites de esta validación

Dos cosas no se verificaron con evidencia: la obra en un teléfono real (sólo viewport simulado) y la lectura con lector de pantalla (sólo se comprobó el DOM y `aria-hidden`).
