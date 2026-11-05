import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { ExtensionSessionForm } from "./extension-session-form";
const mocks = vi.hoisted(() => ({ save: vi.fn(), close: vi.fn(), warning: vi.fn(), others: [] as Array<Record<string, unknown>> }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionDevices: () => ({ data: [{ id: "chrome-a", name: "Chrome A" }, { id: "chrome-b", name: "Chrome B" }] }),
  useAccounts: () => ({ data: { items: mocks.others } }),
  useResourceMutation: (fn: (value: unknown) => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { configureExtensionSession: mocks.save } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: mocks.warning } }));
const account: PlatformAccount = { id: "account-a", platformId: "medium", name: "Medium A", username: "alice", enabled: true, status: "CONNECTED", settings: { delivery: "extension" } };
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("account Chrome session configuration", () => {
  beforeEach(() => { mocks.save.mockReset().mockResolvedValue({}); mocks.close.mockReset(); mocks.warning.mockReset(); mocks.others = []; });
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

  it("says when the chosen Chrome profile already holds another account of the platform, and warns after saving", async () => {
    const imported = { extensionSession: { deviceId: "chrome-a", expectedUsername: "alice", provider: "password", autoLogin: false, autoTotp: false } };
    mocks.others = [
      { id: "account-b", platformId: "medium", name: "Medium B", settings: { extensionSession: { deviceId: "chrome-a" } } },
      { id: "account-c", platformId: "quora", name: "Quora C", settings: { extensionSession: { deviceId: "chrome-a" } } },
    ];
    mocks.save.mockResolvedValue({ deviceId: "chrome-a", sharedWith: ["Medium B"] });
    render(<ExtensionSessionForm account={{ ...account, settings: imported }} onClose={mocks.close} />);
    // Already on that profile (older import): editable, with a note naming only the same-platform account.
    expect(screen.getByRole("note")).toHaveTextContent("Chrome A cũng đang giữ Medium B của cùng nền tảng. Bạn vẫn sửa và lưu được");
    expect(screen.getByRole("note")).not.toHaveTextContent("Quora C");
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiên và đăng nhập" }));
    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining("Chrome A cũng đang giữ Medium B"), { duration: 15_000 }));
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });

  it("explains that a profile holding another account of the platform cannot take this one", () => {
    mocks.others = [{ id: "account-b", platformId: "medium", name: "Medium B", settings: { extensionSession: { deviceId: "chrome-b" } } }];
    render(<ExtensionSessionForm account={account} onClose={mocks.close} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    change("Hồ sơ Chrome nhận bài", "chrome-b");
    expect(screen.getByRole("note")).toHaveTextContent("Chrome B đang giữ Medium B của cùng nền tảng nên không nhận thêm tài khoản này.");
  });
});
