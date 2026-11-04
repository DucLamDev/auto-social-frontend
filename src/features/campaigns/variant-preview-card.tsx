"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { useMedia } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/api/errors";
import { resourcesService } from "@/services/resources.service";
import type { ContentVariant, PlatformAccount } from "@/types/domain";
import { PostPreview } from "./post-preview";

/** True once `pending` has lasted a moment: a fast answer then never flashes a skeleton. */
export function useSlow(pending: boolean, after = 300) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { if (!pending) return; const timer = setTimeout(() => setSlow(true), after); return () => clearTimeout(timer); }, [pending, after]);
  return pending && slow;
}

export function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}

/** The post mock-up of one platform, rendered from the server's publishing text (unsaved edits included). */
export function VariantPreviewCard({ variant, edit, account }: { variant: ContentVariant; edit?: { title: string; body: string }; account?: PlatformAccount }) {
  const title = useDebounced(edit?.title ?? variant.title ?? "", 400);
  const body = useDebounced(edit?.body ?? variant.body, 400);
  const preview = useQuery({
    queryKey: ["variant-preview", variant.id, title, body, account?.id ?? ""],
    queryFn: () => resourcesService.previewVariant(variant.id, { title, body, ...(account ? { platformAccountId: account.id } : {}) }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const media = useMedia({ variantId: variant.id, limit: 10 });
  const asset = (media.data?.items ?? []).find((item) => item.type === "IMAGE" && item.publicUrl);
  const slow = useSlow(preview.isPending);
  if (preview.isPending) return slow ? <TableSkeleton rows={2} /> : <div aria-busy="true" className="min-h-40" />;
  // An API without the preview route (backend before 1.10.0) answers 404 for this POST.
  if (preview.isError && preview.error instanceof ApiError && preview.error.status === 404) {
    return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Máy chủ chưa có chức năng xem trước. Cập nhật backend lên bản 1.10.0 trở lên rồi tải lại trang.</p>;
  }
  if (preview.isError) return <ErrorState compact error={preview.error} onRetry={() => void preview.refetch()} />;
  const data = preview.data;
  const destination = data.destination;
  const where = destination?.community || destination?.category;
  return <div className="space-y-2">
    {(where || destination?.language) && <p className="text-xs text-muted">
      {where ? <>Đăng vào <span className="font-semibold text-slate-700">{where}</span></> : null}
      {where && destination?.language ? " · " : null}
      {destination?.language ? <>Ngôn ngữ bài: <span className="font-semibold text-slate-700">{destination.language === "vi" ? "Tiếng Việt" : "English"}</span></> : null}
    </p>}
    <div className="rounded-2xl bg-slate-100 p-2 sm:p-6"><PostPreview slug={variant.platformSlug} platformName={variant.platform} accountName={account?.name ?? "Tài khoản của bạn"} handle={account?.username}
      preview={data} image={asset?.publicUrl ? { url: asset.publicUrl, alt: asset.altText } : null} imagePending={Boolean(variant.image) && !asset} /></div>
    <p className={cn("text-xs", data.overLimit ? "font-semibold text-red-700" : "text-muted")}>
      {data.maxChars ? `${data.length}/${data.maxChars} ký tự${data.overLimit ? " · vượt giới hạn, cần rút gọn trước khi đăng" : ""}` : `${data.length} ký tự`}
      {data.tags.length ? ` · ${data.tags.length} tag gửi riêng` : ""} · Bản mô phỏng; giao diện thật của {variant.platform} có thể khác đôi chút.
    </p>
  </div>;
}

