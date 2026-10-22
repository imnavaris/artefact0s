# Fuentes y límites

Consultadas el 21/10/2026.

## Contexto histórico

- Archivo Nacional de la Memoria, informe sobre Short Skyvan SC-7 SH 1888, ex PA-51: https://www.argentina.gob.ar/derechoshumanos/ANM/informe-preliminar-sobre-el-avion-short-skyvan-sc-7-serie-sh-1888-ex-pa-51-de-la . Documenta la aeronave utilizada en vuelos de la muerte. Modelo de esta obra: representación procedural, no levantamiento técnico.
- Abuelas de Plaza de Mayo, campaña Florecerán pañuelos: https://www.abuelas.org.ar/acciones/250 . El pañuelo es símbolo compartido de lucha de Madres y Abuelas; esta obra lo evoca y no se presenta como producción o aval de las organizaciones.
- Parque de la Memoria, El Siluetazo: https://parquedelamemoria.org.ar/en/el-siluetazo-2/ . Relación entre acción artística y demanda de aparición con vida. La silueta del proyecto no representa a una persona identificada.
- Gobierno de la Ciudad de Buenos Aires, ciclo sobre censura cinematográfica: https://buenosaires.gob.ar/gcaba_historico/noticias/el-san-martin-les-dedica-un-ciclo-las-peliculas-censuradas-entre-los-60-y . Vincula a Miguel Paulino Tato con el Señor Tijeras. No se incorporan letras de Sui Generis.

## Tipografía

Sligoil Micro, Ariel Martín Pérez. Distribución: Velvetyne. Archivos obtenidos del repositorio oficial: https://gitlab.com/velvetyne/sligoil . Licencia SIL OFL 1.1 y copyright incluidos en assets/fonts. Se usa en el título y en cada glifo ASCII.

## Texto y API

- Corpus: Gustavo Adolfo Bécquer, Rimas, en Obras escogidas. https://www.gutenberg.org/ebooks/53552 ; texto descargado desde https://www.gutenberg.org/cache/epub/53552/pg53552.txt . Se conserva ortografía de la edición y se reemplazan saltos por separadores para la trama. Obra en dominio público; no se atribuye al proyecto ni al usuario. El JSON conserva título, autor, fuente, idioma y licencia por poema.
- Gutendex: https://gutendex.com/ . Consultas por ids e idioma; devuelve metadatos y formatos. Prueba directa: 403; en el servidor de validación: timeout. Falla registrada, sin presentarla como éxito.
- Open Library: https://openlibrary.org/developers/api . Consulta bibliográfica por autor, idioma y límite. En la validación devolvió metadatos; no versos.
- PoetryDB: https://poetrydb.org/index.html . No se usa para fingir poemas españoles ni se traduce automáticamente su corpus.
- Kaikki: el dump indicado por el usuario es un diccionario, no fuente de poemas; no se descarga un archivo masivo sin una función concreta.

Gutenberg respondió en la prueba del servidor y se verificó `live-gutenberg-53552` en la procedencia. La selección aleatoria cambia en cada carga sin necesitar un corpus remoto diferente cada vez. Si no hay red, usa la copia local de 74 rimas. El servidor limita descarga y timeout y no recibe URLs arbitrarias del navegador.
