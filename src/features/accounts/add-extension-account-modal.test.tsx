import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddExtensionAccountModal } from "./add-extension-account-modal";

const mocks = vi.hoisted(() => ({ importOne: vi.fn(), success: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, info: mocks.info, error: vi.fn() } }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { importOneExtensionAccount: mocks.importOne } }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionDevices: () => ({ data: [{ id: "device-1", name: "Chrome văn phòng", createdAt: "2026-11-01T00:00:00Z" }] }),
  usePlatforms: () => ({ isPending: false, data: { items: [
    { id: "p-caddy", slug: "caddy-community", name: "Caddy Community", mode: "MANUAL", enabled: true, defaultSettings: { extensionFlowId: "caddy-community", extensionEngine: "discourse", extensionTargetUrl: "https://caddy.community/new-topic", extensionSetupHint: "Chọn chuyên mục Help." } },
    { id: "p-devto", slug: "devto", name: "dev.to", mode: "OFFICIAL_API", enabled: true, defaultSettings: {} },
  ] } }),
  useResourceMutation: (fn: (input: unknown) => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));

const fill = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("add one social to the extension flow", () => {
  beforeEach(() => {
    mocks.importOne.mockReset().mockResolvedValue({ imported: 1, skipped: 0, queued: 1, batchId: "b", rows: [{ row: "manual:1", name: "Caddy Community", setup: "READY" }] });
    mocks.success.mockReset(); mocks.info.mockReset();
  });

  it("lists only platforms with a Chrome flow and shows the flow's default page and hint", () => {
    render(<AddExtensionAccountModal open onClose={vi.fn()} />);
    const platform = screen.getByLabelText("Nền tảng");
    expect(within(platform).getByRole("option", { name: "Caddy Community" })).toBeInTheDocument();
    expect(within(platform).queryByRole("option", { name: "dev.to" })).not.toBeInTheDocument();
    fill("Nền tảng", "caddy-community");
    expect(screen.getByText("Chọn chuyên mục Help.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Trang đăng bài/)).toHaveAttribute("placeholder", "Để trống: https://caddy.community/new-topic");
    expect(screen.getByLabelText("Chuyên mục / community")).toBeInTheDocument();
  });

  it("asks for the platform and the login before sending", async () => {
    render(<AddExtensionAccountModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm social" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chọn nền tảng.");
    fill("Nền tảng", "caddy-community");
    fireEvent.click(screen.getByRole("radio", { name: "Đăng nhập bằng Google" }));
    fireEvent.click(screen.getByRole("button", { name: "Thêm social" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nhập email Google.");
    expect(mocks.importOne).not.toHaveBeenCalled();
  });

  it("sends one row for the chosen Chrome and closes once Chrome is asked to sign it in", async () => {
    const onClose = vi.fn();
    render(<AddExtensionAccountModal open onClose={onClose} />);
    fill("Nền tảng", "caddy-community");
    fill("Email / tên đăng nhập", "writer@example.test");
    fill("Mật khẩu", "fixture-pass"); // vpsttt-secretscan: ignore
    fill("Chuyên mục / community", "help");
    fill(/Tag cố định/, "caddy, proxy");
    fireEvent.click(screen.getByRole("button", { name: "Thêm social" }));
    await waitFor(() => expect(mocks.importOne).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      deviceId: "device-1", platform: "caddy-community", provider: "password", loginUsername: "writer@example.test",
      password: "fixture-pass", category: "help", tags: "caddy, proxy", targetUrl: "", // vpsttt-secretscan: ignore
    })));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.success).toHaveBeenCalledWith("Đã thêm Caddy Community. Chrome sẽ đăng nhập thử social này.");
  });

  it("keeps the form open with the reason when the row is refused", async () => {
    mocks.importOne.mockResolvedValue({ imported: 0, queued: 0, batchId: null, rows: [{ row: "manual:1", name: "Caddy Community", issue: "INVALID_TOTP" }] });
    const onClose = vi.fn();
    render(<AddExtensionAccountModal open onClose={onClose} />);
    fill("Nền tảng", "caddy-community");
    fill("Email / tên đăng nhập", "writer@example.test");
    fireEvent.click(screen.getByRole("button", { name: "Thêm social" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Caddy Community: khoá 2FA không hợp lệ (cần khoá thiết lập, không phải mã 6 số)");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("says when the social already exists unchanged", async () => {
    mocks.importOne.mockResolvedValue({ imported: 0, skipped: 1, queued: 0, batchId: null, rows: [{ row: "manual:1", name: "Caddy Community", setup: "UNCHANGED" }] });
    render(<AddExtensionAccountModal open onClose={vi.fn()} />);
    fill("Nền tảng", "caddy-community");
    fill("Email / tên đăng nhập", "writer@example.test");
    fireEvent.click(screen.getByRole("button", { name: "Thêm social" }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalledWith("Caddy Community đã có và không đổi gì."));
  });
});
