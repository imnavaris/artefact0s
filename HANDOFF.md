---
type: registro
---

# HANDOFF: Artefactos de memoria

Punto de reanudación y memoria técnica. Última sesión de trabajo: 02/11/2026.

## Estado del Proyecto

La obra está **completada, calibrada y verificada contra Chromium headless vía CDP**. Se realizaron iteraciones profundas sobre interactividad, tipografía procedural, iluminación y dinámica continua:

1. **Catálogo de 6 artefactos de memoria** (`src/models/*.js`, `assets/texts/texts.json`):
   - `book` (*El libro quemado*): Juan Gelman, *Bajo la lluvia ajena*, 1980. Simulación de combustión con cenizas y brasa.
   - `silhouette` (*La silueta*): Rodolfo Walsh, *Carta abierta de un escritor a la Junta Militar*, 1977. Relieve anatómico inicial que se desvanece y dispersa en partículas flotantes dejando la silueta del Siluetazo.
   - `scissors` (*Las tijeras*): María Elena Walsh, *Desventuras en el País-Jardín-de-Infantes*, 1979. Corte gradual de cinta de celuloide con caída física.
   - `tv` (*El televisor*): Rodolfo Walsh, *Carta abierta a la Junta Militar*, 1977. Modelo CRT de época mirando de frente con pantalla abombada, perillas y antenas; pantalla oscura en reposo que genera estática ASCII analógica (`tvStatic`) al scrollear. Iluminación frontal calibrada (`[0.35, -0.75, 0.6]`) para máxima nitidez en pantalla y chasis frontal, proyectando sombra profunda en el tubo posterior.
   - `birds` (*Los pájaros*): Paco Urondo, *Poemas de la cárcel*, 1973. Vista frontal con cage y vuelo parabólico continuo.
   - `flight` (*El vuelo*): Néstor Perlongher, *Cadáveres*, 1984. Skyvan con apertura notoria de compuerta trasera y cámara enfocando la rampa.

2. **Tipografía viva y scrubbing interactivo reversible**:
   - `src/typewriter.js`: máquina de escribir interactiva vinculada al scroll. El avance hacia abajo tipea los versos con cadencia humana y micro-pausas; el retroceso hacia arriba borra letra por letra hasta el inicio. Cursor parpadeante `▌`.
   - `src/dissolve.js`: revelado tipográfico progresivo de títulos y versos con rampa de caracteres glitch/polvo (` .·░▒▓█`) y desvanecimiento reactivo.

3. **Fondo ASCII con siluetas humanas en memoria de los desaparecidos** (`src/bg.js`):
   - Grilla reactiva con bustos humanos proporcionales (cuello y hombros naturales, rasgos faciales y peinados diferenciados).
   - Matriz alfanumérica densa (`@#BWMQ8...`) inspirada en la composición gráfica de referencia; movimiento sutil de respiración y dispersión dinámica con el scroll.

4. **Fluidez continua y ausencia de escalonamiento**:
   - Eliminada cualquier cuantización de estados discretos: interpolación continua a 60 fps (`FRAME_MS = 16`).
   - Sin reducción de movimiento forzada (`reduceMotion = false`).
   - Scrollbars ocultas en CSS para preservación de la atmósfera inmersiva.
   - Todos los modelos 3D poseen movimiento orgánico continuo de respiración / vibración en reposo mediante `frame(now)`.

5. **Iluminación y contraste calibrados**:
   - Soporte para iluminación direccional por pieza en `src/glyph-stage.js` (`setDirectionalLight`).
   - Iluminación frontal de TV (`[0.35, -0.75, 0.6]`) con materiales claros en chasis/marco (`#ffffff`, `#f4efe6`) y tubo posterior oscuro (`#24211c`).

---

## Verificación y Pruebas

Servidor local:
```sh
# Levantar servidor en puerto 8000
python -m http.server 8000 --bind 127.0.0.1
```

Herramientas CDP (`tools/cdp.mjs`):
```sh
# Captura de pantalla de cualquier pieza y progreso:
$env:PORT="8000"; node tools/cdp.mjs shot "scratch/tv_test.png" tv 0
$env:PORT="8000"; node tools/cdp.mjs shot "scratch/book_test.png" book 0.5

# Recorrido de scroll completo con comprobación de consola:
$env:PORT="8000"; node tools/cdp.mjs scroll all
```

---

## Evidencia Ejecutada (02/11/2026)
- **CDP Shot TV (`p=0`, `p=0.25`):** Frente del televisor iluminado con pantalla y caracteres nítidos; tubo posterior en sombra; estática analógica visible en scroll; consola sin errores.
- **CDP Shot Book (`p=0`):** Caracteres monocromos de papel nítidos, titulación y poema limpios; consola sin errores.
- **Animación:** 60 fps continuos sin saltos.
