"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LockKeyhole, MessagesSquare, Save, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Switch } from "@/components/ui/form";
import { ErrorState } from "@/components/ui/states";
import { env } from "@/config/env";
import { useChatIntegration } from "@/hooks/use-resources";
import { ApiError } from "@/services/api/errors";
import { resourcesService, type ChatIntegrationSettings, type ChatIntegrationUpdate } from "@/services/resources.service";
import { formatDate } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = {
  APPROVAL_CREATE: "Gửi yêu cầu duyệt",
  APPROVAL_CANCEL: "Huỷ yêu cầu duyệt",
  APPROVAL_RESULT: "Báo kết quả đăng",
  NOTICE: "Thông báo vào kênh",
  TEST: "Tin thử",
};

export function ChatIntegrationForm() {
  const query = useChatIntegration();
  const forbidden = query.error instanceof ApiError && query.error.status === 403;
  return <Card className="mb-5 overflow-hidden" id="chat-integration">
    <div className="flex items-start gap-3 border-b border-border p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><MessagesSquare className="size-5" /></span>
      <div><h2 className="font-bold">Kết nối chat</h2><p className="mt-1 text-sm text-muted">Gửi bài cần duyệt cho chủ chiến dịch và báo sự việc vào kênh &quot;Auto Social&quot; của chat VPSTTT.</p></div>
      {query.data && <span className={`ml-auto whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${query.data.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{query.data.enabled ? "Đang bật" : "Đang tắt"}</span>}
    </div>
    {query.isPending ? <p className="p-5 text-sm text-muted">Đang tải cấu hình kết nối chat…</p>
      : forbidden ? <div className="flex items-center gap-3 p-5 text-sm text-muted"><LockKeyhole className="size-5 shrink-0 text-amber-600" />Chỉ vai trò ADMIN xem và sửa được kết nối chat.</div>
        : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} compact />
          : query.data && <ChatIntegrationEditor key={query.data.revision} settings={query.data} />}
  </Card>;
}

function ChatIntegrationEditor({ settings }: { settings: ChatIntegrationSettings }) {
  const client = useQueryClient();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl ?? "");
  const [channelId, setChannelId] = useState(settings.channelId ?? "");
  const [botToken, setBotToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(settings.enabled);
  const [forgetPrevious, setForgetPrevious] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const changes: Omit<ChatIntegrationUpdate, "revision"> = {
    ...(baseUrl.trim() !== (settings.baseUrl ?? "") ? { baseUrl: baseUrl.trim() } : {}),
    ...(channelId.trim() && channelId.trim() !== (settings.channelId ?? "") ? { channelId: channelId.trim() } : {}),
    ...(botToken.trim() ? { botToken: botToken.trim() } : {}),
    ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
    ...(enabled !== settings.enabled ? { enabled } : {}),
    ...(forgetPrevious ? { clearPreviousWebhookSecret: true } : {}),
  };
  const dirty = Object.keys(changes).length > 0;
  const webhookUrl = `${env.apiUrl}${settings.webhookPath}`;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true); setError("");
    try {
      // Keys go straight to the API; only the masked description is cached.
      const saved = await resourcesService.updateChatIntegration({ revision: settings.revision, ...changes });
      client.setQueryData(["chat-integration"], saved);
      toast.success(saved.enabled ? "Đã lưu và bật kết nối chat." : "Đã lưu cấu hình kết nối chat.");
    } catch (err) { setError(err instanceof Error ? err.message : "Không lưu được cấu hình. Vui lòng thử lại."); }
    finally { setSaving(false); }
  }

  async function sendTest() {
    setTesting(true); setError("");
    try {
      const result = await resourcesService.testChatIntegration();
      if (result.ok) toast.success("Đã gửi tin thử vào kênh Auto Social.");
      else setError(result.error ?? "Chat không nhận tin thử.");
      await client.invalidateQueries({ queryKey: ["chat-integration"] });
    } catch (err) { setError(err instanceof Error ? err.message : "Không gửi được tin thử."); }
    finally { setTesting(false); }
  }

  const last = settings.lastDelivery;
  return <form onSubmit={(event) => void save(event)}>
    <fieldset disabled={saving} className="grid gap-5 p-5 sm:grid-cols-2">
      <div><Label htmlFor="chat-base-url">Địa chỉ chat</Label><Input id="chat-base-url" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} maxLength={2048} placeholder="https://chat.vpsttt.com" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setError(""); }} /><p className="mt-1.5 text-xs text-muted">Chỉ nhận https://.</p></div>
      <div><Label htmlFor="chat-channel-id">Mã kênh &quot;Auto Social&quot;</Label><Input id="chat-channel-id" autoCapitalize="none" spellCheck={false} maxLength={36} placeholder="UUID của kênh đã cài bot" value={channelId} onChange={(event) => { setChannelId(event.target.value); setError(""); }} /></div>
      <div><Label htmlFor="chat-bot-token">Khoá bot</Label><Input id="chat-bot-token" type="password" autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={512} placeholder={settings.botTokenConfigured ? `Đã lưu (${settings.botTokenHint ?? "đã che"})` : "wtb_…"} value={botToken} onChange={(event) => { setBotToken(event.target.value); setError(""); }} /><p className="mt-1.5 text-xs text-muted">Cần scope message.write và approval.write. Để trống thì giữ khoá đã lưu.</p></div>
      <div><Label htmlFor="chat-webhook-secret">Khoá webhook</Label><Input id="chat-webhook-secret" type="password" autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={512} placeholder={settings.webhookSecretConfigured ? "Đã lưu" : "Khoá ký của webhook đi bên chat"} value={webhookSecret} onChange={(event) => { setWebhookSecret(event.target.value); setError(""); }} />
        <p className="mt-1.5 text-xs text-muted">{settings.previousWebhookSecretConfigured ? (forgetPrevious ? "Khoá cũ sẽ bị quên khi lưu." : `Để trống thì giữ khoá đã lưu. Khoá cũ còn được nhận tới ${formatDate(settings.previousWebhookSecretExpiresAt)}.`) : "Để trống thì giữ khoá đã lưu; nhập khoá mới thì khoá đang dùng còn được nhận thêm 24 giờ."}</p>
        {settings.previousWebhookSecretConfigured && <Button type="button" variant="ghost" className="mt-1" onClick={() => setForgetPrevious(!forgetPrevious)}>{forgetPrevious ? "Giữ khoá cũ" : "Quên khoá cũ"}</Button>}
      </div>
      <div className="sm:col-span-2"><Label htmlFor="chat-webhook-url">Địa chỉ nhận webhook (nhập bên chat)</Label><Input id="chat-webhook-url" readOnly value={webhookUrl} onFocus={(event) => event.currentTarget.select()} /><p className="mt-1.5 text-xs text-muted">Webhook đi bên chat chỉ cần các sự kiện approval.*.</p></div>
      <div className="flex min-h-11 items-center gap-3 sm:col-span-2"><Switch checked={enabled} onChange={(value) => { setEnabled(value); setError(""); }} label="Bật kết nối chat" disabled={saving} /><span className="text-sm font-semibold">Bật kết nối</span><span className="text-xs text-muted">Tắt thì không gửi gì sang chat.</span></div>
    </fieldset>

    <div className="mx-5 mb-5 rounded-xl border border-border p-4 text-sm" aria-live="polite">
      <p className="font-semibold">Lần gửi gần nhất</p>
      {last ? <p className={`mt-1 flex items-start gap-2 ${last.ok ? "text-emerald-700" : "text-red-700"}`}>{last.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}<span>{formatDate(last.at)} · {KIND_LABELS[last.kind] ?? last.kind} · {last.ok ? "Thành công" : `Lỗi: ${last.error ?? "không rõ"}`}</span></p>
        : <p className="mt-1 text-muted">Chưa gửi lần nào.</p>}
      <p className="mt-1 text-xs text-muted">Đang chờ gửi: {settings.pendingCount} · Đã dừng sau khi thử lại: {settings.failedCount}</p>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
      <Button type="button" variant="secondary" loading={testing} disabled={saving || !settings.botTokenConfigured || !settings.baseUrl || !settings.channelId} onClick={() => void sendTest()}><Send className="size-4" />Gửi tin thử</Button>
      <Button type="submit" disabled={!dirty} loading={saving}><Save className="size-4" />Lưu kết nối chat</Button>
    </div>
    {dirty && <p className="-mt-3 px-5 pb-4 text-xs text-muted">Tin thử dùng cấu hình đã lưu; lưu trước khi gửi thử.</p>}
    {error && <p role="alert" className="px-5 pb-5 text-sm text-red-700">{error}</p>}
  </form>;
}
