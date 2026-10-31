import type { PublishNeedsAction } from "@/types/domain";

const browserMessages: Record<string, string> = {
  LOGIN_REQUIRED: "Session đã hết hoặc nền tảng yêu cầu đăng nhập lại. Mở trang Tài khoản, chạy helper rồi tiếp tục job.",
  CAPTCHA_REQUIRED: "Nền tảng yêu cầu CAPTCHA. Tự hoàn thành CAPTCHA trong Chromium helper rồi tiếp tục job; hệ thống không vượt CAPTCHA.",
  TWO_FACTOR_REQUIRED: "Nền tảng yêu cầu xác minh hai bước. Tự hoàn thành 2FA trong Chromium helper rồi tiếp tục job.",
  SECURITY_CHECK_REQUIRED: "Nền tảng yêu cầu kiểm tra bảo mật. Hoàn thành bước xác minh trong Chromium helper rồi tiếp tục job.",
  EDITOR_NOT_FOUND: "Không tìm thấy trình soạn thảo đã kiểm thử. Kiểm tra lại box/đường dẫn; nếu giao diện vừa thay đổi, adapter cần được cập nhật trước khi chạy lại.",
  AUTOMATION_BUSY: "Một tác vụ khác đang dùng session này. Đợi tác vụ đó kết thúc rồi tiếp tục job.",
  AUTOMATION_DISABLED: "Playwright đang tắt ở backend. Bật browser automation, khởi động lại worker rồi tiếp tục job.",
  AUTOMATION_FAILED: "Trình duyệt đã dừng an toàn trước khi xác nhận đăng. Kiểm tra worker và cấu hình điểm đến rồi chạy lại adapter.",
  SUBMISSION_CONFIRMATION_REQUIRED: "Adapter đã dừng trước nút đăng cuối cùng. Bật auto-submit và xác nhận quyền automation trong cấu hình trước khi chạy lại.",
};

const extensionMessages: Record<string, string> = {
  CAPTCHA_REQUIRED: "Diễn đàn đòi CAPTCHA. Tiện ích đã điền sẵn và mở tab trong Chrome; giải CAPTCHA rồi bấm Đăng, hệ thống tự ghi nhận.",
  WAITING_USER: "Tiện ích đã điền sẵn bài trong Chrome và chờ bạn kiểm tra, bấm Đăng.",
  SUBMIT_REJECTED: "Diễn đàn từ chối bài sau khi bấm Đăng. Xem tab diễn đàn, sửa rồi bấm Đăng lại hoặc Giao lại cho tiện ích.",
  SUBMIT_UNCONFIRMED: "Đã bấm Đăng nhưng chưa thấy bài mới. Kiểm tra diễn đàn: có bài thì bấm Đã đăng, chưa có thì Giao lại cho tiện ích.",
  RESULT_UNKNOWN: "Tiện ích không báo kết quả. Kiểm tra diễn đàn: có bài thì bấm Đã đăng, chưa có thì Giao lại cho tiện ích.",
};

export function getNeedsActionMessage(action?: PublishNeedsAction) {
  if (!action) return undefined;
  if (action.kind === "EXTENSION_PENDING") return "Đang chờ tiện ích Chrome đăng (Chrome cần mở và đã đăng nhập diễn đàn).";
  if (action.kind === "EXTENSION_ACTION") return action.message?.trim() || (action.reason && extensionMessages[action.reason]);
  if (action.kind === "POLICY_BLOCKED") {
    return "Automation bị vô hiệu hóa theo chính sách của nền tảng. Dùng luồng bàn giao an toàn thay vì cố chạy Playwright.";
  }
  return (action.reason && browserMessages[action.reason]) || action.message;
}
