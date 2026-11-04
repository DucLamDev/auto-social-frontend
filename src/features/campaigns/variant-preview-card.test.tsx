import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/errors";
import { VariantPreviewCard } from "./variant-preview-card";

const mocks = vi.hoisted(() => ({ preview: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({ useMedia: () => ({ data: { items: [] } }) }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { previewVariant: mocks.preview } }));

describe("variant preview card", () => {
  it("says the server needs updating when it has no preview route yet", async () => {
    mocks.preview.mockRejectedValue(new ApiError("Cannot POST /api/v1/content-variants/x/preview", "HTTP_ERROR", 404));
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <VariantPreviewCard variant={{ id: "x", contentId: "c", platform: "Bluesky", platformSlug: "bluesky", body: "Body", status: "GENERATED" }} />
    </QueryClientProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Cập nhật backend lên bản 1.10.0");
    expect(screen.queryByText(/Cannot POST/)).not.toBeInTheDocument();
  });

  it("says where the post goes and in which language, as the account is set up", async () => {
    mocks.preview.mockResolvedValue({ title: "Proxy or VPS?", body: "Body", format: "markdown", appearance: "markdown", tags: [], group: "COMMUNITY", engine: "lemmy", maxChars: null, length: 4, overLimit: false, destination: { community: "Technology", language: "en" } });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <VariantPreviewCard variant={{ id: "y", contentId: "c", platform: "Lemmy.World", platformSlug: "lemmy-world", title: "Proxy or VPS?", body: "Body", status: "GENERATED" }} />
    </QueryClientProvider>);
    expect(await screen.findByText(/Đăng vào/)).toHaveTextContent("Đăng vào Technology · Ngôn ngữ bài: English");
  });
});
