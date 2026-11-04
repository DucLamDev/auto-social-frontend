"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Check, ChevronDown, ChevronUp, CircleAlert, Clock3, Eye, LoaderCircle, Pencil, RefreshCw, Save, Sparkles, Star, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useAccounts, useAiCampaigns, useMedia, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { cn, formatDate } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { Campaign, ContentVariant, PlatformAccount } from "@/types/domain";
import { aiScore, imagePending, isAutomationAccountEligible, normalizeMinScore, readApproveMinScore, reviewOutcomeWarning, saveApproveMinScore } from "./campaign-utils";
import { isRewriting, VariantRewritePanel } from "./variant-rewrite-panel";
import { VariantImagePanel } from "./variant-image-panel";
import { useSlow, VariantPreviewCard } from "./variant-preview-card";

const isGenerating = (campaign: Campaign) => campaign.automationState === "QUEUED" || campaign.automationState === "PROCESSING";

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
  const pending = state === "QUEUED" ? { label: "Chờ tới lượt", icon: Clock3, tone: "text-slate-500" }
    : state === "FAILED" ? { label: "Chưa tạo được", icon: CircleAlert, tone: "text-red-700" }
      : { label: "AI đang viết…", icon: LoaderCircle, tone: "text-indigo-700" };
  return <div className="mt-3 rounded-xl border border-border bg-slate-50/60 p-3" aria-label="Tiến độ tạo nội dung theo kênh">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
      <span>Đã tạo {done}/{total} kênh</span>
      {state === "PROCESSING" && done === total && <span className="text-indigo-700">Đã viết xong, đang tạo ảnh cho kênh cần ảnh…</span>}
    </div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Số kênh đã tạo" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((row) => {
      const Icon = row.done ? Check : pending.icon;
      return <li key={row.slug} className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
        <PlatformMark slug={row.slug} name={row.name} size="sm" />
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{row.name}</span><span className="block truncate text-[11px] text-muted">{row.accounts.join(", ")}</span></span>
        <span className={cn("inline-flex shrink-0 items-center gap-1 font-semibold", row.done ? "text-emerald-700" : pending.tone)}><Icon aria-hidden className={cn("size-3.5", !row.done && state === "PROCESSING" && "animate-spin motion-reduce:animate-none")} />{row.done ? "Đã tạo" : pending.label}</span>
      </li>;
    })}</ul>
  </div>;
}

function ReviewContent({ campaign, accounts }: { campaign: Campaign; accounts: PlatformAccount[] }) {
  const variants = useVariants(campaign.content?.id ?? "", true);
  const media = useMedia({ contentId: campaign.content?.id, limit: 100 });
  const [edits, setEdits] = useState<Record<string, { title: string; body: string }>>({});
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"content" | "preview">("content");
  // "all" schedules every draft still waiting; a variant id schedules only that platform.
  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null);
  const scheduleOpen = scheduleTarget !== null;
  const setScheduleOpen = (open: boolean) => setScheduleTarget(open ? "all" : null);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Approved posts are folded to one line; the operator can open one to read it again.
  const [openApproved, setOpenApproved] = useState<Record<string, boolean>>({});
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
  const save = useResourceMutation(async () => {
    for (const [id, input] of Object.entries(edits)) await resourcesService.updateVariant(id, input);
  }, ["variants"]);
  /** Saves the unsaved edits of these drafts and forgets them, before they are approved. */
  const saveEdits = async (ids: string[]) => {
    const pendingEdits = Object.entries(edits).filter(([id]) => ids.includes(id));
    for (const [id, input] of pendingEdits) await resourcesService.updateVariant(id, input);
    if (pendingEdits.length) setEdits((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))));
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
  const pendingCount = items.filter(waiting).length;
  // A platform can be approved (and goes out) as soon as its post and image are
  // done, while the AI is still writing the others.
  // …and while the AI rewrites a post, approving it would send the old text.
  const readyToApprove = (variant: ContentVariant) => waiting(variant) && !imagePending(variant) && !isRewriting(variant);
  const readyCount = items.filter(readyToApprove).length;
  // "Duyệt & đăng bài từ N điểm": ready posts the AI editor scored at least N (unscored ones are left out).
  const scoredReady = items.filter((variant) => readyToApprove(variant) && (aiScore(variant.reason) ?? 0) >= minScore);
  const generating = isGenerating(campaign);
  const editable = campaign.reviewMode !== "EXISTING_CAMPAIGN" && (campaign.automationState === "WAITING_REVIEW" || generating || (standalone && campaign.automationState === "APPROVED"));
  const eligibleAccounts = accounts.filter((account) => isAutomationAccountEligible(account) && chosenVariants.some((variant) => variant.platformSlug === account.platform?.slug));
  const dirty = Object.keys(edits).length > 0;
  const busy = save.isPending || review.isPending || decide.isPending || scoredRunning;
  const change = (variant: ContentVariant, patch: { title?: string; body?: string }) => {
    setEdits((current) => ({ ...current, [variant.id]: { title: variant.title ?? "", body: variant.body, ...current[variant.id], ...patch } }));
  };
  const emptyEdit = Object.values(edits).some((edit) => !edit.body.trim());
  const ready = perPost
    ? readyCount > 0 && !busy && !emptyEdit
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
  const scheduleVariant = scheduleTarget && scheduleTarget !== "all" ? items.find((variant) => variant.id === scheduleTarget) : undefined;
  const loadingSlowly = useSlow(variants.isPending);
  if (variants.isPending) return loadingSlowly ? <TableSkeleton /> : <div aria-busy="true" className="min-h-24" />;
  if (variants.isError) return <ErrorState error={variants.error} onRetry={() => void variants.refetch()} />;
  return <div className="space-y-4 border-t border-border p-5">
    {campaign.reviewMode === "EXISTING_CAMPAIGN" && <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">Các biến thể này đã gắn với chiến dịch trước đây. Theo dõi và xử lý từng bài ở <Link href="/publishing" className="font-semibold text-primary underline">Publishing</Link>.</p>}
    <div role="tablist" aria-label="Cách xem nội dung" className="inline-flex flex-wrap rounded-xl border border-border bg-slate-50 p-1">
      {([["content", "Nội dung", Pencil], ["preview", "Xem trước như trên mạng xã hội", Eye]] as const).map(([value, label, Icon]) => <button key={value} type="button" role="tab" aria-selected={view === value} onClick={() => setView(value)}
        className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition", view === value ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900")}><Icon aria-hidden className="size-4" />{label}</button>)}
    </div>
    {media.data?.items.map((asset) => <p key={asset.id} className="text-sm">{asset.publicUrl ? <a href={asset.publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">Xem tệp đính kèm{asset.altText ? `: ${asset.altText}` : ""}</a> : `Tệp đính kèm: ${asset.mimeType}`}</p>)}
    {items.map((variant) => { const folded = perPost && variant.status === "APPROVED" && !openApproved[variant.id]; return <div key={variant.id} className={cn("space-y-3 rounded-xl border border-border p-4", perPost && variant.status === "REJECTED" && "bg-slate-50", folded && "py-3")}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{variant.platform}</h3>{aiScore(variant.reason) !== null && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", variant.recommended === false ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700")}>AI chấm {aiScore(variant.reason)}/10</span>}</div><Badge value={perPost && waiting(variant) ? "WAITING_REVIEW" : variant.status} /></div>
      {perPost && editable && waiting(variant) && <PermissionGate allow={["ADMIN", "EDITOR"]}><div role="group" aria-label={`Duyệt bài ${variant.platform}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
        <Button size="sm" disabled={busy || !readyToApprove(variant) || edits[variant.id]?.body.trim() === ""} loading={decide.isPending && decide.variables?.variantId === variant.id && decide.variables.action === "approve"} onClick={() => void actOn(variant, "approve")}><Check className="size-4" />Duyệt & đăng bài này</Button>
        <Button size="sm" variant="secondary" disabled={busy || !readyToApprove(variant) || edits[variant.id]?.body.trim() === ""} onClick={() => setScheduleTarget(variant.id)}><CalendarClock className="size-4" />Hẹn lịch bài này</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void actOn(variant, "reject")}><X className="size-4" />Từ chối bài này</Button>
        {isRewriting(variant) ? <span className="text-xs text-indigo-700">AI đang viết lại bài này; duyệt được khi bài mới xong.</span>
          : imagePending(variant) ? <span className="text-xs text-indigo-700">Đang tạo ảnh cho bài này; duyệt được ngay khi ảnh xong.</span>
          : edits[variant.id] && <span className="text-xs text-muted">Duyệt sẽ lưu luôn phần bạn đã sửa.</span>}
      </div></PermissionGate>}
      {perPost && variant.status === "APPROVED" && <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-emerald-700">Đã duyệt: bài vào hàng đợi đăng. Theo dõi ở <Link href="/publishing" className="font-semibold underline">Publishing</Link>.</p>
        <Button size="sm" variant="ghost" aria-expanded={!folded} aria-label={folded ? `Xem nội dung bài ${variant.platform}` : `Thu gọn bài ${variant.platform}`} onClick={() => setOpenApproved((current) => ({ ...current, [variant.id]: folded }))}>{folded ? <><ChevronDown className="size-4" />Xem nội dung</> : <><ChevronUp className="size-4" />Thu gọn</>}</Button>
      </div>}
      {!folded && <>
      {perPost && variant.status === "REJECTED" && <div className="space-y-2">
        <p className="text-sm text-muted">Đã từ chối. Khôi phục để sửa và duyệt lại; bài chỉ đăng sau khi bạn duyệt.</p>
        {["REJECTED", "WAITING_REVIEW", "APPROVED"].includes(campaign.automationState ?? "") && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" className="min-h-11" disabled={busy} loading={decide.isPending && decide.variables?.variantId === variant.id && decide.variables.action === "restore"} onClick={() => void actOn(variant, "restore")}><Undo2 className="size-4" />Khôi phục bài này</Button></PermissionGate>}
      </div>}
      {standalone && editable && ["GENERATED", "APPROVED"].includes(variant.status) && <label className="flex items-center gap-2 text-sm text-primary"><input type="radio" name={`variant-${campaign.id}-${variant.platformSlug}`} checked={chosenVariants.some((chosen) => chosen.id === variant.id)} disabled={busy} onChange={() => setSelectedVariants((current) => ({ ...current, [variant.platformSlug]: variant.id }))} />Dùng biến thể này khi đăng · {variant.title || variant.platform}</label>}
      {variant.recommended === false && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">AI đề nghị kiểm tra: {variant.reason || "Nội dung cần được chỉnh sửa trước khi đăng."}</p>}
      <VariantRewritePanel variant={variant} unsaved={Boolean(edits[variant.id])}
        editable={editable && (perPost ? waiting(variant) : ["GENERATED", "APPROVED"].includes(variant.status))} />
      {view === "preview" ? <VariantPreviewCard variant={variant} edit={edits[variant.id]} account={accountFor(variant)} /> : <>
        <div><Label htmlFor={`title-${variant.id}`}>Tiêu đề</Label><Input id={`title-${variant.id}`} value={edits[variant.id]?.title ?? variant.title ?? ""} readOnly={!editable || !editing || (perPost && !waiting(variant)) || isRewriting(variant)} disabled={busy} onChange={(event) => change(variant, { title: event.target.value })} /></div>
        <div><Label htmlFor={`body-${variant.id}`}>Nội dung · {variant.platform}</Label><Textarea id={`body-${variant.id}`} className="min-h-64" value={edits[variant.id]?.body ?? variant.body} readOnly={!editable || !editing || (perPost && !waiting(variant)) || isRewriting(variant)} disabled={busy} onChange={(event) => change(variant, { body: event.target.value })} /></div>
        <VariantImagePanel variant={variant} editable={editable && (perPost ? readyToApprove(variant) : !generating && ["GENERATED", "APPROVED"].includes(variant.status))} />
        {!!variant.hashtags?.length && <p className="break-words text-sm text-muted">{variant.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}</p>}
        {variant.cta && <p className="text-sm text-muted">{variant.cta}</p>}
      </>}
      </>}
    </div>; })}
    {editable && <PermissionGate allow={["ADMIN", "EDITOR"]}>
      {standalone && <fieldset className="rounded-xl border border-border p-4"><legend className="px-2 text-sm font-semibold">Chọn tài khoản để đăng biến thể đã có</legend><div className="grid gap-3 sm:grid-cols-2">{eligibleAccounts.map((account) => <label key={account.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountIds.includes(account.id)} disabled={busy} onChange={(event) => setAccountIds((current) => event.target.checked ? [...current, account.id] : current.filter((id) => id !== account.id))} />{account.name} · {account.platform?.name}</label>)}</div>{!eligibleAccounts.length && <p className="text-sm text-amber-700">Chưa có tài khoản sẵn sàng khớp với nền tảng của biến thể. Kiểm tra tại trang Tài khoản.</p>}</fieldset>}
      {/* Long reviews (13 platforms) pushed these buttons far below the fold: keep them in view while scrolling. */}
      <div role="region" aria-label="Duyệt nội dung" className="sticky bottom-0 z-20 -mx-5 -mb-5 flex flex-wrap items-center gap-2 border-t border-border bg-white/95 px-3 py-2 sm:px-5 sm:py-3 shadow-[0_-6px_16px_-12px_rgba(15,23,42,0.35)] backdrop-blur">
      <p className="mr-auto hidden text-xs font-semibold text-slate-600 sm:block">{perPost ? `${pendingCount} chờ duyệt${readyCount < pendingCount ? ` (${pendingCount - readyCount} đang tạo ảnh)` : ""} · ${items.filter((variant) => variant.status === "APPROVED").length} đã duyệt · ${items.filter((variant) => variant.status === "REJECTED").length} từ chối · ` : ""}{items.length} kênh{items.some((variant) => variant.recommended === false) ? ` · ${items.filter((variant) => variant.recommended === false).length} kênh AI đề nghị kiểm tra` : ""}</p>
      {!editing && <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setEditing(true); setView("content"); }}><Pencil className="size-4" />Edit nội dung</Button>}
      {editing && <Button size="sm" variant="secondary" disabled={!dirty || busy || Object.values(edits).some((edit) => !edit.body.trim())} loading={save.isPending} onClick={() => void save.mutateAsync().then(() => { setEdits({}); setEditing(false); toast.success("Đã lưu nội dung"); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể lưu"))}><Save className="size-4" />Lưu chỉnh sửa</Button>}
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
      <Button size="sm" disabled={!ready} loading={review.isPending} onClick={() => void act("approve")}><Check className="size-4" />{perPost ? `Duyệt & đăng bài đã xong (${readyCount})` : "Duyệt đăng ngay"}</Button>
      <Button size="sm" variant="ghost" className={perPost ? "hidden sm:inline-flex" : undefined} disabled={busy || (perPost ? !pendingCount : generating)} onClick={() => void act("reject")}><X className="size-4" />{perPost ? "Từ chối bài còn chờ" : "Từ chối"}</Button>
      {dirty && !perPost && <p className="text-xs text-amber-700">Lưu chỉnh sửa trước khi duyệt.</p>}
      {dirty && perPost && <p className="text-xs text-muted">Duyệt sẽ lưu luôn phần bạn đã sửa.</p>}
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
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const retry = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "retry-generation"), ["campaigns"]);
  const resume = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "approve"), ["campaigns", "publish-jobs"]);
  const restore = useResourceMutation((id: string) => resourcesService.reviewAiCampaign(id, "restore"), ["campaigns", "contents", "variants"]);
  const all = (query.data?.items ?? []).filter((campaign) => campaign.automationState);
  const items = all.filter((campaign) => filter === "ALL" || (filter === "PROCESSING" ? ["QUEUED", "PROCESSING"].includes(campaign.automationState!) : campaign.automationState === filter));
  return <div className="animate-enter">
    <PageHeader eyebrow="AI Workspace" title="Content đợi duyệt" description="Tự đồng bộ mỗi 2 giây với AI đang tạo và đã tạo xong. Review, edit nội dung, hẹn lịch hoặc duyệt đăng ngay tại đây." action={<Link href="/campaigns?automate=1" className={buttonVariants()}><Sparkles className="size-4" />Tạo nội dung AI</Link>} />
    <p className="mb-3 text-sm text-muted">{all.length} lượt nội dung · {new Set(all.flatMap((item) => item.automationVariantIds ?? [])).size} biến thể · gồm dữ liệu trước đây và Content Studio</p>
    <div role="tablist" aria-label="Trạng thái nội dung AI" className="mb-5 flex flex-wrap gap-2">{[["ALL", "Tất cả"], ["PROCESSING", "Đang tạo"], ["WAITING_REVIEW", "Chờ duyệt"], ["APPROVED", "Đã duyệt"], ["FAILED", "Có lỗi"], ["REJECTED", "Đã từ chối"]].map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} className={buttonVariants({ variant: filter === value ? "primary" : "secondary", size: "sm" })} onClick={() => setFilter(value!)}>{label}</button>)}</div>
    {query.isPending ? <TableSkeleton /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !items.length ? <EmptyState title="Chưa có nội dung trong mục này" description="Các lượt tạo AI sẽ xuất hiện ở đây và cập nhật tiến độ tự động." /> : <div className="space-y-4">{items.map((campaign) => {
      const state = campaign.automationState!;
      const selectedAccounts = (campaign.automationAccountIds ?? []).map((id) => accounts.data?.items.find((account) => account.id === id)?.name ?? id);
      return <Card key={campaign.id} className="overflow-clip">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1 basis-full sm:basis-80"><h2 className="font-bold">{campaign.name}</h2><p className="mt-1 text-xs text-muted">{formatDate(campaign.createdAt)} · {selectedAccounts.length} tài khoản · {campaign.automationVariantIds?.length ?? 0} nội dung</p><p className="mt-2 break-words text-xs text-muted">{selectedAccounts.join(", ")}</p>
            {state === "QUEUED" && <p className="mt-3 text-sm text-indigo-700">Đã nhận yêu cầu, đang chờ AI xử lý.</p>}
            {state === "PROCESSING" && <p className="mt-3 text-sm text-indigo-700">AI đang tạo nội dung. Kênh nào xong sẽ hiện ngay để bạn xem trước.</p>}
            {state === "FAILED" && <p role="alert" className="mt-3 text-sm text-red-700">Chưa tạo được nội dung. Kiểm tra cấu hình AI và tài khoản rồi thử lại. ({campaign.automationErrorCode})</p>}
            {state === "DRAFT" && <p className="mt-3 text-sm text-muted">Lượt cũ chưa có biến thể. Mở Content Studio để tạo nội dung.</p>}
            {state === "WAITING_REVIEW" && campaign.reviewMode !== "EXISTING_CAMPAIGN" && <p className="mt-3 text-sm text-amber-700">Chưa đăng lên social. {campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date() ? `Lịch đăng sau khi duyệt: ${formatDate(campaign.scheduledAt)}.` : "Bài sẽ vào hàng đợi đăng ngay sau khi bạn duyệt."}</p>}
            {campaign.reviewMode === "EXISTING_CAMPAIGN" && !!campaign.automationVariantIds?.length && <p className="mt-3 text-sm text-muted">Nội dung từ chiến dịch trước đây · trạng thái đăng: <Badge value={campaign.status} /></p>}
          </div>
          <div className="flex flex-wrap items-center gap-2"><Badge value={state === "PROCESSING" ? "AI_GENERATING" : state} />
            {!!campaign.automationVariantIds?.length && <Button variant="secondary" size="sm" onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}>{expanded === campaign.id ? "Thu gọn" : isGenerating(campaign) ? `Xem ${campaign.automationVariantIds?.length ?? 0} kênh đã tạo` : state === "WAITING_REVIEW" ? "Review & duyệt" : "Review nội dung"}</Button>}
            {state === "REJECTED" && campaign.reviewMode === "AUTOMATION" && !!campaign.automationVariantIds?.length && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" className="min-h-11" disabled={restore.isPending} loading={restore.isPending && restore.variables === campaign.id} onClick={() => void restore.mutateAsync(campaign.id).then(() => { setFilter("WAITING_REVIEW"); setExpanded(campaign.id); toast.success("Đã khôi phục về chờ duyệt. Nội dung được giữ nguyên; bạn có thể sửa và duyệt lại."); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể khôi phục nội dung"))}><Undo2 className="size-4" />Khôi phục để duyệt</Button></PermissionGate>}
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
  </div>;
}
