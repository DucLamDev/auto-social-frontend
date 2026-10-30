"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { useExtensionDevices, useResourceMutation } from "@/hooks/use-resources";
import { resourcesService, type ExtensionSessionInput } from "@/services/resources.service";
import type { PlatformAccount } from "@/types/domain";

export function ExtensionSessionForm({ account, onClose }: { account: PlatformAccount; onClose: () => void }) {
  const devices = useExtensionDevices();
  const saved = (account.settings?.extensionSession ?? {}) as Partial<ExtensionSessionInput>;
  const [deviceId, setDeviceId] = useState(saved.deviceId ?? "");
  const [expectedUsername, setExpectedUsername] = useState(saved.expectedUsername ?? account.username ?? "");
  const [profileUrl, setProfileUrl] = useState(saved.profileUrl ?? "");
  const [identitySelector, setIdentitySelector] = useState(saved.identitySelector ?? "");
  const [provider, setProvider] = useState<"password" | "google">(saved.provider ?? "password");
  const [autoLogin, setAutoLogin] = useState(saved.autoLogin ?? true);
  const [autoTotp, setAutoTotp] = useState(saved.autoTotp ?? true);
  const [loginUrl, setLoginUrl] = useState(saved.loginUrl ?? "");
  const [loginUsername, setLoginUsername] = useState(saved.loginUsername ?? "");
  const [password, setPassword] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const save = useResourceMutation((input: ExtensionSessionInput) => resourcesService.configureExtensionSession(account.id, input), ["accounts", "account-health"]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await save.mutateAsync({ deviceId, expectedUsername: expectedUsername.trim(), profileUrl: profileUrl.trim(), identitySelector: identitySelector.trim(),
        provider, autoLogin, autoTotp: autoLogin && autoTotp, loginUrl: autoLogin ? loginUrl.trim() : "", loginUsername: loginUsername.trim(),
        ...(autoLogin && password ? { password } : {}), ...(autoLogin && autoTotp && totpSecret ? { totpSecret: totpSecret.trim() } : {}) });
      setPassword(""); setTotpSecret(""); toast.success("Đã lưu hồ sơ Chrome và cấu hình đăng nhập mã hóa"); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không lưu được cấu hình đăng nhập"); }
  };
  return <form className="space-y-4" onSubmit={event => void submit(event)} autoComplete="off">
    <p className="rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-900">Mỗi tài khoản trên cùng nền tảng cần một hồ sơ Chrome riêng. Một hồ sơ có thể dùng cho nhiều nền tảng; nếu đăng nhập qua Google, hãy dùng cùng một tài khoản Google trong hồ sơ đó. Tiện ích kiểm tra đúng tài khoản trước khi đăng.</p>
    <div><Label htmlFor="session-device">Hồ sơ Chrome nhận bài</Label><Select id="session-device" required value={deviceId} onChange={event => setDeviceId(event.target.value)}><option value="">Chọn hồ sơ đã ghép nối</option>{(devices.data ?? []).map(device => <option key={device.id} value={device.id}>{device.name}</option>)}</Select><p className="mt-1 text-xs text-muted">Tạo hồ sơ Chrome và ghép nối tiện ích một lần cho từng tài khoản. Giữ các hồ sơ cần chạy mở.</p></div>
    <div><Label htmlFor="session-identity">Username trên nền tảng đích</Label><Input id="session-identity" required value={expectedUsername} onChange={event => setExpectedUsername(event.target.value)} placeholder="Tên tài khoản sẽ đứng tên bài đăng" /></div>
    <div><Label htmlFor="session-profile">URL hồ sơ trên nền tảng</Label><Input id="session-profile" type="url" value={profileUrl} onChange={event => setProfileUrl(event.target.value)} placeholder="https://medium.com/@ten-cua-ban" /><p className="mt-1 text-xs text-muted">Dùng để đối chiếu tài khoản đang đăng nhập. Không dùng URL trang chủ hoặc trang hướng dẫn.</p></div>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="session-auto-login">Tự đăng nhập khi hết phiên</Label><Switch checked={autoLogin} onChange={setAutoLogin} label="Tự đăng nhập khi hết phiên" /></div>
    {autoLogin && <>
      <div><Label htmlFor="session-provider">Phương thức đăng nhập</Label><Select id="session-provider" value={provider} onChange={event => setProvider(event.target.value as "password" | "google")}><option value="password">Tài khoản / mật khẩu của nền tảng</option><option value="google">Đăng nhập bằng Google</option></Select></div>
      <div><Label htmlFor="session-login-url">Trang đăng nhập của nền tảng</Label><Input id="session-login-url" type="url" required value={loginUrl} onChange={event => setLoginUrl(event.target.value)} placeholder="URL trang có form đăng nhập hoặc nút Continue with Google" /><p className="mt-1 text-xs text-muted">Cùng tên miền với trang đăng bài. Với Google, tiện ích sẽ đi tiếp qua nút đăng nhập Google của trang này.</p></div>
      <div><Label htmlFor="session-login-user">{provider === "google" ? "Email tài khoản Google" : "Email / tên đăng nhập"}</Label><Input id="session-login-user" required value={loginUsername} onChange={event => setLoginUsername(event.target.value)} autoComplete="off" /></div>
      <div><Label htmlFor="session-password">{provider === "google" ? "Mật khẩu Google" : "Mật khẩu nền tảng"}</Label><Input id="session-password" type="password" required={!saved.autoLogin} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" placeholder={saved.autoLogin ? "Để trống để giữ mật khẩu đã mã hóa" : "Chỉ gửi để lưu mã hóa"} /></div>
      <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Tự điền mã TOTP</span><Switch checked={autoTotp} onChange={setAutoTotp} label="Tự điền mã TOTP" /></div>
      {autoTotp && <div><Label htmlFor="session-totp">{provider === "google" ? "Khóa thiết lập TOTP của Google" : "Khóa thiết lập TOTP"}</Label><Input id="session-totp" type="password" required={!saved.autoTotp} value={totpSecret} onChange={event => setTotpSecret(event.target.value)} autoComplete="new-password" placeholder={saved.autoTotp ? "Để trống để giữ khóa đã mã hóa" : "Khóa Base32 hoặc otpauth://totp/…"} /><p className="mt-1 text-xs leading-5 text-muted">Nhập khóa dùng để thiết lập Authenticator, không phải mã 6 số đang thay đổi. Backend giữ khóa đã mã hóa và chỉ cấp mã hiện tại cho đúng hồ sơ Chrome đang chạy bài.</p></div>}
    </>}
    <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-xs font-semibold">Nhận diện tài khoản nâng cao</summary><div className="mt-3"><Label htmlFor="session-selector">CSS của tên tài khoản trong menu cá nhân</Label><Input id="session-selector" value={identitySelector} onChange={event => setIdentitySelector(event.target.value)} placeholder="Để trống để dùng bộ nhận diện của nền tảng" /><p className="mt-1 text-xs leading-5 text-muted">Chỉ cần khi giao diện mới chưa được nhận diện. Phần tử phải chứa username chính xác hoặc link hồ sơ của tài khoản đang đăng nhập.</p></div></details>
    <p className="text-xs leading-5 text-muted">Mật khẩu và khóa TOTP không hiện lại sau khi lưu. Nếu gặp CAPTCHA, xác nhận trên điện thoại hoặc tài khoản không khớp, bài chờ xử lý trên web.</p>
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" loading={save.isPending}>Lưu phiên và đăng nhập</Button></div>
  </form>;
}
