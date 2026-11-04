import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AiContentView } from "./ai-content-view";

const mocks = vi.hoisted(() => ({

  role: "ADMIN", review: vi.fn(), reviewExisting: vi.fn(), update: vi.fn(), preview: vi.fn(), reviewVariant: vi.fn(), variantStatus: "GENERATED", state: "WAITING_REVIEW", ids: ["variant-1"], mode: "AUTOMATION", multipleVersions: false, secondAccount: false,

  review: vi.fn(), reviewExisting: vi.fn(), update: vi.fn(), preview: vi.fn(), reviewVariant: vi.fn(), variantStatus: "GENERATED", image: null as null | { type: string; status: string }, state: "WAITING_REVIEW", ids: ["variant-1"], mode: "AUTOMATION", multipleVersions: false, secondAccount: false,

}));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ data: { role: mocks.role } }) }));
vi.mock("@/hooks/use-resources", () => ({
  useAiCampaigns: () => ({ data: { items: [{ id: "campaign-1", name: "Launch", reviewMode: mocks.mode, status: "DRAFT", content: { id: "content-1" }, automationState: mocks.state, automationVariantIds: mocks.ids, automationAccountIds: mocks.secondAccount ? ["account-1", "account-2"] : ["account-1"], createdAt: "2026-11-02T00:00:00Z" }] } }),
  useAccounts: () => ({ data: { items: [{ id: "account-1", name: "DEV account", enabled: true, status: "CONNECTED", platform: { slug: "devto", name: "DEV", mode: "OFFICIAL_API" } },
    ...(mocks.secondAccount ? [{ id: "account-2", name: "Tumblr vpsttt", enabled: true, status: "CONNECTED", platform: { slug: "tumblr", name: "Tumblr", mode: "OFFICIAL_API" } }] : [])] } }),
  useVariants: () => ({ data: { items: [{ id: "variant-1", platform: "DEV", platformSlug: "devto", title: "Original title", body: "Original body", status: mocks.variantStatus, image: mocks.image }, ...(mocks.multipleVersions ? [{ id: "variant-2", platform: "DEV", platformSlug: "devto", title: "Older version", body: "Older body", status: "APPROVED" }] : [])] } }),
  useMedia: () => ({ data: { items: [] } }),
  useAiImageStatus: () => ({ data: { configured: true, model: "vpsttt-image", provider: "vpsttt" } }),
  useResourceMutation: (fn: (...args: unknown[]) => unknown) => ({ mutateAsync: (...args: unknown[]) => fn(...args), isPending: false }),
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { reviewAiCampaign: mocks.review, updateVariant: mocks.update, reviewExistingContent: mocks.reviewExisting, previewVariant: mocks.preview, reviewAiVariant: mocks.reviewVariant } }));

describe("AI content waiting for review", () => {
  beforeEach(() => {
    mocks.role = "ADMIN";
    mocks.state = "WAITING_REVIEW";
    mocks.mode = "AUTOMATION";
    mocks.multipleVersions = false;
    mocks.secondAccount = false;
    mocks.ids = ["variant-1"];
    mocks.review.mockReset().mockResolvedValue({});
    mocks.reviewExisting.mockReset().mockResolvedValue({});
    mocks.update.mockReset().mockResolvedValue({});
    mocks.reviewVariant.mockReset().mockResolvedValue({});
    mocks.variantStatus = "GENERATED";
    mocks.image = null;
    mocks.preview.mockReset().mockResolvedValue({ title: "Original title", body: "Original body #vps", format: "markdown", tags: ["vps"], group: "DEVELOPER", engine: "devto", maxChars: null, length: 18, overLimit: false });
  });

  it("shows old campaign variants without offering duplicate approval or editing a referenced post", () => {
    mocks.mode = "EXISTING_CAMPAIGN";
    mocks.state = "APPROVED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Duyệt đăng ngay" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tiếp tục đăng" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tiến độ đăng" })).toBeInTheDocument();
  });

  it("requires account selection to publish an existing Studio variant through the content endpoint", async () => {
    mocks.mode = "CONTENT";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    expect(screen.getByRole("button", { name: "Duyệt đăng ngay" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /DEV account/ }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt đăng ngay" }));
    await waitFor(() => expect(mocks.reviewExisting).toHaveBeenCalledWith("content-1", { variantIds: ["variant-1"], platformAccountIds: ["account-1"], publishMode: "NOW" }));
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("shows every saved version and publishes only the version selected for that platform", async () => {
    mocks.mode = "CONTENT";
    mocks.multipleVersions = true;
    mocks.ids = ["variant-1", "variant-2"];
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    expect(screen.getByDisplayValue("Original body")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Older body")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Older version/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /DEV account/ }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt đăng ngay" }));
    await waitFor(() => expect(mocks.reviewExisting).toHaveBeenCalledWith("content-1", { variantIds: ["variant-2"], platformAccountIds: ["account-1"], publishMode: "NOW" }));
  });

  it("updates from generating to reviewable content as the live query changes", () => {
    mocks.state = "PROCESSING";
    mocks.ids = [];
    const { rerender } = render(<AiContentView />);
    expect(screen.getByText(/AI đang tạo nội dung/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Review|Xem \d+ kênh/ })).not.toBeInTheDocument();
    mocks.state = "WAITING_REVIEW";
    mocks.ids = ["variant-1"];
    rerender(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("saves unsaved edits as part of approving, so publishing needs no separate save", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited body" } });
    expect(screen.getAllByText("Duyệt sẽ lưu luôn phần bạn đã sửa.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith("campaign-1", "approve", { publishMode: "NOW" }));
    expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Edited body" });
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.review.mock.invocationCallOrder[0]!);
  });

  it("saves the edit of one post when approving that post alone, and refuses an emptied post", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "   " } });
    expect(within(card).getByRole("button", { name: "Duyệt & đăng bài này" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited one" } });
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài này" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" }));
    expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Edited one" });
  });

  it("requires a future schedule and sends it as an explicit timestamp", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Hẹn lịch bài còn chờ" }));
    const input = screen.getByLabelText("Ngày giờ đăng (giờ địa phương)");
    fireEvent.change(input, { target: { value: "2000-01-01T12:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Duyệt & hẹn lịch" }));
    expect(mocks.review).not.toHaveBeenCalled();
    const date = `${new Date().getFullYear() + 1}-11-02T12:00`;
    fireEvent.change(input, { target: { value: date } });
    fireEvent.click(screen.getByRole("button", { name: "Duyệt & hẹn lịch" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith("campaign-1", "approve", { publishMode: "SCHEDULED", scheduledAt: new Date(date).toISOString() }));
  });

  it("lists which platforms are written while the AI works and opens the finished ones for review", async () => {
    mocks.state = "PROCESSING";
    mocks.secondAccount = true;
    render(<AiContentView />);
    const progress = screen.getByLabelText("Tiến độ tạo nội dung theo kênh");
    expect(progress).toHaveTextContent("Đã tạo 1/2 kênh");
    expect(screen.getByRole("progressbar", { name: "Số kênh đã tạo" })).toHaveAttribute("aria-valuenow", "1");
    expect(within(progress).getByText("DEV").closest("li")).toHaveTextContent("Đã tạo");
    expect(within(progress).getByText("Tumblr").closest("li")).toHaveTextContent("AI đang viết…");
    fireEvent.click(screen.getByRole("button", { name: "Xem 1 kênh đã tạo" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited early" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉnh sửa" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Edited early" }));
    // The finished platform is approved and published without waiting for the others.
    expect(screen.getByText(/Kênh nào xong \(kèm ảnh\) là duyệt và đăng được ngay/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Từ chối bài còn chờ" })).toBeEnabled();
    fireEvent.click(within(screen.getByRole("group", { name: "Duyệt bài DEV" })).getByRole("button", { name: "Duyệt & đăng bài này" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" }));
  });

  it("waits for a post's image before it can be approved", () => {
    mocks.image = { type: "image", status: "generating" };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    expect(within(card).getByRole("button", { name: "Duyệt & đăng bài này" })).toBeDisabled();
    expect(within(card).getByText("Đang tạo ảnh cho bài này; duyệt được ngay khi ảnh xong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
    expect(within(card).getByRole("button", { name: "Từ chối bài này" })).toBeEnabled();
  });

  it("shows the platforms still missing after a failed run", () => {
    mocks.state = "FAILED";
    mocks.secondAccount = true;
    render(<AiContentView />);
    const progress = screen.getByLabelText("Tiến độ tạo nội dung theo kênh");
    expect(within(progress).getByText("Tumblr").closest("li")).toHaveTextContent("Chưa tạo được");
    expect(within(progress).getByText("DEV").closest("li")).toHaveTextContent("Đã tạo");
  });

  it("keeps the approval buttons in a bar that stays visible and previews each post as its platform shows it", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiContentView /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const bar = screen.getByRole("region", { name: "Duyệt nội dung" });
    expect(bar).toHaveClass("sticky");
    expect(within(bar).getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
    fireEvent.click(screen.getByRole("tab", { name: "Xem trước như trên mạng xã hội" }));
    expect(await screen.findByRole("heading", { name: "Original title" })).toBeInTheDocument();
    expect(mocks.preview).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Original body", platformAccountId: "account-1" });
    expect(screen.getByText(/18 ký tự · 1 tag gửi riêng/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    expect(screen.getByLabelText("Nội dung · DEV")).not.toHaveAttribute("readonly");
  });

  it("approves, schedules or rejects one platform's post on its own card", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài này" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" }));
    fireEvent.click(within(card).getByRole("button", { name: "Từ chối bài này" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenLastCalledWith("campaign-1", "variant-1", "reject", undefined));
    fireEvent.click(within(card).getByRole("button", { name: "Hẹn lịch bài này" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Duyệt bài DEV và đăng vào thời gian bạn chọn");
    fireEvent.change(within(dialog).getByLabelText("Ngày giờ đăng (giờ địa phương)"), { target: { value: "2099-01-01T10:00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Duyệt & hẹn lịch" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenLastCalledWith("campaign-1", "variant-1", "approve", { publishMode: "SCHEDULED", scheduledAt: new Date("2099-01-01T10:00").toISOString() }));
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("shows an approved post as decided, without its approve buttons or edits", () => {
    mocks.variantStatus = "APPROVED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    expect(screen.queryByRole("group", { name: "Duyệt bài DEV" })).not.toBeInTheDocument();
    expect(screen.getByText(/Đã duyệt: bài vào hàng đợi đăng/)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Khôi phục/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt hết bài còn chờ (0)" })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveAttribute("readonly");
  });
  it("restores a rejected campaign and opens its unchanged content for review", async () => {
    mocks.state = "REJECTED";
    const { rerender } = render(<AiContentView />);
    fireEvent.click(screen.getByRole("tab", { name: "Đã từ chối" }));
    mocks.review.mockImplementation(async () => { mocks.state = "WAITING_REVIEW"; });
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục để duyệt" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith("campaign-1", "restore"));
    rerender(<AiContentView />);
    expect(screen.getByRole("tab", { name: "Chờ duyệt" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(screen.getByRole("button", { name: "Duyệt bài này" })).toBeEnabled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.reviewVariant).not.toHaveBeenCalled();
  });

  it.each(["REJECTED", "WAITING_REVIEW", "APPROVED"])("restores one rejected post in a %s campaign", async (state) => {
    mocks.state = state;
    mocks.variantStatus = "REJECTED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: state === "WAITING_REVIEW" ? "Review & duyệt" : "Review nội dung" }));
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục bài này" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "restore", undefined));
    expect(mocks.review).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
  });

  it("keeps the rejected item visible when restoration fails", async () => {
    mocks.state = "REJECTED";
    mocks.review.mockRejectedValue(new Error("Không thể khôi phục"));
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("tab", { name: "Đã từ chối" }));
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục để duyệt" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalled());
    expect(screen.getByRole("tab", { name: "Đã từ chối" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Khôi phục để duyệt" })).toBeEnabled();
  });

  it("does not offer restoration to viewers or for approved posts", () => {
    mocks.role = "VIEWER";
    mocks.state = "REJECTED";
    mocks.variantStatus = "REJECTED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    expect(screen.queryByRole("button", { name: /Khôi phục/ })).not.toBeInTheDocument();
  });

});
