import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AiContentView } from "./ai-content-view";

const mocks = vi.hoisted(() => ({
  failure: undefined as Record<string, string> | undefined, role: "ADMIN", review: vi.fn(), reviewExisting: vi.fn(), update: vi.fn(), preview: vi.fn(), reviewVariant: vi.fn(), rewrite: vi.fn(), extra: [] as Array<Record<string, unknown>>, revision: null as null | { status: string; instruction?: string; error?: string }, review_: { recommended: true as boolean, reason: "" }, warning: vi.fn(), error: vi.fn(), variantStatus: "GENERATED", image: null as null | { type: string; status: string }, state: "WAITING_REVIEW", ids: ["variant-1"], mode: "AUTOMATION", multipleVersions: false, secondAccount: false,
  roles: null as null | Record<string, unknown>, approval: null as null | Record<string, unknown>, approvalCurrent: undefined as boolean | undefined, requestApproval: vi.fn(), success: vi.fn(), live: [] as unknown[], deleteCampaign: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ data: { role: mocks.role } }) }));
vi.mock("@/hooks/use-resources", () => ({
  useAiCampaigns: () => ({ data: { items: [{ id: "campaign-1", name: "Launch", reviewMode: mocks.mode, status: "DRAFT", content: { id: "content-1" }, automationState: mocks.state, automationErrorCode: mocks.failure?.code ?? null, automationErrorDetail: mocks.failure ?? null, automationVariantIds: mocks.ids, automationAccountIds: mocks.secondAccount ? ["account-1", "account-2"] : ["account-1"], createdAt: "2026-11-02T00:00:00Z" }] } }),
  useAccounts: () => ({ data: { items: [{ id: "account-1", name: "DEV account", enabled: true, status: "CONNECTED", platform: { slug: "devto", name: "DEV", mode: "OFFICIAL_API" } },
    ...(mocks.secondAccount ? [{ id: "account-2", name: "Tumblr vpsttt", enabled: true, status: "CONNECTED", platform: { slug: "tumblr", name: "Tumblr", mode: "OFFICIAL_API" } }] : [])] } }),
  useVariants: (_id: string, live?: boolean) => (mocks.live.push(live), { data: { items: [{ id: "variant-1", platform: "DEV", platformSlug: "devto", title: "Original title", body: "Original body", status: mocks.variantStatus, image: mocks.image, aiRevision: mocks.revision, recommended: mocks.review_.recommended, reason: mocks.review_.reason, aiApproval: mocks.approval, aiApprovalCurrent: mocks.approvalCurrent }, ...(mocks.multipleVersions ? [{ id: "variant-2", platform: "DEV", platformSlug: "devto", title: "Older version", body: "Older body", status: "APPROVED" }] : []), ...mocks.extra] } }),
  useMedia: () => ({ data: { items: [] } }),
  useAiImageStatus: () => ({ data: { configured: true, model: "vpsttt-image", provider: "vpsttt" } }),
  useAiRoles: () => ({ data: mocks.roles }),
  useResourceMutation: (fn: (...args: unknown[]) => unknown) => ({ mutateAsync: (...args: unknown[]) => fn(...args), isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { reviewAiCampaign: mocks.review, updateVariant: mocks.update, reviewExistingContent: mocks.reviewExisting, previewVariant: mocks.preview, reviewAiVariant: mocks.reviewVariant, rewriteVariant: mocks.rewrite, requestVariantApproval: mocks.requestApproval, deleteAiCampaign: mocks.deleteCampaign } }));

/** Posts start folded to their header and decision buttons: open them to read, edit or preview. */
const openPost = (platform = "DEV") => fireEvent.click(screen.getByRole("button", { name: `Xem nội dung bài ${platform}` }));
const openAll = () => fireEvent.click(screen.getByRole("button", { name: "Mở hết" }));

describe("AI content waiting for review", () => {
  beforeEach(() => {
    mocks.role = "ADMIN";
    mocks.state = "WAITING_REVIEW";
    mocks.mode = "AUTOMATION";
    mocks.multipleVersions = false;
    mocks.secondAccount = false;
    mocks.ids = ["variant-1"];
    mocks.failure = undefined;
    mocks.review.mockReset().mockResolvedValue({});
    mocks.reviewExisting.mockReset().mockResolvedValue({});
    mocks.update.mockReset().mockResolvedValue({});
    mocks.reviewVariant.mockReset().mockResolvedValue({});
    mocks.warning.mockReset();
    mocks.error.mockReset();
    mocks.variantStatus = "GENERATED";
    mocks.image = null;
    mocks.revision = null;
    mocks.extra = [];
    mocks.review_ = { recommended: true, reason: "" };
    mocks.roles = null;
    mocks.approval = null;
    mocks.approvalCurrent = undefined;
    mocks.requestApproval.mockReset().mockResolvedValue({ status: "running" });
    mocks.success.mockReset();
    mocks.live = [];
    mocks.rewrite.mockReset().mockResolvedValue({ status: "generating" });
    mocks.preview.mockReset().mockResolvedValue({ title: "Original title", body: "Original body #vps", format: "markdown", tags: ["vps"], group: "DEVELOPER", engine: "devto", maxChars: null, length: 18, overLimit: false });
  });

  it("shows old campaign variants without offering duplicate approval or editing a referenced post", () => {
    mocks.mode = "EXISTING_CAMPAIGN";
    mocks.state = "APPROVED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    openPost();
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
    openAll();
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
    openPost();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("saves unsaved edits as part of approving, so publishing needs no separate save", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
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
    openPost();
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "   " } });
    expect(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited one" } });
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" }));
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
    openPost();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited early" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu bài này" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Edited early" }));
    // The finished platform is approved and published without waiting for the others.
    expect(screen.getByText(/Kênh nào xong \(kèm ảnh\) là duyệt và đăng được ngay/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Từ chối bài còn chờ" })).toBeEnabled();
    fireEvent.click(within(screen.getByRole("group", { name: "Duyệt bài DEV" })).getByRole("button", { name: "Duyệt & đăng bài DEV" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" }));
  });

  it("waits for a post's image before it can be approved", () => {
    mocks.image = { type: "image", status: "generating" };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    expect(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
    expect(within(card).getByText("Đang tạo ảnh cho bài này; duyệt được ngay khi ảnh xong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
    expect(within(card).getByRole("button", { name: "Từ chối bài DEV" })).toBeEnabled();
  });

  it("shows the platforms still missing after a failed run", () => {
    mocks.state = "FAILED";
    mocks.secondAccount = true;
    render(<AiContentView />);
    const progress = screen.getByLabelText("Tiến độ tạo nội dung theo kênh");
    expect(within(progress).getByText("Tumblr").closest("li")).toHaveTextContent("Chưa tạo được");
    expect(within(progress).getByText("DEV").closest("li")).toHaveTextContent("Đã tạo");
    // Hovering (or focusing) the status explains it; an older run kept only its code.
    const status = within(within(progress).getByText("Tumblr").closest("li")!).getByRole("button", { name: /Chưa tạo được/ });
    expect(document.getElementById(status.getAttribute("aria-describedby")!)).toHaveTextContent("không lưu chi tiết lỗi; bấm Thử lại để chạy lại và xem lỗi chi tiết");
  });

  it("says why a run failed and on which platform, and that the others were not started", () => {
    mocks.state = "FAILED";
    mocks.secondAccount = true;
    mocks.ids = [];
    mocks.failure = { code: "PLATFORM_RATE_LIMITED", message: "VPSTTT AI rate limit was reached. Try again later", platform: "devto", platformName: "DEV", provider: "vpsttt" };
    render(<AiContentView />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Dừng ở kênh DEV. AI báo đã đạt hạn mức lượt gọi");
    expect(alert).toHaveTextContent("Chi tiết: VPSTTT AI rate limit was reached. Try again later · mã PLATFORM_RATE_LIMITED · AI vpsttt");
    const progress = screen.getByLabelText("Tiến độ tạo nội dung theo kênh");
    expect(within(progress).getByText("DEV").closest("li")).toHaveTextContent("Lỗi ở kênh này");
    expect(within(progress).getByText("Tumblr").closest("li")).toHaveTextContent("Chưa chạy (dừng sau lỗi)");
    // The "!" of each platform explains itself on hover / focus.
    const tooltip = (platform: string) => within(within(progress).getByText(platform).closest("li")!).getByRole("tooltip", { hidden: true });
    expect(tooltip("DEV")).toHaveTextContent("AI gặp lỗi khi viết bài cho kênh này");
    expect(tooltip("DEV")).toHaveTextContent("Chi tiết: VPSTTT AI rate limit was reached. Try again later · mã PLATFORM_RATE_LIMITED · AI vpsttt");
    expect(tooltip("Tumblr")).toHaveTextContent("Chưa chạy: lượt tạo dừng ở kênh DEV vì lỗi “VPSTTT AI rate limit was reached. Try again later” (mã PLATFORM_RATE_LIMITED)");
    const devStatus = within(within(progress).getByText("DEV").closest("li")!).getByRole("button", { name: /Lỗi ở kênh này/ });
    expect(devStatus).toHaveAttribute("aria-describedby", tooltip("DEV").id);
  });

  it("deletes a run after confirmation, says why the server refused, and never while the AI writes", async () => {
    mocks.deleteCampaign.mockReset().mockResolvedValueOnce({ deleted: true, contentRemoved: true });
    const { unmount } = render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá lượt Launch" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Xoá “Launch” khỏi Content đợi duyệt");
    fireEvent.click(within(dialog).getByRole("button", { name: "Xoá lượt này" }));
    await waitFor(() => expect(mocks.deleteCampaign).toHaveBeenCalledWith("campaign-1"));
    expect(mocks.success).toHaveBeenCalledWith("Đã xoá lượt “Launch”.");
    // A refusal from the server is shown as it is.
    mocks.deleteCampaign.mockRejectedValueOnce(new Error("Lượt này đã có 2 bài đăng lên social nên được giữ lại để còn lịch sử đăng."));
    fireEvent.click(screen.getByRole("button", { name: "Xoá lượt Launch" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xoá lượt này" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Lượt này đã có 2 bài đăng lên social nên được giữ lại để còn lịch sử đăng."));
    unmount();
    mocks.state = "PROCESSING";
    mocks.ids = [];
    render(<AiContentView />);
    expect(screen.getByRole("button", { name: "Xoá lượt Launch" })).toBeDisabled();
  });

  it("offers no delete to viewers", () => {
    mocks.role = "VIEWER";
    render(<AiContentView />);
    expect(screen.queryByRole("button", { name: "Xoá lượt Launch" })).not.toBeInTheDocument();
  });

  it("keeps the approval buttons in a bar that stays visible and previews each post as its platform shows it", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiContentView /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    const bar = screen.getByRole("region", { name: "Duyệt nội dung" });
    expect(bar).toHaveClass("sticky");
    expect(within(bar).getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
    fireEvent.click(within(screen.getByRole("tablist", { name: "Cách xem bài DEV" })).getByRole("tab", { name: "Xem trước" }));
    expect(await screen.findByRole("heading", { name: "Original title" })).toBeInTheDocument();
    expect(mocks.preview).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Original body", platformAccountId: "account-1" });
    expect(screen.getByText(/18 ký tự · 1 tag gửi riêng/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
    expect(screen.getByLabelText("Nội dung · DEV")).not.toHaveAttribute("readonly");
  });

  it("approves, schedules or rejects one platform's post on its own card", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" }));
    fireEvent.click(within(card).getByRole("button", { name: "Từ chối bài DEV" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenLastCalledWith("campaign-1", "variant-1", "reject", undefined));
    fireEvent.click(within(card).getByRole("button", { name: "Hẹn lịch bài DEV" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Duyệt bài DEV và đăng vào thời gian bạn chọn");
    fireEvent.change(within(dialog).getByLabelText("Ngày giờ đăng (giờ địa phương)"), { target: { value: "2099-01-01T10:00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Duyệt & hẹn lịch" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenLastCalledWith("campaign-1", "variant-1", "approve", { publishMode: "SCHEDULED", scheduledAt: new Date("2099-01-01T10:00").toISOString() }));
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("warns which accounts were left out of an approval, and shows why an approval was refused", async () => {
    mocks.reviewVariant.mockResolvedValueOnce({ skippedAccounts: [{ id: "account-9", name: "vpsttt phụ", platform: "DEV", reason: "NOT_CONNECTED", reasonLabel: "chưa kết nối, cần đăng nhập lại" }], waitingVariantIds: [] });
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" }));
    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith("Không đăng lên 1 tài khoản chưa sẵn sàng: vpsttt phụ · DEV (chưa kết nối, cần đăng nhập lại).", { duration: 15_000 }));
    mocks.reviewVariant.mockRejectedValueOnce(new Error("Chưa có tài khoản DEV nào sẵn sàng để đăng: DEV account (tài khoản đang tắt)."));
    fireEvent.click(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Chưa có tài khoản DEV nào sẵn sàng để đăng: DEV account (tài khoản đang tắt)."));
    expect(mocks.warning).toHaveBeenCalledTimes(1);
  });

  it("rewrites a low-scoring post with AI from an optional instruction, showing its score", async () => {
    mocks.review_ = { recommended: false, reason: "Cần xem lại (AI chấm 5/10): Mở bài chung chung" };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    expect(screen.getByText("AI chấm 5/10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Viết lại bằng AI" }));
    fireEvent.change(screen.getByLabelText("Hướng dẫn cho AI (không bắt buộc)"), { target: { value: "Mở bài bằng số liệu" } });
    fireEvent.click(screen.getByRole("button", { name: "Viết lại" }));
    await waitFor(() => expect(mocks.rewrite).toHaveBeenCalledWith("variant-1", "Mở bài bằng số liệu"));
  });

  it("locks approval and editing of a post while the AI rewrites it, and shows a failed rewrite", () => {
    mocks.revision = { status: "generating", instruction: "Ngắn hơn" };
    const { unmount } = render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    expect(screen.getByRole("status")).toHaveTextContent("AI đang viết lại bài này theo hướng dẫn “Ngắn hơn”");
    const card = screen.getByRole("group", { name: "Duyệt bài DEV" });
    expect(within(card).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
    expect(within(card).getByRole("button", { name: "Hẹn lịch bài DEV" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Viết lại bằng AI" })).not.toBeInTheDocument();
    unmount();
    mocks.revision = { status: "failed", error: "VPSTTT AI đang giới hạn lượt." };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa viết lại được: VPSTTT AI đang giới hạn lượt.");
    expect(screen.getByRole("button", { name: "Viết lại bằng AI" })).toBeEnabled();
  });

  it("shows an approved post as decided, without its approve buttons or edits", () => {
    mocks.variantStatus = "APPROVED";
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    expect(screen.queryByRole("group", { name: "Duyệt bài DEV" })).not.toBeInTheDocument();
    expect(screen.getByText(/Đã duyệt: bài vào hàng đợi đăng/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Khôi phục/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
    // An approved post is folded to one line until opened.
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem nội dung bài DEV" }));
    expect(screen.queryByRole("button", { name: "Sửa bài DEV" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn bài DEV" }));
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
  });

  it("approves and publishes only the ready posts scoring at least the chosen score, and remembers that score", async () => {
    window.localStorage.removeItem("auto-social:approve-min-score");
    mocks.review_ = { recommended: true, reason: "Hợp người đọc (AI chấm 8/10)" };
    mocks.ids = ["variant-1", "variant-3", "variant-4"];
    mocks.extra = [
      { id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED", recommended: false, reason: "Cần xem lại (AI chấm 5/10): Nhạt" },
      { id: "variant-4", platform: "Bluesky", platformSlug: "bluesky", title: null, body: "Bluesky body", status: "GENERATED", recommended: true, reason: "Hợp người đọc (AI chưa chấm được)" },
    ];
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt & đăng bài từ 7 điểm (1)" }));
    await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledTimes(1));
    expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" });
    const score = screen.getByLabelText("Điểm AI tối thiểu để duyệt");
    fireEvent.change(score, { target: { value: "" } });
    expect(score).toHaveValue(null);
    fireEvent.change(score, { target: { value: "5" } });
    // Unscored posts are never included.
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài từ 5 điểm (2)" })).toBeEnabled();
    expect(window.localStorage.getItem("auto-social:approve-min-score")).toBe("5");
  });
  it("restores a rejected campaign and opens its unchanged content for review", async () => {
    mocks.state = "REJECTED";
    const { rerender } = render(<AiContentView />);
    fireEvent.click(screen.getByRole("tab", { name: /^Đã từ chối/ }));
    mocks.review.mockImplementation(async () => { mocks.state = "WAITING_REVIEW"; });
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục để duyệt" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith("campaign-1", "restore"));
    rerender(<AiContentView />);
    expect(screen.getByRole("tab", { name: /^Chờ duyệt/ })).toHaveAttribute("aria-selected", "true");
    openPost();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(screen.getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeEnabled();
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
    openPost();
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
  });

  it("keeps the rejected item visible when restoration fails", async () => {
    mocks.state = "REJECTED";
    mocks.review.mockRejectedValue(new Error("Không thể khôi phục"));
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("tab", { name: /^Đã từ chối/ }));
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục để duyệt" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalled());
    expect(screen.getByRole("tab", { name: /^Đã từ chối/ })).toHaveAttribute("aria-selected", "true");
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

  it("keeps the AI image buttons usable under the social-media preview", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiContentView /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    fireEvent.click(within(screen.getByRole("tablist", { name: "Cách xem bài DEV" })).getByRole("tab", { name: "Xem trước" }));
    expect(await screen.findByRole("heading", { name: "Original title" })).toBeInTheDocument();
    const images = screen.getByRole("region", { name: "Ảnh · DEV" });
    expect(within(images).getByRole("button", { name: "Tạo ảnh bằng AI" })).toBeEnabled();
    expect(within(images).getByRole("button", { name: "Tải ảnh lên" })).toBeEnabled();
  });

  it("outlines a post the AI passed in green and one it did not pass in orange", () => {
    mocks.ids = ["variant-1", "variant-3"];
    mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED", recommended: false, reason: "Cần xem lại (AI chấm 5/10): Mở bài chung chung" }];
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const dev = screen.getByRole("article", { name: "DEV" });
    const tumblr = screen.getByRole("article", { name: "Tumblr" });
    expect(dev).toHaveAttribute("data-verdict", "passed");
    expect(dev).toHaveClass("border-emerald-300", "border-l-emerald-500");
    expect(within(dev).getByText("Kết quả: chờ duyệt · AI đạt")).toBeInTheDocument();
    expect(tumblr).toHaveAttribute("data-verdict", "failed");
    expect(tumblr).toHaveClass("border-orange-300", "border-l-orange-500");
    expect(screen.getByText("Viền cam: chưa đạt")).toBeInTheDocument();
  });

  it("keeps each post's buttons on its own card, named after its platform, and edits one post at a time", () => {
    mocks.ids = ["variant-1", "variant-3"];
    mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED" }];
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openAll();
    const dev = screen.getByRole("article", { name: "DEV" });
    const tumblr = screen.getByRole("article", { name: "Tumblr" });
    expect(within(dev).getByRole("group", { name: "Duyệt bài DEV" })).toHaveTextContent("Bài DEV");
    expect(within(dev).queryByRole("button", { name: /Tumblr/ })).not.toBeInTheDocument();
    expect(within(tumblr).getByRole("button", { name: "Duyệt & đăng bài Tumblr" })).toBeEnabled();
    fireEvent.click(within(dev).getByRole("button", { name: "Sửa bài DEV" }));
    expect(screen.getByLabelText("Nội dung · Tumblr")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Draft edit" } });
    // "Huỷ sửa" drops what was typed and closes editing of that post only.
    fireEvent.click(within(dev).getByRole("button", { name: "Huỷ sửa" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveAttribute("readonly");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lists every post at the top with its status and scrolls to the one picked", () => {
    const original = Element.prototype.scrollIntoView;
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    try {
      mocks.ids = ["variant-1", "variant-3"];
      mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "APPROVED" }];
      render(<AiContentView />);
      fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
      const nav = screen.getByRole("navigation", { name: "Đi tới bài của từng kênh" });
      expect(within(nav).getByRole("button", { name: /DEV/ })).toHaveTextContent("chờ duyệt");
      fireEvent.click(within(nav).getByRole("button", { name: /Tumblr/ }));
      expect(within(nav).getByRole("button", { name: /Tumblr/ })).toHaveTextContent("đã duyệt");
      expect(scroll.mock.contexts[0]).toBe(screen.getByRole("article", { name: "Tumblr" }));
    } finally { Element.prototype.scrollIntoView = original; }
  });

  it("cuts long AI recommendations to two lines each until opened", () => {
    mocks.review_ = { recommended: false, reason: `Cần xem lại (AI chấm 6/10): ${"Câu này cần kiểm chứng lại. ".repeat(12)}` };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    const point = () => screen.getByText(/^Câu này cần kiểm chứng lại/);
    expect(point()).toHaveClass("line-clamp-2");
    fireEvent.click(screen.getByRole("button", { name: "Xem đủ ghi chú" }));
    expect(point()).not.toHaveClass("line-clamp-2");
    expect(screen.getByRole("button", { name: "Thu gọn ghi chú" })).toHaveAttribute("aria-expanded", "true");
  });

  it("fixes a post following only the AI recommendations left ticked", async () => {
    mocks.review_ = { recommended: false, reason: "Cần xem lại (AI chấm 7/10): Thông tin chưa có căn cứ: I write for vpsttt; Lời mở đầu hơi chung chung; Thêm một ví dụ cụ thể" };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    const advice = screen.getByRole("region", { name: "Khuyến nghị của AI · DEV" });
    expect(advice).toHaveTextContent("AI đề nghị kiểm tra (3 góp ý)");
    expect(within(advice).getAllByRole("checkbox").every((box) => (box as HTMLInputElement).checked)).toBe(true);
    // Keep the disclosure: untick it.
    fireEvent.click(within(advice).getByRole("checkbox", { name: "Thông tin chưa có căn cứ: I write for vpsttt" }));
    fireEvent.click(within(advice).getByRole("button", { name: "Sửa theo 2 khuyến nghị đã chọn" }));
    await waitFor(() => expect(mocks.rewrite).toHaveBeenCalledWith("variant-1", undefined, ["Lời mở đầu hơi chung chung", "Thêm một ví dụ cụ thể"]));
  });

  it("asks to save or drop an edit first, and needs at least one ticked recommendation", () => {
    mocks.review_ = { recommended: false, reason: "Cần xem lại (AI chấm 6/10): Lời mở đầu hơi chung chung" };
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    const advice = screen.getByRole("region", { name: "Khuyến nghị của AI · DEV" });
    fireEvent.click(within(advice).getByRole("checkbox", { name: "Lời mở đầu hơi chung chung" }));
    expect(within(advice).getByRole("button", { name: "Sửa theo 0 khuyến nghị đã chọn" })).toBeDisabled();
    expect(advice).toHaveTextContent("Tick ít nhất một khuyến nghị.");
    fireEvent.click(within(advice).getByRole("checkbox", { name: "Lời mở đầu hơi chung chung" }));
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Đang sửa tay" } });
    expect(within(advice).getByRole("button", { name: "Sửa theo 1 khuyến nghị đã chọn" })).toBeDisabled();
    expect(advice).toHaveTextContent("Lưu hoặc huỷ phần đang sửa của bài này trước.");
    expect(mocks.rewrite).not.toHaveBeenCalled();
  });

  it("only lists the recommendations for viewers and while the AI is rewriting", () => {
    mocks.review_ = { recommended: false, reason: "Cần xem lại (AI chấm 6/10): Lời mở đầu hơi chung chung" };
    mocks.role = "VIEWER";
    const { unmount } = render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: /Review/ }));
    openPost();
    let advice = screen.getByRole("region", { name: "Khuyến nghị của AI · DEV" });
    expect(advice).toHaveTextContent("Lời mở đầu hơi chung chung");
    expect(within(advice).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(advice).queryByRole("button")).not.toBeInTheDocument();
    unmount();
    mocks.role = "ADMIN";
    mocks.revision = { status: "generating", notes: ["Lời mở đầu hơi chung chung"] } as typeof mocks.revision;
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openPost();
    advice = screen.getByRole("region", { name: "Khuyến nghị của AI · DEV" });
    expect(within(advice).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AI đang viết lại bài này theo 1 khuyến nghị đã chọn");
  });

  it("starts every post folded to its header and decision buttons, and opens one post at a time", () => {
    mocks.ids = ["variant-1", "variant-3"];
    mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "Tiêu đề Tumblr", body: "Tumblr body", status: "GENERATED" }];
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const tumblr = screen.getByRole("article", { name: "Tumblr" });
    // Folded: a one-line excerpt and the decision stay visible, the text does not.
    expect(within(tumblr).getByText("Tiêu đề Tumblr")).toBeInTheDocument();
    expect(within(tumblr).getByRole("button", { name: "Duyệt & đăng bài Tumblr" })).toBeEnabled();
    expect(screen.queryByLabelText("Nội dung · Tumblr")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    fireEvent.click(within(tumblr).getByRole("button", { name: "Xem nội dung bài Tumblr" }));
    expect(screen.getByLabelText("Nội dung · Tumblr")).toHaveValue("Tumblr body");
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mở hết" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn hết" }));
    expect(screen.queryByLabelText("Nội dung · Tumblr")).not.toBeInTheDocument();
  });

  it("switches one post to its social-media preview without changing the others", async () => {
    mocks.ids = ["variant-1", "variant-3"];
    mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED" }];
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiContentView /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    openAll();
    expect(screen.queryByRole("tablist", { name: "Cách xem nội dung" })).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("tablist", { name: "Cách xem bài DEV" })).getByRole("tab", { name: "Xem trước" }));
    expect(await screen.findByRole("heading", { name: "Original title" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung · Tumblr")).toHaveValue("Tumblr body");
    // "Sửa bài" brings that post back to its text.
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
    expect(screen.getByLabelText("Nội dung · DEV")).not.toHaveAttribute("readonly");
  });

  it("opens the post picked in the jump list", () => {
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = vi.fn();
    try {
      mocks.ids = ["variant-1", "variant-3"];
      mocks.extra = [{ id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED" }];
      render(<AiContentView />);
      fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
      fireEvent.click(within(screen.getByRole("navigation", { name: "Đi tới bài của từng kênh" })).getByRole("button", { name: /Tumblr/ }));
      expect(screen.getByLabelText("Nội dung · Tumblr")).toHaveValue("Tumblr body");
      expect(screen.queryByLabelText("Nội dung · DEV")).not.toBeInTheDocument();
    } finally { Element.prototype.scrollIntoView = original; }
  });

  describe("final AI approval", () => {
    const roles = {
      reviewer: { provider: "vpsttt", model: "claude:sonnet", label: "Claude Sonnet", configured: true },
      approver: { provider: "vpsttt", model: "claude:opus", label: "Claude Opus", configured: true },
      approvalEnabled: true,
    };
    const verdict = (status: string, extra: Record<string, unknown> = {}) => ({ status, approver: "vpsttt:claude:opus", approverLabel: "Claude Opus", startedAt: new Date().toISOString(), ...extra });
    const openReview = () => fireEvent.click(screen.getByRole("button", { name: "Review & duyệt" }));
    const decision = () => screen.getByRole("group", { name: "Duyệt bài DEV" });

    it.each([
      ["approved", true, "Opus: Đạt"],
      ["rejected", true, "Opus: Từ chối"],
      ["running", true, "Opus đang duyệt…"],
      ["failed", true, "Opus lỗi"],
      [null, undefined, "Chưa duyệt cuối"],
      ["approved", false, "Chưa duyệt cuối"],
    ] as const)("shows the verdict %s (current text: %s) as a chip on the post", (status, current, chip) => {
      mocks.roles = roles;
      mocks.approval = status ? verdict(status) : null;
      mocks.approvalCurrent = current;
      render(<AiContentView />);
      openReview();
      expect(within(screen.getByRole("article", { name: "DEV" })).getByText(chip)).toBeInTheDocument();
    });

    it("lists why the final approver refused a post and lets nobody approve it", () => {
      mocks.roles = roles;
      mocks.review_ = { recommended: false, reason: "AI duyệt cuối (Claude Opus) từ chối: Giọng quảng cáo lộ liễu (AI chấm 7/10)" };
      mocks.approval = verdict("rejected", { score: 4, risk: "high", seeding: true, reasons: ["Giọng quảng cáo lộ liễu", "Bình luận giả làm khách hàng"] });
      mocks.approvalCurrent = true;
      render(<AiContentView />);
      openReview();
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
      expect(within(decision()).getByRole("button", { name: "Hẹn lịch bài DEV" })).toBeDisabled();
      expect(within(decision()).getByRole("button", { name: "Từ chối bài DEV" })).toBeEnabled();
      expect(decision()).toHaveTextContent("Claude Opus từ chối bài này.");
      // A refusal is fixed by editing or rewriting, which has the post approved again by itself.
      expect(within(decision()).queryByRole("button", { name: /Cho AI duyệt lại/ })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
      expect(screen.getByText("AI chấm 7/10")).toHaveAttribute("title", "Chấm bởi Claude Sonnet");
      openPost();
      const box = screen.getByRole("region", { name: "AI duyệt cuối · DEV" });
      expect(box).toHaveTextContent("Claude Opus từ chối bài này (chấm 4/10)");
      expect(box).toHaveTextContent("Giọng quảng cáo lộ liễu");
      expect(box).toHaveTextContent("Bình luận giả làm khách hàng");
      expect(box).toHaveTextContent("Có dấu hiệu seeding");
      expect(box).toHaveTextContent("Rủi ro cho công ty: cao");
      expect(box).toHaveTextContent("Sửa theo khuyến nghị");
      expect(within(screen.getByRole("region", { name: "Khuyến nghị của AI · DEV" })).getByRole("button", { name: "Sửa theo 1 khuyến nghị đã chọn" })).toBeEnabled();
    });

    it("waits for the verdict while the approver reads, on a live list that shows it by itself", () => {
      mocks.roles = roles;
      mocks.approval = verdict("running");
      const { rerender } = render(<AiContentView />);
      openReview();
      expect(mocks.live).toContain(true);
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
      expect(decision()).toHaveTextContent("Claude Opus đang đọc bài…");
      expect(within(decision()).queryByRole("button", { name: /Cho AI duyệt lại/ })).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Duyệt nội dung" })).toHaveTextContent("1 chờ AI duyệt cuối");
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
      mocks.approval = verdict("approved");
      mocks.approvalCurrent = true;
      rerender(<AiContentView />);
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
    });

    it("asks the approver again for a failed or never-approved post", async () => {
      mocks.roles = roles;
      mocks.approval = verdict("failed", { error: "VPSTTT AI quá tải" });
      const { unmount } = render(<AiContentView />);
      openReview();
      expect(decision()).toHaveTextContent("Claude Opus chưa duyệt được bài này.");
      fireEvent.click(within(decision()).getByRole("button", { name: "Cho AI duyệt lại bài DEV" }));
      await waitFor(() => expect(mocks.requestApproval).toHaveBeenCalledWith("variant-1"));
      expect(mocks.success).toHaveBeenCalledWith("Claude Opus đang đọc lại bài DEV. Kết quả tự hiện khi xong.");
      openPost();
      expect(screen.getByRole("region", { name: "AI duyệt cuối · DEV" })).toHaveTextContent("VPSTTT AI quá tải");
      unmount();
      mocks.approval = null;
      render(<AiContentView />);
      openReview();
      expect(decision()).toHaveTextContent("Chưa được AI duyệt cuối.");
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeDisabled();
      fireEvent.click(within(decision()).getByRole("button", { name: "Cho AI duyệt lại bài DEV" }));
      await waitFor(() => expect(mocks.requestApproval).toHaveBeenCalledTimes(2));
    });

    it("saves an edited post for the approver to read again instead of approving the text it read", async () => {
      mocks.roles = roles;
      mocks.approval = verdict("approved");
      mocks.approvalCurrent = true;
      render(<AiContentView />);
      openReview();
      openPost();
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
      fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Bài đã sửa" } });
      expect(within(decision()).queryByRole("button", { name: "Duyệt & đăng bài DEV" })).not.toBeInTheDocument();
      expect(within(decision()).getByRole("button", { name: "Hẹn lịch bài DEV" })).toBeDisabled();
      expect(decision()).toHaveTextContent("lưu để AI duyệt cuối đọc lại");
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (0)" })).toBeDisabled();
      fireEvent.click(within(decision()).getByRole("button", { name: "Lưu bài DEV để AI duyệt lại" }));
      await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Bài đã sửa" }));
      await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Đã lưu bài DEV. AI duyệt cuối đang đọc lại bài."));
      expect(mocks.reviewVariant).not.toHaveBeenCalled();
    });

    it("counts and approves in bulk only the posts the approver passed, and names the ones it kept back", async () => {
      window.localStorage.removeItem("auto-social:approve-min-score");
      mocks.roles = roles;
      mocks.review_ = { recommended: true, reason: "Hợp người đọc (AI chấm 8/10)" };
      mocks.approval = verdict("approved");
      mocks.approvalCurrent = true;
      mocks.ids = ["variant-1", "variant-3", "variant-4"];
      mocks.extra = [
        { id: "variant-3", platform: "Tumblr", platformSlug: "tumblr", title: "T", body: "Tumblr body", status: "GENERATED", recommended: true, reason: "Hợp người đọc (AI chấm 9/10)", aiApproval: verdict("rejected"), aiApprovalCurrent: true },
        { id: "variant-4", platform: "Bluesky", platformSlug: "bluesky", title: null, body: "Bluesky body", status: "GENERATED", recommended: true, reason: "Hợp người đọc (AI chấm 8/10)", aiApproval: verdict("running") },
      ];
      render(<AiContentView />);
      openReview();
      expect(screen.getByRole("region", { name: "Duyệt nội dung" })).toHaveTextContent("2 chờ AI duyệt cuối");
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Duyệt & đăng bài từ 7 điểm (1)" }));
      await waitFor(() => expect(mocks.reviewVariant).toHaveBeenCalledTimes(1));
      expect(mocks.reviewVariant).toHaveBeenCalledWith("campaign-1", "variant-1", "approve", { publishMode: "NOW" });
      mocks.review.mockResolvedValueOnce({ waitingVariantIds: ["variant-3"], unapprovedVariants: [{ id: "variant-3", platform: "Tumblr", message: "Claude Opus từ chối bài này" }] });
      fireEvent.click(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" }));
      await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith("Chưa đăng 1 bài chưa được AI duyệt cuối: Tumblr (Claude Opus từ chối bài này). Sửa bài hoặc chờ AI duyệt xong rồi duyệt lại.", { duration: 15_000 }));
    });

    it.each([
      ["the approver is switched off", { ...roles, approvalEnabled: false }],
      ["the backend has no AI roles (404)", null],
    ])("lets people approve as before when %s", (_, value) => {
      mocks.roles = value;
      mocks.approval = verdict("rejected");
      mocks.approvalCurrent = true;
      render(<AiContentView />);
      openReview();
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Duyệt & đăng bài đã xong (1)" })).toBeEnabled();
      expect(screen.queryByText(/Opus|Chưa duyệt cuối/)).not.toBeInTheDocument();
      openPost();
      expect(screen.queryByRole("region", { name: "AI duyệt cuối · DEV" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Sửa bài DEV" }));
      fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Bài đã sửa" } });
      expect(within(decision()).getByRole("button", { name: "Duyệt & đăng bài DEV" })).toBeEnabled();
    });
  });
});
