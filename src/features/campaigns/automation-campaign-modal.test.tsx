import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { AutomationCampaignModal } from "./automation-campaign-modal";

const suggestCampaigns = vi.hoisted(() => vi.fn());
vi.mock("@/services/resources.service", () => ({ resourcesService: { suggestCampaigns } }));

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
  it("requires Pixelfed media before generating or submitting the campaign when AI images are unavailable", async () => {
    const onSubmit = vi.fn();
    const pixelfed: PlatformAccount = { ...accounts[0]!, id: "pixelfed", name: "Pixelfed", settings: { delivery: "extension", extensionEngine: "pixelfed", extensionAutoSubmit: true } };
    render(<AutomationCampaignModal open accounts={[pixelfed]} aiProviders={aiProviders} imageGeneration={{ configured: false, model: "vpsttt-image" }} onClose={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole("switch", { name: "AI tạo ảnh cho kênh cần ảnh" })).toBeDisabled();
    expect(screen.getByText(/Máy chủ chưa bật tạo ảnh bằng VPSTTT AI/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), { target: { value: "Chia sẻ thông tin sản phẩm theo nội dung được cung cấp." } });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));
    await screen.findByText(/Pixelfed cần ảnh/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lets AI create the Pixelfed photo, and can be switched off", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const pixelfed: PlatformAccount = { ...accounts[0]!, id: "pixelfed", name: "Pixelfed", settings: { delivery: "extension", extensionEngine: "pixelfed", extensionAutoSubmit: true } };
    render(<AutomationCampaignModal open accounts={[pixelfed]} aiProviders={aiProviders} imageGeneration={{ configured: true, model: "vpsttt-image" }} onClose={vi.fn()} onSubmit={onSubmit} />);
    const toggle = screen.getByRole("switch", { name: "AI tạo ảnh cho kênh cần ảnh" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), { target: { value: "Chia sẻ thông tin sản phẩm theo nội dung được cung cấp." } });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ generateImages: true })));

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));
    await screen.findByText(/Pixelfed cần ảnh/);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("publishes posts the AI check passed without review only when that switch is turned on", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AutomationCampaignModal open accounts={accounts} aiProviders={aiProviders} onClose={vi.fn()} onSubmit={onSubmit} />);
    const toggle = screen.getByRole("switch", { name: "Tự đăng bài AI chấm đạt, không cần duyệt" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Bạn duyệt một lần")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), { target: { value: "Quảng bá VPS cho lập trình viên Việt Nam, hỗ trợ 24/7." } });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ autoPublish: false })));
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Bài đạt tự duyệt")).toBeInTheDocument();
    expect(screen.getByText(/Bài chưa đạt vẫn chờ bạn duyệt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ autoPublish: true })));
  });

  it("uses your own image instead of AI images", () => {
    render(<AutomationCampaignModal open accounts={accounts} aiProviders={aiProviders} imageGeneration={{ configured: true, model: "vpsttt-image" }} onClose={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Hoặc dùng ảnh của bạn (tuỳ chọn)"), { target: { files: [new File(["image"], "own.png", { type: "image/png" })] } });
    expect(screen.getByRole("switch", { name: "AI tạo ảnh cho kênh cần ảnh" })).toBeDisabled();
    expect(screen.getByText(/ảnh này dùng thay ảnh AI/)).toBeInTheDocument();
  });

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
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      name: "Ra mắt VPS",
      accountIds: ["account-devto", "account-browser-assisted"],
      runMode: "NOW",
      aiProvider: "deepseek",
      confirmAutoPublish: true,
    }));
  });

  it.each([
    { channel: "extension" as const, checked: /Chrome forum/, unchecked: /DEV Production/ },
    { channel: "api" as const, checked: /DEV Production/, unchecked: /Chrome forum/ },
  ])("starting from the $channel accounts tab preselects only that tab's accounts", ({ channel, checked, unchecked }) => {
    const chromeForum: PlatformAccount = {
      ...accounts[0]!, id: "account-chrome", name: "Chrome forum",
      platformId: "platform-voz", platform: { id: "platform-voz", name: "Voz", slug: "voz-forums", mode: "MANUAL" },
      settings: { delivery: "extension", extensionEngine: "xenforo", extensionTargetUrl: "https://voz.vn/f/a.17/post-thread", extensionAutoSubmit: true },
    };
    render(<AutomationCampaignModal open accounts={[...accounts, chromeForum]} channel={channel} aiProviders={aiProviders} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: checked })).toBeChecked();
    // The other tab's accounts stay selectable.
    expect(screen.getByRole("checkbox", { name: unchecked })).not.toBeChecked();
  });

  it("suggests campaigns for the chosen platforms and fills the name and description with the one picked", async () => {
    suggestCampaigns.mockResolvedValue({ suggestions: [{
      name: "Tối ưu NGINX trên VPS nhỏ", brief: "Hướng dẫn tối ưu NGINX trên VPS 2 GB: worker_processes, gzip, cache; gắn VPS NVMe của VPSTTT.",
      angle: "Hướng dẫn", whyEffective: "Giải quyết vấn đề thật của người tự quản trị.", platformFit: "dev.to: bài hướng dẫn; diễn đàn: hỏi kinh nghiệm.",
    }] });
    render(<AutomationCampaignModal open accounts={accounts} aiProviders={aiProviders} onClose={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Gợi ý chiến dịch bằng AI"), { target: { value: "proxy dân cư" } });
    fireEvent.click(screen.getByRole("button", { name: "Gợi ý" }));
    await waitFor(() => expect(suggestCampaigns).toHaveBeenCalledWith({ platformSlugs: ["devto", "assisted-forum"], hint: "proxy dân cư", aiProvider: "deepseek" }));
    fireEvent.click(await screen.findByRole("button", { name: "Dùng gợi ý này" }));
    expect(screen.getByLabelText(/Tên chiến dịch/)).toHaveValue("Tối ưu NGINX trên VPS nhỏ");
    expect(screen.getByLabelText("Mô tả bài đăng")).toHaveValue("Hướng dẫn tối ưu NGINX trên VPS 2 GB: worker_processes, gzip, cache; gắn VPS NVMe của VPSTTT.");
    // Ideas were made for these two socials: changing the selection hides them until asked again.
    fireEvent.click(screen.getByRole("checkbox", { name: /Browser-assisted destination/ }));
    expect(screen.queryByRole("button", { name: /Dùng gợi ý này|Đang dùng gợi ý này/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Danh sách social đã đổi/)).toBeInTheDocument();
  });

  it("uses the named publish button as the single submission action", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("checkbox", { name: /Tôi xác nhận/ })).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));

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

    expect(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ })).toBeDisabled();
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
    fireEvent.change(screen.getByLabelText("Hoặc dùng ảnh của bạn (tuỳ chọn)"), { target: { files: [image] } });
    fireEvent.change(screen.getByLabelText("Mô tả ảnh / alt text (tuỳ chọn)"), { target: { value: "Dashboard VPS" } });
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), {
      target: { value: "Quảng bá VPS cho lập trình viên bằng hình ảnh dashboard thực tế." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      name: "",
      image,
      imageAltText: "Dashboard VPS",
    }));
  });

  it("preselects and enforces at most 50 distinct destination platforms", async () => {
    const destinations: PlatformAccount[] = Array.from({ length: 51 }, (_, index) => ({
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

    expect(screen.getByText("Đã chọn 50/50 nền tảng; có thể chọn nhiều tài khoản cùng nền tảng.")).toBeInTheDocument();
    const thirteenth = screen.getByRole("checkbox", { name: /Destination 50/ });
    expect(thirteenth).not.toBeChecked();
    fireEvent.click(thirteenth);
    expect(thirteenth).not.toBeChecked();
    expect(await screen.findByText(/Tối đa 50 nền tảng khác nhau mỗi lần/)).toBeInTheDocument();
  });

  it("shows in each account card's corner how many posts that account has published", () => {
    const counted = [{ ...accounts[0]!, publishedCount: 12 }, { ...accounts[0]!, id: "devto-2", name: "DEV Second", publishedCount: 0 }];
    render(<AutomationCampaignModal open accounts={counted} aiProviders={aiProviders} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Đã đăng 12 bài")).toHaveTextContent("12");
    expect(screen.getByLabelText("Đã đăng 12 bài")).toHaveAttribute("title", "Đã đăng 12 bài bằng tài khoản này");
    expect(screen.getByLabelText("Đã đăng 0 bài")).toHaveTextContent("0");
    expect(screen.getByText(/Số ở góc phải mỗi thẻ là số bài đã đăng/)).toBeInTheDocument();
  });

  it("shows no count when the server does not send one (older backend)", () => {
    render(<AutomationCampaignModal open accounts={[accounts[0]!]} aiProviders={aiProviders} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/Đã đăng \d+ bài/)).not.toBeInTheDocument();
  });
});

