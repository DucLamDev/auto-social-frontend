export type ApiGuide = {
  id: string; name: string; method: string; fields: string; steps: string[]; limits: string;
  docs: string; setupUrl?: string; environment?: string; callback?: string;
};

// Field names and OAuth callbacks match the connectors shipped in this project.
export const apiGuides: ApiGuide[] = [
  {
    id: "mastodon", name: "Mastodon.social / social.vivaldi.net", method: "Access token",
    fields: "Instance URL · Access token · Visibility",
    steps: ["Trên đúng máy chủ tài khoản, mở Preferences → Development → New application.", "Cấp read:accounts để kiểm tra tài khoản và write:statuses để đăng. Lưu ứng dụng rồi lấy access token của tài khoản.", "Trong Tài khoản → Kết nối / cấu hình, chọn nền tảng, nhập Instance URL (https://mastodon.social hoặc https://social.vivaldi.net), Access token và Visibility. Bấm Lưu & kiểm tra."],
    limits: "Connector API hiện đăng văn bản. Token của Mastodon.social không dùng thay cho token Vivaldi; mỗi tài khoản cần token riêng.",
    setupUrl: "https://mastodon.social/settings/applications", docs: "https://docs.joinmastodon.org/client/token/",
  },
  {
    id: "bluesky", name: "Bluesky", method: "App Password",
    fields: "Handle · App Password · PDS service URL",
    steps: ["Mở Settings → Privacy and security → App passwords trên Bluesky, tạo App Password dành cho Social Publisher.", "Nhập Handle đầy đủ, ví dụ ten.bsky.social; nhập App Password vừa tạo. PDS mặc định là https://bsky.social; tài khoản trên máy chủ khác dùng PDS tương ứng.", "Lưu & kiểm tra. Hệ thống tạo phiên API từ App Password khi đăng."],
    limits: "Connector hiện đăng văn bản tối đa 300 ký tự; chưa hỗ trợ ảnh. Không điền mật khẩu đăng nhập Google vào App Password.",
    setupUrl: "https://bsky.app/settings/app-passwords", docs: "https://bsky.social/about/blog/5-19-2023-user-faq",
  },
  {
    id: "wordpress", name: "WordPress", method: "Application Password",
    fields: "Site URL · Username · Application Password · Trạng thái bài mặc định",
    steps: ["Trong WordPress Admin → Users → Profile, tạo Application Password cho tài khoản có quyền xuất bản.", "Nhập Site URL HTTPS, username WordPress và Application Password vào form WordPress trên web này.", "Chọn Publish để đăng ngay hoặc Draft / Pending review để giữ nháp, rồi Lưu & kiểm tra."],
    limits: "Dành cho site WordPress hỗ trợ REST API và Application Passwords. Quyền xuất bản phụ thuộc vai trò của tài khoản; mật khẩu ứng dụng không tự tăng quyền.",
    docs: "https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/",
  },
  {
    id: "devto", name: "DEV / Forem", method: "API key",
    fields: "DEV API key · Forem API URL · Publish ngay",
    steps: ["Mở DEV Settings → Extensions, tạo API key cho tài khoản đăng bài.", "Dán vào DEV API key; giữ Forem API URL là https://dev.to/api khi dùng DEV.", "Bật Publish ngay nếu muốn xuất bản thay vì lưu nháp, rồi Lưu & kiểm tra."],
    limits: "Tài khoản DEV đang bị đình chỉ vẫn bị chặn khi dùng API. API không khôi phục quyền đăng; cần xử lý trạng thái tài khoản trước.",
    setupUrl: "https://dev.to/settings/extensions", docs: "https://developers.forem.com/api",
  },
  {
    id: "discord", name: "Discord", method: "Webhook",
    fields: "Webhook URL · Tên webhook · Thread ID hoặc Tự tạo thread",
    steps: ["Trong server Discord, mở Server Settings → Integrations → Webhooks; tạo webhook cho đúng channel và Copy Webhook URL.", "Dán URL đầy đủ vào trường Webhook URL. Tên và avatar webhook là tùy chọn.", "Với Forum/Media channel, chọn Tự tạo thread hoặc nhập Thread ID có sẵn, không bật cả hai. Lưu & kiểm tra."],
    limits: "Webhook đăng vào channel được cấp, không đăng thay một tài khoản cá nhân. URL webhook chứa khóa truy cập, chỉ nhập ở trường credential.",
    docs: "https://docs.discord.com/developers/resources/webhook",
  },
  {
    id: "discourse", name: "Discourse: Caddy, AlmaLinux, NGINX…", method: "API key do quản trị viên cấp",
    fields: "Forum URL · API Username · API Key · Category ID · Tags mặc định",
    steps: ["Nhờ quản trị viên của chính diễn đàn tạo khóa tại Admin → API keys, gắn với đúng người dùng và quyền đọc / tạo topic cần dùng.", "Trong form tài khoản, chọn API Discourse nếu đang tạo mới; nhập Forum URL, API Username, API Key và Category ID được phép đăng.", "Điền các tag đã tồn tại nếu chuyên mục yêu cầu; Lưu & kiểm tra."],
    limits: "Có tài liệu API công khai không có nghĩa thành viên tự lấy được khóa quản trị. Nếu diễn đàn không cấp khóa, dùng Tiện ích Chrome đã ghép nối. Cả hai cách vẫn chịu kiểm duyệt của diễn đàn.",
    docs: "https://meta.discourse.org/t/create-and-configure-an-api-key/230124",
  },
  {
    id: "blogger", name: "Blogger", method: "OAuth Google",
    fields: "Kết nối Google/Blogger → chọn tài khoản sở hữu blog",
    steps: ["Quản trị hệ thống: tạo OAuth client loại Web application trong Google Cloud, bật Blogger API và cấu hình màn hình consent. Khi app còn Testing, thêm email dùng thử vào Test users.", "Đăng ký callback đúng với máy chủ này, lưu GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET ở backend rồi khởi động lại dịch vụ.", "Trên web: Tài khoản → Kết nối / cấu hình → Đăng nhập một lần → Google/Blogger. Chấp thuận quyền https://www.googleapis.com/auth/blogger; hệ thống lấy danh sách blog của tài khoản. Bật Đăng ngay trên blog cần dùng."],
    environment: "GOOGLE_CLIENT_ID=...\nGOOGLE_CLIENT_SECRET=...", callback: "google",
    limits: "API key chỉ đọc dữ liệu công khai không đủ quyền đăng bài. Cần OAuth và tài khoản có quyền viết trên blog; Google có thể yêu cầu xác minh ứng dụng.",
    setupUrl: "https://console.cloud.google.com/apis/credentials", docs: "https://developers.google.com/blogger/docs/3.0/using",
  },
  {
    id: "tumblr", name: "Tumblr", method: "OAuth 2.0",
    fields: "Kết nối Tumblr → blog đích",
    steps: ["Đăng ký ứng dụng Tumblr và nhập OAuth2 redirect URL trùng callback của backend.", "Lưu TUMBLR_CLIENT_ID và TUMBLR_CLIENT_SECRET ở backend; khởi động lại dịch vụ.", "Tại Tài khoản → Kết nối / cấu hình → Đăng nhập một lần, bấm Tumblr. Hệ thống yêu cầu basic, write, offline_access và tạo tài khoản theo các blog có quyền đăng."],
    environment: "TUMBLR_CLIENT_ID=...\nTUMBLR_CLIENT_SECRET=...", callback: "tumblr",
    limits: "Connector hiện tạo bài văn bản. Chọn đúng blog và bật Đăng ngay nếu muốn xuất bản ngay.",
    setupUrl: "https://www.tumblr.com/oauth/apps", docs: "https://github.com/tumblr/docs/blob/master/api.md#oauth2-authorization",
  },
  {
    id: "linkedin", name: "LinkedIn", method: "OAuth 2.0",
    fields: "Kết nối LinkedIn · phiên bản LinkedIn API đang được hỗ trợ",
    steps: ["Tạo ứng dụng trong LinkedIn Developers. Bật Share on LinkedIn và Sign In with LinkedIn using OpenID Connect; cấu hình callback.", "Lưu LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET và LINKEDIN_API_VERSION (dạng YYYYMM đang được LinkedIn hỗ trợ) ở backend.", "Bấm Kết nối LinkedIn trên web. Luồng hiện yêu cầu openid, profile và w_member_social để đăng cho thành viên đã cấp quyền."],
    environment: "LINKEDIN_CLIENT_ID=...\nLINKEDIN_CLIENT_SECRET=...\nLINKEDIN_API_VERSION=YYYYMM", callback: "linkedin",
    limits: "Luồng OAuth hiện dành cho hồ sơ cá nhân. Quyền đăng cho tổ chức cần cấu hình riêng. Connector có thể trả ID bài mà chưa trả permalink.",
    setupUrl: "https://www.linkedin.com/developers/apps", docs: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
  },
  {
    id: "instagram", name: "Instagram", method: "OAuth / token người dùng",
    fields: "Kết nối Instagram; hoặc Access token · Instagram User ID",
    steps: ["Tạo ứng dụng Meta có Instagram API with Instagram Login, cấu hình tài khoản chuyên nghiệp và callback theo tài liệu Meta.", "Lưu INSTAGRAM_APP_ID và INSTAGRAM_APP_SECRET ở backend. Luồng dự án yêu cầu instagram_business_basic, instagram_business_content_publish.", "Bấm Kết nối Instagram trong mục Đăng nhập một lần. Hoặc nhập token và Instagram User ID vào form credential khi đã có token phù hợp."],
    environment: "INSTAGRAM_APP_ID=...\nINSTAGRAM_APP_SECRET=...", callback: "instagram",
    limits: "Connector hiện hỗ trợ một ảnh cho mỗi bài, cần URL ảnh HTTPS mà Meta tải được. Tài khoản / ứng dụng phải được Meta cấp quyền phù hợp; token dán tay không tự gia hạn theo luồng OAuth của dự án.",
    setupUrl: "https://developers.facebook.com/apps/", docs: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/",
  },
  {
    id: "threads", name: "Threads", method: "OAuth / token người dùng",
    fields: "Kết nối Threads; hoặc Access token · Threads User ID",
    steps: ["Tạo ứng dụng Meta cho Threads API và đăng ký callback của backend.", "Lưu THREADS_APP_ID và THREADS_APP_SECRET ở backend; luồng dự án yêu cầu threads_basic và threads_content_publish.", "Bấm Kết nối Threads trong mục Đăng nhập một lần, đăng nhập đúng tài khoản và cấp quyền. Form credential cũng nhận token và Threads User ID đã được cấp."],
    environment: "THREADS_APP_ID=...\nTHREADS_APP_SECRET=...", callback: "threads",
    limits: "Kiểm tra quyền và chế độ ứng dụng trên Meta. Ưu tiên kết nối OAuth của dự án để hệ thống quản lý gia hạn token.",
    setupUrl: "https://developers.facebook.com/apps/", docs: "https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions",
  },
  {
    id: "x", name: "X (Twitter)", method: "User access token",
    fields: "User access token",
    steps: ["Trong X Developer Console, tạo ứng dụng có quyền đăng bài và quyền truy cập API phù hợp với gói của ứng dụng.", "Lấy OAuth user access token với tweet.read, tweet.write và users.read. Token app-only không đại diện cho người dùng để đăng bài.", "Dán token vào User access token trong form X rồi Lưu & kiểm tra. Dự án hiện chưa cung cấp luồng OAuth X tự gia hạn qua nút kết nối."],
    limits: "Hạn mức / chi phí theo tài khoản developer. Token hết hạn cần cấp lại; connector hiện đăng văn bản.",
    setupUrl: "https://developer.x.com/", docs: "https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code",
  },
];
