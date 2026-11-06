"use client";

import { LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck, ShieldQuestionMark, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useResourceMutation } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { AiBrandRisk, ContentVariant } from "@/types/domain";
import { approvalGate, shortAiLabel, type ApprovalGate } from "./campaign-utils";

const riskLabel: Record<AiBrandRisk, string> = { none: "không có", low: "thấp", medium: "trung bình", high: "cao" };

const approverOf = (variant: Pick<ContentVariant, "aiApproval">) => variant.aiApproval?.approverLabel.trim() || "AI duyệt cuối";

/** The approver can be asked again when it failed, never read the post, or read an older text and is not reading now. */
export const canRequestApproval = (gate: ApprovalGate) => gate.state === "failed" || gate.state === "missing" || gate.state === "stale";

/** Final AI approval at a glance in a post's header: "Opus: Đạt", "Opus đang duyệt…"… Nothing when the gate is off. */
export function ApprovalChip({ variant, approvalEnabled }: { variant: Pick<ContentVariant, "aiApproval" | "aiApprovalCurrent">; approvalEnabled: boolean }) {
  const gate = approvalGate(variant, approvalEnabled);
  if (gate.state === "off") return null;
  const name = shortAiLabel(approverOf(variant));
  const look = {
    approved: { text: `${name}: Đạt`, tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: ShieldCheck },
    rejected: { text: `${name}: Từ chối`, tone: "bg-red-50 text-red-700 ring-red-600/20", Icon: ShieldX },
    running: { text: `${name} đang duyệt…`, tone: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", Icon: LoaderCircle },
    failed: { text: `${name} lỗi`, tone: "bg-amber-50 text-amber-800 ring-amber-600/20", Icon: ShieldAlert },
    missing: { text: "Chưa duyệt cuối", tone: "bg-slate-100 text-slate-600 ring-slate-500/20", Icon: ShieldQuestionMark },
    stale: { text: "Chưa duyệt cuối", tone: "bg-slate-100 text-slate-600 ring-slate-500/20", Icon: ShieldQuestionMark },
  }[gate.state];
  const score = variant.aiApproval?.score;
  const title = [variant.aiApproval ? approverOf(variant) : "AI duyệt cuối", typeof score === "number" ? `chấm ${score}/10` : null, gate.message].filter(Boolean).join(" · ");
  return <span title={title} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", look.tone)}>
    <look.Icon aria-hidden className={cn("size-3.5", gate.state === "running" && "animate-spin motion-reduce:animate-none")} />{look.text}
  </span>;
}

/**
 * Why the final approver refused a post (or could not read it), with its reasons and the seeding /
 * brand-risk flags. A refused post cannot be approved by anyone; an edit or an AI rewrite has it
 * approved again automatically. `action` is shown at the end (e.g. "Cho AI duyệt lại"); `fixes` says how
 * this page fixes a post (by default the review page's AI fixes and manual edit).
 */
export function ApprovalNotice({ variant, approvalEnabled, action, fixes }: { variant: ContentVariant; approvalEnabled: boolean; action?: ReactNode; fixes?: string }) {
  const gate = approvalGate(variant, approvalEnabled);
  const approval = variant.aiApproval;
  if (!approval || (gate.state !== "rejected" && gate.state !== "failed")) return null;
  const label = approverOf(variant);
  const flags = [approval.seeding ? "Có dấu hiệu seeding" : null, approval.risk && approval.risk !== "none" ? `Rủi ro cho công ty: ${riskLabel[approval.risk]}` : null].filter((flag): flag is string => Boolean(flag));
  const reasons = approval.reasons ?? [];
  return <section aria-label={`AI duyệt cuối · ${variant.platform}`} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
    <p className="font-semibold">{gate.state === "rejected"
      ? `${label} từ chối bài này${typeof approval.score === "number" ? ` (chấm ${approval.score}/10)` : ""}`
      : `${label} chưa duyệt được bài này`}</p>
    {flags.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{flags.map((flag) => <li key={flag} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200">{flag}</li>)}</ul>}
    {reasons.length > 0 && <ul className="mt-2 space-y-1">{reasons.map((reason) => <li key={reason} className="flex items-start gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-red-500" /><span className="min-w-0 break-words">{reason}</span></li>)}</ul>}
    {gate.state === "failed" && (approval.error || approval.status === "running") && <p className="mt-2 break-words text-xs">{approval.error || "Lượt duyệt bị gián đoạn (máy chủ khởi động lại giữa chừng)."}</p>}
    <p className="mt-2 text-xs text-red-800">{gate.state === "rejected"
      ? `Không ai duyệt được bài này như hiện tại. ${fixes ?? (variant.recommended === false ? "Dùng “Sửa theo khuyến nghị”, “Viết lại bằng AI” hoặc sửa tay" : "Dùng “Viết lại bằng AI” hoặc sửa tay")}; bài mới được AI duyệt lại tự động.`
      : "Bài chưa duyệt hay đăng được cho tới khi AI duyệt cuối đọc xong. Cho AI duyệt lại để thử lần nữa."}</p>
    {action && <div className="mt-2 flex flex-wrap items-center gap-2">{action}</div>}
  </section>;
}

/** "Cho AI duyệt lại": starts the final approval again on the server; the variant list shows the verdict when it comes. */
export function RequestApprovalButton({ variant, disabled }: { variant: ContentVariant; disabled?: boolean }) {
  const request = useResourceMutation(() => resourcesService.requestVariantApproval(variant.id), ["variants"]);
  const start = async () => {
    try {
      await request.mutateAsync(undefined);
      toast.success(`${approverOf(variant)} đang đọc lại bài ${variant.platform}. Kết quả tự hiện khi xong.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể cho AI duyệt lại"); }
  };
  return <Button size="sm" variant="secondary" aria-label={`Cho AI duyệt lại bài ${variant.platform}`} disabled={disabled} loading={request.isPending} onClick={() => void start()}>
    <RefreshCw className="size-4" />Cho AI duyệt lại
  </Button>;
}
