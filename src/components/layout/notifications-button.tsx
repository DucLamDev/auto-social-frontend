"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { AttentionBody, AttentionClear, attentionClear } from "@/features/dashboard/attention-panel";
import { useAccountHealth } from "@/hooks/use-resources";

/**
 * The bell in the top bar: its badge counts what needs the operator, and a
 * click opens the list in a modal on the current page instead of leaving it
 * for the Dashboard.
 */
export function NotificationsButton() {
  const health = useAccountHealth();
  const [open, setOpen] = useState(false);
  const attention = health.data?.total ?? 0;
  const label = attention ? `${attention} việc cần xử lý` : "Không có việc cần xử lý";
  const close = () => setOpen(false);
  const data = health.data;

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={`Thông báo: ${label}`} title={label}
      className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100">
      <Bell className="size-[18px]" />
      {attention > 0 && <span aria-hidden className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">{attention > 99 ? "99+" : attention}</span>}
    </button>
    <Modal open={open} onClose={close} title="Thông báo" description={data ? (attention ? `${attention} việc cần xử lý` : "Không có việc cần xử lý") : undefined} className="max-w-xl">
      {health.isError ? <ErrorState compact error={health.error} onRetry={() => void health.refetch()} />
        : health.isPending || !data ? <div className="space-y-3"><Skeleton /><Skeleton /></div>
          : attentionClear(data) ? <AttentionClear /> : <AttentionBody data={data} variant="modal" onNavigate={close} />}
      {data && <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
        <span>{data.alertsEnabled ? "Cảnh báo cũng được gửi về kênh chat đã cấu hình." : "Chưa cấu hình ALERT_WEBHOOK_URL nên chỉ hiển thị trên web."}</span>
        <Link href="/dashboard#can-xu-ly" onClick={close} className="shrink-0 font-semibold text-primary hover:underline">Xem trên Dashboard</Link>
      </div>}
    </Modal>
  </>;
}
