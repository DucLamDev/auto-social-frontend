"use client";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Copy, ExternalLink, FilePenLine, FileText, Paperclip, RefreshCw, Save, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";
import { useAccounts, useAiProviders, useContent, useMedia, usePlatforms, useResourceMutation, useVariants } from "@/hooks/use-resources";
import { cn, formatDate } from "@/lib/utils";
import { getAiGenerationErrorMessage } from "@/services/api/errors";
import { resourcesService } from "@/services/resources.service";
import type { AiProviderId, AiProviderOption, ContentVariant } from "@/types/domain";

const aiProviderOrder: Array<Pick<AiProviderOption, "id" | "label">> = [
  { id: "openai", label: "OpenAI" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "gemini", label: "Gemini" },
];

function AiProviderPicker({
  providers,
  selected,
  onSelect,
  pending,
  error,
  generationError,
  onRetry,
}: {
  providers?: AiProviderOption[];
  selected: AiProviderId | "";
  onSelect: (provider: AiProviderId) => void;
  pending: boolean;
  error?: Error | null;
  generationError?: string | null;
  onRetry: () => void;
}) {
  const byId = new Map(providers?.map((provider) => [provider.id, provider]));
  const options = aiProviderOrder.map((fallback) => byId.get(fallback.id) ?? {
    ...fallback,
    model: "Chưa nhận cấu hình",
    configured: false,
    isDefault: false,
  });

  return (
    <Card className="mb-5 overflow-hidden border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-3 lg:w-64 lg:shrink-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm"><Bot className="size-5" /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Chọn AI tạo nội dung</h2>
            <p className="mt-1 text-xs leading-5 text-muted">AI đã chọn sẽ tối ưu SEO và định dạng riêng cho từng nền tảng.</p>
          </div>
        </div>
        <div role="radiogroup" aria-label="Chọn nhà cung cấp AI" className="grid flex-1 gap-2 sm:grid-cols-3">
          {options.map((provider) => {
            const active = provider.id === selected;
            return (
              <button
                key={provider.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${provider.label}${provider.configured ? "" : " (chưa cấu hình)"}`}
                disabled={!provider.configured || pending}
                onClick={() => onSelect(provider.id)}
                className={cn(
                  "min-w-0 rounded-xl border bg-white px-4 py-3 text-left transition",
                  active ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-indigo-200",
                  (!provider.configured || pending) && "cursor-not-allowed bg-slate-50 opacity-60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">{provider.label}</span>
                  {provider.isDefault && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">Mặc định</span>}
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted">{provider.model}</span>
                <span className={cn("mt-2 block text-[10px] font-bold", provider.configured ? "text-emerald-600" : "text-amber-700")}>
                  {provider.configured ? (active ? "Đang được chọn" : "Sẵn sàng") : "Chưa cấu hình API key"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {pending && <p className="border-t border-indigo-100 px-5 py-2.5 text-xs text-muted">Đang tải cấu hình AI…</p>}
      {error && (
        <div className="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50/70 px-5 py-2.5">
          <p className="text-xs font-medium text-red-700">{error.message}</p>
          <Button variant="ghost" size="sm" onClick={onRetry}><RefreshCw className="size-4" />Thử lại</Button>
        </div>
      )}
      {generationError && (
        <div role="alert" className="border-t border-red-100 bg-red-50/70 px-5 py-3 text-xs leading-5 text-red-800">
          <span className="font-bold">Chưa thể tạo nội dung: </span>{generationError}
        </div>
      )}
    </Card>
  );
}

function VariantEditor({ variant }: { variant: ContentVariant }) {
  const [title, setTitle] = useState(variant.title ?? ""); const [body, setBody] = useState(variant.body);
  const [file, setFile] = useState<File | null>(null); const [fileInputKey, setFileInputKey] = useState(0);
  const save = useResourceMutation((input: { title: string; body: string }) => resourcesService.updateVariant(variant.id, input), ["variants"]);
  const approve = useResourceMutation(() => resourcesService.approveVariant(variant.id), ["variants"]);
  const media = useMedia({ variantId: variant.id, limit: 100 });
  const upload = useResourceMutation((selectedFile: File) => resourcesService.uploadMedia(selectedFile, { variantId: variant.id }), ["media"]);
  const saveVariant = async () => { try { await save.mutateAsync({ title, body }); toast.success("Đã lưu biến thể"); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu"); } };
  const uploadFile = async () => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("File vượt quá giới hạn 50 MiB.");
    try { await upload.mutateAsync(file); toast.success("Đã upload và gắn media vào biến thể"); setFile(null); setFileInputKey((value) => value + 1); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể upload media"); }
  };
  return <div className="flex min-h-[570px] flex-col"><div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4"><PlatformMark slug={variant.platformSlug} name={variant.platform} size="sm" /><div className="mr-auto"><p className="text-sm font-bold capitalize">{variant.platform}</p><p className="text-[10px] text-muted">Cập nhật {formatDate(variant.updatedAt)}</p></div><Badge value={variant.status} /><Button variant="ghost" size="sm" onClick={() => void navigator.clipboard.writeText(body).then(() => toast.success("Đã sao chép"))}><Copy className="size-4" />Sao chép</Button></div><div className="flex-1 space-y-4 p-5"><Input aria-label="Tiêu đề biến thể" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề…" /><Textarea aria-label="Nội dung biến thể" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[360px] border-0 bg-slate-50 p-4 leading-7 focus:bg-white" />{variant.hashtags?.length ? <div className="flex flex-wrap gap-1.5">{variant.hashtags.map((tag) => <span key={tag} className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">#{tag.replace(/^#/, "")}</span>)}</div> : null}
    <div className="rounded-2xl border border-border bg-slate-50/70 p-4"><div className="mb-3 flex items-start gap-2"><Paperclip className="mt-0.5 size-4 text-primary" /><div><p className="text-xs font-bold">Media đính kèm ({media.data?.items.length ?? 0})</p><p className="mt-0.5 text-[10px] leading-4 text-muted">JPEG, PNG, WebP, MP4, WebM hoặc PDF · tối đa 50 MiB. Connector đích vẫn áp dụng capability riêng.</p></div></div>{media.isPending ? <p className="py-2 text-xs text-muted">Đang tải media…</p> : media.isError ? <button type="button" className="text-xs font-semibold text-danger" onClick={() => void media.refetch()}>Không tải được media · thử lại</button> : media.data.items.length ? <div className="mb-3 grid gap-2 sm:grid-cols-2">{media.data.items.map((asset) => <a key={asset.id} href={asset.publicUrl ?? undefined} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-white p-2.5 hover:border-indigo-200"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-primary"><Paperclip className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{asset.storageKey.split("/").at(-1)}</span><span className="block text-[9px] text-muted">{asset.type} · {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MiB</span></span>{asset.publicUrl && <ExternalLink className="size-3 text-slate-400" />}</a>)}</div> : <p className="mb-3 text-xs text-muted">Chưa có media gắn riêng cho biến thể này.</p>}<PermissionGate allow={["ADMIN", "EDITOR"]}><div className="flex flex-col gap-2 sm:flex-row"><Input key={fileInputKey} aria-label="Chọn media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf" className="h-10 bg-white py-1.5 text-xs" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button type="button" variant="secondary" size="sm" disabled={!file} loading={upload.isPending} onClick={() => void uploadFile()}><Upload className="size-4" />Upload & gắn</Button></div></PermissionGate></div>
  </div><PermissionGate allow={["ADMIN", "EDITOR"]}><div className="flex justify-end gap-2 border-t border-border px-5 py-4"><Button variant="secondary" loading={save.isPending} onClick={() => void saveVariant()}><Save className="size-4" />Lưu</Button><Button loading={approve.isPending} onClick={() => void approve.mutateAsync(undefined).then(() => toast.success("Đã duyệt biến thể")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể duyệt"))}><Check className="size-4" />Duyệt</Button></div></PermissionGate></div>;
}

export function StudioView({ contentId }: { contentId?: string }) {
  const content = useContent(contentId ?? ""); const variants = useVariants(contentId ?? ""); const [activeId, setActiveId] = useState<string | null>(null);
  const platforms = usePlatforms({ limit: 100 }); const accounts = useAccounts({ limit: 200, status: "CONNECTED" });
  const aiProviders = useAiProviders(); const [aiProvider, setAiProvider] = useState<AiProviderId | "">("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false); const [manualPlatform, setManualPlatform] = useState("");
  const [manualTitle, setManualTitle] = useState(""); const [manualBody, setManualBody] = useState(""); const [manualHashtags, setManualHashtags] = useState("");
  const generate = useResourceMutation((provider: AiProviderId) => resourcesService.generateVariants(contentId ?? "", undefined, provider), ["variants", "contents", "content"]);
  const createManual = useResourceMutation((input: { contentId: string; platformSlug: string; title?: string; body: string; hashtags?: string[] }) => resourcesService.createVariant(input), ["variants", "contents", "content"]);
  const configuredAiProviders = (aiProviders.data ?? []).filter((provider) => provider.configured);
  const effectiveAiProvider = configuredAiProviders.find((provider) => provider.id === aiProvider)?.id
    || configuredAiProviders.find((provider) => provider.isDefault)?.id
    || configuredAiProviders[0]?.id
    || "";
  const providerPicker = <AiProviderPicker providers={aiProviders.data} selected={effectiveAiProvider} onSelect={(provider) => { setAiProvider(provider); setGenerationError(null); }} pending={aiProviders.isPending} error={aiProviders.isError ? aiProviders.error : null} generationError={generationError} onRetry={() => void aiProviders.refetch()} />;
  if (!contentId) return <div className="animate-enter"><PageHeader eyebrow="AI Workspace" title="Content Studio" description="Các provider AI khả dụng hiển thị bên dưới. Mở một nội dung để bắt đầu tạo biến thể." />{providerPicker}<Card><EmptyState title="Chọn một nội dung để bắt đầu" description="Content Studio làm việc trên một canonical content tại một thời điểm." action={<Link href="/contents" className={buttonVariants({ variant: "primary" })}><FileText className="size-4" />Mở thư viện</Link>} /></Card></div>;
  if (content.isPending || variants.isPending) return <PageLoader />;
  if (content.isError || variants.isError) return <><PageHeader title="Content Studio" />{providerPicker}<Card><ErrorState error={content.error || variants.error} onRetry={() => { void content.refetch(); void variants.refetch(); }} /></Card></>;
  const item = content.data; const variantItems = variants.data?.items ?? []; const selected = variantItems.find((variant) => variant.id === activeId) ?? variantItems[0];
  const enabledPlatforms = (platforms.data?.items ?? []).filter((platform) => platform.enabled);
  const connectedPlatformIds = new Set((accounts.data?.items ?? []).filter((account) => account.enabled && account.status === "CONNECTED").map((account) => account.platformId));
  const preferredManualPlatform = enabledPlatforms.find((platform) => connectedPlatformIds.has(platform.id)) ?? enabledPlatforms[0];
  const openManual = () => { setManualPlatform(preferredManualPlatform?.slug ?? ""); setManualTitle(item.title); setManualBody(item.body ?? ""); setManualHashtags(item.tags?.join(", ") ?? ""); setManualOpen(true); };
  const runGenerate = async () => {
    if (!effectiveAiProvider) return toast.warning("Chưa có provider AI nào được cấu hình trong backend.");
    setGenerationError(null);
    try {
      const generated = await generate.mutateAsync(effectiveAiProvider);
      toast.success(`Đã tạo ${generated.length} biến thể bằng ${aiProviders.data?.find((provider) => provider.id === effectiveAiProvider)?.label ?? "AI"}`);
    } catch (error) { const message = getAiGenerationErrorMessage(error); setGenerationError(message); toast.error(message); }
  };
  const submitManual = async () => {
    if (!manualPlatform) return toast.warning("Chọn nền tảng cho biến thể.");
    if (!manualBody.trim()) return toast.warning("Nội dung biến thể không được để trống.");
    const hashtags = manualHashtags.split(/[\s,]+/).map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean);
    try {
      const created = await createManual.mutateAsync({ contentId: item.id, platformSlug: manualPlatform, title: manualTitle.trim() || undefined, body: manualBody, hashtags });
      setActiveId(created.id); setManualOpen(false); toast.success("Đã tạo biến thể thủ công");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tạo biến thể thủ công"); }
  };
  return <div className="animate-enter"><PageHeader eyebrow="AI Workspace" title="Content Studio" description="So sánh nội dung gốc và tinh chỉnh biến thể trước khi phê duyệt." action={<div className="flex flex-wrap gap-2"><Link href="/contents" className={buttonVariants({ variant: "secondary" })}><ArrowLeft className="size-4" />Thư viện</Link><PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" onClick={openManual}><FilePenLine className="size-4" />Tạo thủ công</Button><Button disabled={!effectiveAiProvider} loading={generate.isPending} onClick={() => void runGenerate()}><Sparkles className="size-4" />{variantItems.length ? "Tạo lại bằng AI" : "Tạo bằng AI"}</Button></PermissionGate></div>} />
    {providerPicker}
    <div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nội dung gốc</p><h2 className="mt-1 font-bold">{item.title}</h2></div><Badge value={item.status} /></div><article className="max-h-[650px] overflow-y-auto p-6"><p className="mb-5 text-xs text-muted">{item.source?.name ?? "Nội dung thủ công"} · {formatDate(item.createdAt)}</p>{item.description && <p className="mb-5 rounded-xl border-l-4 border-indigo-300 bg-indigo-50 p-4 text-sm font-medium leading-6 text-indigo-900">{item.description}</p>}<div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.body || "Nội dung gốc chưa được backend trả về."}</div></article></Card>
      <Card className="overflow-hidden">{variantItems.length ? <><div className="flex gap-1 overflow-x-auto border-b border-border bg-slate-50 px-3 pt-3">{variantItems.map((variant) => <button key={variant.id} onClick={() => setActiveId(variant.id)} className={cn("flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-xs font-bold transition", selected?.id === variant.id ? "border border-b-white border-border bg-white text-primary" : "text-slate-500 hover:bg-white/70")}><PlatformMark slug={variant.platformSlug} name={variant.platform} size="sm" />{variant.platform}</button>)}</div>{selected && <VariantEditor key={selected.id} variant={selected} />}</> : <EmptyState title="Chưa có biến thể" description="Tạo thủ công để đăng ngay không cần AI, hoặc chọn một provider đã cấu hình để tạo biến thể." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={openManual}><FilePenLine className="size-4" />Tạo thủ công</Button><Button disabled={!effectiveAiProvider} loading={generate.isPending} onClick={() => void runGenerate()}><Sparkles className="size-4" />Tạo bằng AI</Button></div></PermissionGate>} />}</Card></div>
    <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Tạo biến thể thủ công" description="Nội dung được sao chép từ bài gốc. Chọn một nền tảng, tinh chỉnh rồi duyệt trước khi tạo chiến dịch." className="max-w-2xl">
      <div className="space-y-4"><div><Label htmlFor="manual-platform">Nền tảng</Label><Select id="manual-platform" value={manualPlatform} onChange={(event) => setManualPlatform(event.target.value)}><option value="">Chọn nền tảng đang bật</option>{enabledPlatforms.map((platform) => <option key={platform.id} value={platform.slug}>{platform.name}{connectedPlatformIds.has(platform.id) ? " · đã kết nối" : ""}</option>)}</Select>{!enabledPlatforms.length && !platforms.isPending && <p className="mt-2 text-xs text-amber-700">Chưa có nền tảng đang bật.</p>}</div>
        <div><Label htmlFor="manual-title">Tiêu đề</Label><Input id="manual-title" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} maxLength={500} placeholder="Bắt buộc với dev.to và Discourse" /></div>
        <div><Label htmlFor="manual-body">Nội dung</Label><Textarea id="manual-body" value={manualBody} onChange={(event) => setManualBody(event.target.value)} className="min-h-64" placeholder="Markdown hoặc nội dung phù hợp nền tảng" /></div>
        <div><Label htmlFor="manual-hashtags">Hashtags (phân tách bằng dấu phẩy)</Label><Input id="manual-hashtags" value={manualHashtags} onChange={(event) => setManualHashtags(event.target.value)} placeholder="nodejs, tutorial" /><p className="mt-1.5 text-[11px] text-muted">dev.to chỉ gửi tối đa 4 tags; Discourse dùng tags mặc định trong cấu hình tài khoản.</p></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setManualOpen(false)}>Hủy</Button><Button loading={createManual.isPending} onClick={() => void submitManual()}><FilePenLine className="size-4" />Tạo biến thể</Button></div></div>
    </Modal>
  </div>;
}
