"use client";
import Link from "next/link";
import { AlertTriangle, Clock3, Copy, ExternalLink, FileText, LogIn, Play, Puzzle, RefreshCw, RotateCcw, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import type { PublishJob } from "@/types/domain";
import { buildBrowserLoginCommand } from "@/features/accounts/browser-login-guide";
import { getNeedsActionMessage } from "./needs-action-feedback";
import { safeReviewUrl } from "./review-links";

const tabs = ["", "QUEUED", "PUBLISHING", "PROCESSING", "PUBLISHED", "RETRY", "FAILED", "NEEDS_ACTION"] as const;

function canResumeBrowserJob(job: PublishJob) {
  return job.needsAction?.canResumeBrowser === true
    && job.accountEnabled !== false
    && (job.accountStatus === undefined || job.accountStatus === "CONNECTED");
}

function ModerationLink({ job }: { job: PublishJob }) {
  if (job.needsAction?.kind !== "MODERATION") return null;
  const postUrl = safeReviewUrl(job.needsAction.url) || safeReviewUrl(job.publishedUrl);
  const href = postUrl || safeReviewUrl(job.reviewUrl);
  return <div className="mt-2 flex flex-col items-start gap-2 text-xs">
    <Link href={`/pending-posts/${job.id}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><FileText className="size-3.5" />Xem nội dung</Link>
    {href && <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3.5 shrink-0" />{postUrl ? "Mở bài viết" : job.reviewUrlKind === "pending_queue" ? "Xem hàng đợi trên diễn đàn" : "Mở diễn đàn để kiểm tra"}</a>}
    {!postUrl && <p className="text-muted">Chưa có link công khai của bài viết.</p>}
  </div>;
}

export function PublishingView({ moderationOnly = false }: { moderationOnly?: boolean } = {}) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [manualJobId, setManualJobId] = useState<string | null>(null);
  const [externalPostId, setExternalPostId] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [retryTarget, setRetryTarget] = useState<{ id: string; contentTitle: string; account: string } | null>(null);
  const [reconcileRetryTarget, setReconcileRetryTarget] = useState<PublishJob | null>(null);
  const [browserResumeTarget, setBrowserResumeTarget] = useState<PublishJob | null>(null);
  const [extensionRequeueTarget, setExtensionRequeueTarget] = useState<PublishJob | null>(null);
  const query = usePublishJobs({ page, limit: 50, status: moderationOnly ? "NEEDS_ACTION" : status || undefined, reviewState: moderationOnly ? "MODERATION" : undefined, search: search || undefined });
  const confirmationJob = query.data?.items.find((job) => job.id === manualJobId);
  const retry = useResourceMutation((id: string) => resourcesService.retryJob(id), ["publish-jobs"]);
  const reconcileRetry = useResourceMutation((id: string) => resourcesService.reconcileNotFound(id), ["publish-jobs"]);
  const resumeBrowser = useResourceMutation((id: string) => resourcesService.resumeBrowserJob(id), ["publish-jobs"]);
  const requeueExtension = useResourceMutation((id: string) => resourcesService.requeueExtensionJob(id), ["publish-jobs", "account-health"]);
  const mark = useResourceMutation((input: { id: string; externalPostId: string; url?: string }) => resourcesService.markPublished(input.id, { externalPostId: input.externalPostId, url: input.url }), ["publish-jobs", "published-posts"]);

  const copyAndOpen = async (id: string, openUrl?: string) => {
    const destinationWindow = window.open("about:blank", "_blank");
    if (destinationWindow) destinationWindow.opener = null;
    try {
      const payload = await resourcesService.manualPayload(id);
      await navigator.clipboard.writeText(payload.content);
      toast.success(payload.media.length ? "Đã sao chép nội dung và liên kết ảnh" : "Đã sao chép nội dung");
      const destinationUrl = openUrl || payload.platformUrl;
      if (destinationUrl && destinationWindow) destinationWindow.location.replace(destinationUrl);
      else destinationWindow?.close();
    } catch (error) {
      destinationWindow?.close();
      toast.error(error instanceof Error ? error.message : "Không thể tải nội dung");
    }
  };
  const confirmPublished = async () => {
    if (!manualJobId || !externalPostId.trim()) { toast.warning("Nhập ID bài đăng từ nền tảng."); return; }
    try {
      await mark.mutateAsync({ id: manualJobId, externalPostId: externalPostId.trim(), url: publishedUrl.trim() || undefined });
      toast.success("Đã đánh dấu published"); setManualJobId(null); setExternalPostId(""); setPublishedUrl("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể cập nhật"); }
  };
  const openPublishedConfirmation = (job: PublishJob) => {
    setManualJobId(job.id);
    setExternalPostId(job.needsAction?.externalPostId ?? "");
    setPublishedUrl(job.needsAction?.url ?? "");
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
  const confirmReconciliationRetry = async () => {
    if (!reconcileRetryTarget) return;
    try {
      await reconcileRetry.mutateAsync(reconcileRetryTarget.id);
      toast.success("Đã xác nhận không tìm thấy topic và đưa job cũ vào hàng đợi");
      setReconcileRetryTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xếp hàng lại job");
    }
  };
  const copyBrowserLoginCommand = async (accountId: string) => {
    const command = buildBrowserLoginCommand(accountId);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(command);
      toast.success("Đã sao chép lệnh đăng nhập Playwright", { description: command });
    } catch {
      toast.info("Mở trang Tài khoản để xem và sao chép lệnh đăng nhập.");
    }
  };
  const confirmBrowserResume = async () => {
    if (!browserResumeTarget) return;
    try {
      await resumeBrowser.mutateAsync(browserResumeTarget.id);
      toast.success("Đã đưa job Playwright trở lại hàng đợi");
      setBrowserResumeTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tiếp tục job Playwright");
    }
  };

  return <div className="animate-enter">
    <PageHeader eyebrow="Operations" title={moderationOnly ? "Bài chờ duyệt" : "Publishing"} description={moderationOnly ? "Các bài nền tảng đã nhận và đang chờ duyệt. Nếu chưa có link bài, mở diễn đàn để kiểm tra. Sau khi được duyệt, cập nhật URL bằng nút Đã được duyệt để đưa vào Bài đã đăng." : `Theo dõi publish jobs theo thời gian gần thực. Bảng tự làm mới mỗi ${Math.max(1, Math.round(env.pollIntervalMs / 1000))} giây mà không chặn giao diện.`} action={<div className="flex flex-wrap items-center gap-3">{!moderationOnly && <Link href="/pending-posts" className={buttonVariants({ variant: "secondary" })}><Clock3 className="size-4" />Bài chờ duyệt</Link>}<Link href="/published-posts" className={buttonVariants({ variant: "secondary" })}><ExternalLink className="size-4" />Bài đã đăng</Link><div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />Live polling</div></div>} />
    <Card className="overflow-hidden">
      {moderationOnly && <div className="border-b border-border px-5 py-4 text-sm font-semibold">{query.data ? `${query.data.meta?.total ?? query.data.items.length} bài chờ duyệt${search ? " khớp tìm kiếm" : ""}` : "Đang tải bài chờ duyệt…"}</div>}
      {!moderationOnly && <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-3">{tabs.map((tab) => <button key={tab || "all"} onClick={() => { setStatus(tab); setPage(1); }} className={cn("shrink-0 rounded-t-xl px-3 py-2.5 text-xs font-semibold", status === tab ? "border border-b-white border-border bg-white text-primary" : "text-slate-500 hover:bg-slate-50")}>{tab ? tab.replaceAll("_", " ") : "Tất cả"}</button>)}</div>}
      <Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm theo nội dung, tài khoản…" end={<Button variant="ghost" size="sm" onClick={() => void query.refetch()}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Làm mới</Button>} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title={moderationOnly ? "Không có bài đang chờ duyệt" : "Không có publish job"} description={moderationOnly ? "Bài đã được nền tảng nhận và yêu cầu duyệt sẽ xuất hiện ở đây. Thử xóa từ khóa nếu đang tìm kiếm." : "Các tác vụ từ campaign sẽ xuất hiện tại đây."} /> : <><TableWrap><Table><thead><tr><Th>Nền tảng / tài khoản</Th><Th>Nội dung</Th><Th>Trạng thái</Th><Th>Lần thử</Th><Th>Thời gian</Th><Th className="text-right">Kết quả</Th></tr></thead><tbody>{query.data.items.map((job) => <tr key={job.id} className="hover:bg-slate-50/70">
        <Td><div className="flex items-center gap-3"><PlatformMark slug={job.platform.toLowerCase()} name={job.platform} /><div><p className="text-xs font-bold capitalize text-foreground">{job.platform}</p><p className="mt-0.5 text-[11px] text-muted">{job.account}</p></div></div></Td>
        <Td className="max-w-xs"><p className="truncate font-semibold text-foreground">{job.contentTitle}</p>{job.error && job.needsAction?.kind !== "MODERATION" && <p title={job.error.message} className="mt-1 truncate text-[10px] text-danger">{job.error.code}: {job.error.message}</p>}{getNeedsActionMessage(job.needsAction) && <p title={job.needsAction?.message} className={cn("mt-1 line-clamp-2 text-[10px] leading-4", job.needsAction?.kind === "EXTENSION_PENDING" ? "text-indigo-700" : "text-amber-700")}>{getNeedsActionMessage(job.needsAction)}</p>}<ModerationLink job={job} /></Td>
        <Td><Badge value={job.needsAction?.kind === "MODERATION" ? "MODERATION_PENDING" : job.needsAction?.kind === "EXTENSION_PENDING" ? "WAITING_EXTENSION" : job.status} /></Td><Td><span className="text-xs font-semibold">{job.attempt}/{job.maxAttempts ?? 3}</span></Td>
        <Td className="text-xs"><p>{formatDate(job.startedAt || job.scheduledAt)}</p>{job.finishedAt && <p className="mt-0.5 text-[10px] text-muted">{job.needsAction?.kind === "MODERATION" ? "Đã gửi" : "Xong"} {formatDate(job.finishedAt)}</p>}</Td>
        <Td><div className="flex flex-wrap justify-end gap-1">{job.publishedUrl && <a href={job.publishedUrl} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg text-primary hover:bg-indigo-50" aria-label="Mở bài đã đăng"><ExternalLink className="size-4" /></a>}<PermissionGate allow={["ADMIN", "EDITOR"]}>{job.status === "FAILED" && <Button variant="ghost" size="sm" onClick={() => setRetryTarget({ id: job.id, contentTitle: job.contentTitle, account: job.account })}><RotateCcw className="size-4" />Retry</Button>}{job.status === "NEEDS_ACTION" && (job.needsAction ? <>
          {job.needsAction.kind === "EXTENSION_PENDING" && <span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-indigo-700" title="Tiện ích Chrome sẽ nhận bài này trong vòng 30 giây khi Chrome đang mở."><Puzzle className="size-3.5" />Chờ tiện ích Chrome</span>}
          {job.needsAction.kind === "EXTENSION_ACTION" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-amber-700"><Puzzle className="size-3.5" />Tiện ích cần bạn</span><Button variant="secondary" size="sm" onClick={() => openPublishedConfirmation(job)}>Đã đăng</Button><Button variant="ghost" size="sm" onClick={() => setExtensionRequeueTarget(job)}><RotateCcw className="size-4" />Giao lại cho tiện ích</Button></>}
          {job.needsAction.kind === "MODERATION" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-amber-700" title="Topic đã được gửi một lần và có thể đang chờ duyệt."><Clock3 className="size-3.5" />Chờ forum duyệt</span>{job.needsAction.url && <a href={job.needsAction.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-indigo-50"><ExternalLink className="size-4" />Kiểm tra</a>}<Button variant="secondary" size="sm" onClick={() => openPublishedConfirmation(job)}>Đã được duyệt</Button></>}
          {job.needsAction.kind === "RECONCILIATION" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-amber-700" title="Topic có thể đã được gửi; phải đối soát trước khi tạo bài khác."><Clock3 className="size-3.5" />Cần đối soát</span>{job.needsAction.url && <a href={job.needsAction.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-indigo-50"><ExternalLink className="size-4" />Kiểm tra</a>}<Button variant="secondary" size="sm" onClick={() => openPublishedConfirmation(job)}>Đã tìm thấy bài</Button>{job.needsAction.canRetryAfterNotFound && <Button variant="ghost" size="sm" onClick={() => setReconcileRetryTarget(job)}><RotateCcw className="size-4" />Không tìm thấy</Button>}</>}
          {job.needsAction.kind === "BROWSER_LOGIN" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-amber-700"><LogIn className="size-3.5" />Cần đăng nhập lại</span>{job.needsAction.accountId && <Button variant="ghost" size="sm" onClick={() => void copyBrowserLoginCommand(job.needsAction!.accountId!)}><Copy className="size-4" />Lệnh đăng nhập</Button>}<a href="/accounts" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-indigo-50"><Settings2 className="size-4" />Tài khoản</a>{canResumeBrowserJob(job) ? <Button variant="secondary" size="sm" onClick={() => setBrowserResumeTarget(job)}><Play className="size-4" />Tiếp tục sau đăng nhập</Button> : <Button variant="secondary" size="sm" disabled><Play className="size-4" />Hoàn tất kết nối trước</Button>}</>}
          {job.needsAction.kind === "BROWSER_REVIEW" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-amber-700"><AlertTriangle className="size-3.5" />Playwright đã dừng an toàn</span>{job.needsAction.url && <a href={job.needsAction.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-indigo-50"><ExternalLink className="size-4" />Mở điểm đến</a>}{job.needsAction.reason === "SUBMISSION_CONFIRMATION_REQUIRED" && <Button variant="ghost" size="sm" onClick={() => void copyAndOpen(job.id, job.needsAction?.url)}><Copy className="size-4" />Copy & mở</Button>}{job.needsAction.canResumeBrowser && <Button variant="secondary" size="sm" disabled={!canResumeBrowserJob(job)} onClick={() => setBrowserResumeTarget(job)}><Play className="size-4" />{canResumeBrowserJob(job) ? "Chạy lại adapter" : "Kết nối tài khoản trước"}</Button>}</>}
          {job.needsAction.kind === "POLICY_BLOCKED" && <><span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-red-700"><AlertTriangle className="size-3.5" />Automation bị chặn</span><Button variant="ghost" size="sm" onClick={() => void copyAndOpen(job.id, job.needsAction?.url)}><Copy className="size-4" />Bàn giao an toàn</Button></>}
        </> : <><Button variant="ghost" size="sm" onClick={() => void copyAndOpen(job.id)}><Copy className="size-4" />Copy & mở</Button><Button variant="secondary" size="sm" onClick={() => openPublishedConfirmation(job)}>Đã đăng</Button></>)}</PermissionGate></div></Td>
      </tr>)}</tbody></Table></TableWrap><Pagination page={Number(query.data.meta?.page ?? page)} totalPages={Number(query.data.meta?.totalPages ?? 1)} total={Number(query.data.meta?.total ?? query.data.items.length)} onPage={setPage} /></>}
    </Card>
    <Modal open={Boolean(manualJobId)} onClose={() => setManualJobId(null)} title={confirmationJob?.needsAction?.kind === "MODERATION" ? "Xác nhận forum đã duyệt" : confirmationJob?.needsAction?.kind === "RECONCILIATION" ? "Xác nhận đã tìm thấy topic" : "Xác nhận đã đăng thủ công"} description={confirmationJob?.needsAction?.kind === "MODERATION" ? "Topic đã được gửi một lần. Chỉ xác nhận sau khi forum hiển thị bài; không đăng lại nội dung." : confirmationJob?.needsAction?.kind === "RECONCILIATION" ? "Request trước có kết quả chưa chắc chắn. Hãy kiểm tra topic gần đây và hàng đợi moderation; không đăng lại trước khi đối soát." : "Lưu ID thật từ nền tảng để chống đăng trùng và giữ lịch sử chính xác."}>
      <div className="space-y-4"><div><Label htmlFor="external-post-id">External post ID</Label><Input id="external-post-id" value={externalPostId} onChange={(event) => setExternalPostId(event.target.value)} placeholder="Ví dụ: 1834928301" /></div><div><Label htmlFor="published-url">Published URL (không bắt buộc)</Label><Input id="published-url" type="url" value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} placeholder="https://platform.example/post/..." /></div><div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setManualJobId(null)}>Hủy</Button><Button loading={mark.isPending} onClick={() => void confirmPublished()}>{confirmationJob?.needsAction?.kind === "MODERATION" ? "Xác nhận đã duyệt" : confirmationJob?.needsAction?.kind === "RECONCILIATION" ? "Xác nhận topic" : "Xác nhận"}</Button></div></div>
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
    <ConfirmDialog
      open={Boolean(reconcileRetryTarget)}
      title="Xác nhận không có topic hoặc bài chờ duyệt"
      description={`Chỉ tiếp tục nếu bạn đã kiểm tra topic gần đây và moderation queue của ${reconcileRetryTarget?.account ?? "forum"}, và chắc chắn request trước không tạo hoặc enqueue bài. Hệ thống sẽ gửi lại chính job này với cùng idempotency key.`}
      confirmLabel="Đã kiểm tra, gửi lại"
      busy={reconcileRetry.isPending}
      danger
      onClose={() => setReconcileRetryTarget(null)}
      onConfirm={confirmReconciliationRetry}
    />
    <ConfirmDialog
      open={Boolean(extensionRequeueTarget)}
      title="Giao lại cho tiện ích Chrome"
      description={`Chỉ giao lại khi chắc chắn bài “${extensionRequeueTarget?.contentTitle ?? ""}” chưa xuất hiện trên ${extensionRequeueTarget?.platform ?? "diễn đàn"}. Tiện ích sẽ mở form và đăng lại bài này.`}
      confirmLabel="Chưa có bài, giao lại"
      busy={requeueExtension.isPending}
      danger
      onClose={() => setExtensionRequeueTarget(null)}
      onConfirm={async () => {
        if (!extensionRequeueTarget) return;
        try { await requeueExtension.mutateAsync(extensionRequeueTarget.id); toast.success("Đã giao lại cho tiện ích"); setExtensionRequeueTarget(null); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Không giao lại được"); }
      }}
    />
    <ConfirmDialog
      open={Boolean(browserResumeTarget)}
      title="Tiếp tục job Playwright"
      description={`Chỉ tiếp tục sau khi đã xử lý yêu cầu “${browserResumeTarget?.needsAction?.reason ?? "cần thao tác"}” cho ${browserResumeTarget?.account ?? "tài khoản"}. Worker sẽ mở lại trình soạn thảo và có thể đăng bài thật nếu auto-submit đã được bật.`}
      confirmLabel="Đã xử lý, tiếp tục"
      busy={resumeBrowser.isPending}
      onClose={() => setBrowserResumeTarget(null)}
      onConfirm={confirmBrowserResume}
    />
  </div>;
}
