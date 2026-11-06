"use client";
import { Ban, CheckCircle2, Clock3, Layers, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/domain";

export type ContentStatusFilter = "ALL" | "PROCESSING" | "WAITING_REVIEW" | "APPROVED" | "FAILED" | "REJECTED";

const STEPS: Array<{ value: Exclude<ContentStatusFilter, "ALL">; label: string; icon: LucideIcon; tone: string; bar: string }> = [
  { value: "PROCESSING", label: "Đang tạo", icon: LoaderCircle, tone: "bg-sky-50 text-sky-700", bar: "bg-sky-500" },
  { value: "WAITING_REVIEW", label: "Chờ duyệt", icon: Clock3, tone: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  { value: "APPROVED", label: "Đã duyệt", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  { value: "FAILED", label: "Có lỗi", icon: TriangleAlert, tone: "bg-red-50 text-red-700", bar: "bg-red-500" },
  { value: "REJECTED", label: "Đã từ chối", icon: Ban, tone: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
];

/** Which status tab a content run belongs to; old runs without one (DRAFT…) only show under "Tất cả". */
export function contentStatusOf(campaign: Pick<Campaign, "automationState">): ContentStatusFilter | null {
  const state = campaign.automationState;
  if (state === "QUEUED" || state === "PROCESSING") return "PROCESSING";
  return STEPS.some((step) => step.value === state) ? state as ContentStatusFilter : null;
}

/**
 * Progress of the AI content runs: a bar split by status and one tab per status with its count.
 * Choosing a tab filters the list below.
 */
export function ContentStatusBar({ campaigns, variantCount, value, onChange }: { campaigns: Array<Pick<Campaign, "automationState">>; variantCount: number; value: ContentStatusFilter; onChange: (value: ContentStatusFilter) => void }) {
  const counts = new Map<ContentStatusFilter, number>();
  for (const campaign of campaigns) {
    const status = contentStatusOf(campaign);
    if (status) counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const total = campaigns.length;
  const approved = counts.get("APPROVED") ?? 0;
  const percent = total ? Math.round((approved / total) * 100) : 0;
  const segments = STEPS.filter((step) => counts.get(step.value));
  const summary = segments.map((step) => `${counts.get(step.value)} ${step.label.toLowerCase()}`).join(", ");
  const tabs: Array<{ value: ContentStatusFilter; label: string; icon: LucideIcon; tone: string; count: number }> = [
    { value: "ALL", label: "Tất cả", icon: Layers, tone: "bg-primary-soft text-primary", count: total },
    ...STEPS.map((step) => ({ ...step, count: counts.get(step.value) ?? 0 })),
  ];

  return <section aria-label="Tiến độ nội dung AI" className="mb-5 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
    <p className="text-sm font-bold text-foreground">Tiến độ duyệt <span className="ml-1 font-semibold text-emerald-700">{percent}% đã duyệt</span></p>
    <p className="mt-0.5 text-xs text-muted">{total} lượt nội dung · {variantCount} biến thể · gồm dữ liệu trước đây và Content Studio</p>
    <div role="img" aria-label={total ? `${total} lượt nội dung: ${summary || "chưa có trạng thái"}` : "Chưa có lượt nội dung nào"} className="mt-3 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
      {segments.map((step) => <span key={step.value} title={`${step.label}: ${counts.get(step.value)}`} className={cn("h-full transition-[width] duration-500 motion-reduce:transition-none", step.bar)} style={{ width: `${((counts.get(step.value) ?? 0) / total) * 100}%` }} />)}
    </div>
    <div role="tablist" aria-label="Trạng thái nội dung AI" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {tabs.map((tab) => {
        const active = value === tab.value;
        const Icon = tab.icon;
        return <button key={tab.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(tab.value)}
          className={cn("flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            active ? "border-primary bg-primary-soft shadow-sm" : "border-border bg-white hover:border-slate-300 hover:bg-slate-50")}>
          <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tab.tone)}><Icon className={cn("size-4", tab.value === "PROCESSING" && tab.count > 0 && "motion-safe:animate-spin")} /></span>
          <span className="min-w-0">
            <span className={cn("block truncate text-xs font-semibold", active ? "text-primary" : "text-slate-600")}>{tab.label}</span>{" "}
            <span className={cn("block text-lg font-bold leading-6 tabular-nums", active ? "text-primary" : "text-foreground")}>{tab.count}</span>
          </span>
        </button>;
      })}
    </div>
  </section>;
}
