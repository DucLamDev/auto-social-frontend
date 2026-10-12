"use client";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, Layers3, RadioTower, Send, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/page-header";
import { useAccounts, usePlatforms, usePublishJobMetrics, usePublishJobs } from "@/hooks/use-resources";
import { compactNumber, formatDate } from "@/lib/utils";

const statusIcon = { PUBLISHED: CheckCircle2, FAILED: AlertCircle, PUBLISHING: RadioTower, PROCESSING: Clock3, QUEUED: Clock3, SCHEDULED: CalendarClock } as const;
export function DashboardView() {
  const now = new Date(); const todayFrom = new Date(now); todayFrom.setHours(0, 0, 0, 0); const todayTo = new Date(now); todayTo.setHours(23, 59, 59, 999); const trendFrom = new Date(todayFrom); trendFrom.setDate(trendFrom.getDate() - 6);
  const platforms = usePlatforms({ limit: 100 }); const accounts = useAccounts({ limit: 1000 }); const jobs = usePublishJobs({ limit: 1000, from: trendFrom.toISOString(), to: todayTo.toISOString() }); const metrics = usePublishJobMetrics(todayFrom.toISOString(), todayTo.toISOString());
  const pending = platforms.isPending || accounts.isPending || jobs.isPending || metrics.isPending; const error = platforms.error || accounts.error || jobs.error || metrics.error;
  if (error && !pending) return <><PageHeader title="Dashboard" description="Tổng quan hoạt động xuất bản." /><Card><ErrorState error={error} onRetry={() => { void platforms.refetch(); void accounts.refetch(); void jobs.refetch(); void metrics.refetch(); }} /></Card></>;
  const jobItems = jobs.data?.items ?? [];
  const stats = [
    { label: "Đã đăng hôm nay", value: metrics.data?.publishedToday ?? 0, icon: Send, color: "bg-emerald-50 text-emerald-600", note: "Hoàn tất" },
    { label: "Đã lên lịch", value: metrics.data?.scheduled ?? 0, icon: CalendarClock, color: "bg-indigo-50 text-indigo-600", note: "Đang chờ" },
    { label: "Đang xử lý", value: metrics.data?.processing ?? 0, icon: RadioTower, color: "bg-sky-50 text-sky-600", note: "Live" },
    { label: "Thất bại", value: metrics.data?.failed ?? 0, icon: AlertCircle, color: "bg-red-50 text-red-600", note: "Cần kiểm tra" },
    { label: "Tài khoản kết nối", value: accounts.data?.items.filter((a) => a.status === "CONNECTED" && a.enabled).length ?? 0, icon: UsersRound, color: "bg-violet-50 text-violet-600", note: "Đang bật" },
    { label: "Nền tảng khả dụng", value: platforms.data?.items.filter((p) => p.enabled).length ?? 0, icon: Layers3, color: "bg-amber-50 text-amber-600", note: "Connectors" },
  ];
  const daily = Array.from({ length: 7 }, (_, offset) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset)); const count = jobItems.filter((j) => j.status === "PUBLISHED" && j.finishedAt && new Date(j.finishedAt).toDateString() === date.toDateString()).length; return { label: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date), count }; });
  const max = Math.max(...daily.map((d) => d.count), 1);
  return <div className="animate-enter"><PageHeader eyebrow="Tổng quan" title="Chào buổi làm việc 👋" description="Một góc nhìn nhanh về luồng nội dung và trạng thái phân phối của bạn." action={<Link href="/studio" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold shadow-sm hover:bg-slate-50">Mở Content Studio<ArrowUpRight className="size-4" /></Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{stats.map(({ label, value, icon: Icon, color, note }) => <Card key={label} className="p-4"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-[18px]" /></span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{note}</span></div><p className="mt-5 text-2xl font-bold tracking-tight">{pending ? <Skeleton className="h-7 w-14" /> : compactNumber(value)}</p><p className="mt-1 text-xs text-muted">{label}</p></Card>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Card><CardHeader><div><CardTitle>Hiệu suất 7 ngày</CardTitle><p className="mt-1 text-xs text-muted">Số publish job hoàn tất mỗi ngày</p></div><Badge value="PUBLISHED" /></CardHeader><CardContent>{pending ? <Skeleton className="h-56" /> : <div className="flex h-56 items-end gap-3 pt-5 sm:gap-5">{daily.map((day) => <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-slate-500">{day.count || ""}</span><div className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400 transition-all" style={{ height: `${Math.max((day.count / max) * 82, day.count ? 8 : 2)}%`, opacity: day.count ? 1 : .18 }} /><span className="text-[10px] font-medium capitalize text-slate-400">{day.label}</span></div>)}</div>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Hoạt động gần đây</CardTitle><Link href="/publishing" className="text-xs font-semibold text-primary hover:underline">Xem tất cả</Link></CardHeader><div>{pending ? <div className="space-y-5 p-5"><Skeleton /><Skeleton /><Skeleton /></div> : jobItems.slice(0, 5).length ? jobItems.slice(0, 5).map((job) => { const Icon = statusIcon[job.status as keyof typeof statusIcon] ?? Clock3; return <div key={job.id} className="flex gap-3 border-b border-border px-5 py-3.5 last:border-0"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{job.contentTitle}</p><p className="mt-1 truncate text-[11px] text-muted">{job.platform} · {job.account}</p></div><div className="text-right"><Badge value={job.status} dot={false} /><p className="mt-1 text-[10px] text-slate-400">{formatDate(job.finishedAt || job.startedAt, "HH:mm")}</p></div></div>; }) : <div className="grid min-h-56 place-items-center px-5 text-center"><div><CheckCircle2 className="mx-auto size-7 text-emerald-400" /><p className="mt-2 text-sm font-semibold">Hàng đợi đang trống</p><p className="mt-1 text-xs text-muted">Job mới sẽ hiện ở đây.</p></div></div>}</div></Card>
    </div>
  </div>;
}
