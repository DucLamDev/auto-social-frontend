"use client";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useExtensionLoginChecks, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";

const labels: Record<string, string> = { QUEUED: "Chờ Chrome", RUNNING: "Đang đăng nhập", AUTHENTICATED: "Đăng nhập thành công", NEEDS_ACTION: "Cần xử lý" };
const issues: Record<string, string> = { MISSING_PASSWORD: "Thiếu mật khẩu", MISSING_USERNAME: "Thiếu tên đăng nhập", MISSING_GOOGLE_EMAIL: "Thiếu địa chỉ Gmail để chọn đúng tài khoản Google", CONFLICTING_PASSWORDS: "Mật khẩu giữa hai nguồn khác nhau", CONFLICTING_TOTP_KEYS: "Khóa TOTP giữa hai nguồn khác nhau", INVALID_TOTP_KEY: "Khóa TOTP chưa hợp lệ", LOGIN_URL_NOT_CONFIGURED: "Chưa xác định trang đăng nhập" };
export function ExtensionLoginCheckPanel() {
  const [filter, setFilter] = useState("all");
  const query = useExtensionLoginChecks();
  const queue = useResourceMutation(() => resourcesService.queueExtensionLoginChecks(undefined, false, true), ["extension-login-checks"]);
  const rows = query.data ?? [];
  const visibleRows = rows.filter(row => filter === "all" || (filter === "missing-flow" ? row.posting?.implemented === false : filter === "configured" ? row.posting?.status === "CONFIGURED" : row.check?.status !== "AUTHENTICATED" || row.posting?.status !== "CONFIGURED"));
  const run = async () => {
    try { const result = await queue.mutateAsync(undefined); toast.success(`Đã xếp ${result.queued} tài khoản vào lượt test đăng nhập`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không tạo được lượt test"); }
  };
  if (!rows.length && !query.isError) return null;
  return <section className="mb-5 rounded-2xl border border-border bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Test đăng nhập social</h2><p className="mt-1 text-xs text-muted">Chỉ đăng nhập và xác nhận account. Thành công ở đây chưa xác nhận quyền đăng bài hoặc kết nối API.</p></div>
      <PermissionGate allow={["ADMIN"]}><Button variant="secondary" loading={queue.isPending} disabled={!rows.some(row => row.configured)} onClick={() => void run()}>Test đăng nhập hàng loạt</Button></PermissionGate></div>
    <p className="mt-2 text-xs text-muted">Thử mật khẩu social đã lưu trước, sau đó Google nếu chưa thành công. Thiếu mật khẩu thì dùng Google. Lịch sử từng cách được giữ lại khi kiểm tra phiên.</p>
    <label className="mt-3 flex items-center gap-2 text-xs">Lọc kiểm tra <select className="rounded border border-border p-2" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả</option><option value="configured">Đã cấu hình luồng đăng</option><option value="needs-action">Cần xử lý</option><option value="missing-flow">Chưa có luồng đăng</option></select></label>
    {query.isError ? <p role="alert" className="mt-3 text-sm text-red-600">Không tải được trạng thái đăng nhập. Kiểm tra backend rồi tải lại.</p> : <>
      <p className="my-3 text-xs">{rows.filter(r => r.configured).length} đã cấu hình · {rows.filter(r => r.check?.status === "AUTHENTICATED").length} đăng nhập thành công · {rows.filter(r => r.check?.status === "RUNNING").length} đang chạy · {rows.filter(r => r.check?.status === "QUEUED").length} chờ Chrome</p>
      {rows.some(r => r.configured && r.autoLogin === false) && <p className="mb-3 text-xs text-muted">Tài khoản thiếu thông tin đăng nhập sẽ được kiểm tra bằng phiên có sẵn trong Chrome. Tiện ích chỉ điền mật khẩu khi đã đủ cấu hình.</p>}
      <details><summary className="cursor-pointer text-sm font-semibold">Xem trạng thái {visibleRows.length} account</summary><div className="mt-3 max-h-96 overflow-auto divide-y divide-border">{visibleRows.map(row => <div key={row.id} className="py-3 text-xs"><div className="flex justify-between gap-3"><span className="font-semibold">{row.name}</span><span>{row.check ? labels[row.check.status] ?? row.check.status : row.configured ? "Sẵn sàng test" : "Thiếu cấu hình"}</span></div>{row.check?.detectedUsername && <p className="mt-1">Account nhận diện: {row.check.detectedUsername}</p>}<p className="mt-1 text-muted">{row.check?.message || row.issues.map(issue => issues[issue] ?? issue).join("; ")}</p>{row.posting && <p className="mt-2 text-muted"><strong>Luồng đăng: </strong>{row.posting.message}{row.posting.url && <a className="ml-2 text-primary underline" href={row.posting.url} target="_blank" rel="noreferrer">Hướng dẫn nền tảng</a>}</p>}{row.attempts?.map(attempt => <p key={attempt.method} className="mt-1 text-muted">{attempt.method === "password" ? "Mật khẩu" : "Google"}: {attempt.check ? `${labels[attempt.check.status] ?? attempt.check.status} · ${attempt.check.message || ""}` : attempt.available ? "Chưa cần thử / chưa chạy" : "Không có thông tin cho cách này"}</p>)}</div>)}</div></details>
    </>}
  </section>;
}
