---
type: registro
---

# VALIDACIÓN: Artefactos de memoria

Los criterios de cierre de la obra y la forma de medirlos. Los comandos corren desde la carpeta del proyecto; los que hablan con la página necesitan el servidor en el puerto 8011 (`python server.py --port 8011`).

## Automáticos

| # | Criterio | Cómo se mide | Comando | Resultado (27/10/2026) |
|---|---|---|---|---|
| V1 | La obra se recorre entera: umbral, seis piezas en orden de 0 a 1 y cierre | Recorrido con scroll real; se lee la pieza activa, su estado y `--glow` | `node tools/cdp.mjs scroll all` | 6 piezas en orden, estados `0 -> 1` y regreso al subir, `--glow` en `[0.72, 0.86, 1]`, `CONSOLA: limpia` |
| V2 | Sin JavaScript el texto sigue en el DOM (y pre-horneado para hosting estático) | Se deshabilita la ejecución de scripts y se cuentan piezas y caracteres visibles | `node tools/verify-nojs.mjs` | 6 piezas, `134` a `231` caracteres visibles por pieza, sin escenario |
| V3 | Costo por cuadro y geometría optimizada | FPS en scroll continuo, conversión y raster por pieza | `node tools/perf.mjs` | `58.6 fps`, conversión `10.3 ms` en libro y `0.9 a 5.3 ms` en las demás piezas (`birds` reducido de `24.080` a `6.128` tris) |
| V4 | Consola sin errores y sin pedidos 404 | Salida del recorrido completo | `node tools/cdp.mjs scroll all` | `CONSOLA: limpia` |
| V5 | Cada modelo es `update(p)`: función pura del progreso, sin `toggle()` ni partículas | Lectura de `src/models/*.js` | Inspección estática | Los seis modelos cumplen |
| V6 | Inscripción íntegra sin filtración de `@%#*+=` | Conteo de caracteres ajenos al poema en `.glyph-output` en `p = 0, 0.5, 1` | Sonda CDP | `leakedAsciiCount = 0` en las 6 piezas (100 % de celdas ocupadas esculpidas con el poema) |
| V7 | Paleta monocroma con piso WCAG AA y único acento brasa | Medición de luminancia relativa de todos los `<span style="color:...">` sobre `#0b0c10` | Sonda CDP | Contraste entre `5.08:1` y `13.32:1`; `0` celdas por debajo de `4.5:1` |
| V8 | La silueta y el pañuelo se leen en ambos extremos del recorrido | Capturas en `p = 0` y `p = 1` | `node tools/cdp.mjs shot` | En `silhouette` los relieves anatómicos están en `p = 0` y dejan la huella vaciada en `p = 1`; en `scarf` pasa de capucha anudada con puntas a triángulo desplegado |
| V9 | Rotación independiente por pieza y accesible por teclado | Arrastre con puntero o `Shift + Flechas` | `src/main.js` | `userAngles` guarda `yaw`/`pitch` por pieza, los preserva en `resize` y permite rotar con `Shift + ArrowLeft/Right/Up/Down` |
| V10 | Layout responsive sin superposición ni overflow horizontal | Emulación `375 × 812` en CDP | Sonda CDP mobile | `overlapsStage: false` (`stageBottom: 324.8px < pieceInnerTop: 336.8px`), `horizontalOverflow: false` (`docWidth: 360px <= 375px`) |

## Corpus

| # | Criterio | Cómo se lee | Estado |
|---|---|---|---|
| C1 | Seis citas reales y pertinentes a cada artefacto | `assets/texts/texts.json`, campo `status` | Las seis en `verified` (Gelman 1980, Gelman 1982 + CONADEP, R. Walsh 1977, M. E. Walsh 1979, P. Urondo 1973, N. Perlongher 1984) |
| C2 | Cada cita con autor, obra, año, edición o URL clicable y encuadre legal | Campos `author`, `work`, `year`, `source`, `license` y `#credits` en DOM | Completos en las seis; URLs convertidas en enlaces `<a href="...">` reales |
| C3 | Máximo 4 versos o 40 palabras por cita | Campo `excerpt` | Todas cumplen `<= 4` versos y `<= 40` palabras |
| C4 | La inscripción del pañuelo («NUNCA MÁS») tiene procedencia documentada | Campos `inscription` e `inscription_source` | Consigna de las Madres y Abuelas de Plaza de Mayo e Informe CONADEP (1984) |
