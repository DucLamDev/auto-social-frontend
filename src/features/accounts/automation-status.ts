import type { Platform } from "@/types/domain";

const labels = {
  READY_AFTER_CREDENTIALS: "Tự động qua API sau khi kết nối credential",
  READY_AFTER_LOGIN: "Adapter Playwright đã kiểm thử · cần đăng nhập một lần",
  API_CONNECTOR_REQUIRED: "Chưa tự động · cần triển khai hoặc duyệt connector API",
  BROWSER_RECIPE_REVIEW_REQUIRED: "Chưa tự động · cần recipe Playwright được kiểm thử",
  POLICY_BLOCKED: "Không tự động · chính sách nền tảng không cho phép",
  PLATFORM_RESEARCH_REQUIRED: "Chưa tự động · cần xác minh nền tảng và phương thức tích hợp",
} as const;

export function getPlatformAutomationLabel(platform: Pick<Platform, "mode" | "capabilities">) {
  const status = platform.capabilities.metadata?.automation?.status;
  if (status) return labels[status];
  if (platform.mode === "BROWSER_ASSISTED") return "Tự động bằng Playwright · cần session đăng nhập";
  if (platform.mode === "OFFICIAL_API" || platform.mode === "COMPATIBLE_API") return "Tự động qua API sau khi kết nối";
  return "Bàn giao thủ công · chưa có connector tự động";
}
