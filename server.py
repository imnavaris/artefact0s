#!/usr/bin/env python3
"""Servidor local estatico para la obra. Python stdlib only.

El corpus vive en assets/texts/texts.json y es la unica fuente de verdad.
El servidor inyecta sus citas en el documento: sin JavaScript, el texto de
las seis piezas sigue en el DOM, como pide el diseno.
"""
import http.server
import json
from pathlib import Path
import argparse
import urllib.parse

ROOT = Path(__file__).resolve().parent
CORPUS = ROOT / 'assets' / 'texts' / 'texts.json'
MARKER = '<!--CITAS-->'


def build_citations():
    """Arma el HTML de las seis citas a partir del corpus."""
    data = json.loads(CORPUS.read_text(encoding='utf-8'))
    blocks = []
    for text in data['texts']:
        piece = text['piece']
        title = text.get('title', piece)
        excerpt = text['excerpt']
        lines = ''.join(
            f'          <span>{line}</span>\n'
            for line in excerpt.split('\n') if line.strip()
        )
        attribution = ', '.join(filter(None, [
            text.get('author'),
            text.get('work'),
            str(text['year']) if text.get('year') else None,
        ]))
        blocks.append(f'''        <section class="piece" data-piece="{piece}" aria-labelledby="t-{piece}">
          <div class="piece-inner">
            <h2 id="t-{piece}" class="piece-title">{title}</h2>
            <blockquote class="citation">
              <p>
{lines}          </p>
              <footer>{attribution}</footer>
            </blockquote>
          </div>
        </section>''')
    return '\n'.join(blocks)


def build_credits():
    """Arma el bloque de creditos con la procedencia de cada cita."""
    data = json.loads(CORPUS.read_text(encoding='utf-8'))
    blocks = []
    for text in data['texts']:
        attribution = ', '.join(filter(None, [
            text.get('author'),
            text.get('work'),
            str(text['year']) if text.get('year') else None,
        ]))
        inscription = ''
        if text.get('inscription'):
            inscription = (
                f'\n          <p class="credits-meta">Inscripción de la pieza: '
                f'{text["inscription"]}. {text.get("inscription_source", "")}</p>'
            )
        blocks.append(f'''        <div class="credits-item">
          <p class="credits-cite">{text['excerpt']}</p>
          <p class="credits-meta">{attribution}. {text.get('source', '')}</p>
          <p class="credits-meta">{text.get('license', '')}</p>{inscription}
        </div>''')
    return '\n'.join(blocks)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        # El navegador pide favicon.ico aunque el documento traiga un icono
        # embebido: sin esto, la consola de la obra muestra un 404.
        path = urllib.parse.urlparse(self.path).path
        if path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        if path in ('/', '/index.html'):
            return self.send_index()
        super().do_GET()

    def send_index(self):
        """Sirve el documento con las citas del corpus ya dentro."""
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        try:
            html = html.replace(MARKER, build_citations())
            html = html.replace('<!--CREDITOS-->', build_credits())
        except (OSError, ValueError, KeyError) as error:
            print(f'no se pudo inyectar el corpus: {error}', flush=True)
        body = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    print(f'http://localhost:{args.port}', flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
