import { describe, expect, it } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { extensionConnectionHelp } from "./extension-connection-help";

const account = { name: "VPSTTT", settings: { extensionSession: { deviceId: "chrome", expectedUsername: "vpsttt", origin: "https://example.test", loginUrl: "https://example.test/login" } }, platform: { slug: "product-hunt", defaultSettings: {} } } as unknown as PlatformAccount;
describe("manual Chrome connection help", () => {
  it("does not present an authenticated account without a posting flow as ready to publish", () => {
    const help = extensionConnectionHelp(account, { status: "AUTHENTICATED" });
    expect(help.hasFlow).toBe(false);
    expect(help.reason).toContain("Chưa có luồng đăng tự động");
    expect(help.steps.join(" ")).toContain("Launch tags");
    expect(help.steps.join(" ")).not.toContain("Đăng nhập trực tiếp");
  });
  it("explains account mismatch and provides a verification step after manual login", () => {
    const help = extensionConnectionHelp(account, { status: "NEEDS_ACTION", message: "Chrome đang đăng nhập tài khoản khác." });
    expect(help.steps.join(" ")).toContain("Tài khoản dự kiến: vpsttt");
    expect(help.steps.join(" ")).toContain("không nhập mật khẩu hoặc mã 2FA");
    expect(help.loginUrl).toBe("https://example.test/login");
  });
  it("separates missing destination from missing flow", () => {
    const help = extensionConnectionHelp({ ...account, platform: { ...account.platform!, defaultSettings: { extensionFlowId: "cloudpanel-forum" } } }, { status: "AUTHENTICATED" });
    expect(help.hasFlow).toBe(true);
    expect(help.reason).toContain("thiếu nơi đăng");
    expect(help.steps.join(" ")).toContain("Bấm “Tiện ích”");
  });
  it("does not expose unsafe login links or hide a provider restriction behind login success", () => {
    const help = extensionConnectionHelp({ ...account, settings: { extensionSession: { loginUrl: "javascript:alert(1)", profileUrl: "https://user:secret@example.test", deviceId: "chrome" }, extensionSetup: { status: "ACCESS_RESTRICTED", message: "Tài khoản đang bị đình chỉ quyền đăng bài." } } }, { status: "AUTHENTICATED" });
    expect(help.loginUrl).toBeUndefined();
    expect(help.profileUrl).toBeUndefined();
    expect(help.reason).toContain("đình chỉ");
  });
});
