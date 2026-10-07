"use client";
import { BarChart3, CalendarClock, Check, CircleOff, Image, Newspaper, RefreshCw, Text, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/form";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Toolbar } from "@/components/ui/toolbar";
import { usePlatforms, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";

const capabilityIcons = { text: Text, image: Image, video: Video, article: Newspaper, delete: Trash2, schedule: CalendarClock, analytics: BarChart3 };
export function PlatformsView() {
  const [search, setSearch] = useState(""); const query = usePlatforms({ limit: 100 });
  const update = useResourceMutation(({ id, enabled }: { id: string; enabled: boolean }) => resourcesService.updatePlatform(id, { enabled }), ["platforms"]);
  const items = (query.data?.items ?? []).filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = async (id: string, enabled: boolean) => { try { await update.mutateAsync({ id, enabled }); toast.success(enabled ? "Đã bật nền tảng" : "Đã tắt nền tảng"); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể cập nhật"); } };
  return <div className="animate-enter"><PageHeader eyebrow="Kết nối" title="Nền tảng" description="Capabilities được cung cấp bởi backend connector; giao diện không tự suy đoán khả năng của nền tảng." action={<Button variant="secondary" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Làm mới</Button>} />
    <Card className="overflow-hidden"><Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm nền tảng…" end={<p className="text-xs text-muted">{query.data?.items.length ?? 0} connectors</p>} />
      {query.isPending ? <div className="p-5"><TableSkeleton rows={4} /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : items.length === 0 ? <EmptyState title="Không tìm thấy nền tảng" description="Thử từ khóa khác hoặc chạy seed platform ở backend." /> : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((platform) => <article className="rounded-2xl border border-border p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50" key={platform.id}><div className="flex items-start gap-3"><PlatformMark slug={platform.slug} name={platform.name} size="lg" /><div className="min-w-0 flex-1"><h2 className="font-bold">{platform.name}</h2><p className="mt-0.5 text-xs text-muted">{platform.mode.replaceAll("_", " ")}</p></div><PermissionGate allow={["ADMIN"]} fallback={<Badge value={platform.enabled ? "ACTIVE" : "INACTIVE"} />}><Switch checked={platform.enabled} disabled={update.isPending} label={`Bật ${platform.name}`} onChange={(enabled) => void toggle(platform.id, enabled)} /></PermissionGate></div><div className="mt-5 flex flex-wrap gap-1.5">{Object.entries(capabilityIcons).map(([key, Icon]) => { const supported = platform.capabilities[key as keyof typeof capabilityIcons]; return <span key={key} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold ${supported ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-100 bg-slate-50 text-slate-400"}`}>{supported ? <Check className="size-3" /> : <CircleOff className="size-3" />}<Icon className="size-3" />{key}</span>; })}</div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><Badge value={platform.connectorStatus ?? "API_RESEARCH_REQUIRED"} /><span className="text-xs font-semibold text-slate-500">{platform.accountCount ?? 0} tài khoản</span></div></article>)}</div>}
    </Card>
  </div>;
}
