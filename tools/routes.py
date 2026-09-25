import json, math, heapq
import os
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, 'osm.json')))
LAT0, LON0 = 21.00585, 105.8435
KX = math.cos(math.radians(LAT0)) * 111320; KZ = 110540
P = lambda la, lo: ((lo - LON0) * KX, -(la - LAT0) * KZ)
DRIVE = {'primary', 'secondary', 'tertiary', 'service', 'residential', 'pedestrian', 'primary_link'}
WALK = DRIVE | {'footway', 'steps', 'path', 'cycleway'}
def graph(kinds):
    xy, adj = {}, {}
    for e in d['elements']:
        t = e.get('tags', {})
        if e['type'] != 'way' or t.get('highway') not in kinds: continue
        ids = [(round(g['lat'], 7), round(g['lon'], 7)) for g in e['geometry']]
        for nid in ids: xy[nid] = P(*nid)
        for a, b in zip(ids, ids[1:]):
            w = math.dist(xy[a], xy[b])
            adj.setdefault(a, []).append((b, w)); adj.setdefault(b, []).append((a, w))
    return xy, adj
def near(xy, adj, p): return min(adj, key=lambda n: math.dist(xy[n], p))
def route(kinds, pts):
    xy, adj = graph(kinds); out = []
    # chỉ dùng thành phần liên thông lớn nhất
    seen, best = set(), set()
    for st in adj:
        if st in seen: continue
        comp, stack = {st}, [st]
        while stack:
            u = stack.pop()
            for v, _ in adj[u]:
                if v not in comp: comp.add(v); stack.append(v)
        seen |= comp
        if len(comp) > len(best): best = comp
    adj = {k: v for k, v in adj.items() if k in best}
    for s, t in zip(pts, pts[1:]):
        a, b = near(xy, adj, s), near(xy, adj, t)

        dist, prev, q = {a: 0}, {}, [(0, a)]
        while q:
            c, u = heapq.heappop(q)
            if u == b: break
            if c > dist[u]: continue
            for v, w in adj[u]:
                if c + w < dist.get(v, 1e18): dist[v] = c + w; prev[v] = u; heapq.heappush(q, (c + w, v))
        path = [b]
        while path[-1] != a: path.append(prev[path[-1]])
        seg = [xy[n] for n in reversed(path)]
        out += [list(s)] + seg + [list(t)]
    # bỏ điểm trùng / quá sát
    res = []
    for p in out:
        if not res or math.dist(res[-1], p) > 2: res.append([round(p[0], 1), round(p[1], 1)])
    return res
def length(r): return round(sum(math.dist(a, b) for a, b in zip(r, r[1:])))

GATE_TDN, GATE_GP = (209, 92), (-195, 83)
TDN_NORTH = (162, -102)  # phố Trần Đại Nghĩa, gần Đại Cồ Việt
GP_SOUTH = (-207, 260)      # trên đường Giải Phóng, phía Kim Liên → Giải Phóng
BAI_D35, BAI_D4 = (147, 142), (-150, 150)
HAM_B7, BAI_B1 = (250, -21), (269, 116)
DROP_GP = (-160, 70)
C2_DOOR = (-100, -60)
R = {
  'motoD35': route(DRIVE, [TDN_NORTH, GATE_TDN, BAI_D35]),
  'walkD35': route(WALK, [BAI_D35, C2_DOOR]),
  'motoD4':  route(DRIVE, [TDN_NORTH, GATE_TDN, BAI_D4]),
  'walkD4':  route(WALK, [BAI_D4, C2_DOOR]),
  'motoB7':  route(DRIVE, [TDN_NORTH, HAM_B7]),
  'walkB7':  route(WALK, [HAM_B7, C2_DOOR]),
  'motoB1':  route(DRIVE, [TDN_NORTH, BAI_B1]),
  'walkB1':  route(WALK, [BAI_B1, C2_DOOR]),
  'car':     route(DRIVE, [GP_SOUTH, GATE_GP, DROP_GP]),
  'walkCar': route(WALK, [DROP_GP, C2_DOOR]),
}
for k, v in R.items(): print(k, len(v), 'pts', length(v), 'm')
open(os.path.join(HERE, '..', 'js', 'campus-routes.js'), 'w').write(
  '// Tuyến đường tính bằng Dijkstra trên mạng đường OpenStreetMap (xem campus-data.js).\n'
  'export default ' + json.dumps(R, separators=(',', ':')) + ';\n')
