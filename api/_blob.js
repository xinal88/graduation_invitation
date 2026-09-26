// Dùng chung cho các hàm trong api/ (file bắt đầu bằng _ không thành endpoint).
// Token của kho Blob: tên mặc định, hoặc tên có tiền tố khi Vercel gắn kho với prefix tuỳ chỉnh
export function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => /BLOB.*READ_WRITE_TOKEN$/i.test(k));
  return key ? process.env[key] : '';
}
