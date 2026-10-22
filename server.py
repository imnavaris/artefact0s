#!/usr/bin/env python3
"""Servidor local estatico para la obra. Python stdlib only.

El corpus vive en assets/texts/texts.json y se sirve como archivo estatico:
no hay API, no hay descarga remota, no hay refresh.
"""
import http.server
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        # El navegador pide favicon.ico aunque el documento traiga un icono
        # embebido: sin esto, la consola de la obra muestra un 404.
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    print(f'http://localhost:{args.port}', flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
