"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useResourceMutation } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { resourcesService, type ApiAccountImportResult, type ApiAccountImportStatus } from "@/services/resources.service";
import { oauthProviderForPlatform } from "./oauth";

const STATUS: Record<ApiAccountImportStatus, { label: string; className: string }> = {
  CONNECTED: { label: "Đã kết nối", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/10" },
  CHECK_FAILED: { label: "Kiểm tra lỗi", className: "bg-red-50 text-red-700 ring-red-600/10" },
  OAUTH_REQUIRED: { label: "Cần bấm Kết nối", className: "bg-amber-50 text-amber-700 ring-amber-600/10" },
  INVALID_ROW: { label: "Dòng không hợp lệ", className: "bg-red-50 text-red-700 ring-red-600/10" },
  NOT_SUPPORTED: { label: "Chưa hỗ trợ", className: "bg-slate-100 text-slate-600 ring-slate-500/10" },
  ACCOUNT_BUSY: { label: "Đang bận", className: "bg-amber-50 text-amber-700 ring-amber-600/10" },
  DUPLICATE_ROW: { label: "Trùng dòng", className: "bg-slate-100 text-slate-600 ring-slate-500/10" },
};

export function ApiImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ApiAccountImportResult>();
  const [error, setError] = useState("");
  const importAccounts = useResourceMutation(() => resourcesService.importApiAccounts(file!), ["accounts"]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setResult(undefined);
    if (!file || file.size > 2 * 1024 * 1024) { setError("Chọn file XLSX, CSV hoặc TSV tối đa 2 MiB."); return; }
    try { setResult(await importAccounts.mutateAsync(undefined)); setFile(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể nhập file cấu hình API."); }
  };
  const connect = async (provider: string) => {
    try { window.location.assign((await resourcesService.oauthStart(provider)).authorizationUrl); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không thể bắt đầu kết nối"); }
  };
  return <Modal open={open} onClose={() => { if (!importAccounts.isPending) onClose(); }} className="max-w-2xl" title="Nhập file cấu hình API" description="Mỗi dòng một tài khoản kèm khoá API. Hệ thống lưu khoá đã mã hoá và tự kiểm tra kết nối từng tài khoản.">
    <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="api-import-file">File cấu hình</Label><Input id="api-import-file" type="file" accept=".xlsx,.csv,.tsv" onChange={event => { setFile(event.target.files?.[0]); setResult(undefined); setError(""); }} /></div>
      <div className="space-y-2 text-xs leading-5 text-muted">
        {/* After an import the results matter more; keep only the reminder about the secret file. */}
        {!result && <>
          <p>Dùng cho dev.to, Mastodon, Bluesky, Discord, Discourse và WordPress tự cài. Cột bắt buộc: Nền tảng, Khoá bí mật; tuỳ nền tảng cần thêm URL, Username / Handle, Category ID. Bluesky dùng App Password, không dùng mật khẩu đăng nhập.</p>
          <p>Instagram, Threads, Blogger, LinkedIn, Tumblr cần bấm Kết nối một lần; file sẽ báo các dòng này kèm nút Kết nối.</p>
        </>}
        <p className="font-semibold text-foreground">File chứa khoá bí mật: xoá file sau khi nhập và không gửi qua chat. Hệ thống không hiển thị lại khoá.</p>
      </div>
      {!result && <a href="/templates/api-accounts.csv" download className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">Tải file mẫu</a>}
      {importAccounts.isPending && <p role="status" className="text-sm text-muted">Đang lưu và kiểm tra kết nối từng tài khoản, có thể mất vài chục giây…</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {result && <div role="status" className="space-y-3 rounded-xl border border-border p-3">
        <p className="text-sm font-semibold">Đã kết nối {result.connected}/{result.total} dòng{result.needsAttention ? `, ${result.needsAttention} dòng cần xem lại` : ""}.</p>
        <ul className="space-y-2">
          {result.rows.map(row => {
            const status = STATUS[row.status];
            const provider = row.status === "OAUTH_REQUIRED" ? oauthProviderForPlatform(row.slug) : undefined;
            return <li key={`${row.row}-${row.name}`} className="rounded-lg bg-slate-50 p-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-muted">Dòng {row.row}</span>
                <span className="font-semibold">{row.name || row.platform}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset", status.className)}>{status.label}</span>
                {provider && <Button type="button" variant="secondary" className="ml-auto min-h-11" onClick={() => void connect(provider)}><LogIn className="size-4" />Kết nối</Button>}
              </div>
              <p className="mt-1 break-words leading-5 text-muted">{row.message}</p>
            </li>;
          })}
        </ul>
      </div>}
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" className="min-h-11" disabled={importAccounts.isPending} onClick={onClose}>Đóng</Button><Button type="submit" className="min-h-11" loading={importAccounts.isPending} disabled={!file}><KeyRound className="size-4" />Nhập & kiểm tra</Button></div>
    </form>
  </Modal>;
}
