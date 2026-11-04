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
});
