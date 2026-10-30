import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/errors";
import type { Platform, PlatformAccount } from "@/types/domain";
import type { ExtensionLoginCheckRow } from "@/services/resources.service";
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
  queueExtensionLoginChecks: vi.fn(),
  loginChecks: [] as ExtensionLoginCheckRow[],
  refetchAccounts: vi.fn(),
  invalidate: vi.fn(),
  oauthStart: vi.fn(),
  runAccountCheck: vi.fn(),
  providers: [] as Array<{ provider: string; platform?: string; status: string }>,
  devices: [] as Array<{ id: string; name: string; lastSeenAt?: string | null; createdAt: string }>,
  configureExtensionDelivery: vi.fn(),
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
  useExtensionDevices: () => ({ data: mocks.devices, isPending: false, isError: false, error: null, refetch: vi.fn() }),
  useExtensionLoginChecks: () => ({ data: mocks.loginChecks, isError: false }),
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
    queueExtensionLoginChecks: mocks.queueExtensionLoginChecks,
    oauthStart: mocks.oauthStart,
    runAccountCheck: mocks.runAccountCheck,
    configureExtensionDelivery: mocks.configureExtensionDelivery,
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

beforeEach(() => {
  mocks.loginChecks = [];
  mocks.queueExtensionLoginChecks.mockReset().mockResolvedValue({ queued: 1, batchId: "batch" });
});

describe("selected Chrome connections", () => {
  const account: PlatformAccount = { ...browserAccount, id: "selected", name: "Selected VPSTTT", status: "CONNECTED", settings: {
    extensionImport: { selected: true }, extensionSession: { deviceId: "chrome", provider: "google", loginUsername: "owner@example.test" },
    delivery: "extension", extensionTargetUrl: "https://forum.test/new-topic", extensionAutoSubmit: true,
  } };
  beforeEach(() => {
    mocks.role = "ADMIN";
    mocks.platforms = [vozPlatform]; mocks.devices = []; mocks.providers = [];
    mocks.accounts = [account, { ...browserAccount, id: "old", name: "Old import", settings: { extensionImport: { selected: false } } }];
    mocks.loginChecks = [{ id: account.id, name: account.name, platform: "Forum", configured: true, issues: [],
      check: { id: "check", status: "AUTHENTICATED", message: "Session verified" } }];
    mocks.testAccount.mockReset(); mocks.runAccountCheck.mockReset();
  });
  it("shows the selected scope and sends Test to Chrome without testing API credentials", async () => {
    render(<AccountsView />);
    const row = screen.getByRole("row", { name: /Selected VPSTTT/ });
    expect(within(row).getByText("Đã kết nối")).toBeInTheDocument();
    expect(within(row).getByText("Tiện ích Chrome")).toBeInTheDocument();
    expect(screen.queryByText("Old import")).not.toBeInTheDocument();
    fireEvent.click(within(row).getByRole("button", { name: "Test" }));
    await waitFor(() => expect(mocks.queueExtensionLoginChecks).toHaveBeenCalledWith(["selected"], true));
    expect(mocks.testAccount).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra tất cả" }));
    await waitFor(() => expect(mocks.queueExtensionLoginChecks).toHaveBeenCalledTimes(2));
    expect(mocks.runAccountCheck).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Phạm vi tài khoản"), { target: { value: "all" } });
    expect(screen.getByText("Old import")).toBeInTheDocument();
  });
  it("uses the failed browser check even when the old API status is connected", () => {
    mocks.loginChecks[0]!.check = { id: "check", status: "NEEDS_ACTION", message: "Wrong Chrome account" };
    render(<AccountsView />);
    const row = screen.getByRole("row", { name: /Selected VPSTTT/ });
    expect(within(row).queryByText("Đã kết nối")).not.toBeInTheDocument();
    expect(within(row).getByText("Wrong Chrome account")).toBeInTheDocument();
  });
  it("does not describe login-only Chrome bindings as automatic publishing", () => {
    mocks.accounts = [{ ...account, settings: { extensionImport: { selected: true }, extensionSession: { deviceId: "chrome" } } }];
    render(<AccountsView />);
    const row = screen.getByRole("row", { name: /Selected VPSTTT/ });
    expect(within(row).getByText("Đã đăng nhập")).toBeInTheDocument();
    expect(within(row).getByText(/chưa có luồng đăng tự động/)).toBeInTheDocument();
    expect(within(row).queryByText("Đã kết nối")).not.toBeInTheDocument();
  });
  it("opens manual connection instructions and checks the existing session", async () => {
    mocks.loginChecks[0]!.check = { id: "check", status: "NEEDS_ACTION", message: "Chrome đang đăng nhập tài khoản khác." };
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: "Hướng dẫn kết nối" }));
    const dialog = screen.getByRole("dialog", { name: "Kết nối Selected VPSTTT" });
    expect(within(dialog).getByText(/Kiểm tra username và link hồ sơ/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tôi đã đăng nhập · Kiểm tra" }));
    await waitFor(() => expect(mocks.queueExtensionLoginChecks).toHaveBeenCalledWith(["selected"], true));
    expect(mocks.testAccount).not.toHaveBeenCalled();
  });
  it("keeps restricted accounts in the needs-action filter despite verified login", () => {
    mocks.accounts = [{ ...account, settings: { ...account.settings, extensionSetup: { status: "ACCESS_RESTRICTED", message: "Nền tảng trả 403: không có quyền tạo bài." } } }];
    render(<AccountsView />);
    fireEvent.change(screen.getByLabelText("Lọc trạng thái kết nối"), { target: { value: "needs_action" } });
    const row = screen.getByRole("row", { name: /Selected VPSTTT/ });
    expect(within(row).getByText("Cần thao tác")).toBeInTheDocument();
    expect(within(row).getByText(/Nền tảng trả 403/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Lọc trạng thái kết nối"), { target: { value: "connected" } });
    expect(screen.queryByRole("row", { name: /Selected VPSTTT/ })).not.toBeInTheDocument();
  });
});

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

describe("AccountsView publish mode", () => {
  beforeEach(() => {
    mocks.platforms = [];
    mocks.providers = [];
    mocks.updateAccountSettings.mockReset().mockResolvedValue({});
    mocks.role = "ADMIN";
    mocks.accounts = [{
      id: "b1d6d0c4-6a8e-4b8a-9d8e-1f0a0b0c0d0e",
      platformId: "platform-blogger",
      platform: { id: "platform-blogger", slug: "blogger", name: "Blogger", mode: "OFFICIAL_API", connectorKey: "blogger" },
      name: "Blog VPSTTT",
      enabled: true,
      status: "CONNECTED",
      settings: { publishImmediately: false },
      oauthConfigured: true,
      oauthToken: { expiresAt: null },
    }];
  });

  it("switches a Blogger account from drafts to immediate publishing", async () => {
    render(<AccountsView />);
    expect(screen.getByText("Lưu nháp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /Đăng ngay trên Blog VPSTTT/ }));
    await waitFor(() => expect(mocks.updateAccountSettings).toHaveBeenCalledWith("b1d6d0c4-6a8e-4b8a-9d8e-1f0a0b0c0d0e", { publishImmediately: true }));
  });
});

describe("AccountsView Chrome extension delivery", () => {
  const nginxPlatform: Platform = {
    ...vozPlatform,
    id: "platform-nginx",
    slug: "nginx-community",
    name: "NGINX Community",
    mode: "COMPATIBLE_API",
    connectorKey: "discourse",
    defaultSettings: { baseUrl: "https://community.nginx.org", apiUsername: "forum-user", categoryId: 23 },
  };
  const nginxAccount: PlatformAccount = {
    id: "account-nginx",
    platformId: nginxPlatform.id,
    platform: nginxPlatform,
    name: "NGINX Chrome",
    username: "forum-user",
    enabled: true,
    status: "RECONNECT_REQUIRED",
    settings: nginxPlatform.defaultSettings,
  };

  beforeEach(() => {
    mocks.platforms = [];
    mocks.providers = [];
    mocks.role = "ADMIN";
    mocks.devices = [{ id: "d1", name: "Chrome văn phòng", lastSeenAt: new Date().toISOString(), createdAt: new Date().toISOString() }];
    mocks.configureExtensionDelivery.mockReset().mockResolvedValue({ enabled: true });
    mocks.createAccount.mockReset().mockResolvedValue(nginxAccount);
    mocks.testAccount.mockReset();
    mocks.accounts = [{
      id: "7a1c2f9e-3b4d-4e5f-8a6b-7c8d9e0f1a2b",
      platformId: "platform-da",
      platform: { id: "platform-da", slug: "directadmin-forums", name: "DirectAdmin Forums", mode: "MANUAL", connectorKey: "manual" },
      name: "DirectAdmin",
      enabled: true,
      status: "CONNECTED",
      settings: {},
    }];
  });

  it("creates a Discourse account without API credentials and opens Chrome configuration", async () => {
    mocks.platforms = [nginxPlatform];
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: "Kết nối / cấu hình" }));
    fireEvent.click(screen.getByRole("button", { name: /NGINX Community/ }));
    const createDialog = screen.getByRole("dialog", { name: "Thêm NGINX Community" });
    fireEvent.change(within(createDialog).getByLabelText("Tên hiển thị"), { target: { value: "NGINX Chrome" } });
    fireEvent.change(within(createDialog).getByLabelText("Username (tuỳ chọn)"), { target: { value: "forum-user" } });
    // Switching methods must not send any API key that was entered beforehand.
    fireEvent.change(within(createDialog).getByLabelText("API Key"), { target: { value: "unused-api-key" } });
    fireEvent.change(within(createDialog).getByLabelText("Phương thức đăng"), { target: { value: "extension" } });
    expect(within(createDialog).queryByLabelText("API Key")).not.toBeInTheDocument();
    expect(within(createDialog).queryByLabelText("API Username")).not.toBeInTheDocument();
    fireEvent.click(within(createDialog).getByRole("button", { name: "Tạo & cấu hình tiện ích" }));

    const extensionDialog = await screen.findByRole("dialog", { name: "Tiện ích Chrome · NGINX Chrome" });
    expect(mocks.createAccount).toHaveBeenCalledExactlyOnceWith({
      platformSlug: "nginx-community", name: "NGINX Chrome", username: "forum-user", settings: { delivery: "extension" }, enabled: true,
    });
    expect(mocks.testAccount).not.toHaveBeenCalled();
    expect(within(extensionDialog).getByLabelText("Luồng đăng")).toHaveValue("discourse");
    fireEvent.change(within(extensionDialog).getByLabelText("Trang tạo chủ đề"), { target: { value: "https://community.nginx.org/new-topic?category=projects/nginx" } });
    fireEvent.change(within(extensionDialog).getByLabelText("Tags"), { target: { value: " #NGINX-Open-Source, nginx-open-source " } });
    fireEvent.click(within(extensionDialog).getByRole("switch", { name: "Tự bấm Đăng" }));
    fireEvent.click(within(extensionDialog).getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(mocks.configureExtensionDelivery).toHaveBeenCalledExactlyOnceWith("account-nginx", {
      enabled: true, engine: "discourse", targetUrl: "https://community.nginx.org/new-topic?category=projects%2Fnginx&tags=nginx-open-source", autoSubmit: false,
    }));
  });

  it("loads saved Discourse tags and can clear them while keeping the category", async () => {
    mocks.accounts = [{ ...nginxAccount, status: "CONNECTED", settings: {
      delivery: "extension", extensionEngine: "discourse", extensionAutoSubmit: true,
      extensionTargetUrl: "https://community.nginx.org/new-topic?category=projects%2Fnginx&tags=nginx-open-source",
    } }];
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: /Tiện ích$/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Tags")).toHaveValue("nginx-open-source");
    fireEvent.change(within(dialog).getByLabelText("Tags"), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(mocks.configureExtensionDelivery).toHaveBeenCalledWith("account-nginx", {
      enabled: true, engine: "discourse", targetUrl: "https://community.nginx.org/new-topic?category=projects%2Fnginx", autoSubmit: true,
    }));
  });

  it("creates a dedicated Caddy flow with its own forum URL, category and tags", async () => {
    const platform: Platform = { ...nginxPlatform, id: 'caddy-platform', slug: 'caddy-community', name: 'Caddy Community', defaultSettings: {
      extensionFlowId: 'caddy-community', extensionEngine: 'discourse', extensionForumUrl: 'https://caddy.community', extensionTargetUrl: 'https://caddy.community/new-topic',
    } };
    mocks.platforms = [platform];
    mocks.createAccount.mockResolvedValue({ ...nginxAccount, id: 'caddy-account', name: 'Caddy Chrome', platformId: platform.id, platform, settings: { delivery: 'extension' } });
    render(<AccountsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Kết nối / cấu hình' }));
    expect(screen.getByText('Luồng đăng bằng tiện ích Chrome')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Caddy Community/ }));
    const create = screen.getByRole('dialog');
    expect(within(create).getByLabelText('Phương thức đăng')).toHaveValue('extension');
    expect(within(create).queryByLabelText('API Key')).not.toBeInTheDocument();
    fireEvent.change(within(create).getByLabelText('Tên hiển thị'), { target: { value: 'Caddy Chrome' } });
    fireEvent.click(within(create).getByRole('button', { name: 'Tạo & cấu hình tiện ích' }));
    const flow = await screen.findByRole('dialog', { name: 'Tiện ích Chrome · Caddy Chrome' });
    expect(within(flow).getByLabelText('Trang tạo chủ đề')).toHaveValue('https://caddy.community/new-topic');
    fireEvent.change(within(flow).getByLabelText('Chuyên mục (slug hoặc ID)'), { target: { value: 'help' } });
    fireEvent.change(within(flow).getByLabelText('Tags'), { target: { value: 'reverse-proxy' } });
    fireEvent.click(within(flow).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(mocks.configureExtensionDelivery).toHaveBeenCalledWith('caddy-account', {
      enabled: true, engine: 'discourse', targetUrl: 'https://caddy.community/new-topic?category=help&tags=reverse-proxy', autoSubmit: true,
    }));
  });

  it("still saves and tests API credentials when switching back to the API method", async () => {
    mocks.platforms = [nginxPlatform];
    mocks.testAccount.mockResolvedValue({ ok: true });
    render(<AccountsView />);
    fireEvent.click(screen.getByRole("button", { name: "Kết nối / cấu hình" }));
    fireEvent.click(screen.getByRole("button", { name: /NGINX Community/ }));
    const dialog = screen.getByRole("dialog", { name: "Thêm NGINX Community" });
    fireEvent.change(within(dialog).getByLabelText("Phương thức đăng"), { target: { value: "extension" } });
    fireEvent.change(within(dialog).getByLabelText("Phương thức đăng"), { target: { value: "connector" } });
    expect(within(dialog).getByLabelText("API Key")).toBeRequired();
    fireEvent.change(within(dialog).getByLabelText("Tên hiển thị"), { target: { value: "NGINX API" } });
    fireEvent.change(within(dialog).getByLabelText("API Key"), { target: { value: "api-test-key" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu & kiểm tra" }));
    await waitFor(() => expect(mocks.testAccount).toHaveBeenCalledExactlyOnceWith("account-nginx"));
    expect(mocks.createAccount).toHaveBeenCalledWith(expect.objectContaining({
      name: "NGINX API", credential: { apiKey: "api-test-key" },
      settings: expect.objectContaining({ baseUrl: "https://community.nginx.org", apiUsername: "forum-user", categoryId: "23" }),
    }));
    expect(mocks.configureExtensionDelivery).not.toHaveBeenCalled();
  });

  it.each([
    { slug: 'substack', name: 'Substack', engine: 'substack', url: 'https://writer.substack.com/publish/post', flair: '' },
    { slug: 'reddit', name: 'Reddit', engine: 'reddit', url: 'https://www.reddit.com/r/example/submit', flair: 'Discussion' },
  ])('creates an automatic $name flow with its own destination and options', async ({ slug, name, engine, url, flair }) => {
    const platform: Platform = { ...nginxPlatform, id: `platform-${slug}`, slug, name, mode: 'MANUAL', connectorKey: 'manual', defaultSettings: {
      extensionFlowId: slug, extensionEngine: engine, extensionTargetUrl: '', extensionForumUrl: url,
    } };
    mocks.platforms = [platform];
    mocks.createAccount.mockResolvedValue({ ...nginxAccount, id: 'social-account', name: `${name} Chrome`, platformId: platform.id, platform, settings: { delivery: 'extension' } });
    render(<AccountsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Kết nối / cấu hình' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
    const create = screen.getByRole('dialog');
    expect(within(create).getByLabelText('Phương thức đăng')).toHaveValue('extension');
    expect(within(create).queryByRole('option', { name: 'Bàn giao thủ công' })).not.toBeInTheDocument();
    fireEvent.change(within(create).getByLabelText('Tên hiển thị'), { target: { value: `${name} Chrome` } });
    fireEvent.click(within(create).getByRole('button', { name: 'Tạo & cấu hình tiện ích' }));
    const flow = await screen.findByRole('dialog', { name: `Tiện ích Chrome · ${name} Chrome` });
    expect(within(flow).getByLabelText('Luồng đăng')).toHaveValue(engine);
    expect(within(flow).getByRole('switch', { name: 'Tự bấm Đăng' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.change(within(flow).getByLabelText('Trang tạo chủ đề'), { target: { value: url } });
    if (flair) fireEvent.change(within(flow).getByLabelText('Flair của subreddit'), { target: { value: flair } });
    else expect(within(flow).getByText(/tắt gửi email và app inbox/)).toBeInTheDocument();
    fireEvent.click(within(flow).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(mocks.configureExtensionDelivery).toHaveBeenCalledWith('social-account', {
      enabled: true, engine, targetUrl: url, autoSubmit: true, tags: [], category: '', flair,
    }));
  });

  it("shows paired Chromes and switches a manual forum to extension delivery", async () => {
    render(<AccountsView />);
    expect(screen.getByText("Chrome văn phòng")).toBeInTheDocument();
    expect(screen.getByText("1/1 đang chạy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tiện ích$/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Trang tạo chủ đề"), { target: { value: "https://forum.directadmin.com/forums/general.5/post-thread" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(mocks.configureExtensionDelivery).toHaveBeenCalledWith("7a1c2f9e-3b4d-4e5f-8a6b-7c8d9e0f1a2b", {
      enabled: true, engine: "xenforo", targetUrl: "https://forum.directadmin.com/forums/general.5/post-thread", autoSubmit: true,
    }));
  });

  it("labels accounts already posting through the extension", () => {
    mocks.accounts = [{ ...mocks.accounts[0]!, settings: { delivery: "extension", extensionEngine: "xenforo", extensionTargetUrl: "https://voz.vn/f/a.17/post-thread", extensionAutoSubmit: false } }];
    render(<AccountsView />);
    expect(screen.getByText("Tiện ích Chrome")).toBeInTheDocument();
    expect(screen.getByText(/voz\.vn · chờ bạn bấm Đăng/)).toBeInTheDocument();
  });
});
