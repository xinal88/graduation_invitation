# Thiệp mời Lễ Tốt Nghiệp · HUST

Trang tĩnh (HTML/CSS/JS thuần, không cần build). Phong cách theo template studio.site (nền vàng chanh `#e1ff00`, chữ đen `#1a1a1a`, serif nghiêng); bố cục nội dung tham khảo thiệp của Trung.

## Chạy thử

```bash
cd grad-invitation
python3 serve.py        # như http.server nhưng tắt cache, sửa file xong chỉ cần F5
# mở http://localhost:8000/?to=Anh%20Minh&rel=anh
```

Phải chạy qua server (ES module không chạy khi mở file trực tiếp bằng `file://`).

## Sửa nội dung

> Sau khi sửa file trong `css/` hoặc `js/`, chạy `python3 tools/bump_version.py` trước khi deploy, để khách không bị kẹt bản cũ trong cache trình duyệt.

Chỉ cần sửa **`js/config.js`**: họ tên, ngày giờ, Google Form, số điện thoại, ảnh, lời nhắn.
Ảnh chân dung và ảnh kỷ niệm đặt vào `images/` rồi điền đường dẫn vào `portrait` / `photos`.

## Link riêng cho từng khách

```
https://<site>/?to=Tên khách&rel=<mã quan hệ>
```

| rel | Lời mời | Gọi khách | Tự xưng |
|---|---|---|---|
| *(trống)* | Trân trọng kính mời | bạn | mình |
| `ban` / `cau` | Mời | bạn / cậu | mình / tớ |
| `anh` / `chi` | Em kính mời | anh / chị | em |
| `em` | Mời | em | `selfToYounger` trong config |
| `bome` / `ongba` | Con / Cháu kính mời | Bố Mẹ / Ông Bà | con / cháu |
| `giadinh` | Em kính mời | cả nhà | em |
| `thay` / `co` | Em trân trọng kính mời | Thầy / Cô | em |

### Ảnh riêng cho từng khách

**Cách khuyên dùng — upload từ trang tạo link (không cần push, ảnh không vào GitHub):**

1. Trên Vercel: project → **Storage → Create → Blob** → gắn vào project (tự sinh `BLOB_READ_WRITE_TOKEN`).
2. **Settings → Environment Variables** → thêm `UPLOAD_PASSWORD` = mật khẩu tuỳ ý → **Redeploy**.
3. Mở `/tao-link.html`, nhập mật khẩu, bấm **Chọn ảnh** cho từng khách. Ảnh được thu nhỏ còn ~1200 px rồi lưu vào Vercel Blob với URL ngẫu nhiên; link thư mời tự kèm ảnh.

Code: `api/upload.js` (hàm Vercel) + `js/upload.js` (thu nhỏ & gửi ảnh). Chỉ chạy trên bản đã deploy, không chạy với `serve.py`.

**Cách thủ công:**

1. Đặt ảnh vào `images/guests/` (ảnh dọc, khoảng 800×1000 px), ví dụ `minh.jpg`.
2. Thêm `&p=minh.jpg` vào link: `?to=Anh Minh&rel=anh&p=minh.jpg`. Cũng có thể dùng thẳng một link ảnh `https://…`.
3. Hoặc khai báo trong `guests` của `config.js` để dùng link ngắn `?g=minh`, không lộ tên và tên file trên URL.

Ảnh sẽ hiện tròn trên phong bì và thành tấm polaroid 3D trong phần Lời nhắn. Không có ảnh thì phần này tự ẩn. Xem thử với ảnh mẫu: `?to=Anh%20Minh&rel=anh&p=demo.jpg`.

Mở **`/tao-link.html`** trên site đã deploy để tạo link hàng loạt: dán danh sách `Tên | rel | ảnh`, bấm copy link hoặc copy nguyên tin nhắn.
Thêm `&skip` vào link để bỏ qua màn phong bì (tiện khi chỉnh sửa).

## Hiệu ứng (`js/fx.js`)

GSAP + ScrollTrigger + SplitText + Lenis, nạp từ CDN:

- Khi mở thiệp: tiêu đề lật 3D từng ký tự, ảnh chân dung được vén lên.
- Hero đứng yên và lùi sâu vào trong (3D), các lớp phía sau trượt đè lên như slide.
- Vòng chữ 3D xoay theo cuộn quanh ngày lễ; các số ngày tháng bay vào lần lượt.
- Lời nhắn và Thông tin là các slide xếp chồng: slide trước lùi xuống và tối dần khi slide sau đè lên.
- Tiêu đề section lật chữ và có gạch chân chạy; lời nhắn sáng dần theo từng từ; số lớn và đồng hồ đếm ngược lật như bảng ga tàu.
- Bản đồ mở rộng dần khi cuộn tới; câu hỏi RSVP lật từng từ; chữ "Thank you" nhảy sóng.
- Cuộn mượt, thanh tiến trình, và con trỏ tuỳ biến trên máy tính.

Nếu CDN lỗi hoặc máy bật "giảm chuyển động", trang tự quay về hiệu ứng cơ bản.

## Bản đồ 3D

- `js/map3d.js` — cảnh three.js: toà nhà đùn khối từ footprint OpenStreetMap thật, C2 được làm nổi bật, 5 tuyến đường (xe máy → Bãi D3-5 / Bãi D4 / Hầm B7 / Nhà xe B1 sau Highlands, ô tô → Cổng Giải Phóng) có hiệu ứng vẽ dần, camera bay theo từng tuyến, chạm vào toà nhà để xem tên, nút toàn màn hình. Trên điện thoại, bản đồ bị khoá cho tới khi chạm vào, để không cản cuộn trang.
- `js/campus-data.js`, `js/campus-routes.js` — sinh tự động bởi `tools/fetch_osm.sh` (tải OSM → `build_campus.py` → `routes.py`, tuyến tính bằng Dijkstra trên mạng đường thật).
- Vị trí bãi xe, cổng, nhãn nằm trong `PLACES` ở đầu `map3d.js`; điểm đầu/cuối tuyến nằm trong `tools/routes.py`.

## Deploy

**Vercel:** `npx vercel --prod` trong thư mục này, hoặc kéo thả thư mục vào vercel.com/new.
**GitHub Pages / Netlify:** đẩy nguyên thư mục lên là chạy.

Sau khi có domain, sửa `og:image` trong `index.html` thành URL tuyệt đối (vd. `https://<site>/images/og.jpg`) để Messenger/Zalo hiện ảnh preview.

Dữ liệu bản đồ © OpenStreetMap contributors (ODbL).
