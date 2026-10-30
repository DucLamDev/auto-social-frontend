import type { Status } from "@/types/domain";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", CONNECTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", READY: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  QUEUED: "bg-indigo-50 text-indigo-700 ring-indigo-600/10", SCHEDULED: "bg-indigo-50 text-indigo-700 ring-indigo-600/10", GENERATED: "bg-indigo-50 text-indigo-700 ring-indigo-600/10", APPROVED: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  PUBLISHING: "bg-sky-50 text-sky-700 ring-sky-600/10", PROCESSING: "bg-sky-50 text-sky-700 ring-sky-600/10", AI_GENERATING: "bg-sky-50 text-sky-700 ring-sky-600/10",
  RETRY: "bg-amber-50 text-amber-700 ring-amber-600/10", WAITING_REVIEW: "bg-amber-50 text-amber-700 ring-amber-600/10", NEEDS_ACTION: "bg-amber-50 text-amber-700 ring-amber-600/10", POSSIBLE_DUPLICATE: "bg-amber-50 text-amber-700 ring-amber-600/10", API_REVIEW_REQUIRED: "bg-amber-50 text-amber-700 ring-amber-600/10", CREDENTIAL_REQUIRED: "bg-amber-50 text-amber-700 ring-amber-600/10",
  FAILED: "bg-red-50 text-red-700 ring-red-600/10", ERROR: "bg-red-50 text-red-700 ring-red-600/10", EXPIRED: "bg-red-50 text-red-700 ring-red-600/10", RECONNECT_REQUIRED: "bg-red-50 text-red-700 ring-red-600/10",
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-500/10", INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/10", DISCONNECTED: "bg-slate-100 text-slate-600 ring-slate-500/10", PAUSED: "bg-slate-100 text-slate-600 ring-slate-500/10", API_RESEARCH_REQUIRED: "bg-slate-100 text-slate-600 ring-slate-500/10", MANUAL_ONLY: "bg-slate-100 text-slate-600 ring-slate-500/10",
  RUNNING: "bg-sky-50 text-sky-700 ring-sky-600/10", COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", PARTIAL: "bg-amber-50 text-amber-700 ring-amber-600/10", CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/10", DISABLED: "bg-slate-100 text-slate-600 ring-slate-500/10", REJECTED: "bg-red-50 text-red-700 ring-red-600/10",
  WAITING_EXTENSION: "bg-indigo-50 text-indigo-700 ring-indigo-600/10", EXTENSION_OFFLINE: "bg-red-50 text-red-700 ring-red-600/10",
  DISCOVERED: "bg-sky-50 text-sky-700 ring-sky-600/10", FETCHED: "bg-indigo-50 text-indigo-700 ring-indigo-600/10", DUPLICATE: "bg-amber-50 text-amber-700 ring-amber-600/10",
};
const labels: Record<string, string> = { PUBLISHED: "Đã đăng", CONNECTED: "Đã kết nối", ACTIVE: "Hoạt động", READY: "Sẵn sàng", SUCCESS: "Thành công", QUEUED: "Trong hàng đợi", SCHEDULED: "Đã lên lịch", GENERATED: "Đã tạo", APPROVED: "Đã duyệt", PUBLISHING: "Đang đăng", PROCESSING: "Đang xử lý", AI_GENERATING: "AI đang tạo", RETRY: "Đang thử lại", WAITING_REVIEW: "Chờ duyệt", NEEDS_ACTION: "Cần thao tác", POSSIBLE_DUPLICATE: "Có thể trùng", FAILED: "Thất bại", ERROR: "Có lỗi", EXPIRED: "Hết hạn", RECONNECT_REQUIRED: "Cần kết nối lại", DRAFT: "Bản nháp", INACTIVE: "Tắt", DISABLED: "Đã tắt", DISCONNECTED: "Chưa kết nối", PAUSED: "Tạm dừng", API_REVIEW_REQUIRED: "Cần API review", CREDENTIAL_REQUIRED: "Cần thông tin xác thực", API_RESEARCH_REQUIRED: "Cần nghiên cứu API", MANUAL_ONLY: "Chỉ đăng thủ công", RUNNING: "Đang chạy", COMPLETED: "Hoàn tất", PARTIAL: "Hoàn tất một phần", CANCELLED: "Đã hủy", ARCHIVED: "Lưu trữ", REJECTED: "Từ chối", DISCOVERED: "Đã phát hiện", FETCHED: "Đã thu thập", DUPLICATE: "Trùng lặp", WAITING_EXTENSION: "Chờ tiện ích", EXTENSION_OFFLINE: "Chrome chưa chạy" };

styles.AUTHENTICATED = styles.CONNECTED!;
styles.MODERATION_PENDING = styles.WAITING_REVIEW!;
labels.MODERATION_PENDING = "Đã gửi · chờ duyệt";
labels.AUTHENTICATED = "Đã đăng nhập";
styles.CHROME_BOUND = styles.WAITING_EXTENSION!;
labels.CHROME_BOUND = "Đã gán Chrome";

export function Badge({ value, className, dot = true }: { value: Status | string; className?: string; dot?: boolean }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset", styles[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/10", className)}>{dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}{labels[value] ?? value.replaceAll("_", " ")}</span>;
}
