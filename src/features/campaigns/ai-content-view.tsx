"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Check, Pencil, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useAccounts, useAiCampaigns, useMedia, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { Campaign, ContentVariant, PlatformAccount } from "@/types/domain";
import { isAutomationAccountEligible } from "./campaign-utils";
import { VariantImagePanel } from "./variant-image-panel";

function ReviewContent({ campaign, accounts }: { campaign: Campaign; accounts: PlatformAccount[] }) {
  const variants = useVariants(campaign.content?.id ?? "", true);
  const media = useMedia({ contentId: campaign.content?.id, limit: 100 });
  const [edits, setEdits] = useState<Record<string, { title: string; body: string }>>({});
  const [editing, setEditing] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
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
  const items = (variants.data?.items ?? []).filter((variant) => campaign.automationVariantIds?.includes(variant.id));
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
      await resourcesService.reviewExistingContent(campaign.content!.id, { ...options, platformAccountIds: accountIds, variantIds: chosenVariants.filter((variant) => selectedPlatforms.has(variant.platformSlug)).map((variant) => variant.id) });
      return;
    }
    await resourcesService.reviewAiCampaign(campaign.id, action, action === "approve" ? options : undefined);
  }, ["campaigns", "contents", "variants", "publish-jobs"]);
  const editable = campaign.reviewMode !== "EXISTING_CAMPAIGN" && (campaign.automationState === "WAITING_REVIEW" || (standalone && campaign.automationState === "APPROVED"));
  const eligibleAccounts = accounts.filter((account) => isAutomationAccountEligible(account) && chosenVariants.some((variant) => variant.platformSlug === account.platform?.slug));
  const dirty = Object.keys(edits).length > 0;
  const busy = save.isPending || review.isPending;
  const change = (variant: ContentVariant, patch: { title?: string; body?: string }) => {
    setEdits((current) => ({ ...current, [variant.id]: { title: variant.title ?? "", body: variant.body, ...current[variant.id], ...patch } }));
  };
  const ready = items.length > 0 && items.length === campaign.automationVariantIds?.length && !dirty && !busy && (!standalone || (accountIds.length > 0 && accountIds.every((id) => eligibleAccounts.some((account) => account.id === id))));
  const act = async (action: "approve" | "reject", schedule?: string) => {
    try {
      await review.mutateAsync({ action, schedule });
      setScheduleOpen(false);
      toast.success(action === "approve" ? schedule ? "Đã duyệt và hẹn lịch đăng." : "Đã duyệt và đưa vào hàng đợi đăng ngay." : "Đã từ chối nội dung. Bài sẽ không được đăng.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xử lý nội dung"); }
  };
  if (variants.isPending) return <TableSkeleton />;
  if (variants.isError) return <ErrorState error={variants.error} onRetry={() => void variants.refetch()} />;
  return <div className="space-y-4 border-t border-border p-5">
    {campaign.reviewMode === "EXISTING_CAMPAIGN" && <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">Các biến thể này đã gắn với chiến dịch trước đây. Theo dõi và xử lý từng bài ở <Link href="/publishing" className="font-semibold text-primary underline">Publishing</Link>.</p>}
    {media.data?.items.map((asset) => <p key={asset.id} className="text-sm">{asset.publicUrl ? <a href={asset.publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">Xem tệp đính kèm{asset.altText ? `: ${asset.altText}` : ""}</a> : `Tệp đính kèm: ${asset.mimeType}`}</p>)}
    {items.map((variant) => <div key={variant.id} className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{variant.platform}</h3><Badge value={variant.status} /></div>
      {standalone && editable && ["GENERATED", "APPROVED"].includes(variant.status) && <label className="flex items-center gap-2 text-sm text-primary"><input type="radio" name={`variant-${campaign.id}-${variant.platformSlug}`} checked={chosenVariants.some((chosen) => chosen.id === variant.id)} disabled={busy} onChange={() => setSelectedVariants((current) => ({ ...current, [variant.platformSlug]: variant.id }))} />Dùng biến thể này khi đăng · {variant.title || variant.platform}</label>}
      {variant.recommended === false && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">AI đề nghị kiểm tra: {variant.reason || "Nội dung cần được chỉnh sửa trước khi đăng."}</p>}
      <div><Label htmlFor={`title-${variant.id}`}>Tiêu đề</Label><Input id={`title-${variant.id}`} value={edits[variant.id]?.title ?? variant.title ?? ""} readOnly={!editable || !editing} disabled={busy} onChange={(event) => change(variant, { title: event.target.value })} /></div>
      <div><Label htmlFor={`body-${variant.id}`}>Nội dung · {variant.platform}</Label><Textarea id={`body-${variant.id}`} className="min-h-64" value={edits[variant.id]?.body ?? variant.body} readOnly={!editable || !editing} disabled={busy} onChange={(event) => change(variant, { body: event.target.value })} /></div>
      <VariantImagePanel variant={variant} editable={editable && ["GENERATED", "APPROVED"].includes(variant.status)} />
      {!!variant.hashtags?.length && <p className="break-words text-sm text-muted">{variant.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}</p>}
      {variant.cta && <p className="text-sm text-muted">{variant.cta}</p>}
    </div>)}
    {editable && <PermissionGate allow={["ADMIN", "EDITOR"]}>
      {standalone && <fieldset className="rounded-xl border border-border p-4"><legend className="px-2 text-sm font-semibold">Chọn tài khoản để đăng biến thể đã có</legend><div className="grid gap-3 sm:grid-cols-2">{eligibleAccounts.map((account) => <label key={account.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountIds.includes(account.id)} disabled={busy} onChange={(event) => setAccountIds((current) => event.target.checked ? [...current, account.id] : current.filter((id) => id !== account.id))} />{account.name} · {account.platform?.name}</label>)}</div>{!eligibleAccounts.length && <p className="text-sm text-amber-700">Chưa có tài khoản sẵn sàng khớp với nền tảng của biến thể. Kiểm tra tại trang Tài khoản.</p>}</fieldset>}
      <div className="flex flex-wrap items-center gap-2">
      {!editing && <Button variant="secondary" disabled={busy} onClick={() => setEditing(true)}><Pencil className="size-4" />Edit nội dung</Button>}
      {editing && <Button variant="secondary" disabled={!dirty || busy || Object.values(edits).some((edit) => !edit.body.trim())} loading={save.isPending} onClick={() => void save.mutateAsync().then(() => { setEdits({}); setEditing(false); toast.success("Đã lưu nội dung"); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể lưu"))}><Save className="size-4" />Lưu chỉnh sửa</Button>}
      <Button variant="secondary" disabled={!ready} onClick={() => setScheduleOpen(true)}><CalendarClock className="size-4" />Hẹn lịch đăng</Button>
      <Button disabled={!ready} loading={review.isPending} onClick={() => void act("approve")}><Check className="size-4" />Duyệt đăng ngay</Button>
      <Button variant="ghost" disabled={busy} onClick={() => void act("reject")}><X className="size-4" />Từ chối</Button>
      {dirty && <p className="text-xs text-amber-700">Lưu chỉnh sửa trước khi duyệt.</p>}
    </div></PermissionGate>}
    <Modal open={scheduleOpen && editable} onClose={() => { if (!busy) setScheduleOpen(false); }} title="Hẹn lịch đăng" description="Duyệt toàn bộ nội dung của lượt này và đăng vào thời gian bạn chọn.">
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const date = new Date(scheduledAt);
        if (!Number.isFinite(date.getTime()) || date <= new Date()) { toast.error("Chọn thời gian đăng trong tương lai"); return; }
        void act("approve", date.toISOString());
      }}>
        <div><Label htmlFor={`schedule-${campaign.id}`}>Ngày giờ đăng (giờ địa phương)</Label><Input id={`schedule-${campaign.id}`} type="datetime-local" required value={scheduledAt} disabled={busy} onChange={(event) => setScheduledAt(event.target.value)} /></div>
        <Button type="submit" disabled={!ready || !scheduledAt} loading={review.isPending}>Duyệt & hẹn lịch</Button>
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
  const all = (query.data?.items ?? []).filter((campaign) => campaign.automationState);
  const items = all.filter((campaign) => filter === "ALL" || (filter === "PROCESSING" ? ["QUEUED", "PROCESSING"].includes(campaign.automationState!) : campaign.automationState === filter));
  return <div className="animate-enter">
    <PageHeader eyebrow="AI Workspace" title="Content đợi duyệt" description="Tự đồng bộ mỗi 2 giây với AI đang tạo và đã tạo xong. Review, edit nội dung, hẹn lịch hoặc duyệt đăng ngay tại đây." action={<Link href="/campaigns?automate=1" className={buttonVariants()}><Sparkles className="size-4" />Tạo nội dung AI</Link>} />
    <p className="mb-3 text-sm text-muted">{all.length} lượt nội dung · {new Set(all.flatMap((item) => item.automationVariantIds ?? [])).size} biến thể · gồm dữ liệu trước đây và Content Studio</p>
    <div role="tablist" aria-label="Trạng thái nội dung AI" className="mb-5 flex flex-wrap gap-2">{[["ALL", "Tất cả"], ["PROCESSING", "Đang tạo"], ["WAITING_REVIEW", "Chờ duyệt"], ["APPROVED", "Đã duyệt"], ["FAILED", "Có lỗi"], ["REJECTED", "Đã từ chối"]].map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} className={buttonVariants({ variant: filter === value ? "primary" : "secondary", size: "sm" })} onClick={() => setFilter(value!)}>{label}</button>)}</div>
    {query.isPending ? <TableSkeleton /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !items.length ? <EmptyState title="Chưa có nội dung trong mục này" description="Các lượt tạo AI sẽ xuất hiện ở đây và cập nhật tiến độ tự động." /> : <div className="space-y-4">{items.map((campaign) => {
      const state = campaign.automationState!;
      const selectedAccounts = (campaign.automationAccountIds ?? []).map((id) => accounts.data?.items.find((account) => account.id === id)?.name ?? id);
      return <Card key={campaign.id} className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1"><h2 className="font-bold">{campaign.name}</h2><p className="mt-1 text-xs text-muted">{formatDate(campaign.createdAt)} · {selectedAccounts.length} tài khoản · {campaign.automationVariantIds?.length ?? 0} nội dung</p><p className="mt-2 break-words text-xs text-muted">{selectedAccounts.join(", ")}</p>
            {state === "QUEUED" && <p className="mt-3 text-sm text-indigo-700">Đã nhận yêu cầu, đang chờ AI xử lý.</p>}
            {state === "PROCESSING" && <p className="mt-3 text-sm text-indigo-700">AI đang tạo nội dung. Bạn có thể tiếp tục làm việc khác.</p>}
            {state === "FAILED" && <p role="alert" className="mt-3 text-sm text-red-700">Chưa tạo được nội dung. Kiểm tra cấu hình AI và tài khoản rồi thử lại. ({campaign.automationErrorCode})</p>}
            {state === "DRAFT" && <p className="mt-3 text-sm text-muted">Lượt cũ chưa có biến thể. Mở Content Studio để tạo nội dung.</p>}
            {state === "WAITING_REVIEW" && campaign.reviewMode !== "EXISTING_CAMPAIGN" && <p className="mt-3 text-sm text-amber-700">Chưa đăng lên social. {campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date() ? `Lịch đăng sau khi duyệt: ${formatDate(campaign.scheduledAt)}.` : "Bài sẽ vào hàng đợi đăng ngay sau khi bạn duyệt."}</p>}
            {campaign.reviewMode === "EXISTING_CAMPAIGN" && !!campaign.automationVariantIds?.length && <p className="mt-3 text-sm text-muted">Nội dung từ chiến dịch trước đây · trạng thái đăng: <Badge value={campaign.status} /></p>}
          </div>
          <div className="flex flex-wrap items-center gap-2"><Badge value={state === "PROCESSING" ? "AI_GENERATING" : state} />
            {!!campaign.automationVariantIds?.length && <Button variant="secondary" size="sm" onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}>{expanded === campaign.id ? "Thu gọn" : "Review nội dung"}</Button>}
            {state === "FAILED" && campaign.reviewMode !== "EXISTING_CAMPAIGN" && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button size="sm" loading={retry.isPending} onClick={() => void retry.mutateAsync(campaign.id).then(() => toast.success("Đã đưa vào hàng đợi tạo lại")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể thử lại"))}><RefreshCw className="size-4" />Thử lại</Button></PermissionGate>}
            {campaign.reviewMode === "EXISTING_CAMPAIGN" && !campaign.automationVariantIds?.length && campaign.content && <Link href={`/studio/${campaign.content.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Content Studio</Link>}
            {(state === "APPROVED" || campaign.reviewMode === "EXISTING_CAMPAIGN") && campaign.reviewMode !== "CONTENT" && !!campaign.automationVariantIds?.length && <Link href="/publishing" className={buttonVariants({ variant: "secondary", size: "sm" })}>Xem tiến độ đăng</Link>}
            {state === "APPROVED" && campaign.status === "DRAFT" && campaign.reviewMode === "AUTOMATION" && <PermissionGate allow={["ADMIN", "EDITOR"]}><Button size="sm" loading={resume.isPending} onClick={() => void resume.mutateAsync(campaign.id).then(() => toast.success("Đã tiếp tục đăng theo lịch đã duyệt")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể tiếp tục"))}>Tiếp tục đăng</Button></PermissionGate>}
          </div>
        </div>
        {expanded === campaign.id && <ReviewContent campaign={campaign} accounts={accounts.data?.items ?? []} />}
      </Card>;
    })}</div>}
  </div>;
}
