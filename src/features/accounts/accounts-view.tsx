"use client";

import { ExternalLink, KeyRound, Link2, LockKeyhole, PlugZap, RefreshCw, ShieldCheck, TestTube2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { useAccounts, useInvalidate, useOAuthProviders, usePlatforms, useResourceMutation } from "@/hooks/use-resources";
import { fromNow } from "@/lib/utils";
import { resourcesService } from "@/services/resources.service";
import type { PlatformAccount } from "@/types/domain";
import { buildCredentialPayload, getCredentialConfig, getInitialCredentialValues, type CredentialValue } from "./credential-config";

interface CredentialTarget { slug: string; account?: PlatformAccount }

function CredentialAccountForm({ target, onClose }: { target: CredentialTarget; onClose: () => void }) {
  const config = getCredentialConfig(target.slug);
  const [accountName, setAccountName] = useState(target.account?.name ?? "");
  const [username, setUsername] = useState(target.account?.username ?? "");
  const [values, setValues] = useState<Record<string, CredentialValue>>(() => config ? getInitialCredentialValues(config) : {});
  const invalidate = useInvalidate();
  const save = useResourceMutation(async (input: { credential: Record<string, unknown>; settings: Record<string, unknown> }) => {
    if (target.account) return resourcesService.updateAccountCredential(target.account.id, input.credential);
    return resourcesService.createAccount({
      platformSlug: target.slug,
      name: accountName.trim(),
      username: username.trim() || undefined,
      credential: input.credential,
      settings: input.settings,
      enabled: true,
    });
  }, ["accounts", "platforms"]);
  const verify = useResourceMutation((id: string) => resourcesService.testAccount(id), ["accounts"]);

  if (!config) return <p className="text-sm text-danger">Connector này chưa khai báo credential form.</p>;
  const visibleFields = target.account ? config.fields.filter((field) => field.storage === "credential") : config.fields;
  const busy = save.isPending || verify.isPending;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!target.account && accountName.trim().length < 2) throw new Error("Tên tài khoản cần ít nhất 2 ký tự.");
      const payload = buildCredentialPayload(config, values, !target.account);
      const account = await save.mutateAsync(payload);
      toast.success("Credential đã được mã hóa và lưu. Đang kiểm tra kết nối…");
      try {
        const result = await verify.mutateAsync(account.id);
        if (!result.ok) throw new Error(result.message || "Connector không hỗ trợ kiểm tra tự động.");
        toast.success(`Kết nối thành công${result.accountName ? `: ${result.accountName}` : ""}`);
        onClose();
      } catch (error) {
        await invalidate("accounts");
        toast.error(`Credential đã lưu nhưng test thất bại: ${error instanceof Error ? error.message : "không xác định"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu credential");
    }
  };

  return <form className="space-y-5" onSubmit={(event) => void submit(event)}>
    <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-5 text-indigo-900"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>{config.description} Secret chỉ được gửi một chiều và không bao giờ được API trả lại.</p></div>
    {target.account ? <div className="rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs font-bold">{target.account.name}</p><p className="mt-1 text-[11px] text-muted">Đang thay credential cho {target.account.platform?.name}. Metadata/settings hiện có được giữ nguyên.</p></div> : <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="credential-account-name">Tên hiển thị</Label><Input id="credential-account-name" required minLength={2} value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={`${config.title} · Marketing`} /></div><div><Label htmlFor="credential-account-username">Username (tuỳ chọn)</Label><Input id="credential-account-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="account_handle" /></div></div>}
    <div className="grid gap-4 sm:grid-cols-2">{visibleFields.map((field) => {
      const value = values[field.key] ?? "";
      if (field.type === "checkbox") return <div key={field.key} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 sm:col-span-2"><div><p className="text-sm font-semibold">{field.label}</p>{field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}</div><Switch checked={Boolean(value)} onChange={(checked) => setValues((current) => ({ ...current, [field.key]: checked }))} label={field.label} /></div>;
      if (field.type === "select") return <div key={field.key}><Label htmlFor={`credential-${field.key}`}>{field.label}</Label><Select id={`credential-${field.key}`} required={field.required} value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>{field.help && <p className="mt-1 text-[11px] text-muted">{field.help}</p>}</div>;
      const wide = field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("password") || field.key === "webhookUrl";
      return <div key={field.key} className={wide ? "sm:col-span-2" : undefined}><Label htmlFor={`credential-${field.key}`}>{field.label}</Label><Input id={`credential-${field.key}`} type={field.type} required={field.required} autoComplete={field.type === "password" ? "new-password" : "off"} value={String(value)} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />{field.help && <p className="mt-1 text-[11px] text-muted">{field.help}</p>}</div>;
    })}</div>
    {!target.account && <p className="text-[11px] leading-5 text-muted">Tên, username và settings không phải secret. Credential được lưu riêng bằng AES-256-GCM. Sau khi lưu, hệ thống gọi endpoint test thật; chỉ test thành công mới chuyển tài khoản sang CONNECTED.</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Huỷ</Button><Button type="submit" loading={busy}><ShieldCheck className="size-4" />Lưu & kiểm tra</Button></div>
  </form>;
}

export function AccountsView() {
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [credentialTarget, setCredentialTarget] = useState<CredentialTarget | null>(null);
  const query = useAccounts({ limit: 100, platformId: platformId || undefined });
  const platforms = usePlatforms({ limit: 100 });
  const providers = useOAuthProviders();
  const update = useResourceMutation(({ id, enabled }: { id: string; enabled: boolean }) => resourcesService.updateAccount(id, { enabled }), ["accounts"]);
  const test = useResourceMutation((id: string) => resourcesService.testAccount(id), ["accounts"]);
  const items = (query.data?.items ?? []).filter((item) => `${item.name} ${item.username ?? ""} ${item.platform?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const credentialPlatforms = useMemo(() => (platforms.data?.items ?? []).filter((platform) => platform.enabled && getCredentialConfig(platform.slug)), [platforms.data?.items]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("oauth") === "success") { toast.success(`Đã kết nối ${params.get("provider") || "tài khoản"} thành công`); window.history.replaceState({}, "", window.location.pathname); } }, []);

  const testConnection = async (id: string) => {
    try { const response = await test.mutateAsync(id); if (response.ok) toast.success(`Kết nối hoạt động tốt${response.accountName ? `: ${response.accountName}` : ""}`); else toast.warning(response.message || "Connector cần thao tác thủ công"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Kiểm tra thất bại"); }
  };
  const connect = async (provider: string) => {
    try { const { authorizationUrl } = await resourcesService.oauthStart(provider); window.location.assign(authorizationUrl); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể bắt đầu OAuth"); }
  };
  const openCredential = (target: CredentialTarget) => { setConnectOpen(false); setCredentialTarget(target); };

  return <div className="animate-enter">
    <PageHeader eyebrow="Destinations" title="Tài khoản" description="OAuth chỉ dùng cho provider backend báo READY; connector credential dùng write-only form và connection test thật." action={<PermissionGate allow={["ADMIN"]}><Button onClick={() => setConnectOpen(true)}><Link2 className="size-4" />Kết nối / cấu hình</Button></PermissionGate>} />
    <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm tài khoản…" filters={<Select aria-label="Lọc nền tảng" className="w-44" value={platformId} onChange={(event) => setPlatformId(event.target.value)}><option value="">Mọi nền tảng</option>{platforms.data?.items.map((platform) => <option value={platform.id} key={platform.id}>{platform.name}</option>)}</Select>} end={<Button variant="ghost" size="sm" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Refresh</Button>} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : items.length === 0 ? <EmptyState title="Chưa có tài khoản" description="Kết nối OAuth hoặc cấu hình connector credential đầu tiên." action={<PermissionGate allow={["ADMIN"]}><Button onClick={() => setConnectOpen(true)}><PlugZap className="size-4" />Cấu hình ngay</Button></PermissionGate>} /> : <TableWrap><Table><thead><tr><Th>Nền tảng / tài khoản</Th><Th>Trạng thái</Th><Th>Xác thực</Th><Th>Kiểm tra gần nhất</Th><Th>Đang bật</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{items.map((account) => {
        const config = getCredentialConfig(account.platform?.slug);
        return <tr key={account.id} className="group hover:bg-slate-50/70">
          <Td><div className="flex items-center gap-3"><PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "Platform"} /><div><p className="font-bold text-foreground">{account.name}</p><p className="mt-0.5 text-xs text-muted">{account.platform?.name ?? "—"}{account.username ? ` · @${account.username}` : ""}</p></div></div></Td>
          <Td><Badge value={account.status} /></Td><Td><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">{account.oauthConfigured ? <Link2 className="size-3.5 text-sky-600" /> : <KeyRound className="size-3.5 text-amber-600" />}{account.oauthConfigured ? "OAuth" : account.credential ? "Credential" : "Chưa cấu hình"}</span><p className="mt-1 text-[10px] text-muted">{account.oauthToken?.expiresAt ? `Hết hạn ${fromNow(account.oauthToken.expiresAt)}` : account.credential?.expiresAt ? `Hết hạn ${fromNow(account.credential.expiresAt)}` : account.credential?.status ?? (account.oauthConfigured ? "Token đã mã hóa" : "—")}</p></Td><Td className="text-xs">{fromNow(account.lastCheckedAt)}</Td>
          <Td><PermissionGate allow={["ADMIN"]} fallback={<Badge value={account.enabled ? "ACTIVE" : "INACTIVE"} />}><Switch checked={account.enabled} disabled={update.isPending} label={`Bật ${account.name}`} onChange={(enabled) => void update.mutateAsync({ id: account.id, enabled }).then(() => toast.success("Đã cập nhật")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Có lỗi"))} /></PermissionGate></Td>
          <Td><div className="flex justify-end gap-1"><PermissionGate allow={["ADMIN", "EDITOR"]}><Button variant="ghost" size="sm" loading={test.isPending} onClick={() => void testConnection(account.id)}><TestTube2 className="size-4" />Test</Button></PermissionGate><PermissionGate allow={["ADMIN"]}>{config ? <Button variant="secondary" size="sm" onClick={() => openCredential({ slug: config.slug, account })}><KeyRound className="size-4" />Credential</Button> : account.status !== "CONNECTED" ? <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}><ExternalLink className="size-4" />Reconnect</Button> : null}</PermissionGate></div></Td>
        </tr>;
      })}</tbody></Table></TableWrap>}
    </Card>

    <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title="Kết nối tài khoản" description="Chọn OAuth chính thức hoặc write-only credential connector." className="max-w-2xl">
      <div className="space-y-6">
        <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">OAuth providers</h3>{providers.isPending ? <TableSkeleton rows={2} /> : providers.isError ? <ErrorState compact error={providers.error} onRetry={() => void providers.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{providers.data.map((provider) => { const platform = provider.platform || provider.provider; const ready = provider.status === "READY"; return <div key={provider.provider} className="flex items-center gap-3 rounded-xl border border-border p-4"><PlatformMark slug={platform} name={platform} /><div className="min-w-0 flex-1"><p className="text-sm font-bold capitalize">{provider.provider === "google" ? "Google · Blogger" : provider.provider}</p><p className="mt-1 text-[11px] text-muted">{ready ? "Backend OAuth đã sẵn sàng" : "Thiếu OAuth app env"}</p></div><Badge value={provider.status} />{ready && <Button size="sm" onClick={() => void connect(provider.provider)}>OAuth</Button>}</div>; })}</div>}</section>
        <section><h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Credential connectors</h3><p className="mb-3 text-xs leading-5 text-muted">Tạo account bằng credential thật, sau đó backend kiểm tra trực tiếp trước khi đánh dấu CONNECTED.</p>{platforms.isPending ? <TableSkeleton rows={3} /> : platforms.isError ? <ErrorState compact error={platforms.error} onRetry={() => void platforms.refetch()} /> : credentialPlatforms.length ? <div className="grid gap-2 sm:grid-cols-2">{credentialPlatforms.map((platform) => <button type="button" key={platform.id} onClick={() => openCredential({ slug: platform.slug })} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"><PlatformMark slug={platform.slug} name={platform.name} size="sm" /><span className="min-w-0 flex-1"><span className="block text-xs font-bold">{platform.name}</span><span className="block text-[10px] text-muted">Write-only credential + test</span></span><KeyRound className="size-4 text-slate-400" /></button>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-muted">Chưa có credential connector nào đang được bật ở trang Nền tảng.</p>}</section>
        <div className="flex gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /><p>Frontend không đọc lại hoặc hiển thị secret đã lưu. Khi cập nhật, hãy nhập lại đầy đủ các trường credential của connector.</p></div>
      </div>
    </Modal>
    <Modal open={Boolean(credentialTarget)} onClose={() => setCredentialTarget(null)} title={credentialTarget?.account ? `Cập nhật ${getCredentialConfig(credentialTarget.slug)?.title ?? "credential"}` : `Thêm ${getCredentialConfig(credentialTarget?.slug)?.title ?? "tài khoản"}`} description={credentialTarget?.account ? "Secret cũ không được tải về; form này thay toàn bộ credential payload." : "Tạo account, lưu credential mã hóa, rồi test connector."} className="max-w-2xl">
      {credentialTarget && <CredentialAccountForm key={`${credentialTarget.slug}:${credentialTarget.account?.id ?? "new"}`} target={credentialTarget} onClose={() => setCredentialTarget(null)} />}
    </Modal>
  </div>;
}
