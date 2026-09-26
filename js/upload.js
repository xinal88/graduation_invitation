// Thu nhỏ ảnh ngay trên trình duyệt rồi gửi lên /api/upload (Vercel Blob).
const MAX_SIDE = 1200;

export async function resizeImage(file, max = MAX_SIDE, quality = 0.85) {
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    src = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không đọc được ảnh — hãy chọn ảnh JPG hoặc PNG.'));
      img.src = URL.createObjectURL(file);
    });
  }
  const k = Math.min(1, max / Math.max(src.width, src.height));
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.round(src.width * k), height: Math.round(src.height * k),
  });
  canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob(
    (b) => (b ? resolve(b) : reject(new Error('Không nén được ảnh.'))), 'image/jpeg', quality,
  ));
}

export async function uploadPhoto(file, { name = '', password = '' } = {}) {
  if (!password) throw new Error('Nhập mật khẩu upload trước.');
  const body = await resizeImage(file);
  const endpoint = new URL(`api/upload?name=${encodeURIComponent(name)}`, new URL('./', location.href));
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream', 'x-upload-password': encodeURIComponent(password) },
      body,
    });
  } catch {
    throw new Error('Không kết nối được máy chủ upload.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* không phải JSON */ }
  if (!res.ok) {
    if (res.status === 404 || res.status === 501) throw new Error('Chưa có API upload — tính năng này chỉ chạy trên bản đã deploy lên Vercel.');
    throw new Error(data.error || `Upload lỗi (${res.status}).`);
  }
  return data.url;
}
