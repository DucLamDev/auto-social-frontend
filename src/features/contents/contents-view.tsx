"use client";
import Link from "next/link";
import { ArrowUpRight, FilePenLine, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { StatusFilter, Toolbar } from "@/components/ui/toolbar";
import { useContents, useSources } from "@/hooks/use-resources";
import { cn, formatDate, truncate } from "@/lib/utils";

export function ContentsView({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch); const [status, setStatus] = useState(""); const [sourceId, setSourceId] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [page, setPage] = useState(1);
  const sources = useSources({ limit: 500 });
  const query = useContents({ page, limit: 20, search: search || undefined, status: status || undefined, sourceId: sourceId || undefined, from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined }); const items = query.data?.items ?? []; const meta = query.data?.meta;
  return <div className="animate-enter"><PageHeader eyebrow="Library" title="Thư viện nội dung" description="Canonical content sau khi được thu thập và làm sạch. Chọn một bài để tạo biến thể theo từng nền tảng." action={<Link href="/sources" className={buttonVariants({ variant: "primary" })}><Plus className="size-4" />Nhập nội dung</Link>} />
    <Card className="overflow-hidden"><Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm theo tiêu đề…" filters={<><StatusFilter value={status} onChange={(value) => { setStatus(value); setPage(1); }} /><Select aria-label="Lọc nguồn" className="w-44" value={sourceId} onChange={(event) => { setSourceId(event.target.value); setPage(1); }}><option value="">Mọi nguồn</option>{sources.data?.items.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</Select><Input aria-label="Từ ngày" title="Từ ngày" type="date" className="w-36" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /><Input aria-label="Đến ngày" title="Đến ngày" type="date" className="w-36" min={from || undefined} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></>} />{query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !items.length ? <EmptyState title="Chưa có nội dung" description="Đồng bộ một nguồn hoặc nhập nội dung thủ công để bắt đầu tạo biến thể." action={<Link href="/sources" className={buttonVariants({ variant: "primary" })}><Plus className="size-4" />Đi tới nguồn</Link>} /> : <><TableWrap><Table><thead><tr><Th>Nội dung</Th><Th>Nguồn</Th><Th>Trạng thái</Th><Th>Biến thể</Th><Th>Cập nhật</Th><Th className="text-right">Studio</Th></tr></thead><tbody>{items.map((content) => <tr key={content.id} className="hover:bg-slate-50/70"><Td className="max-w-md"><div className="flex items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-primary"><FilePenLine className="size-5" /></div><div className="min-w-0"><p className="truncate font-bold text-foreground">{content.title}</p><p className="mt-1 truncate text-xs text-muted">{truncate(content.description || content.body || "Không có mô tả", 90)}</p></div></div></Td><Td><p className="text-xs font-semibold">{content.source?.name ?? "Thủ công"}</p><p className="mt-0.5 text-[10px] text-muted">{content.source?.type ?? "MANUAL"}</p></Td><Td><Badge value={content.status} /></Td><Td><span className="inline-flex items-center gap-1 text-xs font-semibold"><Sparkles className="size-3.5 text-primary" />{content.variantsCount ?? 0}</span></Td><Td className="text-xs">{formatDate(content.updatedAt || content.createdAt)}</Td><Td><div className="flex justify-end"><Link href={`/studio/${content.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Mở Studio<ArrowUpRight className="size-4" /></Link></div></Td></tr>)}</tbody></Table></TableWrap><Pagination page={Number(meta?.page ?? page)} totalPages={Number(meta?.totalPages ?? 1)} total={Number(meta?.total ?? items.length)} onPage={setPage} /></>}</Card>
  </div>;
}
