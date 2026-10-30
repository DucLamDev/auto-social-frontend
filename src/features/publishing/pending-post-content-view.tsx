"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, PageLoader } from "@/components/ui/states";
import { usePublishJobContent } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";
import { safeReviewUrl } from "./review-links";

export function PendingPostContentView({ id }: { id: string }) {
  const query = usePublishJobContent(id);
  const post = query.data;
  const reviewUrl = safeReviewUrl(post?.reviewUrl);
  const sourceUrl = safeReviewUrl(post?.canonicalUrl);
  const copyContent = async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText([post.title, post.body, sourceUrl ? `Nguồn: ${sourceUrl}` : "", post.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")].filter(Boolean).join("\n\n"));
      toast.success("Đã sao chép nội dung");
    } catch { toast.error("Không thể sao chép. Bạn có thể chọn nội dung bên dưới để sao chép."); }
  };

  return <div>
    <PageHeader title="Nội dung bài viết" description="Xem nội dung lưu trong hệ thống và đối chiếu với bài trên diễn đàn." action={<Link href="/pending-posts" className={buttonVariants({ variant: "secondary" })}><ArrowLeft className="size-4" />Bài chờ duyệt</Link>} />
    {query.isPending ? <PageLoader /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : post && <div className="mx-auto max-w-5xl space-y-5">
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-semibold">{post.accountName}</p><p className="mt-1 text-sm text-muted">{post.platformName || post.platform}</p></div>
          <Badge value={post.moderationPending ? "MODERATION_PENDING" : post.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {reviewUrl && <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "primary" })}><ExternalLink className="size-4" />{post.reviewUrlKind === "pending_queue" ? "Xem hàng đợi trên diễn đàn" : "Mở diễn đàn để kiểm tra"}</a>}
          <Button variant="secondary" onClick={() => void copyContent()}><Copy className="size-4" />Sao chép nội dung</Button>
          <Button variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" />Tải lại</Button>
        </div>
        {post.reviewUrlKind === "pending_queue" && <p className="text-sm leading-6 text-muted">Link diễn đàn mở danh sách bài chờ duyệt của tài khoản đang đăng nhập. Dùng đúng hồ sơ Chrome đã đăng bài và tìm theo tiêu đề bên dưới.</p>}
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-slate-50 px-5 py-4 text-sm sm:px-8">
          <p className="font-semibold">Nội dung lưu trong hệ thống</p>
          <p className="mt-1 leading-6 text-muted">Đây là phiên bản hiện lưu cho lượt đăng này. Nếu đã sửa nội dung sau khi gửi, hãy mở hàng đợi trên diễn đàn để xem bản diễn đàn đã nhận.</p>
          {post.contentUpdatedAt && <p className="mt-1 text-xs text-muted">Cập nhật nội dung: {formatDate(post.contentUpdatedAt)}</p>}
        </div>
        <article className="space-y-6 p-5 [overflow-wrap:anywhere] sm:p-8" aria-label="Nội dung bài viết">
          <h2 className="text-xl font-bold leading-8 sm:text-2xl">{post.title || "Bài viết không có tiêu đề"}</h2>
          <div className="whitespace-pre-wrap text-[15px] leading-7" data-testid="post-body">{post.body}</div>
          {post.hashtags.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Hashtags">{post.hashtags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-lg bg-primary-soft px-2.5 py-1 text-sm text-primary">#{tag.replace(/^#/, "")}</span>)}</div>}
          {sourceUrl && <p className="text-sm">Nguồn: <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{sourceUrl}</a></p>}
          {post.media.length > 0 && <div><h3 className="mb-2 font-semibold">Tệp đính kèm</h3><ul className="space-y-2">{post.media.map((media, index) => {
            const url = safeReviewUrl(media.url);
            return <li key={index} className="text-sm">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><ExternalLink className="size-3.5 shrink-0" />{media.altText || `${media.type === "image" ? "Ảnh" : "Tệp"} ${index + 1}`}</a> : "Liên kết tệp không hợp lệ"}</li>;
          })}</ul></div>}
        </article>
      </Card>
    </div>}
  </div>;
}
