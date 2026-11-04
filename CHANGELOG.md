# Nhật ký thay đổi

Mỗi lần sửa (mỗi Pull Request): tăng VERSION (sửa lỗi → số cuối, tính năng → số giữa) và thêm đúng một mục mới ở đầu
danh sách, theo mẫu bên dưới. Hàng chờ gộp tự đổi sang số kế tiếp khi hai nhánh cùng lấy một số.

## 1.9.0 · 03/11/2026
### Tính năng
- Xem trước bài như khi đăng lên từng mạng xã hội (cần backend 1.10.0)
  Khung Review trong Content đợi duyệt có nút "Xem trước như trên mạng xã hội": mỗi kênh hiện bài dạng trang thật của nó
  (bài ngắn kiểu Mastodon / Bluesky / LinkedIn, ảnh kiểu Pixelfed, chủ đề diễn đàn, câu hỏi Stack Overflow, bài viết dài
  kiểu Medium / dev.to) với tên tài khoản, ảnh kèm, tag và số ký tự so với giới hạn của kênh. Nội dung lấy từ máy chủ,
  đúng như sẽ gửi đi (Markdown đã đổi, hashtag đã đặt), kể cả phần đang sửa chưa lưu. Đây là bản mô phỏng.
### Cải tiến
- Nút duyệt luôn thấy khi cuộn
  Duyệt đăng ngay, Hẹn lịch, Từ chối và Edit nội dung nằm trên một thanh bám đáy màn hình suốt lúc xem các kênh, kèm số
  kênh AI đề nghị kiểm tra; nút mở khung đổi thành "Review & duyệt" khi lượt chờ duyệt.
- Ghi đúng dịch vụ tạo ảnh (VPSTTT AI hoặc GPT Image của OpenAI) trong hộp tạo nội dung và khung ảnh.

## 1.8.0 · 03/11/2026
### Tính năng
- Xem tiến độ AI tạo nội dung theo từng kênh và review trước các kênh đã xong (cần backend 1.9.0)
  Trong Content đợi duyệt, lượt đang tạo hiện "Đã tạo X/Y kênh", thanh tiến độ và từng kênh (logo, tài khoản, Đã tạo /
  AI đang viết / Chờ tới lượt). Nút "Xem N kênh đã tạo" mở ngay các kênh đã xong để đọc và sửa trong lúc AI viết tiếp.
  Duyệt, hẹn lịch hay từ chối vẫn chờ AI tạo xong tất cả. Lượt bị lỗi cho biết kênh nào chưa tạo được.

## 1.7.0 · 03/11/2026
### Tính năng
- Cấu hình đăng daily.dev bằng tiện ích Chrome (cần backend 1.8.0)
  Hộp **Tiện ích** của tài khoản daily.dev có luồng "daily.dev · hồ sơ cá nhân", điền sẵn trang tạo bài
  `https://daily.dev/squads/create`; bài đăng lên hồ sơ daily.dev đang đăng nhập (chưa hỗ trợ đăng vào Squad).

## 1.6.1 · 03/11/2026
### Sửa lỗi
- Nút Test, Kiểm tra tất cả và bật tài khoản tự đăng nhập khi Chrome chưa có phiên (cần backend 1.7.1)
  Trước đây các nút này chỉ xem Chrome đã đăng nhập sẵn chưa: trên Chrome mới (ví dụ Chrome trên VPS) tab mở 2–3 giây
  rồi đóng, báo "Lượt kiểm tra này không thử mật khẩu hoặc mã 2FA". Nay chúng chạy như Test đăng nhập hàng loạt: thử
  mật khẩu đã lưu rồi Google, mỗi cách một lần. "Tôi đã đăng nhập · Kiểm tra" trong Hướng dẫn kết nối vẫn chỉ xem
  phiên, dành cho lúc bạn vừa đăng nhập tay.

## 1.6.0 · 03/11/2026
### Tính năng
- Công tắc "AI tạo ảnh cho kênh cần ảnh" trong hộp Tạo nội dung AI chạy ngầm (cần backend 1.7.0)
  Mặc định bật khi máy chủ đã cấu hình tạo ảnh bằng VPSTTT AI; khoá kèm lý do khi chưa cấu hình. Bật công tắc thì Pixelfed
  không còn bắt buộc tự tải ảnh. Ảnh bạn tải lên được dùng thay ảnh AI cho mọi kênh hỗ trợ ảnh.
- Ảnh của từng kênh trong tab Content đợi duyệt
  Mỗi bài hiện ảnh kèm mô tả ảnh, hoặc ghi rõ "Kênh này chỉ đăng chữ". Khi bài còn là bản nháp có thể tạo lại ảnh (sửa được
  mô tả cho AI), bỏ ảnh hoặc tải ảnh khác. Hiện tiến độ khi AI đang tạo ảnh và lý do khi tạo ảnh lỗi.
## 1.5.0 · 03/11/2026
### Tính năng
- Logo của từng mạng xã hội thay cho ô chữ cái
  Ô nền tảng ở trang Tài khoản, Chiến dịch, Publishing, Nhật ký, Bài đã đăng, Studio và Prompt hiện logo thật của
  mạng xã hội (daily.dev, Tumblr, Hugging Face, Bluesky, Reddit, Medium, dev.to, Stack Overflow, diễn đàn NGINX,
  Caddy, MongoDB…). Nền tảng chưa có logo (LinkedIn, Tinhte, Voz, KubeBy, Level1Techs…) vẫn dùng ô chữ cái như cũ.
- Hiện số lượng tài khoản theo từng trạng thái và từng nền tảng
  Trang Tài khoản có hàng thẻ đếm Tất cả / Đã kết nối / Cần thao tác / Đã đăng nhập / Đang kết nối; bấm thẻ là lọc
  ngay. Ô lọc trạng thái, ô lọc nền tảng và ô phạm vi ghi kèm số tài khoản, số đổi theo các bộ lọc còn lại và ô tìm.
  Nền tảng đang có tài khoản được đưa lên đầu danh sách lọc. Khi bộ lọc không khớp tài khoản nào, trang báo rõ và có
  nút Bỏ lọc thay vì báo "Chưa có tài khoản".

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
