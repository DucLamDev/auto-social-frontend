# Nhật ký thay đổi

Mỗi lần sửa (mỗi Pull Request): tăng VERSION (sửa lỗi → số cuối, tính năng → số giữa) và thêm đúng một mục mới ở đầu
danh sách, theo mẫu bên dưới. Hàng chờ gộp tự đổi sang số kế tiếp khi hai nhánh cùng lấy một số.

## 1.4.1 · 03/11/2026
### Sửa lỗi
- Bỏ ô "Google dùng chung" trong hộp Nhập file tài khoản
  Các social trong một file thường dùng nhiều tài khoản Google khác nhau, nên ba ô email / mật khẩu / khoá TOTP Google
  dùng chung bị gỡ. Mỗi dòng dùng đúng email, mật khẩu và 2FA của chính dòng đó (hướng dẫn ghi ngay trong hộp). Cần
  backend 1.6.1.
- Lọc "Cần thao tác" không còn lẫn tài khoản đã đăng nhập thành công
  Tài khoản đăng nhập được nhưng chưa cấu hình nơi đăng chỉ hiện ở lọc "Đã đăng nhập · chưa cấu hình đăng".

## 1.4.0 · 03/11/2026
### Tính năng
- Chọn "VPSTTT AI" (AI API của IDE công ty) khi tạo bài
  Studio và hộp Tạo tự động có thêm lựa chọn VPSTTT AI, dùng tài khoản Claude/Codex công ty cấp qua AI API của IDE.
  Lựa chọn chỉ bật khi backend đã cấu hình địa chỉ và key của AI API. Khi key bị từ chối (sai key, IP máy chủ chưa được
  cho phép) hoặc yêu cầu bị từ chối (model chưa được cấp, nội dung quá dài), trang báo rõ cần kiểm tra gì. Cần backend
  bản 1.3.0 trở lên.

## 1.3.0 · 02/11/2026
### Tính năng
- Ô "Mật khẩu Google" và "Khoá TOTP Google" trong hộp "Nhập file tài khoản"
  Điền cùng email Google dùng chung để tiện ích tự đăng nhập Google và tự điền mã 2 bước cho mọi tài khoản đăng nhập
  bằng Google đó. Khoá TOTP là khoá thiết lập hoặc chuỗi otpauth:// (lấy từ phần sao lưu/xuất của Authenticator); dán
  nhầm mã 6 số sẽ được báo ngay. Hai ô xoá trắng sau khi nhập hoặc khi đóng hộp, không hiển thị lại. Cần backend bản có
  googlePassword/googleTotpSecret.

## 1.2.0 · 31/10/2026
### Tính năng
- Nút "Nhập file cấu hình API" trên trang Tài khoản (chỉ ADMIN)
  Tải file mẫu, điền mỗi dòng một tài khoản dev.to, Mastodon, Bluesky, Discord, Discourse hoặc WordPress kèm khoá,
  rồi bấm "Nhập & kiểm tra". Kết quả hiện theo từng dòng: đã kết nối, khoá sai, dòng thiếu thông tin, trùng dòng…
  kèm lý do. Dòng Instagram, Threads, Blogger, LinkedIn, Tumblr có sẵn nút "Kết nối" để đăng nhập một lần. Cần
  backend bản có API import-api.

## 1.1.0 · 21/10/2026
### Tính năng
- Nút "Kết nối" Instagram, Threads (và LinkedIn, Google · Blogger) trên trang Tài khoản
  Đăng nhập một lần; tài khoản lỗi có nút "Kết nối lại" ngay trên dòng. Lỗi OAuth hiện thông báo tiếng Việt rõ lý do.
- Bảng "Cần xử lý" trên Dashboard và chuông có đếm số
  Hiện tài khoản cần kết nối lại, token sắp hết hạn, bài cần thao tác / thất bại / có thể trùng.
- Nút "Kiểm tra tất cả" trên trang Tài khoản: gia hạn token đến hạn và kiểm tra kết nối ngay.
- Nút Kết nối Tumblr; công tắc Đăng ngay / Lưu nháp cho tài khoản Blogger và Tumblr.
- Tiện ích Chrome: khung ghép nối Chrome trên trang Tài khoản (tạo mã, xem Chrome nào đang chạy, thu hồi), nút
  Tiện ích trên từng dòng diễn đàn để bật đăng bằng Chrome, trạng thái "Chờ tiện ích Chrome" / "Tiện ích cần bạn" và
  nút Giao lại cho tiện ích trên trang Publishing; Dashboard báo khi có bài chờ mà Chrome chưa chạy.
- Form Bluesky nhận Handle + App Password (không hết hạn) thay cho Access JWT 2 giờ.
### Sửa lỗi
- Sửa cảnh báo hydration của Dashboard (thẻ div nằm trong thẻ p).

## 1.0.0 · 21/10/2026
### Bảo trì
- Bắt đầu đánh số phiên bản
  Từ bản này mỗi lần gộp có một số phiên bản và ghi thay đổi ở đây.
