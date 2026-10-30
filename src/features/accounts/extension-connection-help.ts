import type { PlatformAccount } from "@/types/domain";
import { chromeSession } from "./extension-account-state";

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function connectionLink(value: unknown): string | undefined {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch { /* Missing or invalid account URL. */ }
}
const postingNotes: Record<string, string> = {
  producthunt: "Product Hunt dùng luồng ra mắt sản phẩm. Mở Submit → New Product hoặc bản nháp có sẵn, hoàn tất Launch tags rồi Finish setup. Extension hiện chưa có luồng tự xuất bản launch.",
  'product-hunt': "Product Hunt dùng luồng ra mắt sản phẩm. Mở Submit → New Product hoặc bản nháp có sẵn, hoàn tất Launch tags rồi Finish setup. Extension hiện chưa có luồng tự xuất bản launch.",
  dailymotion: "Dailymotion cần video. Mở Dailymotion Studio, tải video và hoàn tất thông tin xuất bản. Extension hiện chưa có luồng tự tải và xuất bản video.",
  'stack-overflow': "Stack Overflow cần câu hỏi lập trình và tags phù hợp. Mở Ask Question để soạn câu hỏi. Extension hiện chưa có luồng tự đăng câu hỏi.",
  'server-fault': "Server Fault cần câu hỏi quản trị hệ thống và tags phù hợp. Mở Ask Question để soạn câu hỏi. Extension hiện chưa có luồng tự đăng câu hỏi.",
  'unix-linux-stackexchange': "Unix & Linux cần câu hỏi Linux/Unix và tags phù hợp. Mở Ask Question để soạn câu hỏi. Extension hiện chưa có luồng tự đăng câu hỏi.",
  minds: "Phiên Minds có thể được xác nhận qua Chrome. Extension hiện chưa có luồng điền và xuất bản bài trên Minds.",
};

export function extensionConnectionHelp(account: PlatformAccount, check?: { status: string; message?: string | null }) {
  const session = chromeSession(account);
  const setup = record(account.settings?.extensionSetup);
  const loginTarget = record(account.settings?.extensionLoginTarget);
  const hasFlow = account.settings?.delivery === "extension" || typeof account.platform?.defaultSettings?.extensionFlowId === "string";
  const verified = check?.status === "AUTHENTICATED";
  const message = check?.message || "Chưa kiểm tra phiên đăng nhập trên Chrome đã gán.";
  const steps: string[] = [];
  if (!verified) {
    steps.push("Mở trang đăng nhập trong đúng hồ sơ Chrome đã ghép với tiện ích. Đăng nhập trực tiếp trên trang của nền tảng.");
    if (/tài khoản khác|đúng tài khoản|đúng hồ sơ|username|nhận diện/i.test(message)) steps.push(`Kiểm tra username và link hồ sơ trong “Phiên Chrome / 2FA”. Tài khoản dự kiến: ${String(session.expectedUsername || account.username || "chưa cấu hình")}. Đăng nhập đúng tài khoản rồi kiểm tra lại.`);
    if (/Google|2FA|TOTP|xác minh|captcha/i.test(message)) steps.push("Hoàn tất yêu cầu xác minh ngay trên tab Google/social. Tiện ích sẽ kiểm tra lại phiên sau khi bạn hoàn tất.");
    if (/mật khẩu|chưa được chấp nhận/i.test(message)) steps.push("Nếu đăng nhập thủ công cũng thất bại, sửa mật khẩu/2FA trong “Phiên Chrome / 2FA”. Không cần nhập lại nếu Chrome đã đăng nhập thành công.");
    if (/tên miền|quyền|permission/i.test(message)) steps.push("Mở Cài đặt tiện ích → Cấp quyền nền tảng. Nếu trang chuyển sang tên miền khác, cần cập nhật đúng URL đăng nhập của tài khoản.");
    steps.push("Bấm “Tôi đã đăng nhập · Kiểm tra”. Lượt này chỉ kiểm tra phiên có sẵn, không nhập mật khẩu hoặc mã 2FA.");
  }
  if (setup.status === "ACCESS_RESTRICTED") {
    steps.push(account.platform?.slug === "devto"
      ? "Mở DEV và dùng liên kết kháng nghị trong thông báo tài khoản bị đình chỉ. Đăng nhập lại không khôi phục quyền đăng bài."
      : "Mở nền tảng, kiểm tra thông báo tài khoản và xác minh email nếu được yêu cầu. Nếu trang tạo bài vẫn báo không có quyền, liên hệ quản trị diễn đàn để được cấp quyền.");
    steps.push("Sau khi nền tảng khôi phục quyền tạo bài, lưu lại Cấu hình đăng bài rồi bấm “Tôi đã đăng nhập · Kiểm tra”.");
  }
  else if (!hasFlow) steps.push(postingNotes[account.platform?.slug || ""] || "Tài khoản đã được gán với Chrome nhưng extension chưa có luồng đăng cho nền tảng này. Đăng nhập lại không bổ sung được luồng đăng; cần triển khai luồng trước khi bật đăng tự động.");
  else if (account.settings?.delivery !== "extension") steps.push("Bấm “Tiện ích”, chọn trang tạo bài/chuyên mục hoặc Space của bạn, bật “Tự bấm Đăng” và lưu. Sau đó kiểm tra phiên để tự bật kết nối.");
  else if (verified) steps.push("Đã xác nhận phiên Chrome và có cấu hình đăng qua tiện ích. Khi tạo chiến dịch, chọn tài khoản này và cung cấp nội dung/media mà nền tảng yêu cầu.");
  const reason = setup.status === "ACCESS_RESTRICTED" ? String(setup.message)
    : verified ? hasFlow ? account.settings?.delivery === "extension" ? "Đã xác nhận phiên Chrome; đã có cấu hình đăng bằng tiện ích." : "Đã đăng nhập, còn thiếu nơi đăng bài cho tiện ích." : "Đã xác nhận phiên Chrome. Chưa có luồng đăng tự động cho nền tảng này."
    : message;
  return { reason, steps, hasFlow, verified,
    loginUrl: connectionLink(session.loginUrl) || connectionLink(loginTarget.url) || connectionLink(session.origin),
    profileUrl: connectionLink(session.profileUrl),
  };
}
