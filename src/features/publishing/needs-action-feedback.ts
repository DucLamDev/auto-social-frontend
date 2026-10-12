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

export function getNeedsActionMessage(action?: PublishNeedsAction) {
  if (!action) return undefined;
  if (action.kind === "POLICY_BLOCKED") {
    return "Automation bị vô hiệu hóa theo chính sách của nền tảng. Dùng luồng bàn giao an toàn thay vì cố chạy Playwright.";
  }
  return (action.reason && browserMessages[action.reason]) || action.message;
}
