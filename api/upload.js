// POST /api/upload — nhận 1 ảnh (đã thu nhỏ ở trình duyệt), lưu vào Vercel Blob, trả về URL công khai.
// Cần trên Vercel: Storage → Blob gắn vào project (tự có BLOB_READ_WRITE_TOKEN) và biến UPLOAD_PASSWORD.
import { put } from '@vercel/blob';
import { timingSafeEqual, createHash } from 'node:crypto';

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// So sánh mật khẩu không lộ thời gian (băm trước để hai chuỗi cùng độ dài)
const samePassword = (a, b) => timingSafeEqual(
  createHash('sha256').update(String(a)).digest(),
  createHash('sha256').update(String(b)).digest(),
);

// Kiểm tra "chữ ký" đầu file để chắc đúng là ảnh
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const slug = (s) => (s || 'khach').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'khach';

export async function POST(request) {
  const expected = process.env.UPLOAD_PASSWORD;
  if (!expected) return json(500, { error: 'Chưa đặt biến UPLOAD_PASSWORD trên Vercel.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(500, { error: 'Chưa gắn Vercel Blob vào project (Storage → Blob).' });
  let given = request.headers.get('x-upload-password') || '';
  try { given = decodeURIComponent(given); } catch { /* giữ nguyên */ }
  if (!samePassword(given, expected)) {
    return json(401, { error: 'Sai mật khẩu upload.' });
  }

  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BYTES) return json(413, { error: 'Ảnh quá lớn (tối đa 4 MB).' });
  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return json(413, { error: 'Ảnh rỗng hoặc quá lớn.' });
  const type = sniff(buf);
  if (!type) return json(415, { error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.' });

  const name = slug(new URL(request.url).searchParams.get('name'));
  try {
    const blob = await put(`guests/${name}.${TYPES[type]}`, buf, {
      access: 'public',
      addRandomSuffix: true,          // URL ngẫu nhiên, không đoán được
      contentType: type,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    return json(200, { url: blob.url });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Lưu ảnh thất bại: ' + (err && err.message ? err.message : 'không rõ lỗi') });
  }
}

export function GET() {
  return json(405, { error: 'Dùng POST để upload ảnh.' });
}
