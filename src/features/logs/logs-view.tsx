"use client";

import { Activity, ExternalLink, History, LockKeyhole, SearchCode, UserRound } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { StatusFilter, Toolbar } from "@/components/ui/toolbar";
import { useCurrentUser } from "@/hooks/use-auth";
import { useAudit, useLogs } from "@/hooks/use-resources";
import { cn, formatDate, truncate } from "@/lib/utils";

function PublishLogs({ search, status, onSearch, onStatus }: { search: string; status: string; onSearch: (value: string) => void; onStatus: (value: string) => void }) {
  const query = useLogs({ limit: 100, search: search || undefined, status: status || undefined });
  return <Card className="overflow-hidden">
    <Toolbar search={search} onSearch={onSearch} searchPlaceholder="Tìm nội dung hoặc tài khoản…" filters={<StatusFilter value={status} onChange={onStatus} />} />
    {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title="Chưa có publish log" description="Publish attempts sẽ được ghi lại tại đây." /> : <TableWrap><Table><thead><tr><Th>Platform / Account</Th><Th>Nội dung</Th><Th>Attempt</Th><Th>Trạng thái</Th><Th>Published URL / Error</Th><Th>Bắt đầu</Th><Th>Kết thúc</Th></tr></thead><tbody>{query.data.items.map((log) => <tr key={log.id} className="hover:bg-slate-50/70"><Td><div className="flex items-center gap-3"><PlatformMark slug={log.platform.toLowerCase()} name={log.platform} size="sm" /><div><p className="text-xs font-bold capitalize">{log.platform}</p><p className="text-[10px] text-muted">{log.account}</p></div></div></Td><Td className="max-w-xs"><p className="truncate text-xs font-semibold">{log.contentTitle}</p><p className="mt-0.5 font-mono text-[9px] text-slate-400">{log.id}</p></Td><Td className="text-xs font-semibold">{log.attempt}/{log.maxAttempts ?? 3}</Td><Td><Badge value={log.status} /></Td><Td className="max-w-xs">{log.publishedUrl ? <a href={log.publishedUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs font-semibold text-primary hover:underline"><ExternalLink className="size-3.5 shrink-0" />{log.publishedUrl}</a> : log.error ? <div><p className="text-[10px] font-bold text-danger">{log.error.code}</p><p className="mt-0.5 truncate text-[10px] text-muted" title={log.error.message}>{log.error.message}</p></div> : "—"}</Td><Td className="whitespace-nowrap text-xs">{formatDate(log.startedAt)}</Td><Td className="whitespace-nowrap text-xs">{formatDate(log.finishedAt)}</Td></tr>)}</tbody></Table></TableWrap>}
  </Card>;
}

function AuditLogs({ search, onSearch, allowed }: { search: string; onSearch: (value: string) => void; allowed: boolean }) {
  const query = useAudit({ limit: 100, search: search || undefined }, allowed);
  if (!allowed) return <Card><div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><LockKeyhole className="size-6" /></span><h2 className="mt-4 font-bold">Audit log chỉ dành cho ADMIN</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Publish log vẫn khả dụng; backend chặn `/logs/audit` với các vai trò khác.</p></div></Card>;
  return <Card className="overflow-hidden">
    <Toolbar search={search} onSearch={onSearch} searchPlaceholder="Tìm action, resource, actor hoặc ID…" />
    {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !query.data.items.length ? <EmptyState title="Chưa có audit log" description="Các mutation quản trị sẽ xuất hiện tại đây." /> : <TableWrap><Table><thead><tr><Th>Action</Th><Th>Resource</Th><Th>Actor</Th><Th>Request ID</Th><Th>Thay đổi</Th><Th>Thời gian</Th></tr></thead><tbody>{query.data.items.map((log) => {
      const metadata = log.metadata ? JSON.stringify(log.metadata) : "";
      return <tr key={log.id} className="hover:bg-slate-50/70"><Td><p className="text-xs font-bold text-foreground">{log.action}</p><p className="mt-0.5 font-mono text-[9px] text-slate-400">{log.id}</p></Td><Td><p className="text-xs font-semibold">{log.resource}</p><p className="mt-0.5 max-w-44 truncate font-mono text-[10px] text-muted" title={log.resourceId ?? undefined}>{log.resourceId ?? "—"}</p></Td><Td><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-slate-100"><UserRound className="size-3.5 text-slate-500" /></span><div><p className="text-xs font-semibold">{log.actor?.name ?? "System"}</p>{log.actor?.email && <p className="text-[9px] text-muted">{log.actor.email}</p>}</div></div></Td><Td><code className="text-[10px] text-slate-500">{log.requestId ?? "—"}</code></Td><Td className="max-w-xs"><code className="block truncate text-[10px] text-slate-500" title={metadata}>{metadata ? truncate(metadata, 100) : "—"}</code></Td><Td className="whitespace-nowrap text-xs">{formatDate(log.createdAt)}</Td></tr>;
    })}</tbody></Table></TableWrap>}
  </Card>;
}

export function LogsView() {
  const [tab, setTab] = useState<"publish" | "audit">("publish");
  const [publishSearch, setPublishSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data: user } = useCurrentUser();
  const canAudit = user?.role === "ADMIN";
  return <div className="animate-enter">
    <PageHeader eyebrow="Observability" title="Nhật ký hệ thống" description="Publish attempts và audit mutations ở hai luồng riêng; credential không xuất hiện trong log." />
    <div className="mb-4 inline-flex rounded-xl border border-border bg-white p-1"><button type="button" onClick={() => setTab("publish")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold", tab === "publish" ? "bg-primary text-white" : "text-muted hover:bg-slate-50")}><Activity className="size-4" />Publish logs</button><button type="button" onClick={() => setTab("audit")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold", tab === "audit" ? "bg-primary text-white" : "text-muted hover:bg-slate-50")}><History className="size-4" />Audit logs{!canAudit && <LockKeyhole className="size-3" />}</button></div>
    {tab === "publish" ? <PublishLogs search={publishSearch} status={status} onSearch={setPublishSearch} onStatus={setStatus} /> : <AuditLogs search={auditSearch} onSearch={setAuditSearch} allowed={canAudit} />}
    <div className="mt-4 flex items-center gap-2 text-xs text-muted"><SearchCode className="size-4" />Dùng requestId, resourceId hoặc publish job ID để đối chiếu structured logs phía backend.</div>
  </div>;
}
