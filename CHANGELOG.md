# Nhật ký thay đổi

Mỗi lần sửa (mỗi Pull Request): tăng VERSION (sửa lỗi → số cuối, tính năng → số giữa) và thêm đúng một mục mới ở đầu
danh sách, theo mẫu bên dưới. Hàng chờ gộp tự đổi sang số kế tiếp khi hai nhánh cùng lấy một số.

## 1.1.0 · 21/10/2026
### Tính năng
- Nút "Kết nối" Instagram, Threads (và LinkedIn, Google · Blogger) trên trang Tài khoản
  Đăng nhập một lần; tài khoản lỗi có nút "Kết nối lại" ngay trên dòng. Lỗi OAuth hiện thông báo tiếng Việt rõ lý do.
- Bảng "Cần xử lý" trên Dashboard và chuông có đếm số
  Hiện tài khoản cần kết nối lại, token sắp hết hạn, bài cần thao tác / thất bại / có thể trùng.
- Nút "Kiểm tra tất cả" trên trang Tài khoản: gia hạn token đến hạn và kiểm tra kết nối ngay.
- Nút Kết nối Tumblr; công tắc Đăng ngay / Lưu nháp cho tài khoản Blogger và Tumblr.
- Form Bluesky nhận Handle + App Password (không hết hạn) thay cho Access JWT 2 giờ.
### Sửa lỗi
- Sửa cảnh báo hydration của Dashboard (thẻ div nằm trong thẻ p).

## 1.0.0 · 21/10/2026
### Bảo trì
- Bắt đầu đánh số phiên bản
  Từ bản này mỗi lần gộp có một số phiên bản và ghi thay đổi ở đây.
