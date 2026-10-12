import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { AutomationCampaignModal } from "./automation-campaign-modal";

const aiProviders = [
  { id: "openai" as const, label: "OpenAI", model: "gpt-5-mini", configured: false, isDefault: false },
  { id: "deepseek" as const, label: "DeepSeek", model: "deepseek-flash", configured: true, isDefault: true },
  { id: "gemini" as const, label: "Google Gemini", model: "gemini-3.8-flash", configured: false, isDefault: false },
];

const accounts: PlatformAccount[] = [
  {
    id: "account-devto",
    platformId: "platform-devto",
    platform: { id: "platform-devto", name: "dev.to", slug: "devto", mode: "OFFICIAL_API" },
    name: "DEV Production",
    username: "duclamdev",
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-browser-assisted",
    platformId: "platform-browser-assisted",
    platform: { id: "platform-browser-assisted", name: "Assisted forum", slug: "assisted-forum", mode: "BROWSER_ASSISTED" },
    name: "Browser-assisted destination",
    settings: { browserAutoSubmit: true, automationPermissionAttested: true },
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-manual",
    platformId: "platform-manual",
    platform: { id: "platform-manual", name: "Manual forum", slug: "manual-forum", mode: "MANUAL" },
    name: "Manual destination",
    enabled: true,
    status: "CONNECTED",
  },
  {
    id: "account-disabled",
    platformId: "platform-discourse",
    platform: { id: "platform-discourse", name: "Discourse", slug: "discourse", mode: "COMPATIBLE_API" },
    name: "Disabled forum",
    enabled: false,
    status: "CONNECTED",
  },
];

describe("AutomationCampaignModal", () => {
  it("keeps an automation failure visible so the user can switch provider and retry", () => {
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={aiProviders}
      submitError="Google Gemini đang quá tải. Mã yêu cầu: request-123."
      onClose={vi.fn()}
      onSubmit={vi.fn()}
    />);

    expect(screen.getByRole("alert")).toHaveTextContent("Chưa thể tạo và đăng chiến dịch");
    expect(screen.getByRole("alert")).toHaveTextContent("request-123");
    expect(screen.getByLabelText("Nhà cung cấp AI")).toBeEnabled();
  });

  it("preselects connected enabled accounts and submits the one-step AI flow", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={aiProviders}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    expect(screen.getByRole("checkbox", { name: /DEV Production/ })).toBeChecked();
    expect(screen.queryByText("Disabled forum")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Manual destination/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Manual destination:/)).toBeInTheDocument();
    expect(screen.getByText(/chỉ hỗ trợ bàn giao thủ công/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Browser-assisted destination/ })).toBeChecked();
    expect(screen.getByText(/Tự động qua Playwright/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nhà cung cấp AI")).toHaveValue("deepseek");
    expect(screen.getByRole("option", { name: /Google Gemini/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Tên chiến dịch/), { target: { value: "Ra mắt VPS" } });
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), {
      target: { value: "Quảng bá gói VPS tốc độ cao cho lập trình viên với ưu đãi tháng đầu." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Tôi xác nhận cho phép tự động đăng bài thật/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      name: "Ra mắt VPS",
      accountIds: ["account-devto", "account-browser-assisted"],
      runMode: "NOW",
      aiProvider: "deepseek",
      confirmAutoPublish: true,
    }));
  });

  it("requires explicit consent before posting externally", async () => {
    const onSubmit = vi.fn();
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={aiProviders}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    fireEvent.change(screen.getByLabelText(/Tên chiến dịch/), { target: { value: "Ra mắt VPS" } });
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), {
      target: { value: "Quảng bá gói VPS tốc độ cao cho lập trình viên với ưu đãi tháng đầu." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    expect(await screen.findByText("Bạn cần xác nhận trước khi hệ thống đăng bài thật.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows the user to select another configured provider", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const providersWithGemini = aiProviders.map((provider) => provider.id === "gemini"
      ? { ...provider, configured: true }
      : provider);
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={providersWithGemini}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    fireEvent.change(screen.getByLabelText("Nhà cung cấp AI"), { target: { value: "gemini" } });
    fireEvent.change(screen.getByLabelText(/Tên chiến dịch/), { target: { value: "Gemini campaign" } });
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), {
      target: { value: "Mô tả chiến dịch đủ chi tiết để tạo nội dung tự động cho các kênh." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Tôi xác nhận cho phép tự động đăng bài thật/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ aiProvider: "gemini" }));
  });

  it("does not allow automation when no provider is configured", () => {
    const onSubmit = vi.fn();
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={aiProviders.map((provider) => ({ ...provider, configured: false, isDefault: false }))}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    expect(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("explains why a Playwright account is excluded until its session and auto-submit are ready", () => {
    const reconnectRequired: PlatformAccount = {
      ...accounts[1]!,
      id: "account-browser-reconnect",
      name: "VOZ cần đăng nhập lại",
      status: "RECONNECT_REQUIRED",
    };
    const autoSubmitOff: PlatformAccount = {
      ...accounts[1]!,
      id: "account-browser-paused",
      name: "VOZ đang tạm dừng",
      settings: { browserAutoSubmit: false, automationPermissionAttested: true },
    };
    render(<AutomationCampaignModal
      open
      accounts={[...accounts, reconnectRequired, autoSubmitOff]}
      aiProviders={aiProviders}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
    />);

    expect(screen.queryByRole("checkbox", { name: /VOZ cần đăng nhập lại/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /VOZ đang tạm dừng/ })).not.toBeInTheDocument();
    expect(screen.getByText(/VOZ cần đăng nhập lại:/)).toBeInTheDocument();
    expect(screen.getByText(/Session Playwright chưa sẵn sàng/)).toBeInTheDocument();
    expect(screen.getByText(/Chưa bật tự bấm nút đăng cuối cùng/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mở Tài khoản/ })).toHaveAttribute("href", "/accounts");
  });

  it("accepts an optional supported image and alt text while leaving the campaign name empty", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AutomationCampaignModal
      open
      accounts={accounts}
      aiProviders={aiProviders}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);
    const image = new File(["image"], "dashboard.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Ảnh minh hoạ (tuỳ chọn)"), { target: { files: [image] } });
    fireEvent.change(screen.getByLabelText("Mô tả ảnh / alt text (tuỳ chọn)"), { target: { value: "Dashboard VPS" } });
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), {
      target: { value: "Quảng bá VPS cho lập trình viên bằng hình ảnh dashboard thực tế." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Tôi xác nhận cho phép tự động đăng bài thật/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI & đăng ngay/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      name: "",
      image,
      imageAltText: "Dashboard VPS",
    }));
  });

  it("preselects and enforces at most 12 distinct destination platforms", async () => {
    const destinations: PlatformAccount[] = Array.from({ length: 13 }, (_, index) => ({
      id: `account-${index}`,
      platformId: `platform-${index}`,
      platform: { id: `platform-${index}`, name: `Platform ${index}`, slug: `platform-${index}`, mode: "OFFICIAL_API" },
      name: `Destination ${index}`,
      enabled: true,
      status: "CONNECTED",
    }));
    render(<AutomationCampaignModal
      open
      accounts={destinations}
      aiProviders={aiProviders}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
    />);

    expect(screen.getByText("Đã chọn 12/12 nền tảng; có thể chọn nhiều tài khoản cùng nền tảng.")).toBeInTheDocument();
    const thirteenth = screen.getByRole("checkbox", { name: /Destination 12/ });
    expect(thirteenth).not.toBeChecked();
    fireEvent.click(thirteenth);
    expect(thirteenth).not.toBeChecked();
    expect(await screen.findByText(/Tối đa 12 nền tảng khác nhau mỗi lần/)).toBeInTheDocument();
  });
});
