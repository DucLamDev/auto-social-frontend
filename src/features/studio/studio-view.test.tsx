import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiProviderOption } from "@/types/domain";
import { StudioView } from "./studio-view";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  providerRefetch: vi.fn(),
  contentRefetch: vi.fn(),
  variantsRefetch: vi.fn(),
  useAiProviders: vi.fn(),
  variants: [] as Array<Record<string, unknown>>,
  preview: vi.fn(),
  roles: null as null | Record<string, unknown>,
  requestApproval: vi.fn(),
  approve: vi.fn(),
  callThrough: false,
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { previewVariant: mocks.preview, requestVariantApproval: mocks.requestApproval, approveVariant: mocks.approve } }));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  useAccounts: () => ({ data: { items: [] }, isPending: false, isError: false }),
  useAiProviders: mocks.useAiProviders,
  useAiRoles: () => ({ data: mocks.roles }),
  useContent: () => ({
    data: {
      id: "content-1",
      title: "Canonical content",
      body: "Body",
      status: "DRAFT",
      createdAt: "2026-10-09T00:00:00.000Z",
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.contentRefetch,
  }),
  useMedia: () => ({ data: { items: [] }, isPending: false, isError: false }),
  usePlatforms: () => ({ data: { items: [] }, isPending: false, isError: false }),
  // callThrough: run the mutation itself, to see which service it calls.
  useResourceMutation: (fn: (...args: unknown[]) => unknown) => ({ isPending: false, mutateAsync: (...args: unknown[]) => mocks.callThrough ? fn(...args) : mocks.mutateAsync(...args) }),
  useVariants: () => ({
    data: { items: mocks.variants },
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.variantsRefetch,
  }),
}));

const providers: AiProviderOption[] = [
  { id: "openai", label: "OpenAI", model: "gpt-5-mini", configured: true, isDefault: true },
  { id: "deepseek", label: "DeepSeek", model: "deepseek-flash", configured: true, isDefault: false },
  { id: "gemini", label: "Gemini", model: "gemini-3.8-flash", configured: false, isDefault: false },
];

function providerQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: providers,
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.providerRefetch,
    ...overrides,
  };
}

describe("StudioView AI provider state", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue([]);
    mocks.providerRefetch.mockReset();
    mocks.contentRefetch.mockReset();
    mocks.variantsRefetch.mockReset();
    mocks.useAiProviders.mockReset().mockReturnValue(providerQuery());
    mocks.variants = [];
  });

  it("keeps the provider area visible while the catalog is loading", () => {
    mocks.useAiProviders.mockReturnValue(providerQuery({ data: undefined, isPending: true }));

    render(<StudioView contentId="content-1" />);

    expect(screen.getByText("Chọn AI tạo nội dung")).toBeInTheDocument();
    expect(screen.getByText("Đang tải cấu hình AI…")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "OpenAI (chưa cấu hình)" })).toBeDisabled();
    for (const generateButton of screen.getAllByRole("button", { name: /Tạo bằng AI/i })) {
      expect(generateButton).toBeDisabled();
    }
  });

  it("surfaces a provider-catalog error and lets the user retry", () => {
    mocks.useAiProviders.mockReturnValue(providerQuery({
      data: undefined,
      isError: true,
      error: new Error("Provider catalog unavailable"),
    }));

    render(<StudioView contentId="content-1" />);

    expect(screen.getByText("Provider catalog unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.providerRefetch).toHaveBeenCalledOnce();
  });

  it("does not keep a stale provider selection enabled after it becomes unconfigured", () => {
    const { rerender } = render(<StudioView contentId="content-1" />);
    fireEvent.click(screen.getByRole("radio", { name: "DeepSeek" }));
    expect(screen.getByRole("radio", { name: "DeepSeek" })).toHaveAttribute("aria-checked", "true");

    mocks.useAiProviders.mockReturnValue(providerQuery({
      data: providers.map((provider) => ({ ...provider, configured: false, isDefault: false })),
    }));
    rerender(<StudioView contentId="content-1" />);

    for (const provider of providers) {
      const option = screen.getByRole("radio", { name: `${provider.label} (chưa cấu hình)` });
      expect(option).toBeDisabled();
      expect(option).toHaveAttribute("aria-checked", "false");
    }
    for (const generateButton of screen.getAllByRole("button", { name: /Tạo bằng AI/i })) {
      expect(generateButton).toBeDisabled();
      fireEvent.click(generateButton);
    }
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows every provider, disables Gemini, and sends the selected provider", async () => {
    render(<StudioView contentId="content-1" />);

    expect(screen.getByRole("radio", { name: "OpenAI" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "DeepSeek" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Gemini (chưa cấu hình)" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "DeepSeek" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Tạo bằng AI" })[0]!);

    expect(mocks.mutateAsync).toHaveBeenCalledWith("deepseek");
  });

  it("links back to the library it was opened from", () => {
    render(<StudioView contentId="content-1" />);

    expect(screen.getByText("Thư viện nội dung")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thư viện" })).toHaveAttribute("href", "/contents");
  });
});

describe("StudioView platform preview", () => {
  it("previews a variant as its platform shows it, including unsaved edits", async () => {
    mocks.useAiProviders.mockReturnValue(providerQuery());
    mocks.variants = [{ id: "variant-1", contentId: "content-1", platform: "Mastodon", platformSlug: "mastodon", title: null, body: "Saved body", status: "GENERATED", updatedAt: "2026-11-04T00:00:00Z" }];
    mocks.preview.mockReset().mockResolvedValue({ title: "", body: "Edited body #VPS", format: "plain", tags: [], group: "SOCIAL", engine: "mastodon", maxChars: 500, length: 16, overLimit: false });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><StudioView contentId="content-1" /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Nội dung biến thể"), { target: { value: "Edited body #VPS" } });
    fireEvent.click(screen.getByRole("tab", { name: "Xem trước" }));
    expect(await screen.findByText("#VPS")).toBeInTheDocument();
    expect(screen.getByText(/16\/500 ký tự/)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(mocks.preview).toHaveBeenLastCalledWith("variant-1", { title: "", body: "Edited body #VPS" });
    fireEvent.click(screen.getByRole("tab", { name: "Sửa" }));
    expect(screen.getByLabelText("Nội dung biến thể")).toHaveValue("Edited body #VPS");
  });
});

describe("StudioView final AI approval", () => {
  const roles = {
    reviewer: { provider: "vpsttt", model: "claude:sonnet", label: "Claude Sonnet", configured: true },
    approver: { provider: "vpsttt", model: "claude:opus", label: "Claude Opus", configured: true },
    approvalEnabled: true,
  };
  const variant = (aiApproval: Record<string, unknown> | null, aiApprovalCurrent?: boolean) => ({ id: "variant-1", contentId: "content-1", platform: "Mastodon", platformSlug: "mastodon", title: null, body: "Saved body", status: "GENERATED", updatedAt: "2026-11-06T00:00:00Z", aiApproval, aiApprovalCurrent });
  const verdict = (status: string, extra: Record<string, unknown> = {}) => ({ status, approver: "vpsttt:claude:opus", approverLabel: "Claude Opus", startedAt: new Date().toISOString(), ...extra });

  beforeEach(() => {
    mocks.useAiProviders.mockReset().mockReturnValue(providerQuery());
    mocks.mutateAsync.mockReset().mockResolvedValue({});
    mocks.requestApproval.mockReset().mockResolvedValue({ status: "running" });
    mocks.roles = roles;
    mocks.callThrough = false;
  });

  it("keeps \"Duyệt\" off for a post the approver refused, and shows why", () => {
    mocks.variants = [variant(verdict("rejected", { reasons: ["Seeding vụng"], seeding: true }), true)];
    render(<StudioView contentId="content-1" />);
    expect(screen.getByText("Opus: Từ chối")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeDisabled();
    expect(screen.getByText("Claude Opus từ chối bài này. Sửa bài hoặc viết lại bằng AI; bài mới được duyệt lại tự động.")).toBeInTheDocument();
    const box = screen.getByRole("region", { name: "AI duyệt cuối · Mastodon" });
    expect(box).toHaveTextContent("Seeding vụng");
    expect(box).toHaveTextContent("Có dấu hiệu seeding");
    expect(box).toHaveTextContent("Sửa bài rồi bấm “Lưu”");
    expect(screen.queryByRole("button", { name: /Cho AI duyệt lại/ })).not.toBeInTheDocument();
  });

  it("asks the approver again for a failed post and approves only a post it passed", async () => {
    mocks.variants = [variant(verdict("failed"), true)];
    mocks.callThrough = true;
    const { rerender } = render(<StudioView contentId="content-1" />);
    expect(screen.getByText("Opus lỗi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cho AI duyệt lại bài Mastodon" }));
    await waitFor(() => expect(mocks.requestApproval).toHaveBeenCalledWith("variant-1"));
    mocks.variants = [variant(verdict("approved"), true)];
    rerender(<StudioView contentId="content-1" />);
    expect(screen.getByText("Opus: Đạt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeEnabled();
    // An unsaved edit is not what the approver read.
    fireEvent.change(screen.getByLabelText("Nội dung biến thể"), { target: { value: "Edited body" } });
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeDisabled();
    expect(screen.getByText("Lưu bài để AI duyệt cuối đọc lại; duyệt được khi có kết quả mới.")).toBeInTheDocument();
  });

  it("does not gate approval on backends without AI roles", () => {
    mocks.roles = null;
    mocks.variants = [variant(verdict("rejected"), true)];
    render(<StudioView contentId="content-1" />);
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeEnabled();
    expect(screen.queryByText(/Opus/)).not.toBeInTheDocument();
  });
});
