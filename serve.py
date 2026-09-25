#!/usr/bin/env python3
"""Server xem thử tại máy: như `python3 -m http.server` nhưng không cho trình duyệt cache."""
import functools, http.server, os, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
handler = functools.partial(NoCache, directory=os.path.dirname(os.path.abspath(__file__)))
print(f'http://localhost:{port}/')
http.server.ThreadingHTTPServer(('', port), handler).serve_forever()
