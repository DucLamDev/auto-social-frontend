"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Play, Plus, Send, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { StatusFilter, Toolbar } from "@/components/ui/toolbar";
import { useAccounts, useAiProviders, useCampaigns, useContents, usePlatforms, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";
import { campaignSchema, type AutomationCampaignInput, type CampaignInput } from "@/schemas/campaign";
import { getAiGenerationErrorMessage } from "@/services/api/errors";
import { resourcesService } from "@/services/resources.service";
import type { MediaAsset } from "@/types/domain";
import { AutomationCampaignModal } from "./automation-campaign-modal";
import { deriveAutomationCampaignName, getApprovedVariantForAccount, getEligibleAccounts, includeImageAltText, isCampaignReadyContent, normalizeAutomationAccountIds } from "./campaign-utils";

function createAutomationIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `automation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CampaignsView() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [automationUploadPending, setAutomationUploadPending] = useState(false);
  const [publishTarget, setPublishTarget] = useState<{ id: string; name: string; targets: number } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useCampaigns({ limit: 100, search: search || undefined, status: status || undefined });
  const contents = useContents({ limit: 100 });
  const accounts = useAccounts({ limit: 100 });
  const platforms = usePlatforms({ limit: 100 });
  const aiProviders = useAiProviders();
  const create = useResourceMutation((input: Parameters<typeof resourcesService.createCampaign>[0]) => resourcesService.createCampaign(input), ["campaigns", "publish-jobs"]);
  const automate = useResourceMutation(
    ({ input, idempotencyKey }: { input: Parameters<typeof resourcesService.automateCampaign>[0]; idempotencyKey: string }) => resourcesService.automateCampaign(input, idempotencyKey),
    ["campaigns", "contents", "variants", "publish-jobs"],
  );
  const publish = useResourceMutation((id: string) => resourcesService.publishCampaign(id), ["campaigns", "publish-jobs"]);
  const automationRequest = useRef<{ fingerprint: string; idempotencyKey: string } | null>(null);
  const automationMedia = useRef<{
    file: File;
    altText: string;
    requestFingerprint: string;
    asset?: MediaAsset;
    promise?: Promise<MediaAsset>;
  } | null>(null);
  const form = useForm<CampaignInput>({ resolver: zodResolver(campaignSchema), defaultValues: { name: "", contentId: "", accountIds: [], scheduledAt: "" } });
  const selectedContentId = useWatch({ control: form.control, name: "contentId" });
  const variants = useVariants(selectedContentId);
  const approvedVariants = variants.data?.items ?? [];
  const eligibleAccounts = getEligibleAccounts(accounts.data?.items ?? [], approvedVariants);
  const campaignContents = (contents.data?.items ?? []).filter(isCampaignReadyContent);
  const enabledPlatformIds = new Set((platforms.data?.items ?? [])
    .filter((platform) => platform.enabled && ["OFFICIAL_API", "COMPATIBLE_API", "BROWSER_ASSISTED", "MANUAL"].includes(platform.mode))
    .map((platform) => platform.id));
  // Manual destinations stay visible only as explicitly blocked candidates so
  // users understand why an existing account cannot enter one-click publishing.
  const automationCandidates = (accounts.data?.items ?? []).filter((account) => enabledPlatformIds.has(account.platformId));

  const openAutomation = () => {
    automationRequest.current = null;
    automationMedia.current = null;
    setAutomationError(null);
    setAutomationOpen(true);
  };

  const closeAutomation = () => {
    automationRequest.current = null;
    automationMedia.current = null;
    setAutomationError(null);
    setAutomationOpen(false);
  };

  const uploadAutomationMedia = async (file: File, altText: string, requestFingerprint: string) => {
    const cached = automationMedia.current;
    if (cached?.file === file && cached.altText === altText && cached.requestFingerprint === requestFingerprint && cached.asset) return cached.asset;
    if (cached?.file === file && cached.altText === altText && cached.requestFingerprint === requestFingerprint && cached.promise) return cached.promise;

    const promise = resourcesService.uploadMedia(file, { altText: altText || undefined });
    automationMedia.current = { file, altText, requestFingerprint, promise };
    setAutomationUploadPending(true);
    try {
      const asset = await promise;
      if (automationMedia.current?.file === file && automationMedia.current.altText === altText && automationMedia.current.requestFingerprint === requestFingerprint) automationMedia.current = { file, altText, requestFingerprint, asset };
      return asset;
    } catch (error) {
      if (automationMedia.current?.file === file && automationMedia.current.altText === altText && automationMedia.current.requestFingerprint === requestFingerprint) automationMedia.current = null;
      throw error;
    } finally {
      setAutomationUploadPending(false);
    }
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;
    try {
      const result = await publish.mutateAsync(publishTarget.id);
      toast.success(`Đã tạo ${result.jobsCreated} publish jobs`);
      setPublishTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất bản");
    }
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const targets = values.accountIds.map((accountId) => {
        const account = accounts.data?.items.find((item) => item.id === accountId);
        const variant = account ? getApprovedVariantForAccount(account, approvedVariants) : undefined;
        if (!variant) throw new Error(`Chưa có biến thể APPROVED đúng nền tảng cho ${account?.platform?.name ?? "tài khoản đã chọn"}.`);
        return { platformAccountId: accountId, contentVariantId: variant.id };
      });
      await create.mutateAsync({
        name: values.name,
        contentId: values.contentId,
        targets,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      toast.success("Đã tạo chiến dịch");
      form.reset();
      setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tạo chiến dịch"); }
  });

  const submitAutomation = async (values: AutomationCampaignInput) => {
    setAutomationError(null);
    try {
      const normalizedAltText = values.imageAltText?.replace(/\s+/g, " ").trim() ?? "";
      const semanticInput: Omit<Parameters<typeof resourcesService.automateCampaign>[0], "mediaAssetIds"> = {
        name: deriveAutomationCampaignName(values.name, values.brief),
        brief: includeImageAltText(values.brief, values.imageAltText),
        platformAccountIds: normalizeAutomationAccountIds(values.accountIds),
        aiProvider: values.aiProvider,
        scheduledAt: values.runMode === "SCHEDULED" && values.scheduledAt
          ? new Date(values.scheduledAt).toISOString()
          : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        publishImmediately: true,
      };
      const requestFingerprint = JSON.stringify(semanticInput);
      const mediaAsset = values.image
        ? await uploadAutomationMedia(values.image, normalizedAltText, requestFingerprint)
        : undefined;
      const input: Parameters<typeof resourcesService.automateCampaign>[0] = {
        ...semanticInput,
        ...(mediaAsset ? { mediaAssetIds: [mediaAsset.id] } : {}),
      };
      const fingerprint = JSON.stringify(input);
      const idempotencyKey = automationRequest.current?.fingerprint === fingerprint
        ? automationRequest.current.idempotencyKey
        : createAutomationIdempotencyKey();
      automationRequest.current = { fingerprint, idempotencyKey };
      const result = await automate.mutateAsync({ input, idempotencyKey });
      toast.success(values.runMode === "SCHEDULED"
        ? `AI đã tạo ${result.generatedVariants} biến thể và lên lịch ${result.jobsCreated} bài đăng.`
        : `AI đã tạo ${result.generatedVariants} biến thể và đưa ${result.jobsCreated} bài vào hàng đợi.`, {
        action: { label: "Xem tiến độ", onClick: () => router.push("/publishing") },
      });
      automationRequest.current = null;
      automationMedia.current = null;
      setAutomationOpen(false);
    } catch (error) {
      const message = error instanceof Error && error.message.includes("_API_KEY is not configured")
        ? "Provider AI đã chọn chưa có API key trong backend. Hãy cấu hình key rồi khởi động lại API."
        : getAiGenerationErrorMessage(error);
      setAutomationError(message);
      toast.error(message);
    }
  };

  return <div className="animate-enter">
    <PageHeader
      eyebrow="Distribution"
      title="Chiến dịch"
      description="Nhập brief một lần để AI viết bài phù hợp từng nền tảng và tự động đăng ngay hoặc theo lịch."
      action={<PermissionGate allow={["ADMIN", "EDITOR"]}><div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}><Settings2 className="size-4" />Nâng cao</Button>
        <Button onClick={openAutomation}><Sparkles className="size-4" />Tạo tự động</Button>
      </div></PermissionGate>}
    />
    <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm chiến dịch…" filters={<StatusFilter value={status} onChange={setStatus} />} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title="Chưa có chiến dịch" description="Nhập mô tả, chọn kênh và để AI tự tạo rồi đăng nội dung cho bạn." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><Button onClick={openAutomation}><Sparkles className="size-4" />Tạo chiến dịch tự động</Button></PermissionGate>} /> : <TableWrap><Table><thead><tr><Th>Chiến dịch / nội dung</Th><Th>Trạng thái</Th><Th>Tiến độ</Th><Th>Lịch chạy</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{query.data.items.map((campaign) => {
        const progress = campaign.targetsCount ? Math.round(((campaign.publishedCount ?? 0) / campaign.targetsCount) * 100) : 0;
        return <tr key={campaign.id} className="hover:bg-slate-50/70">
          <Td><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-primary"><Send className="size-4" /></span><div><p className="font-bold text-foreground">{campaign.name}</p><p className="mt-0.5 max-w-sm truncate text-xs text-muted">{campaign.content?.title ?? "—"}</p></div></div></Td>
          <Td><Badge value={campaign.status} /></Td>
          <Td><div className="w-40"><div className="mb-1.5 flex justify-between text-[10px] font-medium text-muted"><span>{campaign.publishedCount ?? 0}/{campaign.targetsCount ?? 0} đã đăng</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-1 flex gap-2 text-[9px]"><span className="text-danger">{campaign.failedCount ?? 0} lỗi</span><span className="text-amber-600">{campaign.needsActionCount ?? 0} cần thao tác</span><span className="text-sky-600">{campaign.activeCount ?? 0} đang chạy</span></div></div></Td>
          <Td><div className="flex items-center gap-2 text-xs"><CalendarClock className="size-4 text-slate-400" />{campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "Xuất bản thủ công"}</div></Td>
          <Td><div className="flex justify-end"><PermissionGate allow={["ADMIN", "EDITOR"]}>{campaign.status === "DRAFT" && (campaign.targetsCount ?? 0) > 0 && <Button variant="ghost" size="sm" onClick={() => setPublishTarget({ id: campaign.id, name: campaign.name, targets: campaign.targetsCount ?? 0 })}><Play className="size-4" />Publish</Button>}</PermissionGate></div></Td>
        </tr>;
      })}</tbody></Table></TableWrap>}
    </Card>

    <AutomationCampaignModal
      open={automationOpen}
      accounts={automationCandidates}
      accountsPending={accounts.isPending || platforms.isPending}
      accountsError={accounts.error ?? platforms.error}
      aiProviders={aiProviders.data ?? []}
      aiProvidersPending={aiProviders.isPending}
      aiProvidersError={aiProviders.error}
      submitError={automationError}
      busy={automationUploadPending || automate.isPending}
      onClose={closeAutomation}
      onSubmit={submitAutomation}
    />

    <Modal open={open} onClose={() => setOpen(false)} title="Tạo chiến dịch nâng cao" description="Dùng nội dung và biến thể đã duyệt thủ công. Chỉ tài khoản có biến thể APPROVED đúng nền tảng mới được chọn." className="max-w-2xl">
      <form className="space-y-5" onSubmit={submit}>
        <div><Label htmlFor="campaign-name">Tên chiến dịch</Label><Input id="campaign-name" placeholder="Ra mắt sản phẩm tháng 10" {...form.register("name")} /><FieldError>{form.formState.errors.name?.message}</FieldError></div>
        <div><Label htmlFor="campaign-content">Nội dung</Label><Select id="campaign-content" {...form.register("contentId", { onChange: () => form.setValue("accountIds", []) })}><option value="">Chọn nội dung GENERATED / APPROVED</option>{campaignContents.map((content) => <option value={content.id} key={content.id}>{content.title}</option>)}</Select><FieldError>{form.formState.errors.contentId?.message}</FieldError>{!contents.isPending && !campaignContents.length && <p className="mt-2 text-xs text-amber-700">Chưa có nội dung đã generate. Hãy tạo biến thể trong Content Studio trước.</p>}</div>
        <div><Label>Tài khoản đích</Label><Controller control={form.control} name="accountIds" render={({ field }) => <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">{variants.isPending && selectedContentId ? <p className="col-span-2 py-5 text-center text-xs text-muted">Đang kiểm tra biến thể đã duyệt…</p> : eligibleAccounts.length ? eligibleAccounts.map((account) => { const checked = field.value.includes(account.id); return <label key={account.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? "border-indigo-300 bg-indigo-50" : "border-border hover:bg-slate-50"}`}><input type="checkbox" className="size-4 accent-indigo-600" checked={checked} onChange={() => field.onChange(checked ? field.value.filter((id) => id !== account.id) : [...field.value, account.id])} /><PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "P"} size="sm" /><span className="min-w-0"><span className="block truncate text-xs font-bold">{account.name}</span><span className="block text-[10px] text-muted">{account.platform?.name} · approved</span></span></label>; }) : <p className="col-span-2 py-5 text-center text-xs leading-5 text-muted">{selectedContentId ? "Chưa có tài khoản nào khớp với biến thể APPROVED của nội dung này." : "Chọn nội dung trước để kiểm tra tài khoản hợp lệ."}</p>}</div>} /><FieldError>{form.formState.errors.accountIds?.message}</FieldError></div>
        <div><Label htmlFor="campaign-date">Lên lịch (để trống nếu chưa chạy)</Label><Input id="campaign-date" type="datetime-local" {...form.register("scheduledAt")} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" loading={create.isPending}><Plus className="size-4" />Tạo thủ công</Button></div>
      </form>
    </Modal>
    <ConfirmDialog
      open={Boolean(publishTarget)}
      title="Xác nhận kích hoạt chiến dịch"
      description={`Chiến dịch “${publishTarget?.name ?? ""}” sẽ tạo hoặc kích hoạt ${publishTarget?.targets ?? 0} publish job. Job đến hạn có thể gọi API mạng xã hội ngay.`}
      confirmLabel="Kích hoạt publish"
      busy={publish.isPending}
      onClose={() => setPublishTarget(null)}
      onConfirm={confirmPublish}
    />
  </div>;
}
