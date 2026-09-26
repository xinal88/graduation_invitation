import config, { relations, defaultRelation } from './config.js';
import { readGuest } from './guest.js';
import { initFx } from './fx.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const setAll = (sel, text) => $$(sel).forEach((el) => { el.textContent = text; });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Khách & quan hệ ----------
const { name: guestName, rel: relKey, photo: guestPhoto } = readGuest(location.search, config.guests);
const rel = { ...(relations[relKey] || defaultRelation) };
if (!rel.self) rel.self = config.graduate.selfToYounger;
const guest = guestName || (relKey ? cap(rel.call) : 'Quý khách');
const fill = (tpl) => tpl.replaceAll('{self}', rel.self).replaceAll('{call}', rel.call);

// ---------- Đổ nội dung ----------
const g = config.graduate, c = config.ceremony, v = config.venue;
setAll('[data-guest]', guest);
setAll('[data-guest-call]', guestName || rel.call);
setAll('[data-greet]', rel.greet);
setAll('[data-grad-name]', g.name);
setAll('[data-date]', c.dateLabel);
setAll('[data-weekday]', c.weekdayLabel);
setAll('[data-time]', c.timeLabel);
setAll('[data-hall]', v.hall);
setAll('[data-university]', v.university);
setAll('[data-address]', v.address);
$$('[data-map-url]').forEach((a) => { a.href = v.mapUrl; });

const initials = g.name.trim().split(/\s+/);
setAll('[data-initials]', (initials[0][0] + (initials.length > 1 ? initials[initials.length - 1][0] : '')).toUpperCase());

const degree = [g.degree, g.major].filter(Boolean).join(' · ');
if (degree) $$('[data-degree]').forEach((el) => { el.textContent = degree; el.hidden = false; });

$('#message-text').textContent = cap(fill(config.message));
$('#rsvp-q').textContent = `${cap(rel.call)} sẽ đến chung vui cùng ${rel.self} chứ?`;
if (config.note) { $('#note-text').textContent = fill(config.note); $('#note').hidden = false; }
document.title = `${guestName ? guestName + ' · ' : ''}Graduation Invitation · ${c.dateLabel}`;

// Khung vòm ở hero: ảnh khách (nếu link có) → ảnh của mình → chữ viết tắt
function showPortrait(src, alt) {
  if (!src) return;
  const img = Object.assign(new Image(), { src, alt, decoding: 'async' });
  img.onload = () => { $('#portrait').replaceChildren(img); };
}
if (!guestPhoto) showPortrait(config.portrait, g.name);
if (config.photos.length) {
  $('#gallery').hidden = false;
  $('#rsvp-no').textContent = '05';
  $('#gallery-grid').replaceChildren(...config.photos.map((src, i) => {
    const img = new Image(); img.src = src; img.loading = 'lazy'; img.alt = `Ảnh ${i + 1}`; img.className = 'reveal';
    return img;
  }));
}

// ---------- Ảnh khách ----------
if (guestPhoto) {
  const pol = $('#guest-photo');
  const givenName = g.name.trim().split(/\s+/).pop();
  $('#polaroid-cap').textContent = `${guestName || cap(rel.call)} & ${givenName}`;
  pol.hidden = false;
  $('.message__grid').classList.add('has-photo');
  const mk = () => Object.assign(new Image(), { src: guestPhoto, alt: guestName || 'Ảnh khách mời', decoding: 'async' });
  const img = mk();
  img.onload = () => {
    showPortrait(guestPhoto, guestName || 'Ảnh khách mời');
    $('#env-avatar').replaceChildren(mk());
    $('#env-avatar').hidden = false;
    fx?.refresh?.();
  };
  img.onerror = () => { showPortrait(config.portrait, g.name); pol.hidden = true; $('.message__grid').classList.remove('has-photo'); fx?.refresh?.(); };
  $('.polaroid__img').replaceChildren(img);
}

// ---------- Vòng chữ: ngày lễ ----------
const [dd, mm, yyyy] = c.dateLabel.split('.');
$('#kinetic-date').textContent = `${dd}.${mm}`;
$('#kinetic-meta').textContent = [yyyy, c.timeLabel.split(' ')[0], v.hall].join(' · ');

const words = ['Graduation Ceremony', c.dateLabel, g.name, 'Bách khoa Hà Nội', c.timeLabel, v.hall];
$('#marquee').replaceChildren(...[...words, ...words].map((w) => Object.assign(document.createElement('span'), { textContent: w })));

$('#footer-thanks').textContent = 'Thank you';

// ---------- Hiệu ứng (sau khi nội dung đã điền xong) ----------
let fx = null;
try { fx = initFx(); } catch (err) {
  // Lỗi giữa chừng: gỡ trạng thái ẩn để trang vẫn hiển thị đầy đủ
  console.error('fx', err);
  window.ScrollTrigger?.getAll().forEach((t) => t.kill(true));
  window.gsap?.set('.hero *, .ch, .w, .slide__inner, .slide__shade, #map', { clearProps: 'all' });
  document.documentElement.classList.remove('fx');
}

// ---------- Phong bì ----------
const env = $('#envelope');
$('#open-btn').addEventListener('click', () => {
  fx?.intro();
  env.classList.add('is-open');
  document.body.classList.remove('is-locked');
  setTimeout(() => env.classList.add('is-gone'), 1200);
  revealVisible();
});
if (new URLSearchParams(location.search).has('skip')) $('#open-btn').click();

// ---------- Hiệu ứng xuất hiện ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
function revealVisible() { $$('.reveal').forEach((el) => io.observe(el)); }

// ---------- Lịch ----------
const start = new Date(c.startIso), end = new Date(c.endIso);
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const title = `Lễ tốt nghiệp của ${g.name}`;
const where = `${v.hall}, ${v.university}, ${v.address}`;
$('#gcal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + `&text=${encodeURIComponent(title)}&dates=${stamp(start)}/${stamp(end)}`
  + `&location=${encodeURIComponent(where)}&details=${encodeURIComponent(location.origin + location.pathname)}`;
$('#ics').addEventListener('click', () => {
  const esc = (s) => s.replace(/[,;\\]/g, (m) => '\\' + m);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//grad-invitation//VI', 'BEGIN:VEVENT',
    `UID:${stamp(start)}-grad@invite`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(where)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'le-tot-nghiep.ics',
  });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ---------- Đếm ngược ----------
const pad = (n) => String(n).padStart(2, '0');
const cd = Object.fromEntries($$('[data-cd]').map((el) => [el.dataset.cd, el]));
function tick() {
  const now = Date.now();
  let ms = start - now;
  if (ms <= 0) {
    $('.countdown__grid').hidden = true;
    const done = $('#countdown-done'); done.hidden = false;
    done.textContent = now < end
      ? `Buổi lễ đang diễn ra — ${rel.self} đang chờ ${rel.call} ở ${v.hall}!`
      : `Cảm ơn ${rel.call} đã cùng ${rel.self} đi hết hành trình này.`;
    return;
  }
  const s = Math.floor(ms / 1000);
  cd.d.textContent = pad(Math.floor(s / 86400)); cd.h.textContent = pad(Math.floor(s / 3600) % 24);
  cd.m.textContent = pad(Math.floor(s / 60) % 60); cd.s.textContent = pad(s % 60);
  setTimeout(tick, 1000 - (now % 1000));
}
tick();

// ---------- RSVP ----------
const KEY = 'grad-invite-rsvp';
const thanks = $('#rsvp-thanks'), rsvpBtn = $('#rsvp-btn');
function markDone() {
  rsvpBtn.textContent = 'Đã xác nhận ✓'; rsvpBtn.classList.add('is-done');
  thanks.hidden = false;
  thanks.textContent = `Hẹn gặp ${rel.call} ở ${v.hall} lúc ${c.timeLabel.split(' ')[0]} ngày ${c.dateLabel} nhé!`;
}
try { if (localStorage.getItem(KEY) === '1') markDone(); } catch { /* chế độ ẩn danh */ }
rsvpBtn.addEventListener('click', () => {
  if (config.rsvp.formUrl) {
    const u = new URL(config.rsvp.formUrl);
    if (config.rsvp.nameEntry && guestName) u.searchParams.set(config.rsvp.nameEntry, guestName);
    window.open(u, '_blank', 'noopener');
  }
  try { localStorage.setItem(KEY, '1'); } catch { /* bỏ qua */ }
  markDone();
});
// Liên hệ: số hiển thị dạng 0584 637 826
const prettyPhone = (n) => n.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
const { phone, zalo } = config.contact;
if (phone || zalo) $('#contact').hidden = false;
if (phone) Object.assign($('#call-btn'), { href: `tel:${phone.replace(/\D/g, '')}`, textContent: `Gọi ${prettyPhone(phone)}` });
else $('#call-btn').hidden = true;
if (zalo) Object.assign($('#zalo-btn'), { href: `https://zalo.me/${zalo.replace(/\D/g, '')}`, textContent: `Zalo ${prettyPhone(zalo)}` });
else $('#zalo-btn').hidden = true;

// ---------- Bản đồ 3D (tải khi gần tới) ----------
const mapEl = $('#map');
const mapIo = new IntersectionObserver(async (entries) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  mapIo.disconnect();
  try {
    const { initMap } = await import('./map3d.js');
    initMap({ container: mapEl, rel, hall: v.hall });
  } catch (err) {
    console.error(err);
    $('#map-loading').textContent = 'Không tải được bản đồ 3D — dùng nút Google Maps bên dưới nhé.';
  }
}, { rootMargin: '600px 0px' });
mapIo.observe(mapEl);
