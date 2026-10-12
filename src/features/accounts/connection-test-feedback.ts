import type { AccountConnectionTestResult } from "@/services/resources.service";
import { ApiError, getErrorMessage } from "@/services/api/errors";

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

/**
 * A successful Discourse connection test proves API access, but cannot prove
 * that a future topic satisfies every category/tag-group rule. Keep that
 * distinction visible wherever account tests are run.
 */
export function getTagPolicyWarning(result: AccountConnectionTestResult): string | undefined {
  const details = result.details;
  if (!result.ok || details?.tagPolicyRequiresStagingVerification !== true) return undefined;

  const configuredCount = nonNegativeInteger(details.configuredDefaultTagCount);
  const reportedLowerBound = nonNegativeInteger(details.reportedTagCountLowerBound);
  const belowLowerBound = details.configuredTagCountBelowReportedLowerBound === true;

  if (belowLowerBound) {
    const countSummary = configuredCount !== undefined && reportedLowerBound !== undefined
      ? `Forum báo cần ít nhất ${reportedLowerBound} tag nhưng hiện mới cấu hình ${configuredCount}.`
      : "Số defaultTags đang cấu hình chưa đạt mức tối thiểu forum công bố.";
    return `${countSummary} Hãy bổ sung defaultTags và đăng thử trên staging; kiểm tra kết nối không xác nhận quy tắc tag.`;
  }

  const requiredGroupCount = Array.isArray(details.requiredTagGroups)
    ? details.requiredTagGroups.length
    : 0;
  if (requiredGroupCount > 0 || (reportedLowerBound ?? 0) > 0) {
    const groupSummary = requiredGroupCount > 0
      ? ` (${requiredGroupCount} nhóm tag bắt buộc)`
      : "";
    return `Forum có chính sách tag theo category/nhóm tag${groupSummary}. Hãy đăng thử trên staging; kiểm tra kết nối chỉ xác nhận quyền API, không xác nhận topic sẽ vượt qua quy tắc tag.`;
  }

  const configuredSummary = configuredCount !== undefined
    ? `Đã cấu hình ${configuredCount} defaultTags.`
    : "Đã cấu hình defaultTags.";
  return `${configuredSummary} Hãy đăng thử trên staging để xác minh từng tag tồn tại và tài khoản/category được phép sử dụng; kiểm tra kết nối chỉ xác nhận quyền API.`;
}

export function getBrowserConnectionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return getErrorMessage(error);
  const reason = typeof error.details?.reason === "string" ? error.details.reason : "";
  const normalized = `${reason} ${error.message}`.toLowerCase();
  const requestId = error.requestId ? ` Mã yêu cầu: ${error.requestId}.` : "";

  if (["login", "auth", "session", "captcha", "turnstile", "cloudflare", "otp", "2fa"]
    .some((keyword) => normalized.includes(keyword))) {
    return `Session trình duyệt cần được đăng nhập hoặc xác minh lại. Chạy helper đăng nhập rồi kiểm tra session lần nữa.${requestId}`;
  }
  if (reason === "EDITOR_NOT_FOUND" || normalized.includes("editor")) {
    return `Không tìm thấy trình soạn thảo đã kiểm thử. Kiểm tra lại box/đường dẫn đã cấu hình; nếu giao diện nền tảng vừa thay đổi, adapter cần được cập nhật.${requestId}`;
  }
  if (reason === "AUTOMATION_DISABLED" || normalized.includes("automation is disabled")) {
    return `Playwright đang bị tắt trên backend. Bật BROWSER_AUTOMATION_ENABLED và khởi động lại worker trước khi kiểm tra.${requestId}`;
  }
  return `${error.message}${requestId}`;
}
