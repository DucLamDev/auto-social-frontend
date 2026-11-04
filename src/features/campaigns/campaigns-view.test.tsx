import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignsView } from "./campaigns-view";

const mocks = vi.hoisted(() => ({
  uploadMedia: vi.fn(),
  automateCampaign: vi.fn(),
  push: vi.fn(),
  accountItems: [] as Array<Record<string, unknown>>,
  platformItems: [] as Array<Record<string, unknown>>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  useAccounts: () => ({
    data: { items: mocks.accountItems },
    isPending: false,
    isError: false,
    error: null,
  }),
  useAiProviders: () => ({
    data: [{ id: "deepseek", label: "DeepSeek", model: "deepseek-flash", configured: true, isDefault: true }],
    isPending: false,
    isError: false,
    error: null,
  }),
  useAiImageStatus: () => ({ data: { configured: true, model: "vpsttt-image" }, isPending: false }),
  useCampaigns: () => ({ data: { items: [] }, isPending: false, isError: false, error: null }),
  useContents: () => ({ data: { items: [] }, isPending: false, isError: false, error: null }),
  usePlatforms: () => ({
    data: { items: mocks.platformItems },
    isPending: false,
    isError: false,
    error: null,
  }),
  useVariants: () => ({ data: { items: [] }, isPending: false, isError: false, error: null }),
  useResourceMutation: (mutation: (...args: unknown[]) => unknown) => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => mutation(...args),
  }),
}));

vi.mock("@/services/resources.service", () => ({
  resourcesService: {
    uploadMedia: mocks.uploadMedia,
    automateCampaign: mocks.automateCampaign,
    createCampaign: vi.fn(),
    publishCampaign: vi.fn(),
  },
}));

describe("CampaignsView automation media retries", () => {
  beforeEach(() => {
    mocks.accountItems = [{
      id: "account-devto",
      platformId: "platform-devto",
      platform: { id: "platform-devto", name: "dev.to", slug: "devto", mode: "OFFICIAL_API" },
      name: "DEV Production",
      enabled: true,
      status: "CONNECTED",
    }];
    mocks.platformItems = [{ id: "platform-devto", name: "dev.to", slug: "devto", mode: "OFFICIAL_API", enabled: true, capabilities: {} }];
    mocks.uploadMedia.mockReset()
      .mockResolvedValueOnce({ id: "media-1", type: "IMAGE", storageKey: "media/one", mimeType: "image/webp", sizeBytes: 5, createdAt: "2026-10-09T00:00:00Z" })
      .mockResolvedValueOnce({ id: "media-2", type: "IMAGE", storageKey: "media/two", mimeType: "image/webp", sizeBytes: 5, createdAt: "2026-10-09T00:00:01Z" });
    mocks.automateCampaign.mockReset()
      .mockRejectedValueOnce(new Error("Temporary provider failure"))
      .mockRejectedValueOnce(new Error("Temporary provider failure"))
      .mockResolvedValueOnce({ generatedVariants: 1, jobsCreated: 1, activated: true });
    mocks.push.mockReset();
  });

  it("reuses media and the idempotency key for an unchanged retry, then reuploads after request semantics change", async () => {
    render(<CampaignsView />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo tự động" }));
    const brief = screen.getByLabelText("Mô tả bài đăng");
    const image = new File(["image"], "post.webp", { type: "image/webp" });
    fireEvent.change(brief, { target: { value: "Quảng bá VPS hiệu năng cao cho cộng đồng lập trình viên Việt Nam." } });
    fireEvent.change(screen.getByLabelText("Hoặc dùng ảnh của bạn (tuỳ chọn)"), { target: { files: [image] } });
    fireEvent.change(screen.getByLabelText("Mô tả ảnh / alt text (tuỳ chọn)"), { target: { value: "Dashboard VPS" } });
    const submit = screen.getByRole("button", { name: /Tạo bằng AI chạy ngầm/ });

    fireEvent.click(submit);
    await waitFor(() => expect(mocks.automateCampaign).toHaveBeenCalledTimes(1));
    fireEvent.click(submit);
    await waitFor(() => expect(mocks.automateCampaign).toHaveBeenCalledTimes(2));

    expect(mocks.uploadMedia).toHaveBeenCalledTimes(1);
    expect(mocks.uploadMedia).toHaveBeenCalledWith(image, { altText: "Dashboard VPS" });
    // Your own image replaces AI images.
    expect(mocks.automateCampaign.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ mediaAssetIds: ["media-1"], generateImages: false }));
    expect(mocks.automateCampaign.mock.calls[1]?.[1]).toBe(mocks.automateCampaign.mock.calls[0]?.[1]);

    fireEvent.change(brief, { target: { value: "Quảng bá VPS hiệu năng cao cho startup và đội ngũ kỹ thuật Việt Nam." } });
    fireEvent.click(submit);
    await waitFor(() => expect(mocks.automateCampaign).toHaveBeenCalledTimes(3));

    expect(mocks.uploadMedia).toHaveBeenCalledTimes(2);
    expect(mocks.automateCampaign.mock.calls[2]?.[0]).toEqual(expect.objectContaining({ mediaAssetIds: ["media-2"] }));
    expect(mocks.automateCampaign.mock.calls[2]?.[1]).not.toBe(mocks.automateCampaign.mock.calls[0]?.[1]);
  });

  it("passes a connected Playwright account through to the automated campaign picker", () => {
    mocks.accountItems = [{
      id: "account-voz",
      platformId: "platform-voz",
      platform: { id: "platform-voz", name: "Voz Forums", slug: "voz-forums", mode: "BROWSER_ASSISTED" },
      name: "VOZ Production",
      settings: { browserAutoSubmit: true, automationPermissionAttested: true },
      enabled: true,
      status: "CONNECTED",
    }];
    mocks.platformItems = [{ id: "platform-voz", name: "Voz Forums", slug: "voz-forums", mode: "BROWSER_ASSISTED", enabled: true, capabilities: {} }];

    render(<CampaignsView />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo tự động" }));

    expect(screen.getByRole("checkbox", { name: /VOZ Production/ })).toBeChecked();
    expect(screen.getByText(/Tự động qua Playwright/)).toBeInTheDocument();
  });

  it("opened from the API accounts tab, preselects API accounts even when Chrome accounts were chosen in an import", () => {
    const chrome = (id: string, name: string, selected: boolean) => ({
      id, name, platformId: "platform-voz", platform: { id: "platform-voz", name: "Voz Forums", slug: "voz-forums", mode: "MANUAL" }, enabled: true, status: "CONNECTED",
      settings: { delivery: "extension", extensionEngine: "xenforo", extensionTargetUrl: "https://voz.vn/f/a.17/post-thread", extensionAutoSubmit: true, extensionImport: { selected }, extensionSession: { deviceId: "chrome" } },
    });
    mocks.accountItems = [...mocks.accountItems, chrome("chrome-new", "Chrome chosen", true), chrome("chrome-old", "Chrome old import", false)];
    mocks.platformItems = [...mocks.platformItems, { id: "platform-voz", name: "Voz Forums", slug: "voz-forums", mode: "MANUAL", enabled: true, capabilities: {} }];

    render(<CampaignsView initialAutomationOpen initialChannel="api" />);

    expect(screen.getByRole("checkbox", { name: /DEV Production/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Chrome chosen/ })).not.toBeChecked();
    expect(screen.queryByText("Chrome old import")).not.toBeInTheDocument();
  });

  it("closes the form as soon as the background request is accepted without activating publication", async () => {
    mocks.automateCampaign.mockReset().mockResolvedValue({ campaign: { automationState: "QUEUED" }, generatedVariants: 0, jobsCreated: 0, activated: false });
    render(<CampaignsView initialAutomationOpen />);
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), { target: { value: "Quảng bá VPS hiệu năng cao cho cộng đồng lập trình viên Việt Nam." } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bằng AI chạy ngầm" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.automateCampaign).toHaveBeenCalledWith(expect.objectContaining({ publishImmediately: false, generateImages: true }), expect.any(String));
    // Without the switch, every post waits for one review.
    expect(mocks.automateCampaign.mock.calls[0]?.[0]).not.toHaveProperty("autoPublish");
    expect(screen.getByRole("button", { name: "Tạo tự động" })).toBeEnabled();
  });

  it("asks the backend to publish passing posts on its own when the switch is on", async () => {
    mocks.automateCampaign.mockReset().mockResolvedValue({ campaign: { automationState: "QUEUED" }, generatedVariants: 0, jobsCreated: 0, activated: false });
    render(<CampaignsView initialAutomationOpen />);
    fireEvent.change(screen.getByLabelText("Mô tả bài đăng"), { target: { value: "Quảng bá VPS hiệu năng cao cho cộng đồng lập trình viên Việt Nam." } });
    fireEvent.click(screen.getByRole("switch", { name: "Tự đăng bài AI chấm đạt, không cần duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo bằng AI chạy ngầm" }));
    await waitFor(() => expect(mocks.automateCampaign).toHaveBeenCalledWith(expect.objectContaining({ autoPublish: true, publishImmediately: false }), expect.any(String)));
  });
});
