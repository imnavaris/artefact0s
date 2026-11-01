---
type: registro
---

# Artefactos de memoria

Obra interactiva de net art y tipografía 3D que reconstruye seis objetos emblemáticos de la última dictadura cívico-militar argentina vinculados a textos literarios y testimoniales del período.

## Arquitectura y Tecnología

- **Frontend**: JavaScript moderno ES modules, Three.js (renderizado 3D procedural de tipografías y objetos), CSS estilizado.
- **Backend / Distribución**: Servidor estándar en Python (`server.py`) con capacidad de pre-renderizado estático (`--bake`).
- **Verificación**: Sin dependencias pesadas en producción; verificación automatizada mediante `tools/verify-nojs.mjs`.

## Notas de Diseño y Procedencia

Los seis artefactos son representaciones procedurales orientadas a la experiencia estética y reflexiva. Las citas literarias e históricas incluidas en el corpus (`assets/texts/texts.json`) se reproducen bajo el estricto amparo del derecho de cita (art. 10 de la Ley 11.723 de la República Argentina) con fines educativos, culturales y de memoria histórica.

## Licenciamiento

Este repositorio y su código fuente se distribuyen bajo los términos de la licencia MIT. Los textos e imágenes de terceros conservan los derechos de sus respectivos autores y herederos.
