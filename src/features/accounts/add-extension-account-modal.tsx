"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useExtensionDevices, usePlatforms, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService, type ImportOneAccountInput } from "@/services/resources.service";
import { importRowNote } from "./account-import-notes";

const EMPTY = { platform: "", provider: "password" as "password" | "google", loginUsername: "", password: "", totpSecret: "", expectedUsername: "", profileUrl: "", targetUrl: "", category: "", tags: "" };
const COMMUNITY_ENGINES = new Set(["discourse", "lemmy", "discuit", "slideshare"]);

/**
 * "Thêm social": one social added to the extension posting flow, like one row of
 * the accounts file. Only this social is signed in by Chrome; the others are not
 * touched. Secrets are sent once and never shown again.
 */
export function AddExtensionAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const devices = useExtensionDevices();
  const platforms = usePlatforms({ limit: 100 });
  const [form, setForm] = useState(EMPTY);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const flows = useMemo(() => (platforms.data?.items ?? [])
    .filter((platform) => typeof platform.defaultSettings?.extensionFlowId === "string")
    .sort((a, b) => a.name.localeCompare(b.name, "vi")), [platforms.data?.items]);
  const flow = flows.find((platform) => platform.slug === form.platform);
  const engine = String(flow?.defaultSettings?.extensionEngine ?? "");
  const defaultPage = String(flow?.defaultSettings?.extensionTargetUrl ?? "");
  const chosenDevice = deviceId || devices.data?.[0]?.id || "";
  const add = useResourceMutation((input: ImportOneAccountInput) => resourcesService.importOneExtensionAccount(input), ["accounts", "extension-login-checks", "platforms"]);
  const set = (field: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const close = () => { if (add.isPending) return; setForm(EMPTY); setError(""); onClose(); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.platform) { setError("Chọn nền tảng."); return; }
    if (!form.loginUsername.trim()) { setError(form.provider === "google" ? "Nhập email Google." : "Nhập email hoặc tên đăng nhập."); return; }
    try {
      const result = await add.mutateAsync({ deviceId: chosenDevice, ...form, provider: form.provider });
      const row = result.rows[0];
      const note = row ? importRowNote(row) : "không nhận được kết quả";
      if (row?.issue) { setError(`${row.name}: ${note}`); return; }
      if (row?.setup === "UNCHANGED") toast.info(`${row.name} đã có và không đổi gì.`);
      else toast.success(`Đã thêm ${row?.name ?? "social"}${result.queued ? ". Chrome sẽ đăng nhập thử social này" : ""}${note ? ` (${note})` : ""}.`);
      setForm(EMPTY);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thêm được social."); }
  };

  return <Modal open={open} onClose={close} title="Thêm social vào luồng đăng bằng tiện ích" description="Thêm từng social, giống một dòng trong file tài khoản. Chỉ social này được Chrome đăng nhập thử; các social đang chạy giữ nguyên." className="max-w-2xl">
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="add-platform">Nền tảng</Label><Select id="add-platform" value={form.platform} onChange={(event) => set("platform", event.target.value)}>
          <option value="">{platforms.isPending ? "Đang tải…" : "Chọn nền tảng"}</option>
          {flows.map((platform) => <option key={platform.id} value={platform.slug}>{platform.name}</option>)}
        </Select></div>
        <div><Label htmlFor="add-device">Chrome đăng bài</Label><Select id="add-device" value={chosenDevice} onChange={(event) => setDeviceId(event.target.value)}>
          {!devices.data?.length && <option value="">Cần ghép nối Chrome trước</option>}
          {devices.data?.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
        </Select></div>
      </div>
      {platforms.isError && <p className="text-sm text-danger">Không tải được danh sách nền tảng. Đóng hộp này rồi mở lại.</p>}
      {typeof flow?.defaultSettings?.extensionSetupHint === "string" && <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted">{flow.defaultSettings.extensionSetupHint}</p>}
      <fieldset className="flex flex-wrap gap-4 text-sm"><legend className="mb-1.5 text-sm font-semibold text-slate-700">Cách đăng nhập</legend>
        <label className="flex items-center gap-2"><input type="radio" name="add-provider" checked={form.provider === "password"} onChange={() => set("provider", "password")} />Mật khẩu của nền tảng</label>
        <label className="flex items-center gap-2"><input type="radio" name="add-provider" checked={form.provider === "google"} onChange={() => set("provider", "google")} />Đăng nhập bằng Google</label>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="add-login">{form.provider === "google" ? "Email Google" : "Email / tên đăng nhập"}</Label><Input id="add-login" autoComplete="off" value={form.loginUsername} onChange={(event) => set("loginUsername", event.target.value)} /></div>
        <div><Label htmlFor="add-password">{form.provider === "google" ? "Mật khẩu Google" : "Mật khẩu"}</Label><Input id="add-password" type="password" autoComplete="new-password" placeholder="Để trống nếu Chrome đã đăng nhập sẵn" value={form.password} onChange={(event) => set("password", event.target.value)} /></div>
        <div><Label htmlFor="add-totp">Khoá 2FA (không bắt buộc)</Label><Input id="add-totp" type="password" autoComplete="off" placeholder="Khoá thiết lập, không phải mã 6 số" value={form.totpSecret} onChange={(event) => set("totpSecret", event.target.value)} /></div>
        <div><Label htmlFor="add-username">Tên trên nền tảng (không bắt buộc)</Label><Input id="add-username" autoComplete="off" placeholder="Để trống: tự nhận sau lần đăng nhập đầu" value={form.expectedUsername} onChange={(event) => set("expectedUsername", event.target.value)} /></div>
        <div className="sm:col-span-2"><Label htmlFor="add-profile">URL hồ sơ (không bắt buộc)</Label><Input id="add-profile" type="url" placeholder="https://…" value={form.profileUrl} onChange={(event) => set("profileUrl", event.target.value)} /></div>
        <div className="sm:col-span-2"><Label htmlFor="add-target">Trang đăng bài{defaultPage ? " (không bắt buộc)" : ""}</Label><Input id="add-target" type="url" placeholder={defaultPage ? `Để trống: ${defaultPage}` : "URL trang tạo bài / tạo chủ đề"} value={form.targetUrl} onChange={(event) => set("targetUrl", event.target.value)} /></div>
        {COMMUNITY_ENGINES.has(engine) && <div><Label htmlFor="add-category">Chuyên mục / community</Label><Input id="add-category" value={form.category} onChange={(event) => set("category", event.target.value)} /></div>}
        <div><Label htmlFor="add-tags">Tag cố định (không bắt buộc)</Label><Input id="add-tags" placeholder="vps, linux" value={form.tags} onChange={(event) => set("tags", event.target.value)} /></div>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={add.isPending} onClick={close}>Huỷ</Button><Button type="submit" loading={add.isPending} disabled={!devices.data?.length}><Plus className="size-4" />Thêm social</Button></div>
    </form>
  </Modal>;
}
