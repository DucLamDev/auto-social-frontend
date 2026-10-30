import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { ExtensionSessionForm } from "./extension-session-form";
const mocks = vi.hoisted(() => ({ save: vi.fn(), close: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionDevices: () => ({ data: [{ id: "chrome-a", name: "Chrome A" }, { id: "chrome-b", name: "Chrome B" }] }),
  useResourceMutation: (fn: (value: unknown) => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { configureExtensionSession: mocks.save } }));
const account: PlatformAccount = { id: "account-a", platformId: "medium", name: "Medium A", username: "alice", enabled: true, status: "CONNECTED", settings: { delivery: "extension" } };
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("account Chrome session configuration", () => {
  beforeEach(() => { mocks.save.mockReset().mockResolvedValue({}); mocks.close.mockReset(); });
  it("sends the selected Chrome and Google credentials only through the session configuration endpoint", async () => {
    render(<ExtensionSessionForm account={account} onClose={mocks.close} />);
    change("Hồ sơ Chrome nhận bài", "chrome-b");
    change("Phương thức đăng nhập", "google");
    change("Trang đăng nhập của nền tảng", "https://medium.com/m/signin");
    change("Email tài khoản Google", "alice@example.test");
    change("Mật khẩu Google", "fixture-password");
    change("Khóa thiết lập TOTP của Google", "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiên và đăng nhập" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith("account-a", expect.objectContaining({ deviceId: "chrome-b", expectedUsername: "alice", provider: "google", autoLogin: true, autoTotp: true, loginUsername: "alice@example.test", password: "fixture-password", totpSecret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" })));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Mật khẩu Google")).toHaveValue("");
    expect(screen.getByLabelText("Khóa thiết lập TOTP của Google")).toHaveValue("");
  });
  it("leaves stored secrets blank and omits them when only changing public configuration", async () => {
    render(<ExtensionSessionForm account={{ ...account, settings: { extensionSession: { deviceId: "chrome-a", expectedUsername: "alice", provider: "password", autoLogin: true, autoTotp: true, loginUrl: "https://forum.test/login", loginUsername: "alice@example.test" } } }} onClose={mocks.close} />);
    expect(screen.getByLabelText("Mật khẩu nền tảng")).toHaveValue("");
    expect(screen.getByLabelText("Khóa thiết lập TOTP")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiên và đăng nhập" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save.mock.calls[0]![1]).not.toHaveProperty("password");
    expect(mocks.save.mock.calls[0]![1]).not.toHaveProperty("totpSecret");
  });
});
