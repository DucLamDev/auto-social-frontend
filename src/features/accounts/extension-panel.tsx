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
  return account.platform?.mode !== undefined && (account.platform.mode !== "OFFICIAL_API" || typeof account.platform.defaultSettings?.extensionFlowId === "string");
}

export const ENGINE_HELP: Record<ExtensionEngine, { label: string; placeholder: string; help: string }> = {
  mastodon: { label: "Mastodon / Vivaldi Social", placeholder: "https://mastodon.social/publish", help: "Bài viết ngắn trên hồ sơ đang đăng nhập, tối đa 500 ký tự." },
  bluesky: { label: "Bluesky", placeholder: "https://bsky.app/intent/compose", help: "Bài viết ngắn tối đa 300 ký tự." },
  tumblr: { label: "Tumblr", placeholder: "https://www.tumblr.com/new/text", help: "Đăng bài Text trên blog Tumblr đang chọn." },
  devto: { label: "DEV Community", placeholder: "https://dev.to/new", help: "Tự điền tiêu đề, bài Markdown, tags và xuất bản." },
  medium: { label: "Medium", placeholder: "https://medium.com/new-story", help: "Đăng trên hồ sơ Medium đang đăng nhập; hoàn tất cả bước Publish now và không gửi email." },
  substack: { label: "Substack publication", placeholder: "https://ten-publication.substack.com/publish/post", help: "Bài viết chỉ đăng lên web của publication. Tiện ích tắt gửi email và app inbox trước khi xuất bản." },
  quora: { label: "Quora · bài cá nhân hoặc Space", placeholder: "https://www.quora.com/", help: "Bài cá nhân: dùng https://www.quora.com/ (Add question → Create Post → Everyone). Hoặc nhập URL Space của bạn để đăng trong Space có quyền tạo bài." },
  reddit: { label: "Reddit", placeholder: "https://www.reddit.com/r/ten-subreddit/submit", help: "Chọn subreddit hoặc hồ sơ đích. Luồng đăng Text; nhập đúng flair nếu cộng đồng yêu cầu." },
  slideshare: { label: "SlideShare", placeholder: "https://www.slideshare.net/upload", help: "Đính kèm đúng một PDF tối đa 20 MiB vào bài trên web trước khi tạo chiến dịch. Cần chức năng upload của SlideShare đang hoạt động." },
  "aws-builder": { label: "AWS Builder Center", placeholder: "https://builder.aws.com/create/content", help: "Đăng nhập bằng AWS Builder ID và hoàn tất hồ sơ trước khi chạy." },
  tinhte: { label: "Tinhte.vn", placeholder: "https://tinhte.vn/editorv2/create/ID-CHUYEN-MUC/", help: "Vào đúng chuyên mục, bấm viết bài rồi dán URL editorv2/create/ID/. Luồng sẽ dùng chuyên mục trong URL." },
  pixelfed: { label: "pixelfed.social", placeholder: "https://pixelfed.social/i/web", help: "Đính kèm đúng một ảnh JPEG/PNG/WebP tối đa 20 MiB vào bài trên web trước khi tạo chiến dịch." },
  xenforo: {
    label: "XenForo (voz.vn, forums.cpanel.net, forum.directadmin.com…)",
    placeholder: "https://voz.vn/f/chuyen-tro-linh-tinh.17/post-thread",
    help: "Vào box muốn đăng, bấm \"Đăng chủ đề\"/\"Post thread\", rồi dán địa chỉ trang đó (kết thúc bằng /post-thread).",
  },
  discourse: {
    label: "Discourse (community.nginx.org, caddy.community…)",
    placeholder: "https://community.nginx.org/new-topic?category=projects/nginx",
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
        <p className="text-sm font-bold">Tiện ích Chrome · nhiều tài khoản, mỗi tài khoản một phiên</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">Gán từng account với đúng hồ sơ Chrome trong Phiên Chrome / 2FA. Có thể tự đăng nhập và điền TOTP bằng thông tin bạn cấu hình, lưu mã hóa.</p>
        <p className="mt-1 text-xs leading-5 text-muted">Sau khi ghép nối và cấp quyền, bạn chỉ cần duyệt bài và khởi chạy chiến dịch trên web. Giữ Chrome mở; tiện ích tự nhận bài khoảng mỗi 30 giây và đăng khi bật Tự bấm Đăng.</p>
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
  const defaults = account.platform?.defaultSettings ?? {};
  const initialTarget = typeof settings.extensionTargetUrl === "string" ? settings.extensionTargetUrl : String(defaults.extensionTargetUrl ?? "");
  const [enabled, setEnabled] = useState(isExtensionAccount(account) || !settings.delivery);
  const [engine, setEngine] = useState<ExtensionEngine>((settings.extensionEngine as ExtensionEngine | undefined) ?? (defaults.extensionEngine as ExtensionEngine | undefined) ?? (account.platform?.connectorKey === "discourse" ? "discourse" : "xenforo"));
  const [targetUrl, setTargetUrl] = useState(initialTarget);
  const [category, setCategory] = useState(() => {
    if (typeof settings.extensionCategory === "string" && settings.extensionCategory) return settings.extensionCategory;
    try { const params = new URL(initialTarget).searchParams; return params.get("category") ?? params.get("category_id") ?? ""; }
    catch { return ""; }
  });
  const [tags, setTags] = useState(() => {
    if (Array.isArray(settings.extensionTags) && settings.extensionTags.length) return settings.extensionTags.join(", ");
    try { return new URL(initialTarget).searchParams.get("tags") ?? ""; }
    catch { return ""; }
  });
  const [autoSubmit, setAutoSubmit] = useState(settings.extensionAutoSubmit !== false);
  const [flair, setFlair] = useState(String(settings.extensionFlair ?? ""));
  const social = !["discourse", "xenforo", "phpbb"].includes(engine);
  const availableEngines: ExtensionEngine[] = typeof defaults.extensionEngine === "string" ? [defaults.extensionEngine as ExtensionEngine] : ["discourse", "xenforo", "phpbb"];
  const save = useResourceMutation(() => {
    let destination = targetUrl.trim();
    if (enabled && engine === "discourse") {
      const url = new URL(destination);
      const categoryKey = /^\d+$/.test(category.trim()) ? "category_id" : "category";
      url.searchParams.delete(categoryKey === "category" ? "category_id" : "category");
      if (category.trim()) url.searchParams.set(categoryKey, category.trim());
      else url.searchParams.delete(categoryKey);
      const selectedTags = [...new Set(tags.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))];
      if (selectedTags.length > 10) throw new Error("Chỉ cấu hình tối đa 10 tag; giới hạn của diễn đàn có thể thấp hơn.");
      if (selectedTags.length) url.searchParams.set("tags", selectedTags.join(","));
      else if (url.searchParams.has("tags")) url.searchParams.delete("tags");
      destination = url.toString();
    }
    const selectedTags = [...new Set(tags.split(",").map(tag => tag.trim().replace(/^#/, "")).filter(Boolean))];
    if (social && selectedTags.length > 10) throw new Error("Chỉ cấu hình tối đa 10 tag.");
    return resourcesService.configureExtensionDelivery(account.id, enabled ? { enabled, engine, targetUrl: destination, autoSubmit,
      ...(social ? { tags: selectedTags, category: category.trim(), flair: flair.trim() } : {}) } : { enabled: false });
  }, ["accounts", "account-health"]);
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div><p className="text-sm font-semibold">Đăng bằng tiện ích Chrome</p><p className="mt-1 text-xs text-muted">Tiện ích nhận bài từ web và đăng bằng tài khoản đã đăng nhập trong Chrome.</p></div><span className="shrink-0"><Switch checked={enabled} onChange={setEnabled} label="Đăng bằng tiện ích Chrome" /></span></div>
    {enabled && <>
      {typeof defaults.extensionFlowId === "string" && <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900"><p className="font-semibold">Luồng {account.platform?.name}</p><p>{String(defaults.extensionSetupHint ?? "")}</p>{typeof defaults.extensionForumUrl === "string" && <a href={defaults.extensionForumUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Mở nền tảng để đăng nhập</a>}</div>}
      <div><Label htmlFor="extension-engine">Luồng đăng</Label><Select id="extension-engine" value={engine} onChange={(event) => setEngine(event.target.value as ExtensionEngine)}>{availableEngines.map((key) => <option key={key} value={key}>{ENGINE_HELP[key].label}</option>)}</Select></div>
      <div><Label htmlFor="extension-target">Trang tạo chủ đề</Label><Input id="extension-target" type="url" required value={targetUrl} placeholder={help.placeholder} onChange={(event) => {
        setTargetUrl(event.target.value);
        try {
          const url = new URL(event.target.value);
          setCategory(url.searchParams.get("category") ?? url.searchParams.get("category_id") ?? "");
          if (url.searchParams.has("tags")) setTags(url.searchParams.get("tags") ?? "");
        } catch { /* Let the user finish entering the URL. */ }
      }} /><p className="mt-1 text-[11px] leading-4 text-muted">{help.help}</p></div>
      {engine === "discourse" && <div><Label htmlFor="extension-category">Chuyên mục (slug hoặc ID)</Label><Input id="extension-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ví dụ: projects/nginx hoặc 23" /><p className="mt-1 text-[11px] leading-4 text-muted">Chọn chuyên mục phù hợp với bài và được tài khoản của bạn cho phép đăng. Mỗi diễn đàn có chuyên mục riêng.</p></div>}
      {engine === "slideshare" && <div><Label htmlFor="extension-social-category">Chuyên mục</Label><Input id="extension-social-category" required value={category} onChange={event => setCategory(event.target.value)} placeholder="Tên chuyên mục có sẵn trên nền tảng" /></div>}
      {engine === "reddit" && <div><Label htmlFor="extension-flair">Flair của subreddit</Label><Input id="extension-flair" value={flair} onChange={event => setFlair(event.target.value)} placeholder="Tên flair chính xác; để trống nếu không bắt buộc" /></div>}
      {["medium", "substack", "aws-builder", "slideshare"].includes(engine) && <div><Label htmlFor="extension-social-tags">Tags / Topics</Label><Input id="extension-social-tags" value={tags} onChange={event => setTags(event.target.value)} placeholder="Các tag có sẵn, phân tách bằng dấu phẩy" /></div>}
      {engine === "discourse" && <div><Label htmlFor="extension-tags">Tags</Label><Input id="extension-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="nginx-open-source, config" /><p className="mt-1 text-[11px] leading-4 text-muted">Nhập tag có sẵn và được phép trong chuyên mục, phân tách bằng dấu phẩy. Tiện ích chọn các tag này trước khi đăng; hashtag trong nội dung không thay thế tag diễn đàn.</p></div>}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"><div><p className="text-sm font-semibold">Tự bấm Đăng</p><p className="mt-1 text-xs text-muted">Bật để tiện ích tự gửi bài đã duyệt từ web. Tắt để chỉ điền sẵn. Nếu nền tảng yêu cầu CAPTCHA, luồng sẽ chờ bạn xử lý.</p></div><span className="shrink-0"><Switch checked={autoSubmit} onChange={setAutoSubmit} label="Tự bấm Đăng" /></span></div>
    </>}
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button><Button type="submit" loading={save.isPending}>Lưu</Button></div>
  </form>;
}
