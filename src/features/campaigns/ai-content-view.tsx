"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { CalendarClock, Check, ChevronDown, ChevronUp, CircleAlert, Clock3, Eye, FileText, LoaderCircle, Pencil, RefreshCw, Save, Sparkles, Star, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useAccounts, useAiCampaigns, useAiRoles, useMedia, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { cn, formatDate } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { Campaign, ContentVariant, PlatformAccount } from "@/types/domain";
import { ApprovalChip, ApprovalNotice, canRequestApproval, RequestApprovalButton } from "./ai-approval";
import { aiScore, approvalGate, imagePending, isAutomationAccountEligible, normalizeMinScore, readApproveMinScore, reviewOutcomeWarning, saveApproveMinScore } from "./campaign-utils";
import { ReviewAdvice } from "./review-advice";
import { isRewriting, VariantRewritePanel } from "./variant-rewrite-panel";
import { VariantImagePanel } from "./variant-image-panel";
import { useSlow, VariantPreviewCard } from "./variant-preview-card";
import { ContentStatusBar, contentStatusOf, type ContentStatusFilter } from "./content-status-bar";

const isGenerating = (campaign: Campaign) => campaign.automationState === "QUEUED" || campaign.automationState === "PROCESSING";
const without = <T,>(record: Record<string, T>, key: string) => Object.fromEntries(Object.entries(record).filter(([id]) => id !== key));

/** Where a post stands in a per-post review: drives its colour edge and its dot in the jump list. */
/**
 * A post waiting for review is outlined by the AI's verdict: green when it passed (AI score and,
 * when on, the final AI approval), orange when it did not (low score, refused or failed approval),
 * slate while the AI is still deciding (rewriting or approving). Decided posts keep their own look.
 */
type PostState = "passed" | "failed" | "checking" | "approved" | "rejected" | "other";
const postTone: Record<PostState, { edge: string; dot: string; label: string }> = {
  passed: { edge: "border-emerald-300 border-l-emerald-500", dot: "bg-emerald-500", label: "chờ duyệt · AI đạt" },
  failed: { edge: "border-orange-300 border-l-orange-500", dot: "bg-orange-500", label: "chờ duyệt · AI chưa đạt" },
  checking: { edge: "border-border border-l-slate-400", dot: "bg-slate-400", label: "chờ duyệt · AI đang xét" },
  approved: { edge: "border-emerald-300 border-l-emerald-600", dot: "bg-emerald-600", label: "đã duyệt" },
  rejected: { edge: "border-border border-l-slate-300", dot: "bg-slate-300", label: "đã từ chối" },
  other: { edge: "border-border border-l-indigo-300", dot: "bg-indigo-300", label: "" },
};

function jumpToPost(id: string) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(`post-${id}`)?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** What each failure code means for the operator, and what to do. */
const FAILURE_CAUSES: Record<string, string> = {
  PLATFORM_RATE_LIMITED: "AI báo đã đạt hạn mức lượt gọi (quá nhiều lượt mỗi phút hoặc hết lượt của key). Đợi vài phút rồi bấm Thử lại; chỉ các kênh chưa tạo được mới được viết lại.",
  PLATFORM_AUTH_FAILED: "Nhà cung cấp AI từ chối key (sai key, key hết hạn hoặc IP máy chủ chưa được phép). Kiểm tra key trong cấu hình máy chủ.",
  PLATFORM_PERMISSION_DENIED: "Key AI chưa có quyền dùng model này. Nhờ quản trị cấp quyền hoặc chọn nhà cung cấp AI khác.",
  INFRASTRUCTURE_UNAVAILABLE: "Nhà cung cấp AI đang quá tải, mất kết nối hoặc trả lời quá lâu. Thử lại sau ít phút hoặc chọn nhà cung cấp AI khác.",
  PLATFORM_API_ERROR: "AI trả kết quả không dùng được (sai định dạng hoặc bị từ chối). Thử lại hoặc chọn nhà cung cấp AI khác.",
  RESOURCE_NOT_FOUND: "Thiếu nền tảng hoặc prompt (nền tảng bị tắt hoặc chưa có prompt đang dùng).",
  CONFLICT: "Nội dung đang được tạo ở lượt khác hoặc vừa thay đổi. Đợi lượt kia xong rồi thử lại.",
  VALIDATION_FAILED: "Yêu cầu tạo bài không hợp lệ (tài khoản hoặc cấu hình đã đổi).",
  INTERNAL_ERROR: "Lỗi trong máy chủ. Gửi chi tiết bên dưới cho người quản trị để xem log.",
};

/** The failure line of a run: cause, the platform being written, technical detail. Older runs only have a code. */
export function failureSummary(campaign: Pick<Campaign, "automationErrorCode" | "automationErrorDetail">) {
  const detail = campaign.automationErrorDetail;
  const code = detail?.code ?? campaign.automationErrorCode ?? "";
  const cause = FAILURE_CAUSES[code] ?? "Kiểm tra cấu hình AI và tài khoản rồi thử lại.";
  const where = detail?.platformName ? `Dừng ở kênh ${detail.platformName}. ` : "";
  const technical = [detail?.message, code && `mã ${code}`, detail?.provider && `AI ${detail.provider}`].filter(Boolean).join(" · ");
  return { cause, where, technical };
}

/** Why a platform of a failed run has no post: the error on the platform being written, or the stop before the others. */
export function failureHint(campaign: Pick<Campaign, "automationErrorCode" | "automationErrorDetail">, slug: string): string {
  const detail = campaign.automationErrorDetail;
  const { cause, technical } = failureSummary(campaign);
  const at = detail?.at ? ` Lúc ${formatDate(detail.at)}.` : "";
  if (detail?.platform && detail.platform === slug) {
    return `AI gặp lỗi khi viết bài cho kênh này: ${cause}${technical ? ` Chi tiết: ${technical}.` : ""}${at} Sửa nguyên nhân rồi bấm Thử lại để tạo các kênh chưa có bài.`;
  }
  if (detail?.platform) {
    return `Chưa chạy: lượt tạo dừng ở kênh ${detail.platformName ?? detail.platform} vì lỗi${detail.message ? ` “${detail.message}”` : ""}${detail.code ? ` (mã ${detail.code})` : ""} trước khi tới kênh này. Bấm Thử lại để tạo tiếp.`;
  }
  const code = detail?.code ?? campaign.automationErrorCode;
  return `Lượt tạo dừng vì lỗi${code ? ` (mã ${code})` : ""}${detail?.message ? `: ${detail.message}` : ""} trước khi viết xong kênh này.${detail ? "" : " Lượt này chạy trên bản cũ nên không lưu chi tiết lỗi; bấm Thử lại để chạy lại và xem lỗi chi tiết."}`;
}

/** A status that shows its explanation on hover or keyboard focus (the run-progress rows). */
function HintStatus({ hint, className, children }: { hint: string; className?: string; children: ReactNode }) {
  const id = useId();
  return <span className="group relative inline-flex shrink-0">
    <button type="button" aria-describedby={id} className={cn("inline-flex cursor-help items-center gap-1 rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", className)}>{children}</button>
    {/* Opens upwards: the card clips anything below its bottom edge. */}
    <span role="tooltip" id={id} className="pointer-events-none invisible absolute bottom-full right-0 z-30 mb-1.5 w-72 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-normal leading-5 text-white opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">{hint}</span>
  </span>;
}

/** One row per platform of the selected accounts: which ones the AI has already written. */
export function generationProgress(campaign: Campaign, accounts: PlatformAccount[], variants: ContentVariant[]) {
  const saved = new Set(campaign.automationVariantIds ?? []);
  const done = new Set(variants.filter((variant) => saved.has(variant.id)).map((variant) => variant.platformSlug));
  const channels = new Map<string, { slug: string; name: string; accounts: string[] }>();
  for (const id of campaign.automationAccountIds ?? []) {
    const account = accounts.find((item) => item.id === id);
    const slug = account?.platform?.slug;
    if (!account || !slug) continue;
    const channel = channels.get(slug) ?? { slug, name: account.platform?.name ?? slug, accounts: [] };
    channel.accounts.push(account.name);
    channels.set(slug, channel);
  }
  const rows = [...channels.values()].map((channel) => ({ ...channel, done: done.has(channel.slug) }));
  return { rows, done: rows.filter((row) => row.done).length, total: rows.length };
}

function GenerationProgress({ campaign, accounts }: { campaign: Campaign; accounts: PlatformAccount[] }) {
  const state = campaign.automationState;
  const variants = useVariants(campaign.content?.id ?? "", isGenerating(campaign));
  const { rows, done, total } = generationProgress(campaign, accounts, variants.data?.items ?? []);
  if (!total) return null;
  // After a failure the run stops: only the platform being written failed, the others were not started.
  const failedSlug = state === "FAILED" ? campaign.automationErrorDetail?.platform : undefined;
  const pending = state === "QUEUED" ? { label: "Chờ tới lượt", icon: Clock3, tone: "text-slate-500" }
    : state === "FAILED" ? failedSlug ? { label: "Chưa chạy (dừng sau lỗi)", icon: Clock3, tone: "text-slate-500" } : { label: "Chưa tạo được", icon: CircleAlert, tone: "text-red-700" }
      : { label: "AI đang viết…", icon: LoaderCircle, tone: "text-indigo-700" };
  return <div className="mt-3 rounded-xl border border-border bg-slate-50/60 p-3" aria-label="Tiến độ tạo nội dung theo kênh">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
      <span>Đã tạo {done}/{total} kênh</span>
      {state === "PROCESSING" && done === total && <span className="text-indigo-700">Đã viết xong, đang tạo ảnh cho kênh cần ảnh…</span>}
    </div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Số kênh đã tạo" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((row) => {
      const failedHere = !row.done && row.slug === failedSlug;
      const Icon = row.done ? Check : failedHere ? CircleAlert : pending.icon;
      return <li key={row.slug} className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
        <PlatformMark slug={row.slug} name={row.name} size="sm" />
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{row.name}</span><span className="block truncate text-[11px] text-muted">{row.accounts.join(", ")}</span></span>
        {state === "FAILED" && !row.done
          ? <HintStatus hint={failureHint(campaign, row.slug)} className={failedHere ? "text-red-700" : pending.tone}><Icon aria-hidden className="size-3.5" />{failedHere ? "Lỗi ở kênh này" : pending.label}</HintStatus>
          : <span className={cn("inline-flex shrink-0 items-center gap-1 font-semibold", row.done ? "text-emerald-700" : pending.tone)}><Icon aria-hidden className={cn("size-3.5", !row.done && state === "PROCESSING" && "animate-spin motion-reduce:animate-none")} />{row.done ? "Đã tạo" : pending.label}</span>}
      </li>;
    })}</ul>
  </div>;
}

function ReviewContent({ campaign, accounts }: { campaign: Campaign; accounts: PlatformAccount[] }) {
  // Live: polls every 2 seconds, so a final AI verdict still being read shows up by itself.
  const variants = useVariants(campaign.content?.id ?? "", true);
  const media = useMedia({ contentId: campaign.content?.id, limit: 100 });
  const roles = useAiRoles();
  // Older backends (no AI roles, 404) and a switched-off approver leave the decision to people alone.
  const approvalEnabled = roles.data?.approvalEnabled === true;
  const gateOf = (variant: ContentVariant) => approvalGate(variant, approvalEnabled);
  const [edits, setEdits] = useState<Record<string, { title: string; body: string }>>({});
  // Editing is opened post by post, from that post's own "Sửa bài" button.
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  // Each post is read as its text or as its social-media preview, chosen on its own card.
  const [views, setViews] = useState<Record<string, "content" | "preview">>({});
  // "all" schedules every draft still waiting; a variant id schedules only that platform.
  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null);
  const scheduleOpen = scheduleTarget !== null;
  const setScheduleOpen = (open: boolean) => setScheduleTarget(open ? "all" : null);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Every post starts folded to its header and decision buttons; the operator opens the ones to read.
  const [openPosts, setOpenPosts] = useState<Record<string, boolean>>({});
  const [minScore, setMinScore] = useState(readApproveMinScore);
  // What is typed; it becomes the threshold only when it is a whole score from 1 to 10.
  const [minScoreText, setMinScoreText] = useState(() => String(minScore));
  const [scoredRunning, setScoredRunning] = useState(false);
  const standalone = campaign.reviewMode === "CONTENT";
  const [scheduledAt, setScheduledAt] = useState(() => {
    const date = new Date(campaign.scheduledAt ?? "");
    return Number.isFinite(date.getTime()) && date > new Date()
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
      : "";
  });
  const saveOne = useResourceMutation(({ id, input }: { id: string; input: { title: string; body: string } }) => resourcesService.updateVariant(id, input), ["variants"]);
  /** Leaves editing of this post and forgets what was typed in it. */
  const closeEdit = (id: string) => {
    setEditingIds((current) => without(current, id));
    setEdits((current) => without(current, id));
  };
  /** Saves the unsaved edits of these drafts and forgets them, before they are approved. */
  const saveEdits = async (ids: string[]) => {
    const pendingEdits = Object.entries(edits).filter(([id]) => ids.includes(id));
    for (const [id, input] of pendingEdits) await resourcesService.updateVariant(id, input);
    if (pendingEdits.length) setEdits((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))));
    // An approved post is no longer editable; a later restore starts read-only again.
    setEditingIds((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))));
  };
  const items = (variants.data?.items ?? []).filter((variant) => campaign.automationVariantIds?.includes(variant.id));
  const campaignAccounts = accounts.filter((account) => campaign.automationAccountIds?.includes(account.id) || accountIds.includes(account.id));
  const accountFor = (variant: ContentVariant) => campaignAccounts.find((account) => account.platform?.slug === variant.platformSlug)
    ?? accounts.find((account) => account.platform?.slug === variant.platformSlug);
  const chosenVariants = items.filter((variant) => ["GENERATED", "APPROVED"].includes(variant.status)
    && variant.id === (selectedVariants[variant.platformSlug] ?? items.find((candidate) => candidate.platformSlug === variant.platformSlug && ["GENERATED", "APPROVED"].includes(candidate.status))?.id));
  const review = useResourceMutation(async ({ action, schedule }: { action: "approve" | "reject"; schedule?: string }) => {
    const options = { publishMode: schedule ? "SCHEDULED" as const : "NOW" as const, ...(schedule ? { scheduledAt: schedule } : {}) };
    if (standalone) {
      if (action === "reject") {
        for (const variant of items) await resourcesService.updateVariant(variant.id, { status: "REJECTED" });
        return;
      }
      const selectedPlatforms = new Set(accounts.filter((account) => accountIds.includes(account.id)).map((account) => account.platform?.slug));
      return resourcesService.reviewExistingContent(campaign.content!.id, { ...options, platformAccountIds: accountIds, variantIds: chosenVariants.filter((variant) => selectedPlatforms.has(variant.platformSlug)).map((variant) => variant.id) });
    }
    // Approving saves what was edited first, so it needs no separate "Save".
    if (action === "approve") await saveEdits(items.filter((variant) => variant.status === "GENERATED" && !imagePending(variant)).map((variant) => variant.id));
    return resourcesService.reviewAiCampaign(campaign.id, action, action === "approve" ? options : undefined);
  }, ["campaigns", "contents", "variants", "publish-jobs"]);
  // AI reviews are decided post by post; "all" then means the drafts still waiting.
  const perPost = campaign.reviewMode === "AUTOMATION";
  const decide = useResourceMutation(async ({ variantId, action, schedule }: { variantId: string; action: "approve" | "reject" | "restore"; schedule?: string }) => {
    if (action === "approve") await saveEdits([variantId]);
    return resourcesService.reviewAiVariant(
      campaign.id, variantId, action, action === "approve" ? { publishMode: schedule ? "SCHEDULED" : "NOW", ...(schedule ? { scheduledAt: schedule } : {}) } : undefined,
    );
  }, ["campaigns", "contents", "variants", "publish-jobs"]);
  const waiting = (variant: ContentVariant) => variant.status === "GENERATED";
  const verdictOf = (variant: ContentVariant): PostState => {
    if (isRewriting(variant)) return "checking";
    const gate = gateOf(variant);
    if (variant.recommended === false || gate.state === "rejected" || gate.state === "failed") return "failed";
    return gate.ok ? "passed" : "checking";
  };
  const postStateOf = (variant: ContentVariant): PostState => !perPost ? "other" : waiting(variant) ? verdictOf(variant) : variant.status === "APPROVED" ? "approved" : variant.status === "REJECTED" ? "rejected" : "other";
  const pendingCount = items.filter(waiting).length;
  // A platform can be approved (and goes out) as soon as its post and image are
  // done, while the AI is still writing the others.
  // …and while the AI rewrites a post, approving it would send the old text.
  const readyToApprove = (variant: ContentVariant) => waiting(variant) && !imagePending(variant) && !isRewriting(variant);
  const readyCount = items.filter(readyToApprove).length;
  // With the final AI approver on, only a post it approved as it reads now (no unsaved edit) can go out.
  const approvable = (variant: ContentVariant) => readyToApprove(variant) && gateOf(variant).ok && !(approvalEnabled && edits[variant.id]);
  const approvableCount = items.filter(approvable).length;
  const awaitingApproval = approvalEnabled ? items.filter((variant) => readyToApprove(variant) && !gateOf(variant).ok).length : 0;
  // "Duyệt & đăng bài từ N điểm": approvable posts the AI editor scored at least N (unscored ones are left out).
  const scoredReady = items.filter((variant) => approvable(variant) && (aiScore(variant.reason) ?? 0) >= minScore);
  const generating = isGenerating(campaign);
  const editable = campaign.reviewMode !== "EXISTING_CAMPAIGN" && (campaign.automationState === "WAITING_REVIEW" || generating || (standalone && campaign.automationState === "APPROVED"));
  const eligibleAccounts = accounts.filter((account) => isAutomationAccountEligible(account) && chosenVariants.some((variant) => variant.platformSlug === account.platform?.slug));
  const dirty = Object.keys(edits).length > 0;
  const busy = saveOne.isPending || review.isPending || decide.isPending || scoredRunning;
  const change = (variant: ContentVariant, patch: { title?: string; body?: string }) => {
    setEdits((current) => ({ ...current, [variant.id]: { title: variant.title ?? "", body: variant.body, ...current[variant.id], ...patch } }));
  };
  const emptyEdit = Object.values(edits).some((edit) => !edit.body.trim());
  const ready = perPost
    ? approvableCount > 0 && !busy && !emptyEdit
    : !generating && items.length > 0 && items.length === campaign.automationVariantIds?.length && !dirty && !busy && (!standalone || (accountIds.length > 0 && accountIds.every((id) => eligibleAccounts.some((account) => account.id === id))));
  // Accounts that went offline since the AI run are left out of an approval; say which ones.
  const warnSkipped = (outcome: Parameters<typeof reviewOutcomeWarning>[0]) => {
    const warning = reviewOutcomeWarning(outcome, (id) => items.find((variant) => variant.id === id)?.platform);
    if (warning) toast.warning(warning, { duration: 15_000 });
  };
  const actOn = async (variant: ContentVariant, action: "approve" | "reject" | "restore", schedule?: string) => {
    try {
      const outcome = await decide.mutateAsync({ variantId: variant.id, action, schedule });
      setScheduleTarget(null);
      toast.success(action === "restore" ? `Đã khôi phục bài ${variant.platform} về chờ duyệt. Nội dung được giữ nguyên.` : action === "reject" ? `Đã từ chối bài ${variant.platform}. Bài này sẽ không được đăng.`
        : schedule ? `Đã duyệt và hẹn lịch bài ${variant.platform}.` : `Đã duyệt bài ${variant.platform}, đưa vào hàng đợi đăng ngay.`);
      warnSkipped(outcome);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xử lý bài này"); }
  };
  /** Approves the high-scoring posts one by one; a failure on one does not stop the others. */
  const approveScored = async () => {
    const chosen = scoredReady;
    const failures: string[] = [];
    setScoredRunning(true);
    try {
      for (const variant of chosen) {
        try { warnSkipped(await decide.mutateAsync({ variantId: variant.id, action: "approve" })); }
        catch (error) { failures.push(`${variant.platform}: ${error instanceof Error ? error.message : "không duyệt được"}`); }
      }
    } finally { setScoredRunning(false); }
    const approved = chosen.length - failures.length;
    if (approved) toast.success(`Đã duyệt và đưa vào hàng đợi đăng ${approved} bài từ ${minScore} điểm trở lên.`);
    if (failures.length) toast.error(`Chưa duyệt được ${failures.length} bài: ${failures.join("; ")}`);
  };
  const act = async (action: "approve" | "reject", schedule?: string) => {
    try {
      const outcome = await review.mutateAsync({ action, schedule });
      setScheduleOpen(false);
      toast.success(action === "approve" ? schedule ? "Đã duyệt và hẹn lịch đăng." : "Đã duyệt và đưa vào hàng đợi đăng ngay." : "Đã từ chối nội dung. Bài sẽ không được đăng.");
      warnSkipped(outcome);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xử lý nội dung"); }
  };
  /** Saves one post's edit; with the final AI approver on, the server then has it approve the new text. */
  const saveEdit = (variant: ContentVariant) => {
    const edit = edits[variant.id];
    if (!edit) return;
    void saveOne.mutateAsync({ id: variant.id, input: edit })
      .then(() => { closeEdit(variant.id); toast.success(approvalEnabled ? `Đã lưu bài ${variant.platform}. AI duyệt cuối đang đọc lại bài.` : `Đã lưu bài ${variant.platform}`); })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể lưu"));
  };
  const scheduleVariant = scheduleTarget && scheduleTarget !== "all" ? items.find((variant) => variant.id === scheduleTarget) : undefined;
  const loadingSlowly = useSlow(variants.isPending);
  if (variants.isPending) return loadingSlowly ? <TableSkeleton /> : <div aria-busy="true" className="min-h-24" />;
  if (variants.isError) return <ErrorState error={variants.error} onRetry={() => void variants.refetch()} />;
  return <div className="space-y-5 border-t border-border bg-slate-50/70 p-5">
    {campaign.reviewMode === "EXISTING_CAMPAIGN" && <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">Các biến thể này đã gắn với chiến dịch trước đây. Theo dõi và xử lý từng bài ở <Link href="/publishing" className="font-semibold text-primary underline">Publishing</Link>.</p>}
    {media.data?.items.map((asset) => <p key={asset.id} className="text-sm">{asset.publicUrl ? <a href={asset.publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">Xem tệp đính kèm{asset.altText ? `: ${asset.altText}` : ""}</a> : `Tệp đính kèm: ${asset.mimeType}`}</p>)}
    {items.length > 1 && <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold text-slate-600">{items.length} bài · bấm tên kênh để mở và đi tới bài đó</p>
        {perPost && <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><span aria-hidden className="h-3 w-1.5 rounded-sm bg-emerald-500" />Viền xanh: AI đạt</span>
          <span className="inline-flex items-center gap-1"><span aria-hidden className="h-3 w-1.5 rounded-sm bg-orange-500" />Viền cam: chưa đạt</span>
          <span className="inline-flex items-center gap-1"><span aria-hidden className="h-3 w-1.5 rounded-sm bg-slate-400" />AI đang xét</span>
        </p>}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setOpenPosts(Object.fromEntries(items.map((variant) => [variant.id, true])))}><ChevronDown className="size-4" />Mở hết</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenPosts({})}><ChevronUp className="size-4" />Thu gọn hết</Button>
        </div>
      </div>
      <nav aria-label="Đi tới bài của từng kênh" className="flex flex-wrap gap-1.5">
        {items.map((variant) => { const tone = postTone[postStateOf(variant)]; return <button key={variant.id} type="button" onClick={() => { setOpenPosts((current) => ({ ...current, [variant.id]: true })); jumpToPost(variant.id); }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-white py-1 pl-1 pr-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60">
          <PlatformMark slug={variant.platformSlug} name={variant.platform} size="xs" />{variant.platform}
          <span aria-hidden className={cn("size-2 rounded-full", tone.dot)} />{tone.label && <span className="sr-only">({tone.label})</span>}
        </button>; })}
      </nav>
    </div>}
    {items.map((variant, index) => {
      const folded = !openPosts[variant.id];
      const view = views[variant.id] ?? "content";
      const state = postStateOf(variant);
      const score = aiScore(variant.reason);
      const postAccounts = campaignAccounts.filter((account) => account.platform?.slug === variant.platformSlug).map((account) => account.name);
      const canEdit = editable && (!perPost || waiting(variant)) && !isRewriting(variant);
      const isEditing = canEdit && Boolean(editingIds[variant.id]);
      const edit = edits[variant.id];
      const approving = decide.isPending && decide.variables?.variantId === variant.id;
      const saving = saveOne.isPending && saveOne.variables?.id === variant.id;
      const gate = gateOf(variant);
      // An unsaved edit is not what the approver read: it has to be saved (and approved again) first.
      const awaitingSave = approvalEnabled && Boolean(edit);
      const draftEditable = editable && (perPost ? waiting(variant) : ["GENERATED", "APPROVED"].includes(variant.status));
      const retryApproval = approvalEnabled && draftEditable && canRequestApproval(gate) && !edit && !isRewriting(variant)
        ? <PermissionGate allow={["ADMIN", "EDITOR"]}><RequestApprovalButton variant={variant} disabled={busy} /></PermissionGate> : null;
      const [hint, hintTone] = isRewriting(variant) ? ["AI đang viết lại bài này; duyệt được khi bài mới xong.", "text-indigo-700"]
        : imagePending(variant) ? ["Đang tạo ảnh cho bài này; duyệt được ngay khi ảnh xong.", "text-indigo-700"]
          : awaitingSave ? ["Bài đã sửa: lưu để AI duyệt cuối đọc lại, duyệt được khi có kết quả mới.", "text-amber-700"]
            : !gate.ok ? [gate.message, gate.state === "running" ? "text-indigo-700" : gate.state === "rejected" ? "text-red-700" : "text-amber-700"]
              : edit ? ["Duyệt sẽ lưu luôn phần bạn đã sửa.", "text-muted"] : [null, ""];
      const editTools = canEdit ? <PermissionGate allow={["ADMIN", "EDITOR"]}>{isEditing
        ? <><Button size="sm" variant="secondary" disabled={busy || !edit || !edit.body.trim()} loading={saving}
            onClick={() => saveEdit(variant)}><Save className="size-4" />Lưu bài này</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => closeEdit(variant.id)}>Huỷ sửa</Button></>
        : <Button size="sm" variant="secondary" aria-label={`Sửa bài ${variant.platform}`} disabled={busy} onClick={() => { setEditingIds((current) => ({ ...current, [variant.id]: true })); setViews((current) => ({ ...current, [variant.id]: "content" })); }}><Pencil className="size-4" />Sửa bài</Button>}</PermissionGate> : null;
      return <article key={variant.id} id={`post-${variant.id}`} aria-labelledby={`post-title-${variant.id}`}
        data-verdict={state}
        className={cn("scroll-mt-24 overflow-hidden rounded-2xl border border-l-4 border-border bg-white shadow-sm", postTone[state].edge)}>
        {/* Who this post is for, at a glance: logo, platform, account, AI score and status. */}
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-slate-50/80 px-4 py-3">
          <PlatformMark slug={variant.platformSlug} name={variant.platform} />
          <div className="min-w-0 flex-1 basis-40">
            <h3 id={`post-title-${variant.id}`} className="truncate font-bold">{variant.platform}</h3>
            {postTone[state].label && <span className="sr-only">Kết quả: {postTone[state].label}</span>}
            <p className="truncate text-xs text-muted">Bài {index + 1}/{items.length}{postAccounts.length ? ` · đăng bằng ${postAccounts.join(", ")}` : ""}</p>
            {folded && <p className="mt-0.5 truncate text-xs text-slate-600">{variant.title || variant.body.split("\n").find((line) => line.trim())?.trim()}</p>}
          </div>
          {score !== null && <span title={roles.data ? `Chấm bởi ${roles.data.reviewer.label}` : undefined} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", variant.recommended === false ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700")}>AI chấm {score}/10</span>}
          <ApprovalChip variant={variant} approvalEnabled={approvalEnabled} />
          <Badge value={perPost && waiting(variant) ? "WAITING_REVIEW" : variant.status} />
          {!folded && <div role="tablist" aria-label={`Cách xem bài ${variant.platform}`} className="inline-flex rounded-lg border border-border bg-white p-0.5">
            {([["content", "Nội dung", FileText], ["preview", "Xem trước", Eye]] as const).map(([value, label, Icon]) => <button key={value} type="button" role="tab" aria-selected={view === value}
              onClick={() => setViews((current) => ({ ...current, [variant.id]: value }))}
              className={cn("inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition", view === value ? "bg-indigo-50 text-primary" : "text-slate-600 hover:text-slate-900")}><Icon aria-hidden className="size-3.5" />{label}</button>)}
          </div>}
          <Button size="sm" variant="ghost" aria-expanded={!folded} aria-controls={`post-body-${variant.id}`} aria-label={folded ? `Xem nội dung bài ${variant.platform}` : `Thu gọn bài ${variant.platform}`}
            onClick={() => setOpenPosts((current) => ({ ...current, [variant.id]: folded }))}>{folded ? <><ChevronDown className="size-4" />Xem nội dung</> : <><ChevronUp className="size-4" />Thu gọn</>}</Button>
        </header>
        {!folded && <div id={`post-body-${variant.id}`} className="space-y-3 p-4">
          {standalone && editable && ["GENERATED", "APPROVED"].includes(variant.status) && <label className="flex items-center gap-2 text-sm text-primary"><input type="radio" name={`variant-${campaign.id}-${variant.platformSlug}`} checked={chosenVariants.some((chosen) => chosen.id === variant.id)} disabled={busy} onChange={() => setSelectedVariants((current) => ({ ...current, [variant.platformSlug]: variant.id }))} />Dùng biến thể này khi đăng · {variant.title || variant.platform}</label>}
          {/* Per-post review: "Cho AI duyệt lại" sits in the decision footer, which stays visible when folded. */}
          {variant.status === "GENERATED" && <ApprovalNotice variant={variant} approvalEnabled={approvalEnabled} action={perPost ? undefined : retryApproval} />}
          {!perPost && retryApproval && (gate.state === "missing" || gate.state === "stale") && <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><span>{gate.message}</span>{retryApproval}</div>}
          {variant.recommended === false && <ReviewAdvice key={variant.reason ?? ""} variant={variant} unsaved={Boolean(edit)} editable={draftEditable} reviser={roles.data?.reviser?.label} />}
          <VariantRewritePanel variant={variant} unsaved={Boolean(edit)} actions={editTools} editable={draftEditable} reviser={roles.data?.reviser?.label} />
          {view === "preview" ? <>
            <VariantPreviewCard variant={variant} edit={edit} account={accountFor(variant)} />
            {/* The preview shows the picture; the image buttons stay usable under it. */}
            <VariantImagePanel compact variant={variant} editable={editable && (perPost ? readyToApprove(variant) : !generating && ["GENERATED", "APPROVED"].includes(variant.status))} />
          </> : <>
            <div><Label htmlFor={`title-${variant.id}`}>Tiêu đề</Label><Input id={`title-${variant.id}`} value={edit?.title ?? variant.title ?? ""} readOnly={!isEditing} disabled={busy} onChange={(event) => change(variant, { title: event.target.value })} /></div>
            <div><Label htmlFor={`body-${variant.id}`}>Nội dung · {variant.platform}</Label><Textarea id={`body-${variant.id}`} className="min-h-64" value={edit?.body ?? variant.body} readOnly={!isEditing} disabled={busy} onChange={(event) => change(variant, { body: event.target.value })} /></div>
            <VariantImagePanel variant={variant} editable={editable && (perPost ? readyToApprove(variant) : !generating && ["GENERATED", "APPROVED"].includes(variant.status))} />
            {!!variant.hashtags?.length && <p className="break-words text-sm text-muted">{variant.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}</p>}
            {variant.cta && <p className="text-sm text-muted">{variant.cta}</p>}
          </>}
        </div>}
        {/* The decision for this post sits at its end, named after its platform, apart from the whole-run bar. */}
        {perPost && editable && waiting(variant) && <PermissionGate allow={["ADMIN", "EDITOR"]}><footer role="group" aria-label={`Duyệt bài ${variant.platform}`} className="flex flex-wrap items-center gap-2 border-t border-border bg-amber-50/40 px-4 py-3">
          <div className="mr-auto flex min-w-0 basis-full items-center gap-2 sm:basis-auto">
            <PlatformMark slug={variant.platformSlug} name={variant.platform} size="xs" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">Bài {variant.platform}</p>{hint && <p className={cn("text-xs", hintTone)}>{hint}</p>}</div>
          </div>
          <Button variant="ghost" aria-label={`Từ chối bài ${variant.platform}`} disabled={busy} loading={approving && decide.variables?.action === "reject"} onClick={() => void actOn(variant, "reject")}><X className="size-4" />Từ chối</Button>
          {retryApproval}
          <Button variant="secondary" aria-label={`Hẹn lịch bài ${variant.platform}`} disabled={busy || !approvable(variant) || edit?.body.trim() === ""} onClick={() => setScheduleTarget(variant.id)}><CalendarClock className="size-4" />Hẹn lịch</Button>
          {awaitingSave
            ? <Button aria-label={`Lưu bài ${variant.platform} để AI duyệt lại`} disabled={busy || !edit?.body.trim()} loading={saving} onClick={() => saveEdit(variant)}><Save className="size-4" />Lưu để AI duyệt lại</Button>
            : <Button aria-label={`Duyệt & đăng bài ${variant.platform}`} disabled={busy || !approvable(variant) || edit?.body.trim() === ""} loading={approving && decide.variables?.action === "approve"} onClick={() => void actOn(variant, "approve")}><Check className="size-4" />Duyệt & đăng</Button>}
        </footer></PermissionGate>}
        {perPost && variant.status === "APPROVED" && <footer className="border-t border-emerald-100 bg-emerald-50/50 px-4 py-2.5 text-xs text-emerald-800">Đã duyệt: bài vào hàng đợi đăng. Theo dõi ở <Link href="/publishing" className="font-semibold underline">Publishing</Link>.</footer>}
        {perPost && variant.status === "REJECTED" && <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-slate-50 px-4 py-3">
          <p className="mr-auto text-sm text-muted">Đã từ chối. Khôi phục để sửa và duyệt lại; bài chỉ đăng sau khi bạn duyệt.</p>
          {["REJECTED", "WAITING_REVIEW", "APPROVED"].includes(campaign.automationState ?? "") && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" disabled={busy} loading={approving && decide.variables?.action === "restore"} onClick={() => void actOn(variant, "restore")}><Undo2 className="size-4" />Khôi phục bài này</Button></PermissionGate>}
        </footer>}
      </article>;
    })}
    {editable && <PermissionGate allow={["ADMIN", "EDITOR"]}>
      {standalone && <fieldset className="rounded-xl border border-border p-4"><legend className="px-2 text-sm font-semibold">Chọn tài khoản để đăng biến thể đã có</legend><div className="grid gap-3 sm:grid-cols-2">{eligibleAccounts.map((account) => <label key={account.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountIds.includes(account.id)} disabled={busy} onChange={(event) => setAccountIds((current) => event.target.checked ? [...current, account.id] : current.filter((id) => id !== account.id))} />{account.name} · {account.platform?.name}</label>)}</div>{!eligibleAccounts.length && <p className="text-sm text-amber-700">Chưa có tài khoản sẵn sàng khớp với nền tảng của biến thể. Kiểm tra tại trang Tài khoản.</p>}</fieldset>}
      {/* Long reviews (13 platforms) pushed these buttons far below the fold: keep them in view while scrolling. */}
      <div role="region" aria-label="Duyệt nội dung" className="sticky bottom-0 z-20 -mx-5 -mb-5 flex flex-wrap items-center gap-2 border-t border-indigo-100 bg-indigo-50/95 px-3 py-2 sm:px-5 sm:py-3 shadow-[0_-6px_16px_-12px_rgba(15,23,42,0.35)] backdrop-blur">
      {/* This bar acts on every post of the run; each post's own decision is at the end of its card. */}
      <div className="mr-auto min-w-0"><p className="text-xs font-bold text-indigo-900">Cả lượt · {items.length} bài</p><p className="hidden text-xs text-slate-600 sm:block">{perPost ? `${pendingCount} chờ duyệt${readyCount < pendingCount ? ` (${pendingCount - readyCount} đang tạo ảnh)` : ""}${awaitingApproval ? ` · ${awaitingApproval} chờ AI duyệt cuối` : ""} · ${items.filter((variant) => variant.status === "APPROVED").length} đã duyệt · ${items.filter((variant) => variant.status === "REJECTED").length} từ chối · ` : ""}{items.length} kênh{items.some((variant) => variant.recommended === false) ? ` · ${items.filter((variant) => variant.recommended === false).length} kênh AI đề nghị kiểm tra` : ""}</p></div>
      <Button size="sm" variant="secondary" className={perPost ? "hidden sm:inline-flex" : undefined} disabled={!ready} onClick={() => setScheduleOpen(true)}><CalendarClock className="size-4" />{perPost ? "Hẹn lịch bài còn chờ" : "Hẹn lịch đăng"}</Button>
      {perPost && <div role="group" aria-label="Duyệt theo điểm AI" className="flex items-center gap-1.5">
        <label htmlFor={`min-score-${campaign.id}`} className="text-xs font-semibold text-slate-600">Từ</label>
        <Input id={`min-score-${campaign.id}`} type="number" inputMode="numeric" min={1} max={10} step={1} className="h-9 w-16 px-2 text-center" value={minScoreText} disabled={busy}
          aria-label="Điểm AI tối thiểu để duyệt" onBlur={() => setMinScoreText(String(minScore))}
          onChange={(event) => {
            setMinScoreText(event.target.value);
            if (/^(?:[1-9]|10)$/.test(event.target.value.trim())) { const score = normalizeMinScore(event.target.value); setMinScore(score); saveApproveMinScore(score); }
          }} />
        <Button size="sm" variant="secondary" disabled={busy || !scoredReady.length || emptyEdit} loading={scoredRunning} onClick={() => void approveScored()}><Star className="size-4" />Duyệt & đăng bài từ {minScore} điểm ({scoredReady.length})</Button>
      </div>}
      <Button size="sm" disabled={!ready} loading={review.isPending} onClick={() => void act("approve")}><Check className="size-4" />{perPost ? `Duyệt & đăng bài đã xong (${approvableCount})` : "Duyệt đăng ngay"}</Button>
      <Button size="sm" variant="ghost" className={perPost ? "hidden sm:inline-flex" : undefined} disabled={busy || (perPost ? !pendingCount : generating)} onClick={() => void act("reject")}><X className="size-4" />{perPost ? "Từ chối bài còn chờ" : "Từ chối"}</Button>
      {dirty && !perPost && <p className="text-xs text-amber-700">Lưu hoặc huỷ phần đang sửa ở từng bài trước khi duyệt.</p>}
      {dirty && perPost && <p className="text-xs text-muted">{approvalEnabled ? "Duyệt cả lượt sẽ lưu phần đang sửa; bài đã sửa chờ AI duyệt cuối đọc lại rồi mới đăng." : "Duyệt sẽ lưu luôn phần bạn đã sửa."}</p>}
      {generating && <p className="text-xs text-indigo-700">AI đang viết các kênh còn lại. Kênh nào xong (kèm ảnh) là duyệt và đăng được ngay.</p>}
    </div></PermissionGate>}
    <Modal open={scheduleOpen && editable} onClose={() => { if (!busy) setScheduleOpen(false); }} title="Hẹn lịch đăng" description={scheduleVariant ? `Duyệt bài ${scheduleVariant.platform} và đăng vào thời gian bạn chọn; các bài khác vẫn chờ duyệt.` : perPost ? "Duyệt các bài còn chờ và đăng vào thời gian bạn chọn." : "Duyệt toàn bộ nội dung của lượt này và đăng vào thời gian bạn chọn."}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const date = new Date(scheduledAt);
        if (!Number.isFinite(date.getTime()) || date <= new Date()) { toast.error("Chọn thời gian đăng trong tương lai"); return; }
        if (scheduleVariant) void actOn(scheduleVariant, "approve", date.toISOString());
        else void act("approve", date.toISOString());
      }}>
        <div><Label htmlFor={`schedule-${campaign.id}`}>Ngày giờ đăng (giờ địa phương)</Label><Input id={`schedule-${campaign.id}`} type="datetime-local" required value={scheduledAt} disabled={busy} onChange={(event) => setScheduledAt(event.target.value)} /></div>
        <Button type="submit" disabled={(scheduleVariant ? busy : !ready) || !scheduledAt} loading={review.isPending || decide.isPending}>Duyệt & hẹn lịch</Button>
      </form>
    </Modal>
  </div>;
}

export function AiContentView() {
  const query = useAiCampaigns();
  const accounts = useAccounts({ limit: 100 });
  const [filter, setFilter] = useState<ContentStatusFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const retry = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "retry-generation"), ["campaigns"]);
  const resume = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "approve"), ["campaigns", "publish-jobs"]);
  const restore = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "restore"), ["campaigns", "contents", "variants"]);
  const remove = useResourceMutation((id: string) => resourcesService.deleteAiCampaign(id), ["campaigns", "contents", "variants", "publish-jobs"]);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const all = (query.data?.items ?? []).filter((campaign) => campaign.automationState);
  const items = all.filter((campaign) => filter === "ALL" || contentStatusOf(campaign) === filter);
  return <div className="animate-enter">
    <PageHeader eyebrow="AI Workspace" title="Content đợi duyệt" description="Tự đồng bộ mỗi 2 giây với AI đang tạo và đã tạo xong. Review, edit nội dung, hẹn lịch hoặc duyệt đăng ngay tại đây." action={<Link href="/campaigns?automate=1" className={buttonVariants()}><Sparkles className="size-4" />Tạo nội dung AI</Link>} />
    <ContentStatusBar campaigns={all} variantCount={new Set(all.flatMap((item) => item.automationVariantIds ?? [])).size} value={filter} onChange={setFilter} />
    {query.isPending ? <TableSkeleton /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !items.length ? <EmptyState title="Chưa có nội dung trong mục này" description="Các lượt tạo AI sẽ xuất hiện ở đây và cập nhật tiến độ tự động." /> : <div className="space-y-4">{items.map((campaign) => {
      const state = campaign.automationState!;
      const selectedAccounts = (campaign.automationAccountIds ?? []).map((id) => accounts.data?.items.find((account) => account.id === id)?.name ?? id);
      return <Card key={campaign.id} className="overflow-clip">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1 basis-full sm:basis-80"><h2 className="font-bold">{campaign.name}</h2><p className="mt-1 text-xs text-muted">{formatDate(campaign.createdAt)} · {selectedAccounts.length} tài khoản · {campaign.automationVariantIds?.length ?? 0} nội dung</p><p className="mt-2 break-words text-xs text-muted">{selectedAccounts.join(", ")}</p>
            {state === "QUEUED" && <p className="mt-3 text-sm text-indigo-700">Đã nhận yêu cầu, đang chờ AI xử lý.</p>}
            {state === "PROCESSING" && <p className="mt-3 text-sm text-indigo-700">AI đang tạo nội dung. Kênh nào xong sẽ hiện ngay để bạn xem trước.</p>}
            {state === "FAILED" && (() => {
              const failure = failureSummary(campaign);
              return <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <p><span className="font-semibold">Chưa tạo được nội dung.</span> {failure.where}{failure.cause}</p>
                {failure.technical && <p className="mt-1 break-words font-mono text-[11px] text-red-700">Chi tiết: {failure.technical}</p>}
              </div>;
            })()}
            {state === "DRAFT" && <p className="mt-3 text-sm text-muted">Lượt cũ chưa có biến thể. Mở Content Studio để tạo nội dung.</p>}
            {state === "WAITING_REVIEW" && campaign.reviewMode !== "EXISTING_CAMPAIGN" && <p className="mt-3 text-sm text-amber-700">Chưa đăng lên social. {campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date() ? `Lịch đăng sau khi duyệt: ${formatDate(campaign.scheduledAt)}.` : "Bài sẽ vào hàng đợi đăng ngay sau khi bạn duyệt."}</p>}
            {campaign.reviewMode === "EXISTING_CAMPAIGN" && !!campaign.automationVariantIds?.length && <p className="mt-3 text-sm text-muted">Nội dung từ chiến dịch trước đây · trạng thái đăng: <Badge value={campaign.status} /></p>}
          </div>
          <div className="flex flex-wrap items-center gap-2"><Badge value={state === "PROCESSING" ? "AI_GENERATING" : state} />
            {!!campaign.automationVariantIds?.length && <Button variant="secondary" size="sm" onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}>{expanded === campaign.id ? "Thu gọn" : isGenerating(campaign) ? `Xem ${campaign.automationVariantIds?.length ?? 0} kênh đã tạo` : state === "WAITING_REVIEW" ? "Review & duyệt" : "Review nội dung"}</Button>}
            {state === "REJECTED" && campaign.reviewMode === "AUTOMATION" && !!campaign.automationVariantIds?.length && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" className="min-h-11" disabled={restore.isPending} loading={restore.isPending && restore.variables === campaign.id} onClick={() => void restore.mutateAsync(campaign.id).then(() => { setFilter("WAITING_REVIEW"); setExpanded(campaign.id); toast.success("Đã khôi phục về chờ duyệt. Nội dung được giữ nguyên; bạn có thể sửa và duyệt lại."); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể khôi phục nội dung"))}><Undo2 className="size-4" />Khôi phục để duyệt</Button></PermissionGate>}
            {campaign.reviewMode === "AUTOMATION" && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="ghost" size="sm" aria-label={`Xoá lượt ${campaign.name}`}
              disabled={state === "PROCESSING"} title={state === "PROCESSING" ? "AI đang viết bài cho lượt này; đợi xong hoặc báo lỗi rồi xoá." : undefined}
              onClick={() => setDeleteTarget(campaign)}><Trash2 className="size-4" />Xoá</Button></PermissionGate>}
            {state === "FAILED" && campaign.reviewMode !== "EXISTING_CAMPAIGN" && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button size="sm" loading={retry.isPending} onClick={() => void retry.mutateAsync(campaign.id).then(() => toast.success("Đã đưa vào hàng đợi tạo lại")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể thử lại"))}><RefreshCw className="size-4" />Thử lại</Button></PermissionGate>}
            {campaign.reviewMode === "EXISTING_CAMPAIGN" && !campaign.automationVariantIds?.length && campaign.content && <Link href={`/studio/${campaign.content.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Content Studio</Link>}
            {(state === "APPROVED" || campaign.reviewMode === "EXISTING_CAMPAIGN") && campaign.reviewMode !== "CONTENT" && !!campaign.automationVariantIds?.length && <Link href="/publishing" className={buttonVariants({ variant: "secondary", size: "sm" })}>Xem tiến độ đăng</Link>}
            {state === "APPROVED" && campaign.status === "DRAFT" && campaign.reviewMode === "AUTOMATION" && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button size="sm" loading={resume.isPending} onClick={() => void resume.mutateAsync(campaign.id).then(() => toast.success("Đã tiếp tục đăng theo lịch đã duyệt")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể tiếp tục"))}>Tiếp tục đăng</Button></PermissionGate>}
          </div>
        </div>
        {(isGenerating(campaign) || state === "FAILED") && campaign.reviewMode === "AUTOMATION" && <div className="-mt-3 px-5 pb-5"><GenerationProgress campaign={campaign} accounts={accounts.data?.items ?? []} /></div>}
        {expanded === campaign.id && <ReviewContent campaign={campaign} accounts={accounts.data?.items ?? []} />}
      </Card>;
    })}</div>}
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Xoá lượt nội dung này?"
      description={`Xoá “${deleteTarget?.name ?? ""}” khỏi Content đợi duyệt, cùng các bài chưa đăng và nội dung brief của lượt này. Không xoá được khi AI đang viết, khi đang có bài được đăng, hoặc khi lượt đã có bài lên social (giữ lịch sử đăng).`}
      confirmLabel="Xoá lượt này"
      danger
      busy={remove.isPending}
      onClose={() => setDeleteTarget(null)}
      onConfirm={async () => {
        if (!deleteTarget) return;
        try {
          await remove.mutateAsync(deleteTarget.id);
          if (expanded === deleteTarget.id) setExpanded(null);
          toast.success(`Đã xoá lượt “${deleteTarget.name}”.`);
          setDeleteTarget(null);
        } catch (error) { toast.error(error instanceof Error ? error.message : "Không xoá được lượt này"); }
      }}
    />
  </div>;
}
