// GET /api/photo?p=guests/<tên-file> — phục vụ ảnh khách từ kho Vercel Blob private.
// Chỉ đọc được đúng file đã biết tên (tên có đuôi ngẫu nhiên); không liệt kê được kho.
import { get } from '@vercel/blob';
import { blobToken } from './_blob.js';

const SAFE = /^guests\/[\w-]+\.(jpe?g|png|webp)$/i;

export async function GET(request) {
  const p = new URL(request.url).searchParams.get('p') || '';
  if (!SAFE.test(p)) return new Response('Bad request', { status: 400 });

  try {
    const res = await get(p, { access: 'private', token: blobToken() || undefined, ifNoneMatch: request.headers.get('if-none-match') || undefined });
    if (!res) return new Response('Not found', { status: 404 });
    const cache = 'public, max-age=86400, s-maxage=2592000, immutable';
    if (res.statusCode === 304) return new Response(null, { status: 304, headers: { 'cache-control': cache } });
    return new Response(res.stream, {
      headers: {
        'content-type': res.blob.contentType,
        'cache-control': cache,
        etag: res.blob.etag,
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response('Not found', { status: 404 });
  }
}
