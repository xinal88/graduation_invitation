// Đọc / tạo tham số khách trong URL:
//   ?to=Tên&rel=anh&p=minh.jpg     (p = file trong images/guests/, link https, hoặc @mã ảnh trong Vercel Blob)
//   ?g=minh                        (mã khách khai báo sẵn trong config.guests)
const MAX = 48;
export const GUEST_DIR = 'images/guests/';

export function cleanName(raw) {
  if (!raw) return '';
  let s = raw;
  try { s = decodeURIComponent(raw); } catch { /* đã decode sẵn */ }
  return s.replace(/[^\p{L}\p{M}\p{N} .&'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, MAX);
}

export function cleanPhoto(raw) {
  const s = (raw || '').trim();
  if (!s) return '';
  if (/^https:\/\/[^\s"'<>()]+$/i.test(s)) return s;
  if (/^@[\w-]+\.(jpe?g|png|webp)$/i.test(s)) return `api/photo?p=${encodeURIComponent('guests/' + s.slice(1))}`; // ảnh trong kho Blob private
  if (!/^[\w-][\w.-]*$/.test(s)) return '';            // chỉ tên file, không có thư mục
  return GUEST_DIR + (/\.[a-z0-9]{3,4}$/i.test(s) ? s : `${s}.jpg`);
}

export function readGuest(search, guests = {}) {
  const p = new URLSearchParams(search);
  const code = (p.get('g') || '').toLowerCase();
  const preset = Object.prototype.hasOwnProperty.call(guests, code) ? guests[code] : {};
  return {
    name: cleanName(p.get('to')) || cleanName(preset.name),
    rel: (p.get('rel') || preset.rel || '').toLowerCase(),
    photo: cleanPhoto(p.get('p')) || cleanPhoto(preset.photo),
  };
}

export function buildLink(base, name, rel, photo) {
  const u = new URL(base);
  u.search = '';
  if (name) u.searchParams.set('to', name.trim());
  if (rel) u.searchParams.set('rel', rel);
  if (photo) u.searchParams.set('p', photo.trim());
  return u.toString();
}
