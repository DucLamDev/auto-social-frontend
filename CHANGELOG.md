# Nhật ký thay đổi

Mỗi lần sửa (mỗi Pull Request): tăng VERSION (sửa lỗi → số cuối, tính năng → số giữa) và thêm đúng một mục mới ở đầu
danh sách, theo mẫu bên dưới. Hàng chờ gộp tự đổi sang số kế tiếp khi hai nhánh cùng lấy một số.

## 1.37.0 · 11/11/2026
### Tính năng
- Thêm WordPress vào luồng đăng bằng tiện ích (cần backend 1.33.0)
  - Phần Tiện ích của tài khoản WordPress có hướng dẫn: dán trang Viết bài mới của blog (`…/wp-admin/post-new.php`);
    blog WordPress.com chọn giao diện quản trị Classic trước. Tiện ích điền bài, ảnh đại diện rồi bấm Publish.
  - Mastodon.social dùng luồng Mastodon có sẵn (không đổi giao diện).

## 1.36.0 · 10/11/2026
### Tính năng
- "Copy & mở" chép cả footer liên hệ công ty ở cuối bài (cần backend 1.32.0)
  - Với bài tiếng Việt trên kênh của công ty (Medium, Substack, TikTok, Eventbrite…), nội dung chép có thêm khối 6 dòng
    tên công ty, datacenter, hotline, website, email, Zalo, nằm sau dòng "Nguồn" và trước danh sách ảnh.
  - Diễn đàn, cộng đồng, bài tiếng Anh: backend không gửi footer nên nội dung chép giữ như cũ.

## 1.35.0 · 06/11/2026
### Tính năng
- Bấm chuông thông báo mở modal ngay trên trang đang xem
  - Trước đây nút chuông chuyển sang Dashboard. Giờ bấm chuông mở hộp **Thông báo** liệt kê:
    - tài khoản cần kết nối lại hoặc sắp hết hạn token;
    - bài cần thao tác, thất bại, có thể đăng trùng, đang thử lại, chờ tiện ích Chrome.
  - Hộp có nút **Mở Tài khoản**, **Mở Xuất bản**, **Xem trên Dashboard**; bấm một liên kết thì hộp tự đóng. Esc hoặc bấm ra
    ngoài cũng đóng. Có trạng thái đang tải, không có việc và lỗi kèm nút Thử lại.
  - Khung "Cần xử lý" trên Dashboard dùng chung nội dung với hộp này nên hai nơi luôn khớp.

## 1.34.0 · 06/11/2026
### Tính năng
- Thêm social Unraid Forums, aaPanel Forum, cPanel Community vào luồng đăng bằng tiện ích (cần backend 1.29.0)
  - Phần Tiện ích của tài khoản có hướng dẫn cho 3 kiểu diễn đàn mới: Invision Community (Unraid: dán trang
    `…/?do=add` của box), Flarum (aaPanel: dán trang tag `…/forum/t/<tag>`), cộng đồng Zendesk (cPanel: ghi tên topic).
  - Hộp "Thêm social" hiện ô Chuyên mục cho aaPanel (tag) và cPanel (topic).

## 1.33.1 · 06/11/2026
### Sửa lỗi
- Trang Publishing báo "Tiện ích cần cập nhật" khi tiện ích Chrome là bản cũ và bỏ qua bài (cần backend 1.28.2)
  - Trước đây bài của nền tảng mà tiện ích cũ chưa có luồng đăng (Hugging Face, Linux Foundation Forum…) chỉ hiện "Chờ
    tiện ích Chrome" mãi dù Chrome đang mở. Giờ bài hiện nhãn cam **Tiện ích cần cập nhật**, ghi rõ Chrome nào và hướng
    dẫn cập nhật rồi bấm Tải lại ở `chrome://extensions`.
  - Chỉ hiện khi ghi chú của máy chủ còn mới (15 phút). Chrome đã nhận bài thì hiện "Tiện ích đang đăng" như cũ.

## 1.33.0 · 06/11/2026
### Tính năng
- Content đợi duyệt: viền thẻ bài theo kết quả AI để nhận ra ngay bài đạt / chưa đạt
  - Bài chờ duyệt mà AI chấm đạt (và AI duyệt cuối đã duyệt, khi bật) có **viền xanh**.
  - Bài AI chấm chưa đạt, hoặc AI duyệt cuối từ chối / lỗi, có **viền cam**.
  - Bài AI còn đang xét (đang viết lại, đang duyệt cuối, chưa duyệt cuối) có viền xám.
  - Bài đã duyệt giữ viền xanh đậm, bài đã từ chối giữ viền xám nhạt. Chấm màu ở hàng "Đi tới bài của từng kênh" cũng
    đổi theo, kèm chú thích màu ngay trên hàng đó.

## 1.32.0 · 06/11/2026
### Tính năng
- Viết lại bằng AI / Sửa theo khuyến nghị: Claude Opus sửa, chỉ sửa chỗ bị nhắc (cần backend 1.28.0)
  - Lời nhắc ở các nút ghi rõ ai sửa bài (lấy `reviser` từ `/ai/roles`, ví dụ "Claude Opus"). AI chỉ sửa đúng các chỗ
    còn tick, giữ nguyên phần đã ổn. Bản sửa điểm thấp hơn thì giữ bản hiện tại.
  - Trạng thái "đang viết lại" / "đã viết lại" ghi tên AI đã sửa. Lần sửa không được lưu vì điểm thấp hơn thì hiện lý
    do.
  - **Khuyến nghị đầy đủ, không bị cắt.** Bài bị AI duyệt cuối từ chối thì danh sách "AI đề nghị kiểm tra" lấy đủ lý do từ
    kết quả duyệt và tách riêng phần nhận xét chấm điểm. Trước đây ghi chú bị cắt giữa câu nên có khuyến nghị cụt như
    "Câu discl" hoặc hai ý dính vào nhau.

## 1.31.1 · 06/11/2026
### Sửa lỗi
- Hộp tạo bài hiện "Chấm & duyệt cuối: Claude Opus" khi một AI làm cả hai vai (cần backend 1.27.0)
  - Backend 1.27.0 để Claude Opus vừa chấm vừa duyệt cuối. Dòng vai AI giờ gộp hai bước thành một: "Viết: GPT (VPSTTT
    AI) → Chấm & duyệt cuối: Claude Opus", thay vì hiện Opus hai lần.
  - Cảnh báo trùng AI viết và cảnh báo chưa cấu hình cũng nói theo vai gộp. Máy chủ tách hai vai thì vẫn hiện ba bước như
    cũ.

## 1.31.0 · 06/11/2026
### Tính năng
- Gợi ý chiến dịch có điểm AI để chọn gợi ý phù hợp nhất (cần backend 1.26.0)
  - Mỗi thẻ gợi ý có nhãn **AI chấm X/10** (xanh từ 8, vàng 6–7, đỏ dưới 6), điểm từng tiêu chí (hợp mọi nền tảng, giá
    trị cho người đọc, gắn sản phẩm tự nhiên, khả năng tương tác) và **Điểm yếu** chính.
  - Gợi ý điểm cao nhất nằm đầu, có viền xanh và nhãn **Phù hợp nhất**. Lần nào AI chưa chấm được thì ghi rõ và giữ thứ
    tự AI đưa ra.

## 1.30.0 · 06/11/2026
### Tính năng
- Content đợi duyệt: nút Xoá cho từng lượt và lỗi chi tiết khi rê chuột vào từng kênh
  Nút Xoá cần backend 1.25.0.
  - **Nút Xoá** (ADMIN, EDITOR) ở mỗi lượt AI:
    - hỏi xác nhận trước, rồi xoá lượt cùng các bài chưa đăng và nội dung brief của lượt;
    - khoá trong lúc AI đang viết;
    - máy chủ từ chối thì hiện nguyên lý do, ví dụ lượt đã có bài lên social nên giữ lại lịch sử.
  - **Lượt lỗi:** rê chuột hoặc dùng phím Tab lên trạng thái của từng kênh ("Lỗi ở kênh này" / "Chưa chạy (dừng sau
    lỗi)" / "Chưa tạo được") để xem vì sao kênh đó chưa có bài:
    - kênh gặp lỗi: nguyên nhân, thông điệp lỗi, mã lỗi, AI đang dùng, thời điểm;
    - các kênh khác: lượt dừng ở kênh nào, vì lỗi gì, trước khi tới kênh này;
    - lượt chạy trên bản cũ (chỉ còn mã lỗi): nói rõ không có chi tiết, bấm Thử lại để chạy lại và xem lỗi chi tiết.
  Kiểu API sinh lại theo backend 1.25.0.

## 1.29.0 · 06/11/2026
### Tính năng
- Hiện 3 vai AI và kết quả AI duyệt cuối; bài chưa được duyệt cuối không duyệt / đăng được
  Cần backend 1.24.0.
  - **Hộp tạo nội dung AI:**
    - dòng "Viết: … → Chấm: … → Duyệt cuối: …" (ví dụ GPT → Claude Sonnet → Claude Opus);
    - cảnh báo khi AI viết trùng model với AI chấm / AI duyệt, hoặc một vai chưa cấu hình.
  - **Trang Content đợi duyệt:**
    - mỗi bài có nhãn duyệt cuối: Đạt / Từ chối / Đang duyệt… / Lỗi / Chưa duyệt cuối;
    - bài bị từ chối hoặc lỗi có khung đỏ liệt kê lý do, dấu hiệu seeding, mức rủi ro cho công ty, và nút
      **Cho AI duyệt lại**;
    - nút **Duyệt & đăng** / **Hẹn lịch** khoá cho tới khi AI duyệt cuối đạt đúng nội dung hiện tại;
    - đang sửa dở thì nút chính thành **Lưu để AI duyệt lại**;
    - "Duyệt & đăng bài đã xong" và "từ N điểm" chỉ tính bài đã qua duyệt cuối;
    - sau khi duyệt hàng loạt, bài bị giữ vì chưa qua duyệt cuối được báo riêng.
  - **Studio:** nút Duyệt theo cùng luật, có nhãn trạng thái và nút duyệt lại.
  - Tự cập nhật trong lúc AI duyệt cuối đang đọc bài. Backend cũ (không có `/ai/roles`) thì không khoá nút.

## 1.28.1 · 06/11/2026
### Sửa lỗi
- Hộp Tạo nội dung hàng loạt: chọn social trước, rồi mới gợi ý chiến dịch cho đúng các social đó (cần backend 1.23.2)
  - Phần **Đăng tới tài khoản** và **Nhà cung cấp AI** nằm đầu hộp; ô **Gợi ý chiến dịch bằng AI** ở ngay sau, rồi tới
    mô tả bài đăng và tên chiến dịch.
  - Mỗi gợi ý dùng được cho tất cả nền tảng đã chọn và ghi rõ cách dùng cho từng nền tảng.
  - Đổi danh sách tài khoản sau khi đã có gợi ý thì gợi ý cũ được ẩn, kèm lời nhắc bấm Gợi ý lại.
- Chiến dịch AI lỗi hiện rõ nguyên nhân ở Content đợi duyệt
  - Khung lỗi ghi kênh đang viết khi dừng, nguyên nhân dễ hiểu theo mã lỗi (ví dụ đạt hạn mức lượt gọi AI, key bị từ
    chối, AI quá tải) kèm việc nên làm, và dòng **Chi tiết** (thông điệp, mã lỗi, nhà cung cấp AI) để gửi cho quản trị.
  - Bảng tiến độ đánh dấu riêng kênh **Lỗi ở kênh này** và các kênh **Chưa chạy (dừng sau lỗi)**, thay vì ghi "Chưa tạo
    được" cho mọi kênh còn lại. Lượt chạy cũ (trước bản này) vẫn hiện như trước.

## 1.28.0 · 06/11/2026
### Tính năng
- Giao diện sáng / tối, sidebar nền sáng và thẻ tiến độ mới ở trang Content đợi duyệt
  - **Chế độ sáng / tối cho toàn hệ thống**:
    - nút mặt trăng / mặt trời trên thanh trên cùng để chuyển; lựa chọn được nhớ trên trình duyệt đó;
    - khi chưa chọn, giao diện theo cài đặt sáng / tối của máy;
    - trang mở thẳng đúng chế độ, không bị nháy trắng;
    - mọi trang tự đổi màu, chữ đủ tương phản trên nền tối;
    - khung mã lệnh, ô logo nền tảng và phần giới thiệu ở trang đăng nhập vẫn giữ nền tối như cũ.
  - **Sidebar thiết kế lại**:
    - nền sáng thay cho nền xanh đen, có viền ngăn với nội dung;
    - mục đang mở có nền tím nhạt, ô biểu tượng màu tím và vạch đánh dấu bên trái;
    - nhóm menu có nhãn nhỏ, thu gọn thì các nhóm cách nhau bằng vạch kẻ.
  - **Trang Content đợi duyệt**: hàng nút lọc đơn giản được thay bằng thẻ **Tiến độ duyệt**:
    - phần trăm lượt đã duyệt;
    - thanh màu chia theo trạng thái (đang tạo, chờ duyệt, đã duyệt, có lỗi, đã từ chối);
    - mỗi trạng thái là một ô có biểu tượng và số lượt; bấm ô để lọc danh sách như trước.

## 1.27.0 · 06/11/2026
### Tính năng
- Gợi ý chiến dịch bằng AI trong hộp Tạo nội dung hàng loạt (cần backend 1.23.0)
  - Ô **Gợi ý chiến dịch bằng AI** ở đầu hộp: nhập hướng muốn nhắm (tuỳ chọn) rồi bấm **Gợi ý**. AI đưa 4 gợi ý cho
    đúng các nền tảng của tài khoản đang chọn, dựa trên thông tin công ty và kết quả các chiến dịch trước.
  - Mỗi gợi ý có tên chiến dịch, mô tả bài đăng, dạng bài, lý do hiệu quả và các nền tảng hợp nhất. Bấm **Dùng gợi ý
    này** để điền tên chiến dịch và mô tả bài đăng; vẫn sửa tay được. **Gợi ý khác** để lấy bộ mới.
  - Chưa chọn tài khoản hoặc nhà cung cấp AI chưa cấu hình thì nút bị khoá và có lời nhắc; lỗi AI hiện ngay dưới ô.

## 1.26.0 · 06/11/2026
### Tính năng
- Xoá tài khoản social và thao tác hàng loạt trên danh sách tài khoản
  Cần backend 1.22.0. Ở trang **Tài khoản** (chỉ quản trị):
  - mỗi dòng có ô chọn, ô ở đầu bảng chọn mọi tài khoản đang hiện;
  - khi đã chọn, hiện thanh thao tác: **Kiểm tra**, **Bật**, **Tắt**, **Xoá**, **Bỏ chọn**. Kiểm tra hàng loạt bỏ qua
    tài khoản Chrome vừa đăng nhập thành công nên không đăng nhập lại tất cả;
  - mỗi dòng có nút thùng rác để xoá riêng tài khoản đó;
  - trước khi xoá luôn hỏi xác nhận, nói rõ sẽ mất thông tin đăng nhập, phiên Chrome / 2FA và lịch sử đăng (bài đã lên
    mạng xã hội vẫn giữ nguyên). Tài khoản đang có bài chờ đăng hoặc đang đăng được giữ lại kèm lý do;
  - nút lọc **Có thể trùng** gom các tài khoản cùng nền tảng, cùng trang và cùng username (hoặc tên). Nút **Chọn bản
    thừa để xoá** chọn sẵn các bản thừa, mỗi nhóm giữ lại tài khoản tốt nhất (đã kết nối, nhiều bài hơn, đang bật).

## 1.25.0 · 06/11/2026
### Tính năng
- Hiện số bài đã đăng ở góc phải mỗi tài khoản khi chọn kênh để tạo nội dung
  Cần backend 1.21.0. Trong hộp tạo nội dung AI, mục **Đăng tới tài khoản**:
  - mỗi thẻ tài khoản có một số nhỏ ở góc phải: số bài đã đăng bằng tài khoản đó và vẫn còn trên nền tảng;
  - số khác 0 hiện màu xanh, số 0 hiện màu xám;
  - rê chuột lên số sẽ hiện "Đã đăng N bài bằng tài khoản này".
  Nhờ đó dễ chọn các kênh còn ít bài cho đợt đăng hàng loạt tiếp theo. Backend cũ chưa có số này thì thẻ giữ như trước.

## 1.24.0 · 05/11/2026
### Tính năng
- Cấu hình đăng bằng tiện ích cho Linux Foundation Forum, Ubiquiti Community, Blogger, Hugging Face Posts (cần backend
  1.20.0, tiện ích 1.15.0)
  - Form **Tiện ích** có 4 luồng mới kèm trang đăng mặc định và hướng dẫn: "Vanilla Forums", "Ubiquiti Community ·
    Post", "Blogger · blog của tài khoản Google", "Hugging Face · Posts".
  - Ubiquiti có ô **Chủ đề Ubiquiti** chọn trong danh sách chủ đề của trang (mặc định General).
  - Diễn đàn chưa có luồng riêng chọn được thêm kiểu **Vanilla** bên cạnh XenForo, Discourse, phpBB.
  - Hộp **Thêm social** hiện ô Chuyên mục cho Disqus và Ubiquiti.

## 1.23.0 · 05/11/2026
### Tính năng
- Cấu hình đăng bằng tiện ích cho Discuss Disqus và MeWe (cần backend 1.19.0, tiện ích 1.14.0)
  - Form **Tiện ích** của tài khoản có hai luồng mới: "Discuss Disqus · discussion" và "MeWe · dòng thời gian", kèm
    trang đăng mặc định và hướng dẫn.
  - Disqus có ô **Chuyên mục Discuss Disqus** chọn trong 8 chuyên mục của kênh (mặc định Community Growth) và ô
    **Tags / Topics** cho topic cố định.

## 1.22.1 · 05/11/2026
### Sửa lỗi
- Hộp góp ý của AI ghi "AI đề nghị kiểm tra (6 góp ý)" thay cho "(6 điểm)": con số là số góp ý, không phải điểm AI
  chấm, nên đặt cạnh "AI chấm 7/10" dễ đọc nhầm thành điểm 6.

## 1.22.0 · 05/11/2026
### Tính năng
- Cấu hình đăng thread forum Product Hunt bằng tiện ích Chrome
  Cần backend 1.18.0 (tiện ích 1.13.0). Trong cấu hình tiện ích của tài khoản Product Hunt:
  - có luồng **Product Hunt · Forums**, trang đăng `https://www.producthunt.com/p/new`;
  - hướng dẫn ghi forum / product ở ô **Chuyên mục**, đúng tên trong ô "Search for a product" (General, Vibecoding,
    Introduce yourself, Self-Promotion hoặc tên product). Để trống thì đăng vào Self-Promotion.
  Kiểu dữ liệu API sinh lại theo backend 1.18.0.

## 1.21.1 · 05/11/2026
### Sửa lỗi
- Form Phiên Chrome / 2FA báo trước khi hồ sơ Chrome đang giữ tài khoản khác cùng nền tảng
  Cần backend 1.17.2 để lưu được tài khoản đang dùng chung hồ sơ (ví dụ hai tài khoản MeWe cùng ở "Chrome VPS").
  - **Dưới ô "Hồ sơ Chrome nhận bài"** hiện tên tài khoản cùng nền tảng đang ở hồ sơ được chọn:
    - nếu tài khoản này vốn đã ở đó: vẫn sửa và lưu được, kèm lời nhắc mỗi lúc chỉ đăng nhập được một tài khoản;
    - nếu đang chuyển sang hồ sơ đó: báo không nhận thêm, chọn hoặc ghép hồ sơ Chrome khác.
  - **Sau khi lưu**, nếu máy chủ báo hồ sơ còn giữ tài khoản cùng nền tảng (`sharedWith`) thì hiện cảnh báo kèm cách chạy
    cả hai: ghép thêm một hồ sơ Chrome.

## 1.21.0 · 04/11/2026
### Tính năng
- Theo dõi bài tiện ích đang đăng, xem trước khớp bài thật, báo bài quá dài
  Cần backend 1.17.0 trở lên (tiện ích Chrome 1.12.0).
  - **Trang Publishing:**
    - Job tiện ích đã nhận hiện **Tiện ích đang đăng** (khác với **Chờ tiện ích** khi chưa ai nhận).
    - Nhận quá 10 phút mà chưa có kết quả thì có nút **Giao lại cho tiện ích**.
    - Lý do mới có lời giải thích: bài quá dài, trình soạn thảo không giữ đúng nội dung, không thấy ô soạn bài.
  - **Bản xem trước** vẽ theo cách nền tảng thật hiển thị (trường `appearance` của backend):
    - kênh chữ thường (Mastodon, Bluesky…) hiện đúng chữ đã gõ: dấu "•" và xuống dòng giữ nguyên, không vẽ thành
      danh sách;
    - kênh Markdown có thêm bảng và đường kẻ;
    - trình soạn thảo có định dạng (Differ…) vẽ như bài đã định dạng.
    Xem trước hiện **community / chuyên mục** và **ngôn ngữ bài** sẽ đăng, cùng tag thật sự được gửi.
  - **Duyệt bài:** "Duyệt tất cả" còn bài dài quá giới hạn ký tự thì cảnh báo tên kênh và số ký tự (ví dụ "Mastodon
    545/500"), không gộp chung với bài chờ tài khoản. Duyệt hay sửa một bài quá dài hiện câu báo lỗi của máy chủ.
  - Kiểu dữ liệu API sinh lại theo backend 1.17.0.

## 1.20.0 · 04/11/2026
### Tính năng
- Content đợi duyệt: thu gọn từng bài, xem trước theo từng bài
  - Mọi bài mặc định thu gọn: thẻ chỉ còn logo, tên kênh, một dòng tiêu đề, điểm AI, trạng thái và các nút
    "Từ chối / Hẹn lịch / Duyệt & đăng" (bài đã duyệt hoặc đã từ chối thì còn dòng trạng thái). Bấm "Xem nội dung"
    để mở bài đó, "Thu gọn" để đóng lại.
  - Phía trên danh sách có "Mở hết" và "Thu gọn hết". Bấm tên kênh trong hàng "Đi tới bài" thì bài đó mở ra và trang
    cuộn tới.
  - Công tắc chung "Nội dung / Xem trước như trên mạng xã hội" bị bỏ. Bài đang mở có công tắc riêng "Nội dung /
    Xem trước" ở đầu thẻ, nên xem trước bài này không đổi cách xem các bài khác. Bấm "Sửa bài" thì bài đó tự về chế
    độ "Nội dung".

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
