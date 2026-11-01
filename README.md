# Artefactos de memoria

Una experiencia web interactiva y narrativa de lectura sobre la última dictadura cívico-militar argentina. 

A través del scroll, seis objetos tridimensionales se revelan esculpidos en arte ASCII sobre un fondo dinámico de siluetas: un libro consumido por las llamas, una silueta que se desvanece, tijeras de censura, un televisor de tubo que cobra estática, pájaros que escapan de su jaula y un avión con la compuerta de carga abierta. Cada artefacto acompaña fragmentos literarios y documentos históricos de Juan Gelman, Rodolfo Walsh, María Elena Walsh, Paco Urondo y Néstor Perlongher.

## Cómo inicializar

Para correr la obra de forma local con cualquier servidor estático:

```sh
python server.py
```

O con el servidor integrado de Python:

```sh
python -m http.server 8000
```

Luego abrir [http://localhost:8000](http://localhost:8000) en el navegador.

- **Navegación:** Desplazarse con el scroll para transicionar entre piezas y estados.
- **Interacción:** Arrastrar con el cursor (o usar `Shift + Flechas`) para orbitar los modelos 3D.