"use client";

import { Check, Copy, Puzzle, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useExtensionDevices, useResourceMutation } from "@/hooks/use-resources";
import { fromNow } from "@/lib/utils";
import { resourcesService, type ExtensionDevice, type ExtensionEngine } from "@/services/resources.service";
import type { PlatformAccount } from "@/types/domain";

/** A paired Chrome polls every ~30 s; quiet for longer than this counts as offline. */
const ONLINE_WINDOW_MS = 3 * 60_000;

export function isDeviceOnline(device: Pick<ExtensionDevice, "lastSeenAt">, now = Date.now()) {
  return Boolean(device.lastSeenAt && now - new Date(device.lastSeenAt).getTime() < ONLINE_WINDOW_MS);
}

export function isExtensionAccount(account: Pick<PlatformAccount, "settings">) {
  return account.settings?.delivery === "extension";
}

/** Official API platforms keep their API; every forum-style destination can use the extension. */
export function canUseExtension(account: Pick<PlatformAccount, "platform">) {
  return account.platform?.mode !== undefined && account.platform.mode !== "OFFICIAL_API";
}

export const ENGINE_HELP: Record<ExtensionEngine, { label: string; placeholder: string; help: string }> = {
  xenforo: {
    label: "XenForo (voz.vn, forums.cpanel.net, forum.directadmin.com…)",
    placeholder: "https://voz.vn/f/chuyen-tro-linh-tinh.17/post-thread",
    help: "Vào box muốn đăng, bấm \"Đăng chủ đề\"/\"Post thread\", rồi dán địa chỉ trang đó (kết thúc bằng /post-thread).",
  },
  discourse: {
    label: "Discourse (community.nginx.org, caddy.community…)",
    placeholder: "https://community.nginx.org/new-topic?category=general",
    help: "Dán trang chủ diễn đàn, hoặc /new-topic?category=<tên-chuyên-mục> để chọn sẵn chuyên mục.",
  },
  phpbb: {
    label: "phpBB",
    placeholder: "https://forum.example.com/posting.php?mode=post&f=3",
    help: "Mở box, bấm \"New Topic\", rồi dán địa chỉ trang posting.php?mode=post&f=…",
  },
};

function PairingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("Chrome văn phòng");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useResourceMutation((deviceName: string) => resourcesService.createExtensionDevice(deviceName), ["extension-devices"]);
  const close = () => { setToken(null); setCopied(false); onClose(); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const device = await create.mutateAsync(name.trim());
      setToken(device.token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tạo được mã ghép nối");
    }
  };
  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Đã sao chép mã ghép nối");
  };
  return <Modal open={open} onClose={close} title="Ghép nối tiện ích Chrome" description="Mỗi Chrome (máy/hồ sơ) dùng một mã riêng. Mã chỉ hiện một lần; mất mã thì thu hồi và tạo mã mới." className="max-w-xl">
    {token ? <div className="space-y-4">
      <div><Label htmlFor="extension-token">Mã ghép nối</Label><div className="flex gap-2"><Input id="extension-token" readOnly value={token} className="font-mono text-xs" onFocus={(event) => event.currentTarget.select()} /><Button type="button" variant="secondary" onClick={() => void copy()}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}Sao chép</Button></div></div>
      <ol className="list-decimal space-y-1.5 rounded-xl bg-slate-50 p-4 pl-8 text-xs leading-5 text-slate-700">
        <li>Cài tiện ích: mở <code>chrome://extensions</code>, bật Developer mode, bấm Load unpacked và chọn thư mục tiện ích (hoặc giải nén file .zip).</li>
        <li>Bấm biểu tượng tiện ích → Cài đặt. Dán địa chỉ API backend và mã ở trên, bấm Lưu &amp; kiểm tra.</li>
        <li>Bấm Cấp quyền diễn đàn, đăng nhập sẵn các diễn đàn trong chính Chrome này và để Chrome mở.</li>
      </ol>
      <div className="flex justify-end"><Button onClick={close}>Xong</Button></div>
    </div> : <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div><Label htmlFor="extension-device-name">Tên thiết bị</Label><Input id="extension-device-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>Huỷ</Button><Button type="submit" loading={create.isPending}><Plus className="size-4" />Tạo mã</Button></div>
    </form>}
  </Modal>;
}

/** Paired Chromes and their online state, shown on top of the Accounts page. */
export function ExtensionPanel() {
  const devices = useExtensionDevices();
  const [pairing, setPairing] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ExtensionDevice | null>(null);
  const revoke = useResourceMutation((id: string) => resourcesService.revokeExtensionDevice(id), ["extension-devices"]);
  const items = devices.data ?? [];
  const online = items.filter((device) => isDeviceOnline(device)).length;
  return <Card className="mb-5 p-4">
    <div className="flex flex-wrap items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Puzzle className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Tiện ích Chrome · đăng diễn đàn bằng Chrome của bạn</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">Dùng cho diễn đàn không có API (XenForo, Discourse, phpBB). Tiện ích dùng phiên đã đăng nhập sẵn trong Chrome; hệ thống không lưu mật khẩu hay cookie.</p>
        {devices.isPending ? <p className="mt-2 text-xs text-muted">Đang tải…</p> : items.length === 0 ? <p className="mt-2 text-xs font-semibold text-amber-700">Chưa ghép nối Chrome nào.</p> : <ul className="mt-2 flex flex-wrap gap-2">{items.map((device) => {
          const isOnline = isDeviceOnline(device);
          return <li key={device.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
            <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden />
            <span className="font-semibold">{device.name}</span>
            <span className="text-muted">{isOnline ? "đang chạy" : device.lastSeenAt ? `thấy ${fromNow(device.lastSeenAt)}` : "chưa kết nối"}</span>
            <PermissionGate allow={["ADMIN"]}><button type="button" className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-danger" aria-label={`Thu hồi ${device.name}`} onClick={() => setRevokeTarget(device)}><Trash2 className="size-3.5" /></button></PermissionGate>
          </li>;
        })}</ul>}
      </div>
      <div className="flex items-center gap-2">
        {items.length > 0 && <span className={`text-xs font-semibold ${online ? "text-emerald-700" : "text-amber-700"}`}>{online ? `${online}/${items.length} đang chạy` : "Không có Chrome nào đang chạy"}</span>}
        <PermissionGate allow={["ADMIN"]}><Button size="sm" variant="secondary" onClick={() => setPairing(true)}><Plus className="size-4" />Ghép nối Chrome</Button></PermissionGate>
      </div>
    </div>
    <PairingModal open={pairing} onClose={() => setPairing(false)} />
    <ConfirmDialog
      open={Boolean(revokeTarget)}
      title="Thu hồi tiện ích"
      description={`Chrome “${revokeTarget?.name ?? ""}” sẽ không nhận bài nữa. Bài đang chờ vẫn giữ nguyên cho Chrome khác.`}
      confirmLabel="Thu hồi"
      danger
      busy={revoke.isPending}
      onClose={() => setRevokeTarget(null)}
      onConfirm={async () => {
        if (!revokeTarget) return;
        try { await revoke.mutateAsync(revokeTarget.id); toast.success("Đã thu hồi"); setRevokeTarget(null); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Không thu hồi được"); }
      }}
    />
  </Card>;
}

/** Turns extension delivery on/off for one forum account. */
export function ExtensionDeliveryForm({ account, onClose }: { account: PlatformAccount; onClose: () => void }) {
  const settings = account.settings ?? {};
  const [enabled, setEnabled] = useState(isExtensionAccount(account) || !settings.delivery);
  const [engine, setEngine] = useState<ExtensionEngine>((settings.extensionEngine as ExtensionEngine | undefined) ?? (account.platform?.connectorKey === "discourse" ? "discourse" : "xenforo"));
  const [targetUrl, setTargetUrl] = useState(typeof settings.extensionTargetUrl === "string" ? settings.extensionTargetUrl : "");
  const [autoSubmit, setAutoSubmit] = useState(settings.extensionAutoSubmit !== false);
  const save = useResourceMutation(() => resourcesService.configureExtensionDelivery(account.id, enabled ? { enabled, engine, targetUrl: targetUrl.trim(), autoSubmit } : { enabled: false }), ["accounts", "account-health"]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await save.mutateAsync(undefined);
      toast.success(enabled ? "Đã bật đăng bằng tiện ích Chrome" : "Đã tắt đăng bằng tiện ích Chrome");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được");
    }
  };
  const help = ENGINE_HELP[engine];
  return <form className="space-y-4" onSubmit={(event) => void submit(event)}>
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div><p className="text-sm font-semibold">Đăng bằng tiện ích Chrome</p><p className="mt-1 text-xs text-muted">Bài của tài khoản này sẽ do tiện ích đăng trong Chrome đã đăng nhập diễn đàn.</p></div><span className="shrink-0"><Switch checked={enabled} onChange={setEnabled} label="Đăng bằng tiện ích Chrome" /></span></div>
    {enabled && <>
      <div><Label htmlFor="extension-engine">Loại diễn đàn</Label><Select id="extension-engine" value={engine} onChange={(event) => setEngine(event.target.value as ExtensionEngine)}>{(Object.keys(ENGINE_HELP) as ExtensionEngine[]).map((key) => <option key={key} value={key}>{ENGINE_HELP[key].label}</option>)}</Select></div>
      <div><Label htmlFor="extension-target">Trang tạo chủ đề</Label><Input id="extension-target" type="url" required value={targetUrl} placeholder={help.placeholder} onChange={(event) => setTargetUrl(event.target.value)} /><p className="mt-1 text-[11px] leading-4 text-muted">{help.help}</p></div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div><p className="text-sm font-semibold">Tự bấm Đăng</p><p className="mt-1 text-xs text-muted">Tắt: tiện ích chỉ điền sẵn rồi chờ bạn kiểm tra và bấm Đăng. Nên tắt vài ngày đầu với diễn đàn mới. Gặp CAPTCHA luôn chờ bạn.</p></div><span className="shrink-0"><Switch checked={autoSubmit} onChange={setAutoSubmit} label="Tự bấm Đăng" /></span></div>
    </>}
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button><Button type="submit" loading={save.isPending}>Lưu</Button></div>
  </form>;
}
