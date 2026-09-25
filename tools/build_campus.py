import json, math
import os
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, 'osm.json')))
LAT0, LON0 = 21.00585, 105.8435          # tâm vùng hiển thị
S, N, W, E = 21.0034, 21.0084, 105.8406, 105.8466
KX = math.cos(math.radians(LAT0)) * 111320
KZ = 110540
def P(lat, lon):  # x: đông, z: nam (three.js: -z là bắc)
    return [round((lon - LON0) * KX, 1), round(-(lat - LAT0) * KZ, 1)]
def inside(lat, lon): return S < lat < N and W < lon < E
def cen(g): return sum(p['lat'] for p in g)/len(g), sum(p['lon'] for p in g)/len(g)

buildings, roads, parks = [], [], []
for e in d['elements']:
    t = e.get('tags', {}); g = e.get('geometry')
    if not g: continue
    if 'building' in t and len(g) >= 4:
        la, lo = cen(g)
        if not inside(la, lo): continue
        lv = t.get('building:levels')
        try: lv = float(lv)
        except (TypeError, ValueError): lv = None
        name = t.get('name', '')
        if name.startswith('Nhà ') and len(name) <= 7: name = name[4:]
        buildings.append({'n': name, 'lv': lv, 'p': [P(p['lat'], p['lon']) for p in g[:-1]]})
    elif t.get('amenity') == 'parking' and len(g) >= 4 and inside(*cen(g)):
        parks.append([P(p['lat'], p['lon']) for p in g[:-1]])
    elif t.get('highway') in ('primary', 'secondary', 'tertiary', 'service', 'pedestrian', 'residential', 'footway'):
        pts = [p for p in g if S - .0006 < p['lat'] < N + .0006 and W - .0006 < p['lon'] < E + .0006]
        if len(pts) < 2: continue
        hw = t['highway']
        w = {'primary': 14, 'secondary': 10, 'tertiary': 8, 'residential': 5, 'service': 4, 'pedestrian': 4, 'footway': 1.6}[hw]
        roads.append({'n': t.get('name', '') if hw in ('primary', 'tertiary') else '', 'w': w, 'p': [P(p['lat'], p['lon']) for p in pts]})

def pt(lat, lon): return P(lat, lon)
out = {
  'buildings': buildings, 'roads': roads, 'parking': parks,
  'bounds': [P(N, W), P(S, E)],
}
open(os.path.join(HERE, '..', 'js', 'campus-data.js'), 'w').write(
  '// Dữ liệu © OpenStreetMap contributors (ODbL), khu C & D Đại học Bách khoa Hà Nội.\n'
  '// Sinh tự động — toạ độ mét, gốc (21.00585, 105.8435); x = đông, z = nam.\n'
  'export default ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(buildings), 'buildings', len(roads), 'roads', len(parks), 'parking')
for b in buildings:
    if b['n'] in ('C1', 'C2', 'D3-5', 'D4', 'Thư viện Tạ Quang Bửu'):
        xs = [p[0] for p in b['p']]; zs = [p[1] for p in b['p']]
        print(b['n'], round(sum(xs)/len(xs)), round(sum(zs)/len(zs)), b['lv'])
for nm, la, lo in [('gate TDN', 21.00502, 105.84551), ('gate GP', 21.00510, 105.84162), ('gate Parabol', 21.00745, 105.84310)]:
    print(nm, P(la, lo))
