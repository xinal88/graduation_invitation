// ============================================================
//  CẤU HÌNH THIỆP — chỉ cần sửa file này.
// ============================================================
export default {
  graduate: {
    name: 'Bùi Quý',               // TODO: điền họ tên đầy đủ
    degree: '',                    // vd. 'Kỹ sư', 'Cử nhân' — để trống sẽ ẩn
    major: '',                     // vd. 'Khoa học Máy tính' — để trống sẽ ẩn
    // Cách tự xưng khi mời người nhỏ tuổi hơn (rel=em): 'anh', 'chị' hoặc 'mình'
    selfToYounger: 'mình',
  },

  ceremony: {
    // Giờ Việt Nam (+07:00). Sửa nếu ca lễ của bạn khác.
    startIso: '2026-09-27T09:30:00+07:00',
    endIso: '2026-09-27T11:30:00+07:00',
    dateLabel: '27.09.2026',
    weekdayLabel: 'Chủ nhật',
    timeLabel: '9:30 — 11:30',
  },

  venue: {
    hall: 'Nhà C2',
    university: 'Đại học Bách khoa Hà Nội',
    address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    mapUrl: 'https://maps.app.goo.gl/F8J8hEprdyqrMLxn7',
  },

  rsvp: {
    // Google Form (tuỳ chọn). Để trống thì nút chỉ lưu xác nhận trên máy khách.
    formUrl: '',
    // Tuỳ chọn: id ô "Họ tên" trong form để điền sẵn tên khách, vd. 'entry.123456789'
    nameEntry: '',
  },

  contact: {
    phone: '0328165088',   // hiện nút Gọi & Zalo; để trống sẽ ẩn
  },

  // Ảnh (đặt vào thư mục images/). Để trống sẽ ẩn phần ảnh.
  portrait: '',       // vd. 'images/portrait.jpg'
  photos: [],         // vd. ['images/1.jpg', 'images/2.jpg', 'images/3.jpg']

  // Lời nhắn chính. {self} = cách tự xưng, {call} = cách gọi khách.
  message:
    'Sau những năm tháng miệt mài trên giảng đường Bách khoa, {self} sắp chính thức khép lại hành trình sinh viên. ' +
    'Sẽ thật ý nghĩa nếu có {call} ở bên trong khoảnh khắc đáng nhớ này.',

  // Ghi chú hiện dưới câu hỏi xác nhận tham dự. Để trống sẽ ẩn.
  note: 'Không cần quà, chỉ cần tấm ảnh chụp chung',

  // Khách khai báo sẵn → link ngắn ?g=<mã>. Ảnh đặt trong images/guests/.
  // Không khai báo cũng được: dùng ?to=Tên&rel=anh&p=minh.jpg
  guests: {
    // minh: { name: 'Anh Minh', rel: 'anh', photo: 'minh.jpg' },
    // bome: { name: 'Bố Mẹ', rel: 'bome', photo: 'bome.jpg' },
  },
};

// Quan hệ dùng trong link: ?to=Tên&rel=anh
// greet: lời mời · call: cách gọi khách · self: cách tự xưng
export const relations = {
  ban:     { label: 'Bạn bè',        greet: 'Mời',                    call: 'bạn',   self: 'mình' },
  cau:     { label: 'Bạn thân',      greet: 'Mời',                    call: 'cậu',   self: 'tớ' },
  anh:     { label: 'Anh',           greet: 'Em kính mời',            call: 'anh',   self: 'em' },
  chi:     { label: 'Chị',           greet: 'Em kính mời',            call: 'chị',   self: 'em' },
  em:      { label: 'Em',            greet: 'Mời',                    call: 'em',    self: null },   // self lấy từ selfToYounger
  bome:    { label: 'Bố Mẹ',         greet: 'Con kính mời',           call: 'Bố Mẹ', self: 'con' },
  ongba:   { label: 'Ông Bà',        greet: 'Cháu kính mời',          call: 'Ông Bà', self: 'cháu' },
  giadinh: { label: 'Gia đình',      greet: 'Em kính mời',            call: 'cả nhà', self: 'em' },
  thay:    { label: 'Thầy',          greet: 'Em trân trọng kính mời', call: 'Thầy',  self: 'em' },
  co:      { label: 'Cô',            greet: 'Em trân trọng kính mời', call: 'Cô',    self: 'em' },
};

export const defaultRelation = { label: 'Mặc định', greet: 'Trân trọng kính mời', call: 'bạn', self: 'mình' };
