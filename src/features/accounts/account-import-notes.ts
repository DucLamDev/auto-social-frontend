import type { AccountImportResult } from "@/services/resources.service";

type ImportRow = AccountImportResult["rows"][number];

const ISSUES: Record<string, string> = {
  ACCOUNT_BUSY: "đang chạy tác vụ, chưa thay cấu hình",
  PLATFORM_NOT_SUPPORTED: "nền tảng này chưa đăng được bằng tiện ích",
  LOGIN_EMAIL_REQUIRED: "đăng nhập Google cần đúng địa chỉ email",
  INVALID_TOTP: "khoá 2FA không hợp lệ (cần khoá thiết lập, không phải mã 6 số)",
  INVALID_POST_DESTINATION: "trang đăng không đúng dạng của luồng (xem hướng dẫn của nền tảng)",
};

/** What happened to one imported social, in the operator's words; null when it is ready. */
export function importRowNote(row: ImportRow): string | null {
  if (row.issue) return ISSUES[row.issue] ?? `kiểm tra thông tin dòng ${row.row}`;
  if (row.setup === "UNCHANGED") return "đã có, không đổi gì nên bỏ qua";
  if (row.setup === "DESTINATION_REQUIRED") return "cần trang đăng (URL tạo bài)";
  if (row.setup === "FLOW_REQUIRED") return "chưa có luồng đăng bài cho nền tảng này";
  return null;
}

/** One-line summary of an import: new / updated, skipped, sent to Chrome. */
export function importSummary(result: AccountImportResult): string {
  const skipped = result.skipped ? `, bỏ qua ${result.skipped} social đã có không đổi` : "";
  return `Đã thêm / cập nhật ${result.imported} social${skipped}; giao Chrome đăng nhập thử ${result.queued} social.`;
}
