import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentVariant, MediaAsset } from "@/types/domain";
import { VariantImagePanel } from "./variant-image-panel";

const mocks = vi.hoisted(() => ({
  media: [] as MediaAsset[], pending: false, error: false,
  regenerate: vi.fn(), remove: vi.fn(), upload: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ data: { role: "EDITOR" } }) }));
vi.mock("@/hooks/use-resources", () => ({
  useMedia: () => ({ data: { items: mocks.media }, isPending: mocks.pending, isError: mocks.error, refetch: vi.fn() }),
  useAiImageStatus: () => ({ data: { configured: true, model: "vpsttt-image", provider: "vpsttt" } }),
  useResourceMutation: (fn: (...args: unknown[]) => unknown) => ({ mutateAsync: (...args: unknown[]) => fn(...args), isPending: false }),
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { regenerateVariantImage: mocks.regenerate, removeVariantImage: mocks.remove, uploadMedia: mocks.upload } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const variant = (image: ContentVariant["image"]): ContentVariant => ({ id: "variant-1", contentId: "content-1", platform: "Bluesky", platformSlug: "bluesky", body: "Bài viết", status: "GENERATED", image });
const asset: MediaAsset = { id: "media-1", variantId: "variant-1", type: "IMAGE", storageKey: "media/a.png", publicUrl: "https://cdn.example/a.png", mimeType: "image/png", sizeBytes: 10, altText: "Máy chủ VPS", generated: true, createdAt: "2026-11-03T00:00:00Z" };

describe("image of a post under review", () => {
  beforeEach(() => {
    mocks.media = []; mocks.pending = false; mocks.error = false;
    mocks.regenerate.mockReset().mockResolvedValue({ status: "generating" });
    mocks.remove.mockReset().mockResolvedValue({ removed: true });
    mocks.upload.mockReset().mockResolvedValue({ ...asset, id: "media-2", generated: false });
  });

  it("says a text-only destination posts without an image", () => {
    render(<VariantImagePanel variant={variant({ type: "none" })} editable />);
    expect(screen.getByText("Kênh này chỉ đăng chữ, không kèm ảnh.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tạo lại ảnh/ })).not.toBeInTheDocument();
  });

  it("shows the AI image with its description and regenerates from an edited prompt", async () => {
    mocks.media = [asset];
    render(<VariantImagePanel variant={variant({ type: "image", prompt: "A calm server room", altText: "Máy chủ VPS", status: "generated" })} editable />);
    expect(screen.getByRole("img", { name: "Máy chủ VPS" })).toHaveAttribute("src", "https://cdn.example/a.png");
    expect(screen.getByText("Ảnh do AI tạo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tạo lại ảnh/ }));
    const prompt = screen.getByLabelText(/Mô tả ảnh cho AI/);
    expect(prompt).toHaveValue("A calm server room");
    fireEvent.change(prompt, { target: { value: "A bright data centre" } });
    fireEvent.click(screen.getByRole("button", { name: /Tạo ảnh mới/ }));
    await waitFor(() => expect(mocks.regenerate).toHaveBeenCalledWith("variant-1", "A bright data centre"));
  });

  it("shows progress while generating, and the reason when it failed", () => {
    const { rerender } = render(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "generating" })} editable />);
    expect(screen.getByRole("status")).toHaveTextContent("VPSTTT AI đang tạo ảnh");
    expect(screen.getByRole("button", { name: /Tạo lại ảnh/ })).toBeDisabled();
    // A post just written whose image is next in line shows the same progress.
    rerender(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "pending" })} editable />);
    expect(screen.getByRole("status")).toHaveTextContent("đang tạo ảnh");
    rerender(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "failed", error: "Key VPSTTT AI chưa có quyền tạo ảnh." })} editable />);
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa tạo được ảnh: Key VPSTTT AI chưa có quyền tạo ảnh.");
  });

  it("removes the image, or replaces it with an uploaded one", async () => {
    mocks.media = [asset];
    render(<VariantImagePanel variant={variant({ type: "image", prompt: "p", altText: "Máy chủ VPS", status: "generated" })} editable />);
    fireEvent.click(screen.getByRole("button", { name: /Bỏ ảnh/ }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("variant-1", "media-1"));
    const file = new File(["x"], "own.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Chọn ảnh khác cho Bluesky"), { target: { files: [file] } });
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith(file, { variantId: "variant-1", altText: "Máy chủ VPS" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenLastCalledWith("variant-1", "media-1"));
  });

  it("keeps the loaded image when a refresh fails, and reports a failure with nothing to show", () => {
    mocks.media = [asset]; mocks.error = true;
    const { rerender } = render(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "generated" })} editable />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    mocks.media = [];
    rerender(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "generated" })} editable />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được ảnh của bài.");
  });

  it("offers no actions once the post is no longer editable", () => {
    mocks.media = [asset];
    render(<VariantImagePanel variant={variant({ type: "image", prompt: "p", status: "generated" })} editable={false} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
