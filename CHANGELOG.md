# Nhật ký thay đổi

Mỗi lần sửa (mỗi Pull Request): tăng VERSION (sửa lỗi → số cuối, tính năng → số giữa) và thêm đúng một mục mới ở đầu
danh sách, theo mẫu bên dưới. Hàng chờ gộp tự đổi sang số kế tiếp khi hai nhánh cùng lấy một số.

## 1.19.0 · 04/11/2026
### Tính năng
- Logo VPSTTT thay chữ "S" ở thanh menu bên trái và trang đăng nhập, và thay hình tam giác mặc định ở tab trình duyệt.
- Thêm logo cho 15 nền tảng trước đây chỉ hiện chữ cái: LinkedIn, AWS Community, Tinhte, Voz, discuit, DZone, Differ,
  Level1Techs, Scoop.it, DirectAdmin Forums, Warrior Forum, Eventbrite, HestiaCP, aaPanel, CloudPanel. Logo lấy từ biểu
  tượng trên trang của chính nền tảng (LinkedIn, AWS lấy từ Wikimedia Commons), lưu sẵn trong ứng dụng nên không tải ảnh
  từ trang ngoài. Hub (danh mục chưa có địa chỉ trang) và KubeBy (tên miền không còn hoạt động) vẫn hiện chữ cái.

## 1.18.0 · 04/11/2026
### Tính năng
- Sửa bài theo khuyến nghị của AI ngay trong khung ghi chú
  Cần backend 1.16.0 trở lên. Ở trang Content đợi duyệt, khung vàng "AI đề nghị kiểm tra" nay:
  - tách ghi chú thành từng khuyến nghị, mỗi mục một dòng có ô tick (mặc định tick hết);
  - có nút "Sửa theo N khuyến nghị đã chọn": AI viết lại bài chỉ theo các mục còn tick rồi chấm lại, thường 1–3 phút.
    Bỏ tick mục bạn không đồng ý, ví dụ muốn giữ câu giới thiệu thương hiệu;
  - nút khoá khi bài đang được sửa tay chưa lưu, hoặc không còn mục nào được tick, kèm lời nhắc;
  - người chỉ có quyền xem, bài đã duyệt hoặc bài đang được AI viết lại thì chỉ thấy danh sách, không có ô tick và nút.
  Khi đang viết lại, bài hiện "AI đang viết lại bài này theo N khuyến nghị đã chọn". Nút "Viết lại bằng AI" kèm hướng
  dẫn tự gõ vẫn giữ như cũ.

## 1.17.0 · 04/11/2026
### Tính năng
- Trang Tài khoản chia 2 tab, bỏ trang Nền tảng (cần backend 1.15.0)
  - Tab **Đăng bằng tiện ích Chrome** gồm: Chrome đã ghép nối, **Thêm social**, **Nhập file tài khoản**, **Kết nối /
    cấu hình** (luồng Chrome). Tab **Đăng qua API** gồm: **Kết nối tài khoản API** (OAuth, API key, Playwright, bàn
    giao thủ công), **Nhập file cấu hình API**. Tab đang mở được giữ trên địa chỉ (`?tab=api`).
  - Mỗi tab có nút **Tạo nội dung hàng loạt & đăng**, mở hộp tạo bài AI và chọn sẵn tài khoản sẵn sàng của tab đó; vẫn
    tích thêm được tài khoản của tab kia. Tài khoản API luôn có trong hộp tạo bài, kể cả khi đã chọn một nhóm tài khoản
    Chrome lúc nhập file.
  - Trang Nền tảng bỏ khỏi menu; địa chỉ cũ `/platforms` chuyển sang tab API. Không cần bật nền tảng bằng tay nữa:
    thêm tài khoản cho nền tảng đang tắt thì hệ thống tự bật.
- **Thêm social**: thêm từng social vào luồng đăng bằng tiện ích, giống một dòng trong file tài khoản. Chỉ social đó được
  Chrome đăng nhập thử; các social đang chạy giữ nguyên. Hộp hiện hướng dẫn của luồng và trang đăng mặc định.
- Nhập lại file tài khoản báo rõ "bỏ qua N social đã có không đổi"; chỉ social mới (hoặc đổi tài khoản đăng nhập) được
  đăng nhập lại.
- Cột **Kiểu kết nối** nói rõ vì sao tài khoản đã đăng nhập chưa đăng được: "Bấm Test để tự kết nối", "Cần chọn trang
  đăng · bấm Tiện ích", hoặc "Chưa đăng tự động được: …" (kênh chưa có luồng đăng, công tắc bị khoá).

### Gỡ bỏ
- Bỏ 2 nút **Kiểm tra tất cả** và **Test đăng nhập hàng loạt**: bấm nhầm là Chrome đăng nhập lại cả loạt. Kiểm tra từng
  tài khoản bằng nút **Test** ở dòng của tài khoản đó.

## 1.16.0 · 04/11/2026
### Tính năng
- Thiết kế lại thẻ bài ở trang Content đợi duyệt: nhìn là biết nút nào của bài nào
  - Mỗi bài là một thẻ riêng, nền trắng trên vùng xám, có viền màu bên trái theo trạng thái (vàng: chờ duyệt, xanh:
    đã duyệt, xám: đã từ chối). Đầu thẻ có logo nền tảng, tên kênh, "Bài 3/13", tài khoản sẽ đăng, điểm AI và
    trạng thái.
  - Nút quyết định của từng bài ("Từ chối", "Hẹn lịch", "Duyệt & đăng") chuyển xuống cuối thẻ, kèm logo và dòng
    "Bài <tên kênh>". Đọc xong bài là quyết định ngay ở đó. Trong mỗi thẻ chỉ còn nút này có nền màu; "Viết lại bằng AI",
    "Tạo ảnh bằng AI" chuyển sang kiểu viền.
  - Nút "Edit nội dung" chung bị bỏ. Mỗi bài có nút "Sửa bài" riêng, lúc sửa có "Lưu bài này" và "Huỷ sửa" (bỏ phần
    vừa gõ). Sửa bài này không mở khoá bài khác. Duyệt vẫn tự lưu phần đã sửa như trước.
  - Ghi chú dài của AI chỉ hiện 3 dòng, bấm "Xem đủ ghi chú" để đọc hết.
  - Đầu danh sách có hàng "Đi tới bài của từng kênh": mỗi kênh một nút kèm chấm trạng thái, bấm là cuộn tới bài đó.
  - Thanh dưới cùng ghi rõ "Cả lượt · N bài" và đổi sang nền tím nhạt, để phân biệt với nút của từng bài.
- Chế độ "Xem trước như trên mạng xã hội" vẫn tạo được ảnh
  Trước đây bật xem trước thì khung ảnh và các nút "Tạo ảnh bằng AI", "Tạo lại ảnh", "Tải ảnh lên", "Bỏ ảnh" biến mất.
  Nay các nút này nằm ngay dưới bản xem trước; ảnh mới tạo hiện thẳng trong bản xem trước.

## 1.15.0 · 04/11/2026
### Tính năng
- Duyệt & đăng các bài từ N điểm AI, bài đã duyệt được thu gọn
  - Thanh duyệt ở Content đợi duyệt có ô điểm (mặc định 7, chỉnh từ 1 đến 10; trình duyệt nhớ lựa chọn) và nút
    **Duyệt & đăng bài từ N điểm (số bài)**.
  - Nút duyệt lần lượt các bài đã sẵn sàng có điểm AI từ N trở lên. Bài chưa được AI chấm, đang tạo ảnh hoặc đang được
    viết lại thì bỏ qua. Bài nào lỗi thì báo riêng, không làm dừng các bài khác.
  - Bài đã duyệt chỉ còn một dòng "Đã duyệt…", bấm **Xem nội dung** để mở lại.

## 1.14.0 · 04/11/2026
### Tính năng
- Viết lại bài bằng AI ngay trên từng bài (cần backend 1.13.0)
  - Mỗi bài trong Content đợi duyệt có nhãn **AI chấm X/10** và nút **Viết lại bằng AI**, nổi bật với bài AI đề nghị
    kiểm tra.
  - Ô hướng dẫn cho AI là tuỳ chọn; AI tự đọc ghi chú của lần chấm trước. Bài mới thay bài hiện tại và được chấm lại.
  - Trong 1–3 phút AI viết lại, bài hiện "AI đang viết lại…" và khoá nút duyệt, hẹn lịch, sửa của bài đó để không đăng
    nhầm bản cũ. Lỗi thì hiện lý do.
  - Đang có phần sửa chưa lưu thì phải lưu hoặc bỏ trước khi viết lại.
- Tạo ảnh bằng AI cho bài chưa có ảnh
  - Bài chưa có ảnh có nút **Tạo ảnh bằng AI**: một lần bấm, AI tự thiết kế ảnh từ nội dung bài rồi tạo. Không phải
    chọn tệp từ máy; nút **Tải ảnh lên** vẫn còn nếu bạn muốn.
  - **Tạo lại ảnh** nay cho để trống mô tả để AI tự thiết kế.

## 1.13.0 · 04/11/2026
### Tính năng
- Gộp Content Studio vào Thư viện nội dung, bớt một lần bấm qua lại
  Trước đây mục menu "Content Studio" chỉ mở một trang trống bảo "Mở thư viện", còn thư viện lại dẫn ngược về Studio.
  Nay:
  - menu bỏ mục "Content Studio"; Studio là trang của từng bài trong thư viện, khi đang mở thì menu vẫn sáng
    "Thư viện nội dung";
  - trong thư viện, bấm vào tiêu đề bài (hoặc "Mở Studio") là vào thẳng Studio của bài đó;
  - địa chỉ `/studio` cũ (dấu trang, link cũ) tự chuyển về thư viện; nút "Mở Content Studio" ở Dashboard đổi thành
    "Mở thư viện nội dung".
  Chọn AI vẫn nằm trong Studio của từng bài như trước.

## 1.12.2 · 04/11/2026
### Sửa lỗi
- Báo rõ tài khoản bị bỏ qua khi duyệt bài
  Cần backend 1.11.1 trở lên. Từ bản đó, duyệt bài không còn hỏng vì có một tài khoản chưa sẵn sàng. Sau khi bấm
  "Duyệt & đăng bài này" hoặc nút duyệt chung, trang Content đợi duyệt hiện thêm một cảnh báo vàng nếu có:
  - tài khoản không được đăng, kèm tên và lý do (chưa kết nối, tài khoản đang tắt, chưa bật "Tự bấm Đăng"…);
  - bài vẫn chờ duyệt vì nền tảng của nó chưa có tài khoản nào sẵn sàng.
  Khi duyệt bị từ chối, trang hiện nguyên câu báo tiếng Việt của máy chủ, có tên từng tài khoản. Kiểu dữ liệu API được
  sinh lại theo backend mới.

## 1.12.1 · 04/11/2026
### Sửa lỗi
- Sửa lỗi build hỏng (`Unexpected token` ở trang Content đợi duyệt) sau lần gộp nhánh Khôi phục
  Lần gộp main vào nhánh "Khôi phục nội dung đã từ chối" giữ cả hai phía xung đột chồng lên nhau, nên
  `ai-content-view.tsx` thiếu thẻ đóng và `pnpm build` (Docker) dừng. Trang và test của nó nay được gộp lại đúng, giữ đủ
  hai bên:
  - từ 1.11.0: "Duyệt & đăng bài này", tự lưu phần sửa khi duyệt, duyệt được ngay khi ảnh xong;
  - từ nhánh khôi phục: nút "Khôi phục bài này" và "Khôi phục để duyệt".
  `VERSION` trở lại một dòng. Mục khôi phục trùng số 1.11.0 được đổi thành 1.12.0.

## 1.12.0 · 04/11/2026
### Tính năng
- Khôi phục nội dung đã từ chối
  Thêm nút “Khôi phục để duyệt” trên lượt AI bị từ chối và “Khôi phục bài này” trên từng bài bị từ chối. Sau khi khôi phục có thể sửa, duyệt hoặc hẹn lịch lại; nội dung chỉ đăng khi duyệt. Cần backend có API khôi phục (bản 1.12.0 trở lên).

## 1.11.1 · 04/11/2026
### Sửa lỗi
- Test đăng nhập hàng loạt chỉ chạy cho tài khoản chưa đăng nhập (cần backend 1.12.1)
  "Test đăng nhập hàng loạt" và "Kiểm tra tất cả" bỏ qua tài khoản đã đăng nhập thành công; khung Test đăng nhập ghi
  "Sẽ test N tài khoản chưa đăng nhập · bỏ qua M tài khoản đã đăng nhập thành công", nút bị khoá khi không còn tài khoản
  nào cần test, thông báo sau khi bấm cho biết số tài khoản được bỏ qua. Nút "Test" ở từng dòng vẫn kiểm lại tài khoản đó.

## 1.11.0 · 04/11/2026
### Tính năng
- Duyệt một lần là bài tự đăng (cần backend 1.12.0)
  Trong Content đợi duyệt, kênh nào AI viết xong (kèm ảnh) là có nút "Duyệt & đăng bài này" ngay, không chờ các kênh
  khác; nút chung đổi thành "Duyệt & đăng bài đã xong". Bấm duyệt tự lưu phần bạn đã sửa, không cần bấm "Lưu chỉnh
  sửa" trước. Bài có ảnh đang tạo ghi rõ "duyệt được ngay khi ảnh xong".
- Công tắc "Tự đăng bài AI chấm đạt, không cần duyệt" trong hộp Tạo nội dung AI chạy ngầm
  Mặc định tắt. Bật thì bài AI chấm đạt đăng luôn khi viết xong; bài chưa đạt vẫn chờ duyệt. Các bước hướng dẫn trong
  hộp ghi đúng quy trình mới.
- dev.to có nút Đăng ngay / Lưu nháp ở trang Tài khoản như Blogger và Tumblr.

## 1.10.0 · 04/11/2026
### Tính năng
- Duyệt, hẹn lịch hoặc từ chối từng bài theo nền tảng (cần backend 1.11.0)
  Mỗi bài trong Review & duyệt có nút "Duyệt bài này", "Hẹn lịch bài này", "Từ chối bài này". Duyệt bài nào thì chỉ bài
  của nền tảng đó vào hàng đợi đăng, các bài khác vẫn chờ. Bài đã duyệt / từ chối ghi rõ trạng thái và không sửa được
  nữa. Thanh dưới cùng ghi số bài chờ / đã duyệt / từ chối, các nút chung áp dụng cho các bài còn chờ ("Duyệt hết bài còn
  chờ"); trên điện thoại chỉ giữ Edit và Duyệt hết để thanh gọn.
- Xem trước trên nền tảng trong Content Studio
  Mỗi biến thể có nút "Xem trước": bài hiện như trên mạng xã hội đó, kể cả phần đang sửa chưa lưu.
### Sửa lỗi
- Xem trước báo rõ khi máy chủ chưa có chức năng này
  Thay vì "Cannot POST …/preview", trang ghi cần cập nhật backend lên bản 1.10.0 trở lên.

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
