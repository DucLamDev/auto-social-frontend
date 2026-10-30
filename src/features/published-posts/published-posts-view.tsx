"use client";

import Link from "next/link";
import { CheckCheck, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { useAccounts, usePublishedPosts } from "@/hooks/use-resources";
import { formatDate } from "@/lib/utils";

function publishedLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function PublishedPostsView() {
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [page, setPage] = useState(1);
  const accounts = useAccounts({ limit: 1000 });
  const query = usePublishedPosts({ page, limit: 25, search: search.trim() || undefined, platformId: platformId || undefined, accountId: accountId || undefined });
  const platforms = [...new Map((accounts.data?.items ?? []).flatMap((account) => account.platform ? [[account.platform.id, account.platform] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const filteredAccounts = (accounts.data?.items ?? []).filter((account) => !platformId || account.platformId === platformId);
  const hasFilters = Boolean(search || platformId || accountId);

  const clearFilters = () => { setSearch(""); setPlatformId(""); setAccountId(""); setPage(1); };
  const copyLink = async (url: string) => {
    try { await navigator.clipboard.writeText(url); toast.success("Đã sao chép link bài viết"); }
    catch { toast.error("Không thể sao chép. Bạn có thể mở bài và sao chép link trên trình duyệt."); }
  };

  return <>
    <PageHeader eyebrow="Kết quả xuất bản" title="Bài đã đăng" description="Link bài viết đã đăng thành công trên các nền tảng. Danh sách tự cập nhật khi có kết quả mới." action={<Link href="/pending-posts" className={buttonVariants({ variant: "secondary" })}>Bài chờ duyệt</Link>} />
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCheck className="size-5" /></span><div><p className="font-semibold">{query.data ? `${query.data.meta?.total ?? query.data.items.length} bài đã đăng${hasFilters ? " khớp bộ lọc" : ""}` : "Lịch sử đăng bài"}</p><p className="mt-0.5 text-xs text-muted">Bài chờ duyệt được theo dõi tại trang Bài chờ duyệt.</p></div></div>
        <Button variant="ghost" loading={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" />Làm mới</Button>
      </div>
      <Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm tiêu đề, tài khoản hoặc link…" filters={<>
        <Select aria-label="Lọc nền tảng" className="max-w-56" value={platformId} onChange={(e) => { setPlatformId(e.target.value); setAccountId(""); setPage(1); }}><option value="">Mọi nền tảng</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</Select>
        <Select aria-label="Lọc tài khoản" className="max-w-64" value={accountId} onChange={(e) => { setAccountId(e.target.value); setPage(1); }}><option value="">Mọi tài khoản</option>{filteredAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button>}
      </>} />
      {accounts.isError && <p role="alert" className="px-5 py-3 text-xs text-amber-700">Không tải được bộ lọc tài khoản. <button className="underline" onClick={() => void accounts.refetch()}>Thử lại</button></p>}
      {query.isPending ? <TableSkeleton /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data?.items.length ? <EmptyState title={hasFilters ? "Không tìm thấy bài phù hợp" : "Chưa có bài đăng thành công"} description={hasFilters ? "Thử tìm từ khóa khác hoặc xóa bộ lọc." : "Khi hệ thống xác nhận đăng thành công, bài viết và link sẽ tự xuất hiện tại đây."} action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button> : <Link href="/publishing" className={buttonVariants({ variant: "secondary" })}>Xem tiến trình đăng bài</Link>} /> : <>
        <TableWrap><Table><thead><tr><Th>Bài viết / chiến dịch</Th><Th>Nền tảng / tài khoản</Th><Th>Thời gian đăng</Th><Th className="text-right">Link bài viết</Th></tr></thead><tbody>
          {query.data.items.map((post) => {
            const url = publishedLink(post.url);
            return <tr key={post.id} className="hover:bg-slate-50/70">
              <Td className="min-w-64 max-w-md"><p className="break-words font-semibold text-foreground">{post.title}</p><p className="mt-1 text-xs text-muted">{post.campaign.name}</p>{url && <a href={url} target="_blank" rel="noopener noreferrer" title={url} className="mt-2 block max-w-sm truncate text-xs text-primary hover:underline">{url}</a>}</Td>
              <Td><div className="flex items-center gap-3"><PlatformMark slug={post.platform.slug} name={post.platform.name} /><div><p className="font-semibold">{post.platform.name}</p><p className="mt-1 text-xs text-muted">{post.account.name}</p></div></div></Td>
              <Td className="whitespace-nowrap"><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></Td>
              <Td>{url ? <div className="flex justify-end gap-2"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Mở bài: ${post.title}`} className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink className="size-4" />Mở bài</a><Button variant="ghost" size="sm" aria-label={`Sao chép link: ${post.title}`} onClick={() => void copyLink(url)}><Copy className="size-4" />Sao chép</Button></div> : <p className="max-w-48 text-right text-xs text-muted">Đã đăng, chưa có link hợp lệ từ nền tảng.</p>}</Td>
            </tr>;
          })}
        </tbody></Table></TableWrap>
        <Pagination page={page} totalPages={query.data.meta?.totalPages ?? 1} total={query.data.meta?.total} onPage={setPage} />
      </>}
    </Card>
  </>;
}
