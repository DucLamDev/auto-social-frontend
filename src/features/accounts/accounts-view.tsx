"use client";

import { ExternalLink, HeartPulse, KeyRound, Link2, LockKeyhole, LogIn, MonitorPlay, PlugZap, RefreshCw, Settings2, ShieldCheck, ShieldOff, TestTube2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformMark } from "@/components/platforms/platform-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { useAccounts, useInvalidate, useOAuthProviders, usePlatforms, useResourceMutation } from "@/hooks/use-resources";
import { fromNow } from "@/lib/utils";
import { ApiError } from "@/services/api/errors";
import { resourcesService, type AccountConnectionTestResult } from "@/services/resources.service";
import type { Platform, PlatformAccount } from "@/types/domain";
import { BrowserLoginGuide } from "./browser-login-guide";
import { getPlatformAutomationLabel } from "./automation-status";
import { getBrowserConnectionErrorMessage, getTagPolicyWarning } from "./connection-test-feedback";
import { buildCredentialPayload, getCredentialConfig, getInitialCredentialValues, type CredentialValue } from "./credential-config";
import { isAutoRefreshPlatform, oauthProviderForPlatform, oauthProviderLabel, oauthProviderNote, readOAuthResult } from "./oauth";

interface CredentialTarget { platform: Pick<Platform, "id" | "slug" | "name"> & Partial<Pick<Platform, "connectorKey" | "mode" | "defaultSettings">>; account?: PlatformAccount }

const DESTINATION_PAGE_SIZE = 8;

function showSuccessfulConnectionTest(result: AccountConnectionTestResult, message: string) {
  toast.success(message);
  const tagPolicyWarning = getTagPolicyWarning(result);
  if (tagPolicyWarning) toast.warning(tagPolicyWarning, { duration: 12_000 });
}

function CredentialAccountForm({ target, onClose, onBrowserLogin }: { target: CredentialTarget; onClose: () => void; onBrowserLogin: (account: PlatformAccount) => void }) {
  const config = getCredentialConfig(target.platform);
  const [accountName, setAccountName] = useState(target.account?.name ?? "");
  const [username, setUsername] = useState(target.account?.username ?? "");
  const [values, setValues] = useState<Record<string, CredentialValue>>(() => config
    ? getInitialCredentialValues(config, target.account?.settings)
    : {});
  const invalidate = useInvalidate();
  const save = useResourceMutation(async (input: { credential?: Record<string, unknown>; settings: Record<string, unknown> }) => {
    if (target.account) {
      if (config?.requiresCredential === false) {
        return resourcesService.updateAccountSettings(target.account.id, input.settings);
      }
      return resourcesService.updateAccountCredential(target.account.id, {
        credential: input.credential ?? {},
        settings: input.settings,
      });
    }
    return resourcesService.createAccount({
      platformSlug: target.platform.slug,
      name: accountName.trim(),
      username: username.trim() || undefined,
      ...(input.credential && Object.keys(input.credential).length ? { credential: input.credential } : {}),
      settings: input.settings,
      enabled: true,
    });
  }, ["accounts", "platforms"]);
  const verify = useResourceMutation((id: string) => resourcesService.testAccount(id), ["accounts"]);

  if (!config) return <p className="text-sm text-danger">Connector này chưa khai báo credential form.</p>;
  const visibleFields = config.fields;
  const busy = save.isPending || verify.isPending;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!target.account && accountName.trim().length < 2) throw new Error("Tên tài khoản cần ít nhất 2 ký tự.");
      const payload = buildCredentialPayload(config, values, {
        includeEmptySettings: Boolean(target.account),
      });
      const account = await save.mutateAsync(payload);
      if (config.browserAssisted) {
        await invalidate("accounts");
        toast.success(target.account ? "Đã lưu cấu hình Playwright mà không thay đổi session." : "Đã tạo tài khoản Playwright. Hoàn tất bước đăng nhập để kích hoạt.");
        onClose();
        if (!target.account || account.status !== "CONNECTED") onBrowserLogin(account);
        return;
      }
      toast.success(config.requiresCredential === false
        ? "Đã lưu điểm đến bàn giao thủ công. Đang kiểm tra trạng thái…"
        : "Credential đã được mã hóa và lưu. Đang kiểm tra kết nối…");
      try {
        const result = await verify.mutateAsync(account.id);
        if (!result.ok) throw new Error(result.message || "Connector không hỗ trợ kiểm tra tự động.");
        showSuccessfulConnectionTest(result, `Kết nối thành công${result.accountName ? `: ${result.accountName}` : ""}`);
        onClose();
      } catch (error) {
        await invalidate("accounts");
        toast.error(`Credential đã lưu nhưng test thất bại: ${error instanceof Error ? error.message : "không xác định"}`);
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu credential");
    }
  };

  return <form className="space-y-5" onSubmit={(event) => void submit(event)}>
    <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-5 text-indigo-900"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>{config.description}{config.requiresCredential === false && !config.browserAssisted ? " Không cần API key, token hoặc credential giả." : config.browserAssisted ? " Bạn tự hoàn tất đăng nhập, 2FA hoặc CAPTCHA trong cửa sổ Chromium khi helper mở." : " Secret chỉ được gửi một chiều và không bao giờ được API trả lại."}</p></div>
    {target.account ? <div className="rounded-xl border border-border bg-slate-50 p-4"><p className="text-xs font-bold">{target.account.name}</p><p className="mt-1 text-[11px] text-muted">{config.browserAssisted ? "Chỉ cập nhật cấu hình adapter bên dưới. Session trình duyệt đã mã hóa được giữ nguyên; dùng nút đăng nhập/kết nối lại ở danh sách tài khoản khi cần." : config.requiresCredential === false ? "Cập nhật cấu hình điểm đến; không có secret nào được yêu cầu." : "Có thể sửa connector settings bên dưới. Secret cũ không được tải về, vì vậy cần nhập lại đầy đủ credential."}</p></div> : <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="credential-account-name">Tên hiển thị</Label><Input id="credential-account-name" required minLength={2} value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={`${config.title} · Marketing`} /></div><div><Label htmlFor="credential-account-username">Username (tuỳ chọn)</Label><Input id="credential-account-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="account_handle" /></div></div>}
    <div className="grid gap-4 sm:grid-cols-2">{visibleFields.map((field) => {
      const value = values[field.key] ?? "";
      if (field.type === "checkbox") return <div key={field.key} className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 sm:col-span-2"><div><p className="text-sm font-semibold">{field.label}</p>{field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}</div><Switch checked={Boolean(value)} onChange={(checked) => setValues((current) => ({ ...current, [field.key]: checked }))} label={field.label} /></div>;
      if (field.type === "select") return <div key={field.key}><Label htmlFor={`credential-${field.key}`}>{field.label}</Label><Select id={`credential-${field.key}`} required={field.required} value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>{field.help && <p className="mt-1 text-[11px] text-muted">{field.help}</p>}</div>;
      const wide = field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("password") || field.key === "webhookUrl";
      return <div key={field.key} className={wide ? "sm:col-span-2" : undefined}><Label htmlFor={`credential-${field.key}`}>{field.label}</Label><Input id={`credential-${field.key}`} type={field.type} required={field.required} autoComplete={field.type === "password" ? "new-password" : "off"} value={String(value)} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />{field.help && <p className="mt-1 text-[11px] text-muted">{field.help}</p>}</div>;
    })}</div>
    {!target.account && <p className="text-[11px] leading-5 text-muted">{config.browserAssisted
      ? "Sau khi tạo account, sao chép lệnh đăng nhập Playwright từ thông báo hoặc danh sách tài khoản. Account chỉ chuyển CONNECTED sau khi session được lưu và kiểm tra thành công."
      : config.requiresCredential === false
      ? "Sau khi lưu, hệ thống kiểm tra cấu hình bàn giao và đánh dấu điểm đến sẵn sàng. Bài viết vẫn cần bạn xác nhận trên trang đích."
      : "Tên, username và settings không phải secret. Credential được lưu riêng bằng AES-256-GCM. Sau khi lưu, hệ thống gọi endpoint test thật; chỉ test thành công mới chuyển tài khoản sang CONNECTED."}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Huỷ</Button><Button type="submit" loading={busy}><ShieldCheck className="size-4" />{config.browserAssisted ? target.account ? "Lưu cấu hình" : "Tạo & tiếp tục đăng nhập" : "Lưu & kiểm tra"}</Button></div>
  </form>;
}

export function AccountsView() {
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [automaticPage, setAutomaticPage] = useState(1);
  const [browserPage, setBrowserPage] = useState(1);
  const [manualPage, setManualPage] = useState(1);
  const [credentialTarget, setCredentialTarget] = useState<CredentialTarget | null>(null);
  const [browserLoginAccount, setBrowserLoginAccount] = useState<PlatformAccount | null>(null);
  const [browserSessionRevokeTarget, setBrowserSessionRevokeTarget] = useState<PlatformAccount | null>(null);
  const query = useAccounts({ limit: 100, platformId: platformId || undefined });
  const platforms = usePlatforms({ limit: 100 });
  const providers = useOAuthProviders();
  const update = useResourceMutation(({ id, enabled }: { id: string; enabled: boolean }) => resourcesService.updateAccount(id, { enabled }), ["accounts"]);
  const test = useResourceMutation((id: string) => resourcesService.testAccount(id), ["accounts"]);
  const revokeBrowserSession = useResourceMutation((id: string) => resourcesService.revokeBrowserSession(id), ["accounts"]);
  const setPublishMode = useResourceMutation(({ id, publishImmediately }: { id: string; publishImmediately: boolean }) => resourcesService.updateAccountSettings(id, { publishImmediately }), ["accounts"]);
  const checkAll = useResourceMutation(() => resourcesService.runAccountCheck(), ["accounts", "account-health"]);
  const readyProviders = new Set((providers.data ?? []).filter((provider) => provider.status === "READY").map((provider) => provider.provider));
  const items = (query.data?.items ?? []).filter((item) => `${item.name} ${item.username ?? ""} ${item.platform?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const catalogPlatforms = useMemo(() => platforms.data?.items ?? [], [platforms.data?.items]);
  const configurablePlatforms = useMemo(() => catalogPlatforms.filter((platform) => platform.enabled && getCredentialConfig(platform)), [catalogPlatforms]);
  const normalizedDestinationSearch = destinationSearch.trim().toLowerCase();
  const matchingPlatforms = configurablePlatforms.filter((platform) => !normalizedDestinationSearch
    || `${platform.name} ${platform.slug}`.toLowerCase().includes(normalizedDestinationSearch));
  const automaticPlatforms = matchingPlatforms.filter((platform) => ["OFFICIAL_API", "COMPATIBLE_API"].includes(platform.mode));
  const browserPlatforms = matchingPlatforms.filter((platform) => platform.mode === "BROWSER_ASSISTED");
  const manualPlatforms = matchingPlatforms.filter((platform) => platform.mode === "MANUAL");
  const automaticTotalPages = Math.ceil(automaticPlatforms.length / DESTINATION_PAGE_SIZE);
  const browserTotalPages = Math.ceil(browserPlatforms.length / DESTINATION_PAGE_SIZE);
  const manualTotalPages = Math.ceil(manualPlatforms.length / DESTINATION_PAGE_SIZE);
  const visibleAutomaticPlatforms = automaticPlatforms.slice((automaticPage - 1) * DESTINATION_PAGE_SIZE, automaticPage * DESTINATION_PAGE_SIZE);
  const visibleBrowserPlatforms = browserPlatforms.slice((browserPage - 1) * DESTINATION_PAGE_SIZE, browserPage * DESTINATION_PAGE_SIZE);
  const visibleManualPlatforms = manualPlatforms.slice((manualPage - 1) * DESTINATION_PAGE_SIZE, manualPage * DESTINATION_PAGE_SIZE);

  useEffect(() => {
    const outcome = readOAuthResult(window.location.search);
    if (!outcome) return;
    if (outcome.ok) toast.success(outcome.message);
    else toast.error(outcome.message, { duration: 15_000 });
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const testConnection = async (account: PlatformAccount) => {
    try {
      const response = await test.mutateAsync(account.id);
      if (response.ok) showSuccessfulConnectionTest(response, `Kết nối hoạt động tốt${response.accountName ? `: ${response.accountName}` : ""}`);
      else toast.warning(response.message || "Connector cần thao tác thủ công");
      await query.refetch();
      if (response.ok && account.platform?.mode === "BROWSER_ASSISTED") setBrowserLoginAccount(null);
      return response.ok;
    } catch (error) {
      if (account.platform?.mode === "BROWSER_ASSISTED") {
        toast.warning(getBrowserConnectionErrorMessage(error), { duration: 12_000 });
        setBrowserLoginAccount(account);
      } else {
        toast.error(error instanceof Error ? error.message : "Kiểm tra thất bại");
      }
      await query.refetch();
      return false;
    }
  };
  const connect = async (provider: string) => {
    try {
      const { authorizationUrl } = await resourcesService.oauthStart(provider);
      window.location.assign(authorizationUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể bắt đầu OAuth");
    }
  };
  const runCheckAll = async () => {
    try {
      const { tokens, connections } = await checkAll.mutateAsync(undefined);
      const failed = (tokens.failed ?? 0) + (connections.failed ?? 0);
      const summary = `Đã kiểm tra ${connections.checked ?? 0} tài khoản, gia hạn ${tokens.refreshed ?? 0} token.`;
      if (failed) toast.warning(`${summary} ${failed} mục lỗi — xem cột Trạng thái.`);
      else toast.success(summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chạy kiểm tra");
    }
  };
  const confirmBrowserSessionRevoke = async () => {
    if (!browserSessionRevokeTarget) return;
    try {
      await revokeBrowserSession.mutateAsync(browserSessionRevokeTarget.id);
      await query.refetch();
      toast.success("Đã thu hồi session Playwright", {
        description: "Tài khoản và cấu hình điểm đến vẫn được giữ nguyên. Cần đăng nhập lại trước khi tự đăng.",
      });
      setBrowserSessionRevokeTarget(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.warning("Session đang được một tác vụ đăng nhập hoặc đăng bài sử dụng. Đợi tác vụ kết thúc rồi thử thu hồi lại.");
      } else {
        toast.error(error instanceof Error ? error.message : "Không thể thu hồi session Playwright");
      }
    }
  };
  const openCredential = (target: CredentialTarget) => {
    setConnectOpen(false);
    setCredentialTarget(target);
  };

  const destinationCards = (destinations: Platform[], kind: "api" | "browser" | "manual") => <div className="grid gap-2 sm:grid-cols-2">
    {destinations.map((platform) => <button
      type="button"
      key={platform.id}
      onClick={() => openCredential({ platform })}
      className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <PlatformMark slug={platform.slug} name={platform.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{platform.name}</span>
        <span className="block truncate text-[10px] text-muted" title={getPlatformAutomationLabel(platform)}>{getPlatformAutomationLabel(platform)}</span>
      </span>
      {kind === "manual" ? <ExternalLink className="size-4 text-slate-400" /> : kind === "browser" ? <MonitorPlay className="size-4 text-slate-400" /> : <KeyRound className="size-4 text-slate-400" />}
    </button>)}
  </div>;

  return <div className="animate-enter">
    <PageHeader eyebrow="Destinations" title="Tài khoản" description="Kết nối API hoặc đăng nhập một lần bằng Playwright để hệ thống tự đăng; mật khẩu social không đi qua ứng dụng." action={<PermissionGate allow={["ADMIN"]}><Button onClick={() => setConnectOpen(true)}><Link2 className="size-4" />Kết nối / cấu hình</Button></PermissionGate>} />
    <Card className="overflow-hidden">
      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm tài khoản…" filters={<Select aria-label="Lọc nền tảng" className="w-44" value={platformId} onChange={(event) => setPlatformId(event.target.value)}><option value="">Mọi nền tảng</option>{catalogPlatforms.map((platform) => <option value={platform.id} key={platform.id}>{platform.name}</option>)}</Select>} end={<div className="flex gap-1"><PermissionGate allow={["ADMIN"]}><Button variant="ghost" size="sm" loading={checkAll.isPending} onClick={() => void runCheckAll()} title="Gia hạn token đến hạn và kiểm tra kết nối mọi tài khoản ngay"><HeartPulse className="size-4" />Kiểm tra tất cả</Button></PermissionGate><Button variant="ghost" size="sm" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Refresh</Button></div>} />
      {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : items.length === 0 ? <EmptyState title="Chưa có tài khoản" description="Kết nối API hoặc thêm điểm đến bàn giao thủ công đầu tiên." action={<PermissionGate allow={["ADMIN"]}><Button onClick={() => setConnectOpen(true)}><PlugZap className="size-4" />Cấu hình ngay</Button></PermissionGate>} /> : <TableWrap><Table><thead><tr><Th>Nền tảng / tài khoản</Th><Th>Trạng thái</Th><Th>Kiểu kết nối</Th><Th>Kiểm tra gần nhất</Th><Th>Đang bật</Th><Th className="text-right">Thao tác</Th></tr></thead><tbody>{items.map((account) => {
        const platform = catalogPlatforms.find((item) => item.id === account.platformId) ?? account.platform;
        const config = getCredentialConfig(platform);
        const manual = platform?.mode === "MANUAL";
        const browserAssisted = platform?.mode === "BROWSER_ASSISTED";
        const oauthProvider = oauthProviderForPlatform(account.platform?.slug);
        const canReconnectOAuth = Boolean(oauthProvider && readyProviders.has(oauthProvider));
        const autoRefresh = account.oauthConfigured && isAutoRefreshPlatform(account.platform?.slug);
        // Blogger and Tumblr can save drafts instead of publishing; the connector publishes unless this is false.
        const draftCapable = ["blogger", "tumblr"].includes(account.platform?.slug ?? "");
        const publishImmediately = account.settings?.publishImmediately !== false;
        return <tr key={account.id} className="group hover:bg-slate-50/70">
          <Td><div className="flex items-center gap-3"><PlatformMark slug={account.platform?.slug} name={account.platform?.name ?? "Platform"} /><div><p className="font-bold text-foreground">{account.name}</p><p className="mt-0.5 text-xs text-muted">{account.platform?.name ?? "—"}{account.username ? ` · @${account.username}` : ""}</p></div></div></Td>
          <Td><Badge value={account.status} />{browserAssisted && <p className="mt-1 max-w-40 text-[10px] leading-4 text-muted">{account.status === "CONNECTED" ? "Session sẵn sàng cho worker" : account.browserSessionConfigured ? "Cần làm mới và kiểm tra session" : "Chưa lưu session đăng nhập"}</p>}</Td>
          <Td><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">{manual ? <ExternalLink className="size-3.5 text-violet-600" /> : browserAssisted ? <MonitorPlay className="size-3.5 text-indigo-600" /> : account.oauthConfigured ? <Link2 className="size-3.5 text-sky-600" /> : <KeyRound className="size-3.5 text-amber-600" />}{manual ? "Bàn giao thủ công" : browserAssisted ? "Playwright" : account.oauthConfigured ? "OAuth" : account.credential ? "Credential" : "Chưa cấu hình"}</span><p className="mt-1 text-[10px] text-muted">{manual ? "Không lưu API key/token" : browserAssisted ? account.credential ? "Session đã mã hóa" : "Chưa đăng nhập trình duyệt" : autoRefresh ? "Token tự gia hạn" : account.oauthToken?.expiresAt ? `Hết hạn ${fromNow(account.oauthToken.expiresAt)}` : account.credential?.expiresAt ? `Hết hạn ${fromNow(account.credential.expiresAt)}` : account.credential?.status ?? (account.oauthConfigured ? "Token đã mã hóa" : "—")}</p>{draftCapable && <PermissionGate allow={["ADMIN"]} fallback={<p className="mt-1 text-[10px] text-muted">{publishImmediately ? "Đăng ngay" : "Lưu nháp"}</p>}><label className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-slate-600"><Switch checked={publishImmediately} disabled={setPublishMode.isPending} label={`Đăng ngay trên ${account.name}`} onChange={(value) => void setPublishMode.mutateAsync({ id: account.id, publishImmediately: value }).then(() => toast.success(value ? "Bài mới sẽ được đăng ngay" : "Bài mới sẽ được lưu nháp để bạn duyệt")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Có lỗi"))} />{publishImmediately ? "Đăng ngay" : "Lưu nháp"}</label></PermissionGate>}</Td>
          <Td className="text-xs">{fromNow(account.lastCheckedAt)}</Td>
          <Td><PermissionGate allow={["ADMIN"]} fallback={<Badge value={account.enabled ? "ACTIVE" : "INACTIVE"} />}><Switch checked={account.enabled} disabled={update.isPending} label={`Bật ${account.name}`} onChange={(enabled) => void update.mutateAsync({ id: account.id, enabled }).then(() => toast.success("Đã cập nhật")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Có lỗi"))} /></PermissionGate></Td>
          <Td><div className="flex flex-wrap justify-end gap-1">
            <PermissionGate allow={["ADMIN", "EDITOR"]}>{(!browserAssisted || account.browserSessionConfigured === true) && <Button variant="ghost" size="sm" loading={test.isPending} onClick={() => void testConnection(account)}><TestTube2 className="size-4" />Test</Button>}</PermissionGate>
            <PermissionGate allow={["ADMIN"]}>{browserAssisted ? <>
              {config && platform && <Button variant="ghost" size="sm" onClick={() => openCredential({ platform, account })}><Settings2 className="size-4" />Cấu hình</Button>}
              <Button variant="secondary" size="sm" onClick={() => setBrowserLoginAccount(account)}><LogIn className="size-4" />{account.status === "CONNECTED" ? "Đăng nhập lại" : account.browserSessionConfigured ? "Kết nối lại" : "Đăng nhập"}</Button>
              {account.browserSessionConfigured === true && <Button variant="danger" size="sm" onClick={() => setBrowserSessionRevokeTarget(account)}><ShieldOff className="size-4" />Thu hồi session</Button>}
            </> : canReconnectOAuth && oauthProvider ? <Button variant={account.status === "CONNECTED" ? "ghost" : "secondary"} size="sm" onClick={() => void connect(oauthProvider)}><Link2 className="size-4" />Kết nối lại</Button> : config && !manual && platform ? <Button variant="secondary" size="sm" onClick={() => openCredential({ platform, account })}><KeyRound className="size-4" />Credential</Button> : account.status !== "CONNECTED" ? <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}><ExternalLink className="size-4" />Reconnect</Button> : null}</PermissionGate>
          </div></Td>
        </tr>;
      })}</tbody></Table></TableWrap>}
    </Card>

    <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title="Kết nối / cấu hình điểm đến" description="Chọn kênh tự động qua API hoặc kênh bàn giao thủ công." className="max-w-3xl">
      <div className="space-y-7">
        <div><Label htmlFor="destination-search">Tìm điểm đến</Label><Input id="destination-search" value={destinationSearch} onChange={(event) => { setDestinationSearch(event.target.value); setAutomaticPage(1); setBrowserPage(1); setManualPage(1); }} placeholder="Medium, Discourse, Mastodon…" /></div>
        <section><h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Đăng nhập một lần (OAuth chính thức)</h3><p className="mb-3 text-xs leading-5 text-muted">Bấm Kết nối, đăng nhập trên trang của nền tảng và cấp quyền. Hệ thống lưu token đã mã hoá; không cần dán token thủ công.</p>{providers.isPending ? <TableSkeleton rows={2} /> : providers.isError ? <ErrorState compact error={providers.error} onRetry={() => void providers.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{providers.data.map((provider) => { const providerPlatform = provider.platform || provider.provider; const ready = provider.status === "READY"; return <div key={provider.provider} className="flex items-center gap-3 rounded-xl border border-border p-4"><PlatformMark slug={providerPlatform} name={providerPlatform} /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{oauthProviderLabel(provider.provider)}</p><p className="mt-1 text-[11px] text-muted">{oauthProviderNote(provider.provider, provider.status)}</p>{!ready && <Badge value={provider.status} className="mt-2" />}</div>{ready && <Button size="sm" className="shrink-0" onClick={() => void connect(provider.provider)}><Link2 className="size-4" />Kết nối</Button>}</div>; })}</div>}</section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Kênh tự động qua API</h3>
          <p className="mb-3 text-xs leading-5 text-muted">Các nền tảng dùng chung connector (ví dụ Discourse hoặc Mastodon) tự nhận đúng form và URL mặc định của cộng đồng.</p>
          {platforms.isPending ? <TableSkeleton rows={3} /> : platforms.isError ? <ErrorState compact error={platforms.error} onRetry={() => void platforms.refetch()} /> : automaticPlatforms.length ? <>{destinationCards(visibleAutomaticPlatforms, "api")}<Pagination page={automaticPage} totalPages={automaticTotalPages} total={automaticPlatforms.length} onPage={setAutomaticPage} /></> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-muted">Không tìm thấy kênh API phù hợp.</p>}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Tự động bằng Playwright</h3>
          <p className="mb-3 text-xs leading-5 text-muted">Đăng nhập một lần bằng browser helper. Worker tái sử dụng session đã mã hóa và tự dừng nếu gặp đăng nhập, 2FA, CAPTCHA hoặc giao diện thay đổi.</p>
          {platforms.isPending ? <TableSkeleton rows={2} /> : platforms.isError ? <ErrorState compact error={platforms.error} onRetry={() => void platforms.refetch()} /> : browserPlatforms.length ? <>{destinationCards(visibleBrowserPlatforms, "browser")}<Pagination page={browserPage} totalPages={browserTotalPages} total={browserPlatforms.length} onPage={setBrowserPage} /></> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-muted">Chưa có adapter Playwright nào đã được kiểm thử.</p>}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Kênh bàn giao thủ công</h3>
          <p className="mb-3 text-xs leading-5 text-muted">AI vẫn tạo nội dung riêng cho từng kênh. Hệ thống mở trang đích, cho sao chép payload và chờ bạn xác nhận đã đăng; không yêu cầu credential giả.</p>
          {platforms.isPending ? <TableSkeleton rows={3} /> : platforms.isError ? <ErrorState compact error={platforms.error} onRetry={() => void platforms.refetch()} /> : manualPlatforms.length ? <>{destinationCards(visibleManualPlatforms, "manual")}<Pagination page={manualPage} totalPages={manualTotalPages} total={manualPlatforms.length} onPage={setManualPage} /></> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-muted">Không tìm thấy kênh thủ công phù hợp.</p>}
        </section>
        <div className="flex gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /><p>Frontend không đọc lại hoặc hiển thị secret đã lưu. Kênh thủ công chỉ lưu URL bàn giao công khai.</p></div>
      </div>
    </Modal>
    <Modal
      open={Boolean(credentialTarget)}
      onClose={() => setCredentialTarget(null)}
      title={credentialTarget?.account ? `Cập nhật ${getCredentialConfig(credentialTarget.platform)?.title ?? "credential"}` : `Thêm ${getCredentialConfig(credentialTarget?.platform)?.title ?? "tài khoản"}`}
      description={credentialTarget?.account
        ? credentialTarget.platform.mode === "BROWSER_ASSISTED"
          ? "Chỉ sửa cấu hình adapter; session mã hóa không bị thay thế và ứng dụng không yêu cầu mật khẩu social."
          : credentialTarget.platform.mode === "MANUAL"
            ? "Cập nhật điểm đến bàn giao; không cần API key hoặc token."
            : "Secret cũ không được tải về; form này thay toàn bộ credential payload."
        : credentialTarget?.platform.mode === "MANUAL"
          ? "Tạo điểm đến bàn giao thủ công, không cần API key hoặc token."
          : credentialTarget?.platform.mode === "BROWSER_ASSISTED"
            ? "Tạo account rồi đăng nhập bằng Playwright helper; không nhập mật khẩu social vào ứng dụng."
            : "Tạo account, lưu credential mã hóa, rồi test connector."}
      className="max-w-2xl"
    >
      {credentialTarget && <CredentialAccountForm key={`${credentialTarget.platform.slug}:${credentialTarget.account?.id ?? "new"}`} target={credentialTarget} onClose={() => setCredentialTarget(null)} onBrowserLogin={setBrowserLoginAccount} />}
    </Modal>
    <BrowserLoginGuide
      account={browserLoginAccount}
      busy={test.isPending}
      onClose={() => setBrowserLoginAccount(null)}
      onVerify={testConnection}
    />
    <ConfirmDialog
      open={Boolean(browserSessionRevokeTarget)}
      title="Thu hồi session Playwright đã mã hóa"
      description={`Session trình duyệt của “${browserSessionRevokeTarget?.name ?? "tài khoản"}” sẽ bị xóa khỏi kho credential. Tài khoản, cấu hình adapter, lịch sử chiến dịch và bài đăng không bị xóa. Mọi job mới sẽ dừng cho đến khi bạn đăng nhập lại bằng helper.`}
      confirmLabel="Thu hồi session"
      busy={revokeBrowserSession.isPending}
      danger
      onClose={() => setBrowserSessionRevokeTarget(null)}
      onConfirm={confirmBrowserSessionRevoke}
    />
  </div>;
}
