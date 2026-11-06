"use client";
import Link from "next/link";
import { AlertTriangle, BellRing, CheckCircle2, Clock3, Puzzle, Copy, KeyRound, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAccountHealth } from "@/hooks/use-resources";
import { fromNow } from "@/lib/utils";
import type { AttentionAccount } from "@/services/resources.service";

function AccountRow({ account, expiring }: { account: AttentionAccount; expiring?: boolean }) {
  return <li className="flex items-center gap-3 px-5 py-3">
    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${expiring ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>{expiring ? <Clock3 className="size-4" /> : <KeyRound className="size-4" />}</span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-bold">{account.platformName} · {account.name}</p>
      <p className="mt-0.5 text-[11px] text-muted">{expiring
        ? `Token hết hạn ${fromNow(account.expiresAt)}${account.autoRefresh ? " — tự gia hạn đang lỗi" : " — cần kết nối lại"}`
        : "Cần bấm Kết nối lại ở trang Tài khoản"}</p>
    </div>
    {expiring ? <Badge value="EXPIRED" className="hidden sm:inline-flex" /> : <Badge value={account.status} />}
  </li>;
}

type AttentionData = NonNullable<ReturnType<typeof useAccountHealth>["data"]>;

/** True when nothing needs the operator and nothing is moving on its own either. */
export function attentionClear(data: AttentionData): boolean {
  return data.total === 0 && data.jobs.retrying === 0 && data.jobs.waitingExtension === 0;
}

/**
 * The accounts and posts to act on, shared by the Dashboard card and the
 * notification modal. `onNavigate` runs when a link is followed (the modal closes).
 */
export function AttentionBody({ data, variant = "card", onNavigate }: { data: AttentionData; variant?: "card" | "modal"; onNavigate?: () => void }) {
  const jobRows = [
    { label: "Bài cần thao tác", hint: "CAPTCHA, đăng nhập, xác nhận thủ công", value: data.jobs.needsAction, icon: BellRing, status: "NEEDS_ACTION" },
    { label: "Bài thất bại", hint: "Đã hết lượt thử lại", value: data.jobs.failed, icon: AlertTriangle, status: "FAILED" },
    { label: "Có thể đăng trùng", hint: "Cần kiểm tra trên nền tảng", value: data.jobs.possibleDuplicate, icon: Copy, status: "POSSIBLE_DUPLICATE" },
    { label: "Đang thử lại", hint: "Hệ thống tự xử lý", value: data.jobs.retrying, icon: RotateCcw, status: "RETRY" },
    { label: "Chờ tiện ích Chrome", hint: data.extension.offline ? "Không có Chrome nào đang chạy tiện ích" : "Tiện ích sẽ tự đăng", value: data.jobs.waitingExtension, icon: Puzzle, status: data.extension.offline ? "EXTENSION_OFFLINE" : "WAITING_EXTENSION" },
  ].filter((row) => row.value > 0);
  const accountCount = data.accounts.problems.length + data.accounts.expiringSoon.length;
  const modal = variant === "modal";
  const pad = modal ? "px-1" : "px-5";
  return <div className={modal ? "space-y-5" : "grid border-t border-border lg:grid-cols-2"}>
    <section aria-label="Tài khoản cần xử lý" className={modal ? "" : "border-border lg:border-r"}>
      <div className={`flex items-center justify-between ${pad} pb-1 ${modal ? "" : "pt-4"}`}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tài khoản ({accountCount})</p><Link href="/accounts" onClick={onNavigate} className="text-xs font-semibold text-primary hover:underline">Mở Tài khoản</Link></div>
      {accountCount ? <ul className={`divide-y divide-border ${modal ? "[&>li]:px-1" : ""}`}>
        {data.accounts.problems.map((account) => <AccountRow key={account.id} account={account} />)}
        {data.accounts.expiringSoon.map((account) => <AccountRow key={account.id} account={account} expiring />)}
      </ul> : <p className={`${pad} py-4 text-xs text-muted`}>Không có tài khoản cần kết nối lại.</p>}
    </section>
    <section aria-label="Bài đăng cần xử lý">
      <div className={`flex items-center justify-between ${pad} pb-1 ${modal ? "" : "pt-4"}`}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bài đăng</p><Link href="/publishing" onClick={onNavigate} className="text-xs font-semibold text-primary hover:underline">Mở Xuất bản</Link></div>
      {jobRows.length ? <ul className="divide-y divide-border">{jobRows.map(({ label, hint, value, icon: Icon, status }) => <li key={label} className={`flex items-center gap-3 ${pad} py-3`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold">{label}</p><p className="mt-0.5 text-[11px] text-muted">{hint}</p></div>
        <Badge value={status} dot={false} className="tabular-nums" />
        <span className="w-8 text-right text-sm font-bold tabular-nums">{value}</span>
      </li>)}</ul> : <p className={`${pad} py-4 text-xs text-muted`}>Không có bài đăng bị kẹt.</p>}
    </section>
  </div>;
}

/** All clear: every account connected and no post stuck. */
export function AttentionClear() {
  return <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800"><CheckCircle2 className="size-5 shrink-0" /><p>Mọi tài khoản đang kết nối tốt và không có bài nào bị kẹt. Token Instagram/Threads/Blogger được hệ thống tự gia hạn.</p></div>;
}

/** What the operator must act on: broken accounts, expiring tokens and stuck posts. */
export function AttentionPanel() {
  const health = useAccountHealth();
  if (health.isError) return <Card id="can-xu-ly"><ErrorState compact error={health.error} onRetry={() => void health.refetch()} /></Card>;
  const data = health.data;

  return <Card id="can-xu-ly" className="mt-5">
    <CardHeader>
      <div>
        <CardTitle>Cần xử lý</CardTitle>
        <p className="mt-1 text-xs text-muted">{data?.alertsEnabled ? "Cảnh báo cũng được gửi về kênh chat đã cấu hình." : "Chưa cấu hình ALERT_WEBHOOK_URL nên chỉ hiển thị tại đây."}</p>
      </div>
      {data && <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${data.total ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{data.total ? `${data.total} việc` : "Ổn định"}</span>}
    </CardHeader>
    {health.isPending ? <CardContent><div className="space-y-3"><Skeleton /><Skeleton /></div></CardContent>
      : data && attentionClear(data) ? <CardContent><AttentionClear /></CardContent>
        : data && <AttentionBody data={data} />}
  </Card>;
}
