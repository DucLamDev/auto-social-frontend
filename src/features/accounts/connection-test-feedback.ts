import type { AccountConnectionTestResult } from "@/services/resources.service";

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
