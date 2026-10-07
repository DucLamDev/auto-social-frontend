"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Play, Plus, Send } from "lucide-react";
import { useState } from "react";
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
import { useAccounts, useCampaigns, useContents, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";
import { campaignSchema, type CampaignInput } from "@/schemas/campaign";
import { resourcesService } from "@/services/resources.service";
import { getApprovedVariantForAccount, getEligibleAccounts, isCampaignReadyContent } from "./campaign-utils";

export function CampaignsView() {
  const [open, setOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<{ id: string; name: string; targets: number } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useCampaigns({ limit: 100, search: search || undefined, status: status || undefined });
  const contents = useContents({ limit: 100 });
  const accounts = useAccounts({ limit: 200, status: "CONNECTED" });
  const create = useResourceMutation((input: Parameters<typeof resourcesService.createCampaign>[0]) => resourcesService.createCampaign(input), ["campaigns", "publish-jobs"]);
  const publish = useResourceMutation((id: string) => resourcesService.publishCampaign(id), ["campaigns", "publish-jobs"]);
  const form = useForm<CampaignInput>({ resolver: zodResolver(campaignSchema), defaultValues: { name: "", contentId: "", accountIds: [], scheduledAt: "" } });
  const selectedContentId = useWatch({ control: form.control, name: "contentId" });
  const variants = useVariants(selectedContentId);
  const approvedVariants = variants.data?.items ?? [];
  const eligibleAccounts = getEligibleAccounts(accounts.data?.items ?? [], approvedVariants);
  const campaignContents = (contents.data?.items ?? []).filter(isCampaignReadyContent);

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

  return <div className="animate-enter">
    <PageHeader eyebrow="Distribution" title="Chiến dịch" description="Ghép nội dung đã tạo với các biến thể được duyệt đúng nền tảng, sau đó xuất bản ngay hoặc lên lịch." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><Button onClick={() => setOpen(true)}><Plus className="size-4" />Tạo chiến dịch</Button></PermissionGate>} />
    <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm chiến dịch…" filters={<StatusFilter value={status} onChange={setStatus} />} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title="Chưa có chiến dịch" description="Tạo chiến dịch để đưa nội dung tới các tài khoản đích." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><Button onClick={() => setOpen(true)}><Plus className="size-4" />Tạo chiến dịch</Button></PermissionGate>} /> : <TableWrap><Table><thead><tr><Th>Chiến dịch / nội dung</Th><Th>Trạng thái</Th><Th>Tiến độ</Th><Th>Lịch chạy</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{query.data.items.map((campaign) => {
        const progress = campaign.targetsCount ? Math.round(((campaign.publishedCount ?? 0) / campaign.targetsCount) * 100) : 0;
        return <tr key={campaign.id} className="hover:bg-slate-50/70">
          <Td><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-primary"><Send className="size-4" /></span><div><p className="font-bold text-foreground">{campaign.name}</p><p className="mt-0.5 max-w-sm truncate text-xs text-muted">{campaign.content?.title ?? "—"}</p></div></div></Td>
          <Td><Badge value={campaign.status} /></Td>
          <Td><div className="w-40"><div className="mb-1.5 flex justify-between text-[10px] font-medium text-muted"><span>{campaign.publishedCount ?? 0}/{campaign.targetsCount ?? 0} đã đăng</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-1 flex gap-2 text-[9px]"><span className="text-danger">{campaign.failedCount ?? 0} lỗi</span><span className="text-amber-600">{campaign.needsActionCount ?? 0} cần thao tác</span><span className="text-sky-600">{campaign.activeCount ?? 0} đang chạy</span></div></div></Td>
          <Td><div className="flex items-center gap-2 text-xs"><CalendarClock className="size-4 text-slate-400" />{campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "Xuất bản thủ công"}</div></Td>
          <Td><div className="flex justify-end"><PermissionGate allow={["ADMIN", "EDITOR"]}>{campaign.status === "DRAFT" && <Button variant="ghost" size="sm" onClick={() => setPublishTarget({ id: campaign.id, name: campaign.name, targets: campaign.targetsCount ?? 0 })}><Play className="size-4" />Publish</Button>}</PermissionGate></div></Td>
        </tr>;
      })}</tbody></Table></TableWrap>}
    </Card>

    <Modal open={open} onClose={() => setOpen(false)} title="Tạo chiến dịch" description="Chỉ tài khoản có biến thể APPROVED đúng nền tảng mới có thể được chọn." className="max-w-2xl">
      <form className="space-y-5" onSubmit={submit}>
        <div><Label htmlFor="campaign-name">Tên chiến dịch</Label><Input id="campaign-name" placeholder="Ra mắt sản phẩm tháng 10" {...form.register("name")} /><FieldError>{form.formState.errors.name?.message}</FieldError></div>
        <div><Label htmlFor="campaign-content">Nội dung</Label><Select id="campaign-content" {...form.register("contentId", { onChange: () => form.setValue("accountIds", []) })}><option value="">Chọn nội dung GENERATED / APPROVED</option>{campaignContents.map((content) => <option value={content.id} key={content.id}>{content.title}</option>)}</Select><FieldError>{form.formState.errors.contentId?.message}</FieldError>{!contents.isPending && !campaignContents.length && <p className="mt-2 text-xs text-amber-700">Chưa có nội dung đã generate. Hãy tạo biến thể trong Content Studio trước.</p>}</div>
        <div><Label>Tài khoản đích</Label><Controller control={form.control} name="accountIds" render={({ field }) => <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">{variants.isPending && selectedContentId ? <p className="col-span-2 py-5 text-center text-xs text-muted">Đang kiểm tra biến thể đã duyệt…</p> : eligibleAccounts.length ? eligibleAccounts.map((account) => { const checked = field.value.includes(account.id); return <label key={account.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? "border-indigo-300 bg-indigo-50" : "border-border hover:bg-slate-50"}`}><input type="checkbox" className="size-4 accent-indigo-600" checked={checked} onChange={() => field.onChange(checked ? field.value.filter((id) => id !== account.id) : [...field.value, account.id])} /><PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "P"} size="sm" /><span className="min-w-0"><span className="block truncate text-xs font-bold">{account.name}</span><span className="block text-[10px] text-muted">{account.platform?.name} · approved</span></span></label>; }) : <p className="col-span-2 py-5 text-center text-xs leading-5 text-muted">{selectedContentId ? "Chưa có tài khoản nào khớp với biến thể APPROVED của nội dung này." : "Chọn nội dung trước để kiểm tra tài khoản hợp lệ."}</p>}</div>} /><FieldError>{form.formState.errors.accountIds?.message}</FieldError></div>
        <div><Label htmlFor="campaign-date">Lên lịch (để trống nếu chưa chạy)</Label><Input id="campaign-date" type="datetime-local" {...form.register("scheduledAt")} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" loading={create.isPending}>Tạo chiến dịch</Button></div>
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
