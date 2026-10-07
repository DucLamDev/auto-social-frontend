"use client";
import { Copy, ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Toolbar } from "@/components/ui/toolbar";
import { usePublishJobs, useResourceMutation } from "@/hooks/use-resources";
import { cn, formatDate } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import { env } from "@/config/env";

const tabs = ["", "QUEUED", "PUBLISHING", "PROCESSING", "PUBLISHED", "RETRY", "FAILED", "NEEDS_ACTION"] as const;

export function PublishingView() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [manualJobId, setManualJobId] = useState<string | null>(null);
  const [externalPostId, setExternalPostId] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [retryTarget, setRetryTarget] = useState<{ id: string; contentTitle: string; account: string } | null>(null);
  const query = usePublishJobs({ page, limit: 50, status: status || undefined, search: search || undefined });
  const retry = useResourceMutation((id: string) => resourcesService.retryJob(id), ["publish-jobs"]);
  const mark = useResourceMutation((input: { id: string; externalPostId: string; url?: string }) => resourcesService.markPublished(input.id, { externalPostId: input.externalPostId, url: input.url }), ["publish-jobs"]);

  const copyAndOpen = async (id: string) => {
    try {
      const payload = await resourcesService.manualPayload(id);
      await navigator.clipboard.writeText(payload.content);
      toast.success("Đã sao chép nội dung");
      if (payload.platformUrl) window.open(payload.platformUrl, "_blank", "noopener,noreferrer");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải nội dung"); }
  };
  const confirmPublished = async () => {
    if (!manualJobId || !externalPostId.trim()) { toast.warning("Nhập ID bài đăng từ nền tảng."); return; }
    try {
      await mark.mutateAsync({ id: manualJobId, externalPostId: externalPostId.trim(), url: publishedUrl.trim() || undefined });
      toast.success("Đã đánh dấu published"); setManualJobId(null); setExternalPostId(""); setPublishedUrl("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể cập nhật"); }
  };
  const confirmRetry = async () => {
    if (!retryTarget) return;
    try {
      await retry.mutateAsync(retryTarget.id);
      toast.success("Đã đưa job vào hàng đợi thử lại");
      setRetryTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi");
    }
  };

  return <div className="animate-enter">
    <PageHeader eyebrow="Operations" title="Publishing" description={`Theo dõi publish jobs theo thời gian gần thực. Bảng tự làm mới mỗi ${Math.max(1, Math.round(env.pollIntervalMs / 1000))} giây mà không chặn giao diện.`} action={<div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />Live polling</div>} />
    <Card className="overflow-hidden">
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-3">{tabs.map((tab) => <button key={tab || "all"} onClick={() => { setStatus(tab); setPage(1); }} className={cn("shrink-0 rounded-t-xl px-3 py-2.5 text-xs font-semibold", status === tab ? "border border-b-white border-border bg-white text-primary" : "text-slate-500 hover:bg-slate-50")}>{tab ? tab.replaceAll("_", " ") : "Tất cả"}</button>)}</div>
      <Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm theo nội dung, tài khoản…" end={<Button variant="ghost" size="sm" onClick={() => void query.refetch()}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Làm mới</Button>} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title="Không có publish job" description="Các tác vụ từ campaign sẽ xuất hiện tại đây." /> : <><TableWrap><Table><thead><tr><Th>Nền tảng / tài khoản</Th><Th>Nội dung</Th><Th>Trạng thái</Th><Th>Lần thử</Th><Th>Thời gian</Th><Th className="text-right">Kết quả</Th></tr></thead><tbody>{query.data.items.map((job) => <tr key={job.id} className="hover:bg-slate-50/70">
        <Td><div className="flex items-center gap-3"><PlatformMark slug={job.platform.toLowerCase()} name={job.platform} /><div><p className="text-xs font-bold capitalize text-foreground">{job.platform}</p><p className="mt-0.5 text-[11px] text-muted">{job.account}</p></div></div></Td>
        <Td className="max-w-xs"><p className="truncate font-semibold text-foreground">{job.contentTitle}</p>{job.error && <p title={job.error.message} className="mt-1 truncate text-[10px] text-danger">{job.error.code}: {job.error.message}</p>}</Td>
        <Td><Badge value={job.status} /></Td><Td><span className="text-xs font-semibold">{job.attempt}/{job.maxAttempts ?? 3}</span></Td>
        <Td className="text-xs"><p>{formatDate(job.startedAt || job.scheduledAt)}</p>{job.finishedAt && <p className="mt-0.5 text-[10px] text-muted">Xong {formatDate(job.finishedAt)}</p>}</Td>
        <Td><div className="flex justify-end gap-1">{job.publishedUrl && <a href={job.publishedUrl} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg text-primary hover:bg-indigo-50" aria-label="Mở bài đã đăng"><ExternalLink className="size-4" /></a>}<PermissionGate allow={["ADMIN", "EDITOR"]}>{job.status === "FAILED" && <Button variant="ghost" size="sm" onClick={() => setRetryTarget({ id: job.id, contentTitle: job.contentTitle, account: job.account })}><RotateCcw className="size-4" />Retry</Button>}{job.status === "NEEDS_ACTION" && <><Button variant="ghost" size="sm" onClick={() => void copyAndOpen(job.id)}><Copy className="size-4" />Copy & mở</Button><Button variant="secondary" size="sm" onClick={() => setManualJobId(job.id)}>Đã đăng</Button></>}</PermissionGate></div></Td>
      </tr>)}</tbody></Table></TableWrap><Pagination page={Number(query.data.meta?.page ?? page)} totalPages={Number(query.data.meta?.totalPages ?? 1)} total={Number(query.data.meta?.total ?? query.data.items.length)} onPage={setPage} /></>}
    </Card>
    <Modal open={Boolean(manualJobId)} onClose={() => setManualJobId(null)} title="Xác nhận đã đăng thủ công" description="Lưu ID thật từ nền tảng để chống đăng trùng và giữ lịch sử chính xác.">
      <div className="space-y-4"><div><Label htmlFor="external-post-id">External post ID</Label><Input id="external-post-id" value={externalPostId} onChange={(event) => setExternalPostId(event.target.value)} placeholder="Ví dụ: 1834928301" /></div><div><Label htmlFor="published-url">Published URL (không bắt buộc)</Label><Input id="published-url" type="url" value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} placeholder="https://platform.example/post/..." /></div><div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setManualJobId(null)}>Hủy</Button><Button loading={mark.isPending} onClick={() => void confirmPublished()}>Xác nhận</Button></div></div>
    </Modal>
    <ConfirmDialog
      open={Boolean(retryTarget)}
      title="Xác nhận thử publish lại"
      description={`Job “${retryTarget?.contentTitle ?? ""}” cho ${retryTarget?.account ?? "tài khoản"} có thể gọi lại API bên ngoài. Hãy kiểm tra provider nếu lần trước bị timeout để tránh đăng trùng.`}
      confirmLabel="Đưa vào hàng đợi"
      busy={retry.isPending}
      danger
      onClose={() => setRetryTarget(null)}
      onConfirm={confirmRetry}
    />
  </div>;
}
