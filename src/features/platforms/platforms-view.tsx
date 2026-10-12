"use client";

import {
  BarChart3,
  CalendarClock,
  Check,
  CircleOff,
  Image,
  Newspaper,
  RefreshCw,
  RotateCcw,
  Text,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, Switch } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Toolbar } from "@/components/ui/toolbar";
import { useAccounts, usePlatforms, useResourceMutation } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { ConnectorMode, Platform, PlatformAvailability, PlatformGroup } from "@/types/domain";
import { getPlatformConnectionStatus } from "./platform-connection-status";

const PAGE_SIZE = 12;
const capabilityIcons = {
  text: Text,
  image: Image,
  video: Video,
  article: Newspaper,
  delete: Trash2,
  schedule: CalendarClock,
  analytics: BarChart3,
};

const groupLabels: Record<PlatformGroup, string> = {
  SOCIAL: "Mạng xã hội",
  BLOGGING: "Blog & xuất bản",
  COMMUNITY: "Cộng đồng",
  FORUM: "Diễn đàn",
  DEVELOPER: "Cộng đồng lập trình",
  MEDIA: "Media & nội dung",
  COMMERCE: "Thương mại",
  EVENT: "Sự kiện",
};

const modeLabels: Record<ConnectorMode, string> = {
  OFFICIAL_API: "API chính thức",
  COMPATIBLE_API: "API tương thích",
  BROWSER_ASSISTED: "Trình duyệt hỗ trợ",
  MANUAL: "Đăng thủ công",
};

const availabilityOptions: Array<{ value: PlatformAvailability; label: string }> = [
  { value: "READY", label: "Sẵn sàng" },
  { value: "CREDENTIAL_REQUIRED", label: "Cần cấu hình tài khoản" },
  { value: "MANUAL_ONLY", label: "Chỉ đăng thủ công" },
  { value: "API_REVIEW_REQUIRED", label: "Cần API review" },
  { value: "API_RESEARCH_REQUIRED", label: "Cần nghiên cứu API" },
];

type PlatformDisplay = Platform & { displayStatus: string };

function groupPlatforms(items: PlatformDisplay[]) {
  return items.reduce<Array<{ key: string; label: string; items: PlatformDisplay[] }>>((groups, platform) => {
    const key = platform.groupKey ?? "OTHER";
    const current = groups.find((item) => item.key === key);
    if (current) current.items.push(platform);
    else groups.push({ key, label: platform.groupKey ? groupLabels[platform.groupKey] : "Khác", items: [platform] });
    return groups;
  }, []);
}

export function PlatformsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<PlatformGroup | "">("");
  const [mode, setMode] = useState<ConnectorMode | "">("");
  const [availability, setAvailability] = useState<PlatformAvailability | "">("");
  const [enabledStatus, setEnabledStatus] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const query = usePlatforms({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    group: group || undefined,
    mode: mode || undefined,
    availability: availability || undefined,
    enabled: enabledStatus ? enabledStatus === "ACTIVE" : undefined,
  });
  const accounts = useAccounts({ limit: 100 });
  const update = useResourceMutation(
    ({ slug, enabled }: { slug: string; enabled: boolean }) => resourcesService.updatePlatform(slug, { enabled }),
    ["platforms"],
  );
  const items = (query.data?.items ?? []).map((item) => ({
    ...item,
    displayStatus: getPlatformConnectionStatus(item, accounts.data?.items ?? []),
  }));
  const groupedItems = groupPlatforms(items);
  const total = query.data?.meta?.total ?? items.length;
  const totalPages = query.data?.meta?.totalPages ?? (total ? Math.ceil(total / PAGE_SIZE) : 0);
  const hasFilters = Boolean(search || group || mode || availability || enabledStatus);

  const resetFilters = () => {
    setSearch("");
    setGroup("");
    setMode("");
    setAvailability("");
    setEnabledStatus("");
    setPage(1);
  };
  const toggle = async (slug: string, enabled: boolean) => {
    try {
      await update.mutateAsync({ slug, enabled });
      toast.success(enabled ? "Đã bật nền tảng" : "Đã tắt nền tảng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật");
    }
  };

  return (
    <div className="animate-enter">
      <PageHeader
        eyebrow="Kết nối"
        title="Nền tảng"
        description="Danh mục được gom theo nhóm; lọc và phân trang thực hiện trực tiếp trên backend. Mỗi thẻ cho biết mức hỗ trợ và cách đăng hiện có."
        action={(
          <Button variant="secondary" onClick={() => void Promise.all([query.refetch(), accounts.refetch()])}>
            <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        )}
      />
      <Card className="overflow-hidden">
        <Toolbar
          search={search}
          onSearch={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Tìm tên hoặc slug nền tảng…"
          filters={(
            <>
              <Select aria-label="Lọc nhóm nền tảng" className="w-44" value={group} onChange={(event) => { setGroup(event.target.value as PlatformGroup | ""); setPage(1); }}>
                <option value="">Tất cả nhóm</option>
                {Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Select aria-label="Lọc chế độ đăng" className="w-44" value={mode} onChange={(event) => { setMode(event.target.value as ConnectorMode | ""); setPage(1); }}>
                <option value="">Tất cả chế độ</option>
                {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Select aria-label="Lọc mức hỗ trợ" className="w-48" value={availability} onChange={(event) => { setAvailability(event.target.value as PlatformAvailability | ""); setPage(1); }}>
                <option value="">Tất cả mức hỗ trợ</option>
                {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <Select aria-label="Lọc trạng thái bật tắt" className="w-40" value={enabledStatus} onChange={(event) => { setEnabledStatus(event.target.value as "" | "ACTIVE" | "INACTIVE"); setPage(1); }}>
                <option value="">Đang bật & đã tắt</option>
                <option value="ACTIVE">Đang bật</option>
                <option value="INACTIVE">Đã tắt</option>
              </Select>
              {hasFilters && <Button variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="size-4" />Đặt lại</Button>}
            </>
          )}
          end={<p className="whitespace-nowrap text-xs text-muted">{total} nền tảng</p>}
        />
        {query.isPending ? (
          <div className="p-5"><TableSkeleton rows={4} /></div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy nền tảng"
            description={hasFilters ? "Hãy đổi bộ lọc hoặc đặt lại để xem toàn bộ danh mục." : "Chạy seed platform ở backend để nạp danh mục."}
            action={hasFilters ? <Button variant="secondary" onClick={resetFilters}><RotateCcw className="size-4" />Đặt lại bộ lọc</Button> : undefined}
          />
        ) : (
          <div className="space-y-7 p-4 sm:p-5">
            {groupedItems.map((platformGroup) => (
              <section key={platformGroup.key} aria-labelledby={`platform-group-${platformGroup.key}`}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 id={`platform-group-${platformGroup.key}`} className="text-sm font-bold text-slate-800">{platformGroup.label}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{platformGroup.items.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {platformGroup.items.map((platform) => (
                    <article className="rounded-2xl border border-border p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50" key={platform.id}>
                      <div className="flex items-start gap-3">
                        <PlatformMark slug={platform.slug} name={platform.name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold">{platform.name}</h3>
                          <p className="mt-0.5 text-xs text-muted">{modeLabels[platform.mode]}</p>
                        </div>
                        <PermissionGate allow={["ADMIN"]} fallback={<Badge value={platform.enabled ? "ACTIVE" : "INACTIVE"} />}>
                          <Switch checked={platform.enabled} disabled={update.isPending} label={`Bật ${platform.name}`} onChange={(enabled) => void toggle(platform.slug, enabled)} />
                        </PermissionGate>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {Object.entries(capabilityIcons).map(([key, Icon]) => {
                          const supported = platform.capabilities[key as keyof typeof capabilityIcons];
                          return (
                            <span key={key} className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold", supported ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-100 bg-slate-50 text-slate-400")}>
                              {supported ? <Check className="size-3" /> : <CircleOff className="size-3" />}
                              <Icon className="size-3" />
                              {key}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                        <Badge value={platform.displayStatus} />
                        <span className="whitespace-nowrap text-xs font-semibold text-slate-500">{platform.accountCount ?? 0} tài khoản</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        {!query.isPending && !query.isError && (
          <Pagination page={query.data?.meta?.page ?? page} totalPages={totalPages} total={total} onPage={setPage} />
        )}
      </Card>
    </div>
  );
}
