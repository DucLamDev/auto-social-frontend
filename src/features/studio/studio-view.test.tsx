import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiProviderOption } from "@/types/domain";
import { StudioView } from "./studio-view";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  providerRefetch: vi.fn(),
  contentRefetch: vi.fn(),
  variantsRefetch: vi.fn(),
  useAiProviders: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  useAccounts: () => ({ data: { items: [] }, isPending: false, isError: false }),
  useAiProviders: mocks.useAiProviders,
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
  useResourceMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
  useVariants: () => ({
    data: { items: [] },
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

  it("shows the provider choice before a content is selected", () => {
    render(<StudioView />);

    expect(screen.getByText("Chọn AI tạo nội dung")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "OpenAI" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "DeepSeek" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gemini (chưa cấu hình)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở thư viện" })).toBeInTheDocument();
  });
});
