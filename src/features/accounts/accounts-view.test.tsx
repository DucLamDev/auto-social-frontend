import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/errors";
import type { Platform, PlatformAccount } from "@/types/domain";
import { AccountsView } from "./accounts-view";

const mocks = vi.hoisted(() => ({
  accounts: [] as PlatformAccount[],
  platforms: [] as Platform[],
  createAccount: vi.fn(),
  updateAccountSettings: vi.fn(),
  updateAccountCredential: vi.fn(),
  updateAccount: vi.fn(),
  revokeBrowserSession: vi.fn(),
  testAccount: vi.fn(),
  refetchAccounts: vi.fn(),
  invalidate: vi.fn(),
  oauthStart: vi.fn(),
  runAccountCheck: vi.fn(),
  providers: [] as Array<{ provider: string; platform?: string; status: string }>,
  role: "ADMIN",
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: mocks.role } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  useAccounts: () => ({
    data: { items: mocks.accounts },
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.refetchAccounts,
  }),
  usePlatforms: () => ({
    data: { items: mocks.platforms },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useOAuthProviders: () => ({ data: mocks.providers, isPending: false, isError: false, error: null, refetch: vi.fn() }),
  useInvalidate: () => mocks.invalidate,
  useResourceMutation: (mutation: (value: never) => Promise<unknown>) => ({
    isPending: false,
    mutateAsync: (value: never) => mutation(value),
  }),
}));

vi.mock("@/services/resources.service", () => ({
  resourcesService: {
    createAccount: mocks.createAccount,
    updateAccountSettings: mocks.updateAccountSettings,
    updateAccountCredential: mocks.updateAccountCredential,
    updateAccount: mocks.updateAccount,
    revokeBrowserSession: mocks.revokeBrowserSession,
    testAccount: mocks.testAccount,
    oauthStart: mocks.oauthStart,
    runAccountCheck: mocks.runAccountCheck,
  },
}));

const vozPlatform: Platform = {
  id: "platform-voz",
  slug: "voz-forums",
  name: "Voz Forums",
  mode: "BROWSER_ASSISTED",
  connectorKey: "browser-assisted",
  enabled: true,
  defaultSettings: {
    browserRecipe: "voz-xenforo",
    forumPath: "",
    threadPrefixId: "",
    automationPermissionAttested: false,
    browserAutoSubmit: false,
  },
  capabilities: { text: true, image: false, video: false, article: true, delete: false, schedule: false, analytics: false },
};

const browserAccount: PlatformAccount = {
  id: "66f018af-d8a8-4dd8-b584-1ffbd67a8f78",
  platformId: vozPlatform.id,
  platform: {
    id: vozPlatform.id,
    slug: vozPlatform.slug,
    name: vozPlatform.name,
    mode: vozPlatform.mode,
    connectorKey: vozPlatform.connectorKey,
    defaultSettings: vozPlatform.defaultSettings,
  },
  name: "VOZ Production",
  enabled: true,
  status: "CONNECTED",
  browserSessionConfigured: true,
  settings: {
    forumPath: "/f/cong-nghe.10",
    threadPrefixId: "",
    automationPermissionAttested: true,
    browserAutoSubmit: true,
  },
  credential: { status: "ACTIVE" },
};

describe("AccountsView Playwright flow", () => {
  beforeEach(() => {
    mocks.accounts = [];
    mocks.platforms = [vozPlatform];
    mocks.createAccount.mockReset();
    mocks.updateAccountSettings.mockReset();
    mocks.updateAccountCredential.mockReset();
    mocks.updateAccount.mockReset();
    mocks.revokeBrowserSession.mockReset();
    mocks.testAccount.mockReset();
    mocks.refetchAccounts.mockReset().mockResolvedValue(undefined);
    mocks.invalidate.mockReset().mockResolvedValue(undefined);
    mocks.role = "ADMIN";
  });

  it("creates a browser account without a password and keeps the login command visible as the next step", async () => {
    mocks.createAccount.mockResolvedValue({ ...browserAccount, status: "RECONNECT_REQUIRED", browserSessionConfigured: false, credential: null });
    render(<AccountsView />);

    fireEvent.click(screen.getByRole("button", { name: "Kết nối / cấu hình" }));
    const destinations = screen.getByRole("dialog", { name: "Kết nối / cấu hình điểm đến" });
    fireEvent.click(within(destinations).getByRole("button", { name: /Voz Forums/ }));
    const formDialog = screen.getByRole("dialog", { name: "Thêm Voz Forums" });
    expect(within(formDialog).queryByLabelText(/mật khẩu/i)).not.toBeInTheDocument();
    fireEvent.change(within(formDialog).getByLabelText("Tên hiển thị"), { target: { value: "VOZ Production" } });
    fireEvent.change(within(formDialog).getByLabelText("Đường dẫn box VOZ"), { target: { value: "/f/cong-nghe.10" } });
    fireEvent.click(within(formDialog).getByRole("switch", { name: /xác nhận tài khoản/ }));
    fireEvent.click(within(formDialog).getByRole("switch", { name: /Cho phép tự bấm/ }));
    fireEvent.click(within(formDialog).getByRole("button", { name: "Tạo & tiếp tục đăng nhập" }));

    await waitFor(() => expect(mocks.createAccount).toHaveBeenCalledWith(expect.objectContaining({
      platformSlug: "voz-forums",
      name: "VOZ Production",
      settings: expect.objectContaining({
        forumPath: "/f/cong-nghe.10",
        automationPermissionAttested: true,
        browserAutoSubmit: true,
      }),
    })));
    expect(mocks.createAccount.mock.calls[0]?.[0]).not.toHaveProperty("credential");
    expect(await screen.findByRole("dialog", { name: "Hoàn tất đăng nhập Playwright" })).toBeInTheDocument();
    expect(screen.getByLabelText("Lệnh đăng nhập Playwright")).toHaveTextContent(`corepack pnpm browser:login ${browserAccount.id}`);
  });

  it("edits allowlisted browser settings without replacing the encrypted session", async () => {
    mocks.accounts = [browserAccount];
    mocks.updateAccountSettings.mockResolvedValue({ ...browserAccount, settings: { ...browserAccount.settings, threadPrefixId: "2" } });
    render(<AccountsView />);

    fireEvent.click(screen.getByRole("button", { name: "Cấu hình" }));
    const dialog = screen.getByRole("dialog", { name: "Cập nhật Voz Forums" });
    fireEvent.change(within(dialog).getByLabelText("Thread Prefix ID"), { target: { value: "2" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu cấu hình" }));

    await waitFor(() => expect(mocks.updateAccountSettings).toHaveBeenCalledWith(
      browserAccount.id,
      expect.objectContaining({ threadPrefixId: "2", browserAutoSubmit: true }),
    ));
    expect(mocks.updateAccountCredential).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /session Playwright/ })).not.toBeInTheDocument();
  });

  it("offers separate test and reconnect actions for a stored browser session", () => {
    mocks.accounts = [{ ...browserAccount, status: "RECONNECT_REQUIRED" }];
    render(<AccountsView />);

    expect(screen.getByRole("button", { name: "Test" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Kết nối lại" }));
    expect(screen.getByRole("dialog", { name: "Hoàn tất đăng nhập Playwright" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/mật khẩu/i)).not.toBeInTheDocument();
  });

  it("revokes only the encrypted browser session after explicit admin confirmation", async () => {
    mocks.accounts = [browserAccount];
    mocks.revokeBrowserSession.mockResolvedValue({
      ...browserAccount,
      status: "RECONNECT_REQUIRED",
      browserSessionConfigured: false,
      lastCheckedAt: null,
    });
    render(<AccountsView />);

    fireEvent.click(screen.getByRole("button", { name: "Thu hồi session" }));
    const dialog = screen.getByRole("dialog", { name: "Thu hồi session Playwright đã mã hóa" });
    expect(dialog).toHaveTextContent("Tài khoản, cấu hình adapter, lịch sử chiến dịch và bài đăng không bị xóa");
    expect(mocks.revokeBrowserSession).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi session" }));

    await waitFor(() => expect(mocks.revokeBrowserSession).toHaveBeenCalledWith(browserAccount.id));
    await waitFor(() => expect(mocks.refetchAccounts).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Thu hồi session Playwright đã mã hóa" })).not.toBeInTheDocument());
    expect(mocks.updateAccountSettings).not.toHaveBeenCalled();
    expect(mocks.updateAccountCredential).not.toHaveBeenCalled();
  });

  it("does not expose browser-session revocation to non-admin users", () => {
    mocks.accounts = [browserAccount];
    mocks.role = "EDITOR";
    render(<AccountsView />);

    expect(screen.queryByRole("button", { name: "Thu hồi session" })).not.toBeInTheDocument();
  });

  it("keeps the confirmation open when an active browser task holds the session lock", async () => {
    mocks.accounts = [browserAccount];
    mocks.revokeBrowserSession.mockRejectedValue(new ApiError(
      "The browser session is currently in use",
      "CONFLICT",
      409,
    ));
    render(<AccountsView />);

    fireEvent.click(screen.getByRole("button", { name: "Thu hồi session" }));
    const dialog = screen.getByRole("dialog", { name: "Thu hồi session Playwright đã mã hóa" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi session" }));

    await waitFor(() => expect(mocks.revokeBrowserSession).toHaveBeenCalledWith(browserAccount.id));
    expect(screen.getByRole("dialog", { name: "Thu hồi session Playwright đã mã hóa" })).toBeInTheDocument();
    expect(mocks.refetchAccounts).not.toHaveBeenCalled();
  });
});

const threadsAccount: PlatformAccount = {
  id: "0d9b1c55-0b47-4c6f-9a55-2c1f0f7c8e11",
  platformId: "platform-threads",
  platform: { id: "platform-threads", slug: "threads", name: "Threads", mode: "OFFICIAL_API", connectorKey: "threads" },
  name: "@vpsttt",
  enabled: true,
  status: "RECONNECT_REQUIRED",
  oauthConfigured: true,
  oauthToken: { expiresAt: "2026-12-20T00:00:00.000Z" },
};

describe("AccountsView Meta OAuth", () => {
  beforeEach(() => {
    mocks.accounts = [threadsAccount];
    mocks.platforms = [];
    mocks.providers = [{ provider: "threads", platform: "threads", status: "READY" }, { provider: "instagram", platform: "instagram", status: "CREDENTIAL_REQUIRED" }];
    mocks.oauthStart.mockReset().mockRejectedValue(new Error("stop before redirect"));
    mocks.runAccountCheck.mockReset();
    mocks.role = "ADMIN";
    window.history.replaceState({}, "", "/accounts");
  });

  it("reconnects an OAuth account in one click and labels the auto-renewed token", async () => {
    render(<AccountsView />);
    expect(screen.getByText("Token tự gia hạn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Kết nối lại/ }));
    await waitFor(() => expect(mocks.oauthStart).toHaveBeenCalledWith("threads"));
  });

  it("offers a Kết nối button only for providers the backend has configured", () => {
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: /Kết nối \/ cấu hình/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button", { name: /^Kết nối$/ })).toHaveLength(1);
    expect(within(dialog).getByText("Backend chưa cấu hình App ID/Secret")).toBeInTheDocument();
  });

  it("runs the account check on demand", async () => {
    mocks.runAccountCheck.mockResolvedValue({ tokens: { refreshed: 1, failed: 0, skipped: 0 }, connections: { checked: 1, failed: 0 } });
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: /Kiểm tra tất cả/ }));
    await waitFor(() => expect(mocks.runAccountCheck).toHaveBeenCalled());
  });
});
