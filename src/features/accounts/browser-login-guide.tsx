"use client";

import { CheckCircle2, Copy, LockKeyhole, RefreshCw, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PlatformAccount } from "@/types/domain";

export function buildBrowserLoginCommand(accountId: string) {
  return `corepack pnpm browser:login ${accountId}`;
}

export function BrowserLoginGuide({
  account,
  busy,
  onClose,
  onVerify,
}: {
  account: PlatformAccount | null;
  busy: boolean;
  onClose: () => void;
  onVerify: (account: PlatformAccount) => Promise<boolean>;
}) {
  if (!account) return null;
  const command = buildBrowserLoginCommand(account.id);
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(command);
      toast.success("Đã sao chép lệnh đăng nhập Playwright");
    } catch {
      toast.info("Không thể tự sao chép; hãy chọn lệnh trong khung bên dưới.");
    }
  };

  return <Modal
    open
    onClose={onClose}
    title={account.status === "CONNECTED" ? "Làm mới session Playwright" : "Hoàn tất đăng nhập Playwright"}
    description="Đăng nhập diễn ra trực tiếp trong Chromium trên máy chạy backend; ứng dụng không nhận mật khẩu, OTP hoặc CAPTCHA."
    className="max-w-2xl"
  >
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-slate-50 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{account.name}</p>
          <p className="mt-1 text-xs text-muted">{account.platform?.name ?? "Playwright"} · ID {account.id}</p>
        </div>
        <Badge value={account.status} />
      </div>

      <ol className="space-y-3 text-sm leading-6 text-slate-700">
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">1</span><span>Mở terminal tại thư mục <strong>social-publisher-backend</strong> trên máy đang chạy backend và chạy lệnh bên dưới.</span></li>
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">2</span><span>Trong cửa sổ Chromium được mở, tự đăng nhập và hoàn thành 2FA/CAPTCHA nếu nền tảng yêu cầu. Không nhập thông tin đăng nhập vào ứng dụng hoặc terminal.</span></li>
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">3</span><span>Mở đúng trình soạn thảo. Helper sẽ tự nhận biết; nếu cần, quay lại terminal và nhấn Enter. Sau khi terminal báo lưu session thành công, bấm <strong>Kiểm tra session</strong>.</span></li>
      </ol>

      <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"><Terminal className="size-4" />PowerShell / terminal</span>
          <Button type="button" variant="ghost" size="sm" className="text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => void copy()}><Copy className="size-4" />Sao chép</Button>
        </div>
        <code aria-label="Lệnh đăng nhập Playwright" className="block overflow-x-auto whitespace-nowrap text-xs">{command}</code>
      </div>

      <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        <p>Chỉ storage state của trình duyệt được mã hóa trong backend. Mật khẩu social, OTP và nội dung CAPTCHA không được gửi qua API.</p>
      </div>

      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>
        <Button type="button" loading={busy} onClick={() => void onVerify(account)}>
          {account.status === "CONNECTED" ? <RefreshCw className="size-4" /> : <CheckCircle2 className="size-4" />}
          Kiểm tra session
        </Button>
      </div>
    </div>
  </Modal>;
}
