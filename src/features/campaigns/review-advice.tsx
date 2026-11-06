"use client";

import { WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { useResourceMutation } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { ContentVariant } from "@/types/domain";
import { reviewPoints } from "./campaign-utils";
import { isRewriting } from "./variant-rewrite-panel";

const FALLBACK = "Nội dung cần được chỉnh sửa trước khi đăng.";

/**
 * The AI editor's recommendations for one post, one per line. While the post
 * is still a draft, each can be ticked and "Sửa theo khuyến nghị" has the
 * reviser (Claude Opus by default) edit only the ticked points, keeping the
 * rest of the post, then score it again. Remount it (key) when the review
 * changes so a new review starts with every point ticked.
 */
export function ReviewAdvice({ variant, editable, unsaved, reviser }: {
  variant: ContentVariant; editable: boolean; unsaved: boolean;
  /** Who edits ("Claude Opus"); unknown on older backends. */
  reviser?: string;
}) {
  // The final approver's full reasons for the current text; the stored note may shorten them.
  const refusal = variant.aiApproval?.status === "rejected" && variant.aiApprovalCurrent !== false ? variant.aiApproval.reasons : undefined;
  const parsed = reviewPoints(variant.reason, refusal);
  const who = reviser ?? "AI";
  const points = parsed.length ? parsed : [FALLBACK];
  const [skipped, setSkipped] = useState<Set<number>>(() => new Set());
  const [open, setOpen] = useState(false);
  const fix = useResourceMutation((notes: string[]) => resourcesService.rewriteVariant(variant.id, undefined, notes), ["variants"]);
  const chosen = points.filter((_, index) => !skipped.has(index));
  const canFix = editable && !isRewriting(variant);
  const long = points.some((point) => point.length > 160);
  const toggle = (index: number) => setSkipped((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });
  const start = async () => {
    try {
      await fix.mutateAsync(chosen);
      toast.success(`${who} đang sửa bài ${variant.platform} theo ${chosen.length} khuyến nghị. Bài mới sẽ tự hiện và được chấm lại.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể sửa bài theo khuyến nghị"); }
  };
  const text = (point: string) => <span className={cn("min-w-0 break-words", long && !open && "line-clamp-2")}>{point}</span>;
  const list = (checkable: boolean) => <ul className="mt-2 space-y-1.5">{points.map((point, index) => <li key={point}>
    {checkable
      ? <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-amber-600" checked={!skipped.has(index)} disabled={fix.isPending} onChange={() => toggle(index)} />{text(point)}</label>
      : <span className="flex items-start gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />{text(point)}</span>}
  </li>)}</ul>;

  return <section aria-label={`Khuyến nghị của AI · ${variant.platform}`} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
    <p className="font-semibold">AI đề nghị kiểm tra ({points.length} góp ý)</p>
    {canFix ? <PermissionGate allow={["ADMIN", "EDITOR"]} fallback={list(false)}>
      {list(true)}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={!chosen.length || unsaved} loading={fix.isPending} onClick={() => void start()}><WandSparkles className="size-4" />Sửa theo {chosen.length} khuyến nghị đã chọn</Button>
        <span className="text-xs text-amber-800">{unsaved ? "Lưu hoặc huỷ phần đang sửa của bài này trước."
          : !chosen.length ? "Tick ít nhất một khuyến nghị."
            : `Bỏ tick mục bạn không muốn sửa. ${who} chỉ sửa đúng các chỗ còn tick, giữ nguyên phần đã ổn, rồi chấm lại, thường 1–3 phút. Bản sửa điểm thấp hơn thì giữ bản hiện tại.`}</span>
      </div>
    </PermissionGate> : list(false)}
    {long && <button type="button" aria-expanded={open} className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-amber-800 underline" onClick={() => setOpen(!open)}>{open ? "Thu gọn ghi chú" : "Xem đủ ghi chú"}</button>}
  </section>;
}
