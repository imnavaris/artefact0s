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
import html
import re

ROOT = Path(__file__).resolve().parent
CORPUS = ROOT / 'assets' / 'texts' / 'texts.json'
CITAS_START = '<!--CITAS:START-->'
CITAS_END = '<!--CITAS:END-->'
CREDITOS_START = '<!--CREDITOS:START-->'
CREDITOS_END = '<!--CREDITOS:END-->'


def extract_url(text):
    if not text:
        return None
    match = re.search(r'https?://[^\s<>"]+', text)
    return match.group(0) if match else None


def linkify_urls(text):
    if not text:
        return ''
    escaped = html.escape(text)
    # Replace URLs with hyperlinks
    def repl(m):
        url = m.group(0)
        return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{url}</a>'
    return re.sub(r'https?://[^\s<>"]+', repl, escaped)


def build_citations():
    """Arma el HTML de las seis citas a partir del corpus."""
    data = json.loads(CORPUS.read_text(encoding='utf-8'))
    blocks = []
    for text in data['texts']:
        piece = html.escape(text['piece'])
        title = html.escape(text.get('title', piece))
        excerpt = text['excerpt']
        lines = ''.join(
            f'          <span>{html.escape(line)}</span>\n'
            for line in excerpt.split('\n') if line.strip()
        )
        author = html.escape(text.get('author', ''))
        work = html.escape(text.get('work', ''))
        year = html.escape(str(text['year'])) if text.get('year') else ''
        
        attribution = f'{author}, <i>{work}, {year}</i>' if year else f'{author}, <i>{work}</i>'
        
        source_url = extract_url(text.get('source', ''))
        cite_attr = f' cite="{source_url}"' if source_url else ''

        blocks.append(f'''        <section class="piece" id="piece-{piece}" data-piece="{piece}" aria-labelledby="t-{piece}">
          <div class="piece-inner">
            <h2 id="t-{piece}" class="piece-title">{title}</h2>
            <blockquote class="citation"{cite_attr}>
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
        author = html.escape(text.get('author', ''))
        work = html.escape(text.get('work', ''))
        year = html.escape(str(text['year'])) if text.get('year') else ''
        attribution = f'{author}, <i>{work}, {year}</i>.' if year else f'{author}, <i>{work}</i>.'

        source_html = linkify_urls(text.get('source', ''))
        
        inscription = ''
        if text.get('inscription'):
            insc_text = html.escape(text['inscription'])
            insc_source = linkify_urls(text.get('inscription_source', ''))
            inscription = (
                f'\n          <p class="credits-meta">Inscripción de la pieza: '
                f'{insc_text}. {insc_source}</p>'
            )
        
        blocks.append(f'''        <div class="credits-item">
          <p class="credits-cite">{html.escape(text['excerpt'])}</p>
          <p class="credits-meta">{attribution} {source_html}</p>
          <p class="credits-meta">{html.escape(text.get('license', ''))}</p>{inscription}
        </div>''')
    return '\n'.join(blocks)


def inject_corpus(doc_html):
    citations_html = f'{CITAS_START}\n{build_citations()}\n{CITAS_END}'
    credits_html = f'{CREDITOS_START}\n{build_credits()}\n{CREDITOS_END}'

    # Replace old markers or blocks
    if CITAS_START in doc_html and CITAS_END in doc_html:
        doc_html = re.sub(r'<!--CITAS:START-->.*?<!--CITAS:END-->', citations_html, doc_html, flags=re.DOTALL)
    elif '<!--CITAS-->' in doc_html:
        doc_html = doc_html.replace('<!--CITAS-->', citations_html)

    if CREDITOS_START in CREDITOS_END or (CREDITOS_START in doc_html and CREDITOS_END in doc_html):
        doc_html = re.sub(r'<!--CREDITOS:START-->.*?<!--CREDITOS:END-->', credits_html, doc_html, flags=re.DOTALL)
    elif '<!--CREDITOS-->' in doc_html:
        doc_html = doc_html.replace('<!--CREDITOS-->', credits_html)

    return doc_html


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        if path in ('/', '/index.html'):
            return self.send_index()
        super().do_GET()

    def send_index(self):
        html_content = (ROOT / 'index.html').read_text(encoding='utf-8')
        html_content = inject_corpus(html_content)
        body = html_content.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--bake', action='store_true', help='Actualiza index.html en disco con citas y créditos pre-renderizados.')
    args = parser.parse_args()

    if args.bake:
        index_path = ROOT / 'index.html'
        if index_path.exists():
            content = index_path.read_text(encoding='utf-8')
            baked = inject_corpus(content)
            index_path.write_text(baked, encoding='utf-8')
            print('index.html horneado correctamente con éxito.', flush=True)
        else:
            print('Error: index.html no existe.', flush=True)
    else:
        print(f'http://localhost:{args.port}', flush=True)
        http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
