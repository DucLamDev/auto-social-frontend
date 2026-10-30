"use client";
import { ExternalLink, Puzzle, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useResourceMutation } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";
import type { PlatformAccount } from "@/types/domain";
import { extensionConnectionHelp } from "./extension-connection-help";

export function ExtensionConnectionHelpModal({ account, check, onClose, onSession, onDelivery }: {
  account: PlatformAccount | null; check?: { status: string; message?: string | null };
  onClose: () => void; onSession: (account: PlatformAccount) => void; onDelivery: (account: PlatformAccount) => void;
}) {
  const verify = useResourceMutation((id: string) => resourcesService.queueExtensionLoginChecks([id], true), ["extension-login-checks", "accounts"]);
  if (!account) return null;
  const help = extensionConnectionHelp(account, check);
  const run = async () => {
    try { const result = await verify.mutateAsync(account.id); toast.success(result.queued ? "Đã giao Chrome kiểm tra phiên hiện tại" : "Tài khoản đã có lượt kiểm tra đang chạy"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không tạo được lượt kiểm tra"); }
  };
  return <Modal open onClose={onClose} title={`Kết nối ${account.name}`} description="Nguyên nhân hiện tại và cách hoàn tất kết nối trong Chrome.">
    <div className="space-y-5">
      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6" role="status">{help.reason}</p>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6">{help.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      <div className="flex flex-wrap gap-2">
        {help.loginUrl && <a href={help.loginUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink className="size-4" />Mở nền tảng</a>}
        {help.profileUrl && <a href={help.profileUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink className="size-4" />Hồ sơ đã cấu hình</a>}
        <Button variant="secondary" size="sm" onClick={() => { onClose(); onSession(account); }}><Settings2 className="size-4" />Phiên Chrome / 2FA</Button>
        {help.hasFlow && <Button variant="secondary" size="sm" onClick={() => { onClose(); onDelivery(account); }}><Puzzle className="size-4" />Cấu hình đăng bài</Button>}
      </div>
      <Button loading={verify.isPending} onClick={() => void run()}><RefreshCw className="size-4" />Tôi đã đăng nhập · Kiểm tra</Button>
    </div>
  </Modal>;
}
