"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ExternalLink, FileSearch, Plus, RefreshCw, Rss } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Toolbar } from "@/components/ui/toolbar";
import { useResourceMutation, useSourceArticles, useSources } from "@/hooks/use-resources";
import { cn, formatDate, truncate } from "@/lib/utils";
import { sourceSchema, type SourceInput } from "@/schemas/source";
import { resourcesService } from "@/services/resources.service";

const typeLabels = { MANUAL: "Thủ công", URL: "Website URL", RSS: "RSS Feed", SITEMAP: "Sitemap", WORDPRESS: "WordPress" };

export function SourcesView() {
  const [tab, setTab] = useState<"sources" | "articles">("sources");
  const [search, setSearch] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [articleStatus, setArticleStatus] = useState("");
  const [articlePage, setArticlePage] = useState(1);
  const [open, setOpen] = useState(false);
  const sources = useSources({ limit: 100 });
  const articles = useSourceArticles({ page: articlePage, limit: 50, search: articleSearch || undefined, status: articleStatus || undefined });
  const create = useResourceMutation((input: SourceInput) => resourcesService.createSource(input), ["sources", "contents"]);
  const sync = useResourceMutation((id: string) => resourcesService.syncSource(id), ["sources", "source-articles"]);
  const promote = useResourceMutation((id: string) => resourcesService.promoteSourceArticle(id), ["source-articles", "contents"]);
  const form = useForm<SourceInput>({ resolver: zodResolver(sourceSchema), defaultValues: { name: "", type: "URL", url: "", content: "" } });
  const type = useWatch({ control: form.control, name: "type" });
  const sourceItems = (sources.data?.items ?? []).filter((source) => `${source.name} ${source.url ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const submit = form.handleSubmit(async (values) => {
    try { await create.mutateAsync(values); toast.success(values.type === "MANUAL" ? "Đã tạo canonical content" : "Đã thêm nguồn nội dung"); setOpen(false); form.reset(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tạo nguồn"); }
  });
  const syncNow = async (id: string) => {
    try { const result = await sync.mutateAsync(id); toast.success(`Đồng bộ xong: ${result.inserted} bài mới, ${result.duplicates} trùng trên ${result.discovered} bài phát hiện.`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Đồng bộ thất bại"); }
  };
  const promoteArticle = async (id: string) => {
    try { await promote.mutateAsync(id); toast.success("Đã đưa bài crawl vào thư viện nội dung"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đưa bài vào thư viện"); }
  };

  return <div className="animate-enter">
    <PageHeader eyebrow="Ingestion" title="Nguồn nội dung" description="Thu thập từ URL, RSS, sitemap, WordPress; sau đó duyệt bài crawl trước khi đưa vào thư viện canonical content." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><Button onClick={() => setOpen(true)}><Plus className="size-4" />Thêm nguồn</Button></PermissionGate>} />
    <div className="mb-4 inline-flex rounded-xl border border-border bg-white p-1">{(["sources", "articles"] as const).map((value) => <button key={value} onClick={() => setTab(value)} className={cn("rounded-lg px-4 py-2 text-xs font-semibold", tab === value ? "bg-primary text-white" : "text-muted hover:bg-slate-50")}>{value === "sources" ? `Nguồn (${sources.data?.items.length ?? 0})` : `Bài đã crawl (${articles.data?.items.length ?? 0})`}</button>)}</div>

    {tab === "sources" ? <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm nguồn theo tên hoặc URL…" end={<span className="text-xs text-muted">{sources.data?.items.length ?? 0} nguồn</span>} />
      {sources.isPending ? <div className="p-5"><TableSkeleton /></div> : sources.isError ? <ErrorState error={sources.error} onRetry={() => void sources.refetch()} /> : !sourceItems.length ? <EmptyState title="Chưa có nguồn nội dung" description="Thêm website, feed hoặc nội dung thủ công đầu tiên để bắt đầu." action={<PermissionGate allow={["ADMIN", "EDITOR"]}><Button onClick={() => setOpen(true)}><Plus className="size-4" />Thêm nguồn</Button></PermissionGate>} /> : <TableWrap><Table><thead><tr><Th>Nguồn</Th><Th>Loại</Th><Th>Trạng thái</Th><Th>Bài crawl</Th><Th>Đồng bộ gần nhất</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{sourceItems.map((source) => <tr key={source.id} className="hover:bg-slate-50/70">
        <Td><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><Rss className="size-4" /></span><div className="min-w-0"><p className="font-bold text-foreground">{source.name}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer" className="mt-0.5 flex max-w-xs items-center gap-1 truncate text-xs text-muted hover:text-primary">{source.url}<ExternalLink className="size-3 shrink-0" /></a>}</div></div></Td>
        <Td><span className="text-xs font-semibold">{typeLabels[source.type]}</span></Td><Td><Badge value={source.status} /></Td><Td className="font-semibold">{source.articleCount ?? 0}</Td><Td className="text-xs">{formatDate(source.lastFetchedAt)}</Td>
        <Td><div className="flex justify-end"><PermissionGate allow={["ADMIN", "EDITOR"]}>{source.type !== "MANUAL" && <Button variant="ghost" size="sm" loading={sync.isPending} onClick={() => void syncNow(source.id)}><RefreshCw className="size-4" />Đồng bộ ngay</Button>}</PermissionGate></div></Td>
      </tr>)}</tbody></Table></TableWrap>}
    </Card> : <Card className="overflow-hidden">
      <Toolbar search={articleSearch} onSearch={(value) => { setArticleSearch(value); setArticlePage(1); }} searchPlaceholder="Tìm bài crawl…" filters={<Select aria-label="Lọc trạng thái bài crawl" className="w-44" value={articleStatus} onChange={(event) => { setArticleStatus(event.target.value); setArticlePage(1); }}><option value="">Mọi trạng thái</option><option value="FETCHED">Đã thu thập</option><option value="DISCOVERED">Đã phát hiện</option><option value="FAILED">Thất bại</option><option value="DUPLICATE">Trùng lặp</option></Select>} />
      {articles.isPending ? <div className="p-5"><TableSkeleton /></div> : articles.isError ? <ErrorState error={articles.error} onRetry={() => void articles.refetch()} /> : !articles.data.items.length ? <EmptyState title="Chưa có bài crawl" description="Chọn “Đồng bộ ngay” ở một nguồn để thu thập bài viết." /> : <><TableWrap><Table><thead><tr><Th>Bài viết</Th><Th>Nguồn</Th><Th>Trạng thái crawl</Th><Th>Ngày xuất bản</Th><Th>Canonical content</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{articles.data.items.map((article) => <tr key={article.id} className="hover:bg-slate-50/70">
        <Td className="max-w-md"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><FileSearch className="size-4" /></span><div className="min-w-0"><p className="truncate font-bold text-foreground">{article.title}</p><p className="mt-1 truncate text-xs text-muted">{truncate(article.description || article.author || "Không có mô tả", 80)}</p></div></div></Td>
        <Td><p className="text-xs font-semibold">{article.source.name}</p><p className="mt-0.5 text-[10px] text-muted">{article.source.type}</p></Td><Td><Badge value={article.status} />{article.errorMessage && <p className="mt-1 max-w-40 truncate text-[10px] text-danger" title={article.errorMessage}>{article.errorMessage}</p>}</Td><Td className="text-xs">{formatDate(article.publishedAt, "dd/MM/yyyy")}</Td>
        <Td>{article.content ? <Badge value={article.content.status} /> : <span className="text-xs text-muted">Chưa đưa vào thư viện</span>}</Td>
        <Td><div className="flex justify-end">{article.content ? <Link href={`/studio/${article.content.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Mở Studio<ArrowRight className="size-4" /></Link> : <PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="secondary" size="sm" loading={promote.isPending} onClick={() => void promoteArticle(article.id)}>Đưa vào thư viện<ArrowRight className="size-4" /></Button></PermissionGate>}</div></Td>
      </tr>)}</tbody></Table></TableWrap><Pagination page={Number(articles.data.meta?.page ?? articlePage)} totalPages={Number(articles.data.meta?.totalPages ?? 1)} total={Number(articles.data.meta?.total ?? articles.data.items.length)} onPage={setArticlePage} /></>}
    </Card>}

    <Modal open={open} onClose={() => setOpen(false)} title="Thêm nguồn nội dung" description="Backend kiểm tra địa chỉ, chặn private network và làm sạch HTML.">
      <form onSubmit={submit} className="space-y-4"><div><Label htmlFor="source-name">Tên nguồn / tiêu đề</Label><Input id="source-name" placeholder="Blog công ty" {...form.register("name")} /><FieldError>{form.formState.errors.name?.message}</FieldError></div><div><Label htmlFor="source-type">Loại nguồn</Label><Select id="source-type" {...form.register("type")}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></div>{type === "MANUAL" ? <div><Label htmlFor="source-content">Nội dung gốc</Label><Textarea id="source-content" className="min-h-44" placeholder="Dán hoặc soạn nội dung…" {...form.register("content")} /><FieldError>{form.formState.errors.content?.message}</FieldError></div> : <div><Label htmlFor="source-url">Địa chỉ</Label><Input id="source-url" type="url" placeholder={type === "RSS" ? "https://example.com/feed.xml" : "https://example.com"} {...form.register("url")} /><FieldError>{form.formState.errors.url?.message}</FieldError></div>}<div className="flex justify-end gap-2 pt-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" loading={create.isPending}>{type === "MANUAL" ? "Tạo nội dung" : "Thêm nguồn"}</Button></div></form>
    </Modal>
  </div>;
}
