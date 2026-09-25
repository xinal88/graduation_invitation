#!/usr/bin/env python3
"""Gắn ?v=<thời điểm> vào CSS/JS để trình duyệt luôn tải bản mới.

Chạy lại mỗi khi sửa file trong css/ hoặc js/:  python3 tools/bump_version.py
"""
import os, re, time

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
V = time.strftime('%Y%m%d%H%M%S')
MODULES = sorted(f for f in os.listdir(os.path.join(ROOT, 'js')) if f.endswith('.js'))

def importmap(extra=''):
    entries = [f'        "./js/{m}": "./js/{m}?v={V}"' for m in MODULES]
    return ('<script type="importmap">\n    {\n      "imports": {\n' + extra
            + ',\n'.join(entries) + '\n      }\n    }\n  </script>')

THREE = ('        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",\n'
         '        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",\n')

for page, extra in [('index.html', THREE), ('tao-link.html', '')]:
    path = os.path.join(ROOT, page)
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'<script type="importmap">.*?</script>', lambda _: importmap(extra), s, flags=re.S)
    if '<script type="importmap">' not in s:  # trang chưa có import map → chèn trước </head>
        s = s.replace('</head>', '  ' + importmap(extra) + '\n</head>', 1)
    s = re.sub(r'(href="css/style\.css)(\?v=\d+)?"', rf'\1?v={V}"', s)
    s = re.sub(r'(src="js/app\.js)(\?v=\d+)?"', rf'\1?v={V}"', s)
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{page}: v={V}')
