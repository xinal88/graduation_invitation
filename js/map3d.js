import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import campus from './campus-data.js';
import routePaths from './campus-routes.js';

// Toạ độ dữ liệu: x = đông (m), z = nam (m). Trục y hướng lên.
const COLORS = {
  bg: 0xd8f000, ground: 0xe1ff00, road: 0x4a4a4a, park: 0x9aa84a,
  campus: 0x222222, campusEdge: 0x5a5a5a, other: 0xbfcf3a, otherEdge: 0x8f9c1f,
  hover: 0x444444, hall: 0xff4d2e, drive: 0xff4d2e, walk: 0x2d6cdf,
};
const LEVEL_H = 3.6;
const WALK_SPEED = 75; // m/phút

const PLACES = {
  gateTDN:    { p: [209, 92],   text: 'Cổng Trần Đại Nghĩa', cls: 'gate' },
  gateGP:     { p: [-195, 83],  text: 'Cổng Giải Phóng', cls: 'gate' },
  gateMain:   { p: [-42, -177], text: 'Cổng Parabol', cls: 'gate' },
  parkD35:    { p: [147, 142],  text: 'Bãi D3-5', cls: 'park' },
  parkD4:     { p: [-150, 150], text: 'Bãi D4', cls: 'park' },
  hamB7:      { p: [250, -21],  text: 'Hầm B7', cls: 'park' },
  parkB1:     { p: [269, 116],  text: 'Nhà xe B1', cls: 'park' },
  roadDCV:    { p: [90, -214],  text: 'Đại Cồ Việt', cls: 'road' },
  roadGP:     { p: [-222, -40], text: 'Giải Phóng', cls: 'road' },
  roadTDN:    { p: [192, -72],  text: 'Trần Đại Nghĩa', cls: 'road' },
};
const BUILDING_LABELS = ['C1', 'Thư viện Tạ Quang Bửu', 'D3-5', 'D4', 'C9', 'D3', 'Highlands Coffee'];
const INFO = {
  C1: 'Toà nhà biểu tượng của Bách khoa, mặt đường Đại Cồ Việt.',
  C2: 'Hội trường — nơi diễn ra lễ tốt nghiệp.',
  'Thư viện Tạ Quang Bửu': 'Thư viện trung tâm, 10 tầng.',
  'D3-5': 'Bãi gửi xe máy D3-5 nằm ngay cạnh.',
  D4: 'Bãi gửi xe máy D4 nằm phía bắc toà nhà.',
  'Ký túc xá B7': 'Có hầm gửi xe máy.',
  B1: 'Nhà xe B1 nằm ngay cạnh, sau Highlands Coffee.',
  'Highlands Coffee': 'Nhà xe B1 nằm ngay phía sau quán.',
};

const ROUTES = {
  overview: {
    title: 'Nhà C2 — ngay sau toà C1',
    intro: 'C2 nằm phía sau toà C1 (mặt đường Đại Cồ Việt), sát đường Giải Phóng. Chọn cách di chuyển để xem đường đi từng bước.',
    places: ['gateTDN', 'gateGP', 'gateMain', 'parkD35', 'parkD4', 'hamB7', 'parkB1', 'roadDCV', 'roadGP', 'roadTDN'],
  },
  motoD35: {
    title: 'Xe máy · gửi ở Bãi D3-5',
    drive: 'motoD35', walk: 'walkD35',
    steps: [
      'Đi phố Trần Đại Nghĩa, vào trường qua <b>Cổng Trần Đại Nghĩa</b> — xe máy chỉ vào được cổng này.',
      '<b>Rẽ trái ngay</b> sau cổng, gửi xe ở <b>Điểm trông giữ xe D3 - D5</b>, nằm giữa nhà D3 và D5.',
      'Đi bộ khoảng {walk} qua sân trường, hướng về toà C1 là tới <b>Nhà C2</b>.',
    ],
    marks: [['gateTDN', 1], ['parkD35', 2]],
    places: ['gateTDN', 'parkD35', 'roadTDN'],
  },
  motoD4: {
    title: 'Xe máy · gửi ở Bãi D4',
    drive: 'motoD4', walk: 'walkD4',
    steps: [
      'Vào trường qua <b>Cổng Trần Đại Nghĩa</b>.',
      '<b>Đi thẳng</b> theo trục đường chính; tới gần Cổng Giải Phóng thì <b>rẽ trái</b> vào Bãi D4.',
      'Đi bộ khoảng {walk} lên phía bắc là tới <b>Nhà C2</b>.',
    ],
    marks: [['gateTDN', 1], ['parkD4', 2]],
    places: ['gateTDN', 'parkD4', 'gateGP', 'roadTDN'],
  },
  motoB7: {
    title: 'Xe máy · gửi ở Hầm B7',
    drive: 'motoB7', walk: 'walkB7',
    steps: [
      'Đi phố Trần Đại Nghĩa từ phía Đại Cồ Việt, rẽ trái vào <b>hầm gửi xe KTX B7</b>.',
      'Gửi xe xong, đi bộ ra phố Trần Đại Nghĩa, xuôi xuống <b>Cổng Trần Đại Nghĩa</b>.',
      'Vào cổng, đi thẳng rồi cắt chéo qua sân trường, tổng cộng khoảng {walk} là tới <b>Nhà C2</b>.',
    ],
    marks: [['hamB7', 1], ['gateTDN', 2]],
    places: ['hamB7', 'gateTDN', 'roadTDN'],
  },
  motoB1: {
    title: 'Xe máy · gửi ở Nhà xe B1',
    drive: 'motoB1', walk: 'walkB1',
    steps: [
      'Đi phố Trần Đại Nghĩa tới gần cổng trường, rẽ vào lối cạnh <b>Highlands Coffee</b> (bên kia đường so với cổng).',
      'Gửi xe ở <b>Nhà xe B1</b>, ngay phía sau Highlands.',
      'Đi bộ băng qua đường vào <b>Cổng Trần Đại Nghĩa</b>, tổng cộng khoảng {walk} là tới <b>Nhà C2</b>.',
    ],
    marks: [['parkB1', 1], ['gateTDN', 2]],
    places: ['parkB1', 'gateTDN', 'roadTDN'],
  },
  car: {
    title: 'Ô tô · Taxi · Grab',
    drive: 'car', walk: 'walkCar',
    steps: [
      'Đi theo đường Giải Phóng, vào trường qua <b>Cổng Giải Phóng</b> để tránh tắc ở phía Đại Cồ Việt.',
      'Xuống xe ngay sau cổng.',
      'Đi bộ khoảng {walk} là tới <b>Nhà C2</b>.',
    ],
    marks: [['gateGP', 1]],
    places: ['gateGP', 'roadGP'],
  },
};

const pathLength = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function initMap({ container, hall }) {
  const host = container.querySelector('#map-canvas');
  const tip = container.querySelector('#map-tip');
  const lockBtn = container.querySelector('#map-lock');
  const compass = container.querySelector('#compass');
  const routeInfo = document.querySelector('#route-info');
  const tabs = [...document.querySelectorAll('#route-tabs [data-route]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.Fog(COLORS.bg, 950, 2100);

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
  camera.position.set(0, 1100, 200);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 90;
  controls.maxDistance = 1100;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.screenSpacePanning = false;
  controls.autoRotateSpeed = 0.35;

  // ---------- Ánh sáng ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa8b800, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-220, 420, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 50, far: 1400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun);

  // ---------- Mặt đất ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ color: COLORS.ground }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- Đường ----------
  const roadGeos = [];
  const segGeo = (a, b, w, y) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 0.01) return null;
    const g = new THREE.PlaneGeometry(len, w);
    g.rotateX(-Math.PI / 2);
    g.rotateY(-Math.atan2(dz, dx));
    g.translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2);
    return g;
  };
  for (const r of campus.roads) {
    const y = r.w > 6 ? 0.12 : 0.08;
    for (let i = 1; i < r.p.length; i++) {
      const g = segGeo(r.p[i - 1], r.p[i], r.w, y);
      if (g) roadGeos.push(g);
      if (r.w >= 4) {
        const j = new THREE.CircleGeometry(r.w / 2, 10);
        j.rotateX(-Math.PI / 2); j.translate(r.p[i][0], y, r.p[i][1]);
        roadGeos.push(j);
      }
    }
  }
  const roads = new THREE.Mesh(mergeGeometries(roadGeos.map((g) => g.toNonIndexed())), new THREE.MeshLambertMaterial({ color: COLORS.road }));
  roads.receiveShadow = true;
  scene.add(roads);

  const shapeOf = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const parkGeos = campus.parking.map((p) => {
    const g = new THREE.ShapeGeometry(shapeOf(p)); g.rotateX(-Math.PI / 2); g.translate(0, 0.16, 0); return g;
  });
  const parks = new THREE.Mesh(mergeGeometries(parkGeos), new THREE.MeshLambertMaterial({ color: COLORS.park }));
  parks.receiveShadow = true;
  scene.add(parks);

  // ---------- Toà nhà ----------
  const campusMat = new THREE.MeshLambertMaterial({ color: COLORS.campus });
  const hoverMat = new THREE.MeshLambertMaterial({ color: COLORS.hover, emissive: 0x2a2f00 });
  const hallMat = new THREE.MeshLambertMaterial({ color: COLORS.hall, emissive: 0x3a0e00 });
  const pickable = [];
  const otherGeos = [], campusEdges = [], otherEdges = [];
  const byName = {};
  let hallTop = 10;

  for (const b of campus.buildings) {
    const named = Boolean(b.n);
    const levels = b.lv || (named ? 4 : 3);
    const h = levels * LEVEL_H;
    const geo = new THREE.ExtrudeGeometry(shapeOf(b.p), { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const edges = new THREE.EdgesGeometry(geo, 30);
    if (!named) { otherGeos.push(geo); otherEdges.push(edges); continue; }
    const isHall = b.n === 'C2';
    const mesh = new THREE.Mesh(geo, isHall ? hallMat : campusMat);
    mesh.castShadow = mesh.receiveShadow = true;
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(new THREE.Vector3());
    mesh.userData = { name: b.n, levels: b.lv, top: h, center: c };
    pickable.push(mesh);
    byName[b.n] = mesh;
    scene.add(mesh);
    if (isHall) {
      hallTop = h;
      const e = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: COLORS.campus }));
      scene.add(e);
    } else campusEdges.push(edges);
  }
  const others = new THREE.Mesh(mergeGeometries(otherGeos), new THREE.MeshLambertMaterial({ color: COLORS.other }));
  others.castShadow = others.receiveShadow = true;
  scene.add(others);
  scene.add(new THREE.LineSegments(mergeGeometries(campusEdges), new THREE.LineBasicMaterial({ color: COLORS.campusEdge })));
  scene.add(new THREE.LineSegments(mergeGeometries(otherEdges), new THREE.LineBasicMaterial({ color: COLORS.otherEdge })));

  // ---------- Điểm nhấn C2: mũ tốt nghiệp + vòng sóng ----------
  const hallCenter = byName.C2.userData.center;
  const cap = new THREE.Group();
  const ink = new THREE.MeshLambertMaterial({ color: COLORS.campus });
  const board = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 26), ink);
  board.rotation.y = Math.PI / 4;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(8, 9.5, 7, 32), ink);
  crown.position.y = -4;
  const button = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8), new THREE.MeshLambertMaterial({ color: COLORS.ground }));
  button.position.y = 1.2;
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 6), new THREE.MeshLambertMaterial({ color: COLORS.ground }));
  tassel.position.set(17.5, -5, 0);
  const tasselEnd = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.3, 4, 8), tassel.material);
  tasselEnd.position.set(17.5, -12, 0);
  const cord = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.5, 0.5), tassel.material);
  cord.position.set(8.75, 1.1, 0);
  cap.add(board, crown, button, tassel, tasselEnd, cord);
  cap.traverse((o) => { o.castShadow = true; });
  cap.position.set(hallCenter.x, hallTop + 34, hallCenter.z);
  scene.add(cap);

  const rings = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: COLORS.campus, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(hallCenter.x, 0.3 + i * 0.01, hallCenter.z);
    m.userData.offset = i / 3;
    scene.add(m);
    return m;
  });

  // ---------- Nhãn ----------
  const makeLabel = (html, cls, x, y, z) => {
    const el = document.createElement('div');
    el.className = `lbl ${cls ? 'lbl--' + cls : ''}`;
    el.innerHTML = html;
    const obj = new CSS2DObject(el);
    obj.position.set(x, y, z);
    scene.add(obj);
    return obj;
  };
  makeLabel(`${hall}<small>Nơi tổ chức lễ tốt nghiệp</small>`, 'main', hallCenter.x, hallTop + 58, hallCenter.z);
  const placeLabels = {};
  for (const [key, pl] of Object.entries(PLACES)) {
    placeLabels[key] = makeLabel(pl.text, pl.cls, pl.p[0], pl.cls === 'road' ? 1 : 10, pl.p[1]);
  }
  const bLabels = BUILDING_LABELS.filter((n) => byName[n]).map((n) => {
    const u = byName[n].userData;
    return makeLabel(n === 'Thư viện Tạ Quang Bửu' ? 'Thư viện TQB' : n, '', u.center.x, u.top + 6, u.center.z);
  });
  for (const pl of Object.values(PLACES)) {
    if (pl.cls === 'road') continue;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 9, 8), ink);
    pin.position.set(pl.p[0], 4.5, pl.p[1]);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), new THREE.MeshLambertMaterial({ color: pl.cls === 'park' ? COLORS.walk : COLORS.ground }));
    dot.position.set(pl.p[0], 9, pl.p[1]);
    scene.add(pin, dot);
  }

  // ---------- Tuyến đường ----------
  const Y = 1.6;
  const curveOf = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, Y, z)), false, 'centripetal');
  const built = {};
  for (const [key, r] of Object.entries(ROUTES)) {
    if (!r.drive) continue;
    const group = new THREE.Group(); group.visible = false;
    const driveCurve = curveOf(routePaths[r.drive]);
    const walkCurve = curveOf(routePaths[r.walk]);
    const driveLen = pathLength(routePaths[r.drive]);
    const walkLen = pathLength(routePaths[r.walk]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(driveCurve, Math.max(64, routePaths[r.drive].length * 12), 1.9, 8, false),
      new THREE.MeshLambertMaterial({ color: COLORS.drive, emissive: 0x551100 }),
    );
    tube.castShadow = true;
    const nDots = Math.floor(walkLen / 4.5);
    const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1.5, 10, 8), new THREE.MeshLambertMaterial({ color: COLORS.walk, emissive: 0x0a1f55 }), nDots);
    const dotPos = Array.from({ length: nDots }, (_, i) => walkCurve.getPointAt(i / Math.max(1, nDots - 1)));
    const traveler = new THREE.Mesh(new THREE.SphereGeometry(3.4, 20, 14), new THREE.MeshLambertMaterial({ color: COLORS.campus, emissive: 0x111111 }));
    traveler.castShadow = true;
    group.add(tube, dots, traveler);
    scene.add(group);
    const markLabels = (r.marks || []).map(([place, n]) => {
      const [x, z] = PLACES[place].p;
      const l = makeLabel(String(n), 'step', x, 20, z); l.visible = false; return l;
    });
    const endLabel = makeLabel(String((r.marks || []).length + 1), 'step', hallCenter.x + 22, 20, hallCenter.z);
    endLabel.visible = false;
    markLabels.push(endLabel);
    const bounds = new THREE.Box3().setFromPoints([...driveCurve.points, ...walkCurve.points, hallCenter]);
    built[key] = { group, tube, dots, dotPos, traveler, driveCurve, walkCurve, driveLen, walkLen, markLabels, bounds, drawn: 0 };
  }

  // ---------- Camera ----------
  const overviewBox = new THREE.Box3(new THREE.Vector3(-240, 0, -200), new THREE.Vector3(250, 0, 220));
  const viewDir = new THREE.Vector3(0.18, 0.95, 0.78).normalize();
  function frame(box) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3()); center.y = 0;
    const aspect = camera.aspect;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const needH = Math.max(size.z * 0.85, size.x / aspect);
    const dist = THREE.MathUtils.clamp((needH / 2) / Math.tan(vfov / 2) * 1.15, 180, 1000);
    return { target: center, position: center.clone().addScaledVector(viewDir, dist) };
  }
  let fly = null;
  function flyTo(view, ms = 1400, then) {
    if (reduced) ms = 0;
    fly = { t0: performance.now(), ms, then, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: view.position, toT: view.target };
  }
  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; });
  controls.addEventListener('change', () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -320, 320);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -300, 320);
    controls.target.y = 0;
  });

  // ---------- Chọn tuyến ----------
  let active = 'overview';
  function selectRoute(key) {
    active = key;
    const r = ROUTES[key];
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.route === key)));
    for (const [k, b] of Object.entries(built)) {
      const on = k === key;
      b.group.visible = on;
      b.markLabels.forEach((l) => { l.visible = on; });
      if (on) b.drawn = 0;
    }
    for (const [k, l] of Object.entries(placeLabels)) l.element.classList.toggle('lbl--dim', !r.places.includes(k));
    bLabels.forEach((l) => l.element.classList.toggle('lbl--dim', key !== 'overview'));
    controls.autoRotate = false;
    flyTo(frame(key === 'overview' ? overviewBox : built[key].bounds.clone().expandByScalar(30)));

    if (key === 'overview') {
      routeInfo.innerHTML = `<h3>${r.title}</h3><p>${r.intro}</p>
        <div class="legend"><span>Kéo để xoay · chụm hoặc cuộn để phóng to · chạm vào toà nhà để xem tên</span></div>`;
    } else {
      const b = built[key];
      const walk = `${Math.round(b.walkLen / 10) * 10} m (~${Math.ceil(b.walkLen / WALK_SPEED)} phút)`;
      routeInfo.innerHTML = `<h3>${r.title}</h3><ol>${r.steps.map((s) => `<li>${s.replace('{walk}', walk)}</li>`).join('')}</ol>
        <div class="legend"><span><i style="background:#ff4d2e"></i>Đi xe</span><span><i style="background:#2d6cdf"></i>Đi bộ</span></div>`;
    }
  }
  tabs.forEach((t) => t.addEventListener('click', () => selectRoute(t.dataset.route)));
  container.querySelector('#map-reset').addEventListener('click', () => selectRoute('overview'));

  // ---------- Chạm / di chuột vào toà nhà ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null, down = null;
  const pick = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(pickable, false)[0]?.object || null;
  };
  const setHover = (m) => {
    if (hovered === m) return;
    if (hovered && hovered.userData.name !== 'C2') hovered.material = campusMat;
    hovered = m;
    if (m && m.userData.name !== 'C2') m.material = hoverMat;
    renderer.domElement.style.cursor = m ? 'pointer' : '';
  };
  let tipTimer;
  const showTip = (m) => {
    const { name, levels } = m.userData;
    const title = /^[A-Z]\d/.test(name) ? `Nhà ${name}` : name;
    const desc = INFO[name] || (levels ? `${levels} tầng` : 'Khu giảng đường Bách khoa');
    tip.innerHTML = `<b>${title}</b>${desc}`;
    tip.hidden = false;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { tip.hidden = true; }, 4000);
  };
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const m = pick(e);
    if (m) { showTip(m); if (e.pointerType !== 'mouse') { setHover(m); setTimeout(() => setHover(null), 1200); } }
  });
  renderer.domElement.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !e.buttons) setHover(pick(e)); });
  renderer.domElement.addEventListener('pointerleave', () => setHover(null));

  // ---------- Khoá tương tác trên điện thoại ----------
  const coarse = matchMedia('(pointer: coarse)').matches;
  const setLocked = (locked) => {
    controls.enabled = !locked;
    lockBtn.hidden = !locked;
  };
  if (coarse) setLocked(true);
  lockBtn.addEventListener('click', () => { setLocked(false); controls.autoRotate = false; });

  // ---------- Toàn màn hình ----------
  const fullBtn = container.querySelector('#map-full');
  const setFull = (on) => {
    container.classList.toggle('is-full', on);
    document.body.style.overflow = on ? 'hidden' : '';
    fullBtn.setAttribute('aria-label', on ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ');
    if (on) setLocked(false);
    else if (coarse) setLocked(true);
  };
  fullBtn.addEventListener('click', () => setFull(!container.classList.contains('is-full')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && container.classList.contains('is-full')) setFull(false); });

  // ---------- Kích thước & hiển thị ----------
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible && coarse && !container.classList.contains('is-full')) setLocked(true);
    if (visible) requestAnimationFrame(loop);
  }).observe(container);

  // ---------- Vòng lặp ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Object3D();
  function loop() {
    if (!visible) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (fly) {
      const k = fly.ms ? Math.min(1, (performance.now() - fly.t0) / fly.ms) : 1;
      const e = ease(k);
      camera.position.lerpVectors(fly.fromP, fly.toP, e);
      controls.target.lerpVectors(fly.fromT, fly.toT, e);
      if (k >= 1) { const done = fly.then; fly = null; if (done) done(); }
    }
    controls.update();
    compass.style.transform = `rotate(${controls.getAzimuthalAngle()}rad)`;

    cap.position.y = hallTop + 34 + Math.sin(t * 1.6) * 3;
    cap.rotation.y = t * 0.5;
    tassel.rotation.z = tasselEnd.rotation.z = Math.sin(t * 2.2) * 0.08;
    for (const r of rings) {
      const k = (t * 0.45 + r.userData.offset) % 1;
      const s = 14 + k * 46;
      r.scale.set(s, s, s);
      r.material.opacity = (1 - k) * 0.55;
    }

    const b = built[active];
    if (b) {
      b.drawn = Math.min(1, b.drawn + dt / (reduced ? 0.01 : 1.6));
      const idx = b.tube.geometry.index.count;
      b.tube.geometry.setDrawRange(0, Math.floor((idx * b.drawn) / 6) * 6);
      const shown = Math.floor(b.dotPos.length * Math.max(0, b.drawn * 2 - 1));
      b.dotPos.forEach((p, i) => {
        const s = i < shown ? 0.75 + 0.35 * Math.sin(t * 5 - i * 0.45) : 0;
        tmp.position.copy(p); tmp.scale.setScalar(s); tmp.updateMatrix();
        b.dots.setMatrixAt(i, tmp.matrix);
      });
      b.dots.instanceMatrix.needsUpdate = true;
      // chấm trắng chạy dọc tuyến: đi xe nhanh, đi bộ chậm
      const total = b.driveLen / 8 + b.walkLen / 2.2;
      const u = (t % total);
      const pos = u < b.driveLen / 8
        ? b.driveCurve.getPointAt(u / (b.driveLen / 8))
        : b.walkCurve.getPointAt((u - b.driveLen / 8) / (b.walkLen / 2.2));
      b.traveler.position.copy(pos).setY(Y + 2.4);
      b.traveler.visible = b.drawn >= 1;
    }

    renderer.render(scene, camera);
    labels.render(scene, camera);
  }

  // ---------- Khởi động ----------
  container.querySelector('#map-loading').remove();
  selectRoute('overview');
  flyTo(frame(overviewBox), 2400, () => { controls.autoRotate = !reduced && active === 'overview'; });
  requestAnimationFrame(loop);
}
