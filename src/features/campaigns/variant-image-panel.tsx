"use client";

import { ImageOff, ImagePlus, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";
import { useAiImageStatus, useMedia, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService } from "@/services/resources.service";
import { cn } from "@/lib/utils";
import { aiImageProviderLabel, type ContentVariant } from "@/types/domain";

const errorText = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

/**
 * The image that goes with one platform's post: the AI image (or the one you
 * replaced it with), its alt text, and the actions available while the post is
 * still a draft. Text-only destinations say so instead of showing a picture.
 */
export function VariantImagePanel({ variant, editable, compact = false }: {
  variant: ContentVariant; editable: boolean;
  /** Under the post preview, which already shows the picture: keep only the status and the image buttons. */
  compact?: boolean;
}) {
  const plan = variant.image;
  // "pending": the post is written and its image is next in line.
  const generating = plan?.status === "generating" || plan?.status === "pending";
  const media = useMedia({ variantId: variant.id, limit: 10 }, generating ? 3_000 : false);
  const provider = aiImageProviderLabel(useAiImageStatus().data);
  const refetchMedia = media.refetch;
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState(plan?.prompt ?? "");
  const fileInput = useRef<HTMLInputElement>(null);
  const images = (media.data?.items ?? []).filter((asset) => asset.type === "IMAGE");
  const current = images[0];

  // The variant list polls every 2 s; reload the image once generation ends.
  useEffect(() => { if (plan?.status === "generated" || plan?.status === "failed") void refetchMedia(); }, [plan?.status, refetchMedia]);

  const regenerate = useResourceMutation((text: string) => resourcesService.regenerateVariantImage(variant.id, text), ["variants", "media"]);
  const remove = useResourceMutation((mediaId: string) => resourcesService.removeVariantImage(variant.id, mediaId), ["variants", "media"]);
  const replace = useResourceMutation(async (file: File) => {
    const uploaded = await resourcesService.uploadMedia(file, { variantId: variant.id, altText: plan?.altText || current?.altText || undefined });
    // One image per post: the new file replaces the previous ones.
    for (const old of images) if (old.id !== uploaded.id) await resourcesService.removeVariantImage(variant.id, old.id);
  }, ["variants", "media"]);
  const busy = regenerate.isPending || remove.isPending || replace.isPending || generating;

  const noPlan = !plan || plan.type === "none";
  if (noPlan && !images.length && !editable) return <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted"><ImageOff className="size-4 shrink-0" />Kênh này chỉ đăng chữ, không kèm ảnh.</p>;

  // An empty description lets the AI design the image from the post itself.
  const startRegenerate = async (text: string) => {
    try {
      await regenerate.mutateAsync(text);
      setPromptOpen(false);
      toast.success(text.trim() ? `Đang tạo ảnh mới bằng ${provider}. Ảnh sẽ tự hiện khi xong.`
        : `AI đang thiết kế ảnh từ nội dung bài rồi tạo bằng ${provider}. Ảnh sẽ tự hiện khi xong.`);
    } catch (error) { toast.error(errorText(error, "Không thể tạo ảnh")); }
  };

  return <section aria-label={`Ảnh · ${variant.platform}`} className="space-y-2 rounded-xl border border-border bg-slate-50/70 p-3">
    <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-700">Ảnh kèm bài · {variant.platform}</p>{current?.generated && <span className="text-[11px] font-semibold text-indigo-700">Ảnh do AI tạo</span>}</div>
    {generating ? <div role="status" className={cn("flex items-center gap-2 rounded-lg bg-white text-sm text-indigo-700", compact ? "px-3 py-2" : "h-40 justify-center")}><Loader2 className="size-4 animate-spin" />{provider} đang tạo ảnh, thường mất 30 giây đến 2 phút…</div>
      : media.isPending ? <div className={cn("animate-pulse rounded-lg bg-white", compact ? "h-9" : "h-40")} />
        // A failed refresh keeps showing the image already loaded.
        : media.isError && !current ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Không tải được ảnh của bài. <button type="button" className="font-semibold underline" onClick={() => void refetchMedia()}>Thử lại</button></p>
          : compact ? <p className="text-xs text-muted">{current ? "Ảnh này đang hiện trong bản xem trước ở trên." : plan?.status === "removed" ? "Đã bỏ ảnh: bài sẽ đăng chỉ có chữ." : "Bài này chưa có ảnh."}</p>
          : current?.publicUrl ? <figure className="space-y-1">
            {/* Stored media is served from the configured storage host, outside next/image's domain list. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.publicUrl} alt={current.altText || plan?.altText || `Ảnh kèm bài ${variant.platform}`} className="max-h-72 w-auto rounded-lg border border-border bg-white object-contain" />
            {(current.altText || plan?.altText) && <figcaption className="text-xs text-muted">Mô tả ảnh: {current.altText || plan?.altText}</figcaption>}
          </figure>
            : <p className="rounded-lg bg-white p-3 text-sm text-muted">{plan?.status === "removed" ? "Đã bỏ ảnh: bài sẽ đăng chỉ có chữ."
              : noPlan ? "Bài này chưa có ảnh. Ảnh tạo thêm chỉ được đăng kèm ở kênh có hỗ trợ ảnh." : "Chưa có ảnh cho bài này."}</p>}
    {plan?.status === "failed" && !generating && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Chưa tạo được ảnh: {plan.error || "VPSTTT AI không trả về ảnh."}</p>}
    {editable && <PermissionGate allow={["ADMIN", "EDITOR"]}>
      {promptOpen && <div className="space-y-2">
        <Label htmlFor={`image-prompt-${variant.id}`}>Mô tả ảnh cho AI (tiếng Anh cho kết quả tốt nhất)</Label>
        <Textarea id={`image-prompt-${variant.id}`} className="min-h-24" maxLength={4000} value={prompt} disabled={busy} placeholder="Để trống: AI tự thiết kế ảnh từ nội dung bài." onChange={(event) => setPrompt(event.target.value)} />
      </div>}
      <div className="flex flex-wrap gap-2">
        {promptOpen
          ? <><Button size="sm" disabled={busy} loading={regenerate.isPending} onClick={() => void startRegenerate(prompt)}><RefreshCw className="size-4" />Tạo ảnh mới</Button><Button size="sm" variant="ghost" disabled={regenerate.isPending} onClick={() => setPromptOpen(false)}>Huỷ</Button></>
          : noPlan && !current
            ? <Button size="sm" variant="secondary" disabled={busy} loading={regenerate.isPending} onClick={() => void startRegenerate("")}><Sparkles className="size-4" />Tạo ảnh bằng AI</Button>
            : <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setPrompt(plan?.prompt ?? ""); setPromptOpen(true); }}><RefreshCw className="size-4" />Tạo lại ảnh</Button>}
        <Button size="sm" variant="secondary" disabled={busy} loading={replace.isPending} onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" />{current ? "Tải ảnh khác" : "Tải ảnh lên"}</Button>
        {current && <Button size="sm" variant="ghost" disabled={busy} loading={remove.isPending} onClick={() => void remove.mutateAsync(current.id).then(() => toast.success("Đã bỏ ảnh: bài sẽ đăng chỉ có chữ.")).catch((error: unknown) => toast.error(errorText(error, "Không thể bỏ ảnh")))}><Trash2 className="size-4" />Bỏ ảnh</Button>}
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label={`Chọn ảnh khác cho ${variant.platform}`} onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void replace.mutateAsync(file).then(() => toast.success("Đã thay ảnh của bài.")).catch((error: unknown) => toast.error(errorText(error, "Không thể tải ảnh")));
        }} />
      </div>
    </PermissionGate>}
  </section>;
}
