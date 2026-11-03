import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiContentView } from "./ai-content-view";

const mocks = vi.hoisted(() => ({
  review: vi.fn(), reviewExisting: vi.fn(), update: vi.fn(), state: "WAITING_REVIEW", ids: ["variant-1"], mode: "AUTOMATION", multipleVersions: false, secondAccount: false,
}));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ data: { role: "ADMIN" } }) }));
vi.mock("@/hooks/use-resources", () => ({
  useAiCampaigns: () => ({ data: { items: [{ id: "campaign-1", name: "Launch", reviewMode: mocks.mode, status: "DRAFT", content: { id: "content-1" }, automationState: mocks.state, automationVariantIds: mocks.ids, automationAccountIds: mocks.secondAccount ? ["account-1", "account-2"] : ["account-1"], createdAt: "2026-11-02T00:00:00Z" }] } }),
  useAccounts: () => ({ data: { items: [{ id: "account-1", name: "DEV account", enabled: true, status: "CONNECTED", platform: { slug: "devto", name: "DEV", mode: "OFFICIAL_API" } },
    ...(mocks.secondAccount ? [{ id: "account-2", name: "Tumblr vpsttt", enabled: true, status: "CONNECTED", platform: { slug: "tumblr", name: "Tumblr", mode: "OFFICIAL_API" } }] : [])] } }),
  useVariants: () => ({ data: { items: [{ id: "variant-1", platform: "DEV", platformSlug: "devto", title: "Original title", body: "Original body", status: "GENERATED" }, ...(mocks.multipleVersions ? [{ id: "variant-2", platform: "DEV", platformSlug: "devto", title: "Older version", body: "Older body", status: "APPROVED" }] : [])] } }),
  useMedia: () => ({ data: { items: [] } }),
  useResourceMutation: (fn: (...args: unknown[]) => unknown) => ({ mutateAsync: (...args: unknown[]) => fn(...args), isPending: false }),
}));
vi.mock("@/services/resources.service", () => ({ resourcesService: { reviewAiCampaign: mocks.review, updateVariant: mocks.update, reviewExistingContent: mocks.reviewExisting } }));

describe("AI content waiting for review", () => {
  beforeEach(() => {
    mocks.state = "WAITING_REVIEW";
    mocks.mode = "AUTOMATION";
    mocks.multipleVersions = false;
    mocks.secondAccount = false;
    mocks.ids = ["variant-1"];
    mocks.review.mockReset().mockResolvedValue({});
    mocks.reviewExisting.mockReset().mockResolvedValue({});
    mocks.update.mockReset().mockResolvedValue({});
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
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
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
    expect(screen.queryByRole("button", { name: "Review nội dung" })).not.toBeInTheDocument();
    mocks.state = "WAITING_REVIEW";
    mocks.ids = ["variant-1"];
    rerender(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    expect(screen.getByLabelText("Nội dung · DEV")).toHaveValue("Original body");
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("requires saving edits before approving immediate publication", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit nội dung" }));
    fireEvent.change(screen.getByLabelText("Nội dung · DEV"), { target: { value: "Edited body" } });
    expect(screen.getByRole("button", { name: "Duyệt đăng ngay" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hẹn lịch đăng" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉnh sửa" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Duyệt đăng ngay" })).toBeEnabled());
    expect(mocks.update).toHaveBeenCalledWith("variant-1", { title: "Original title", body: "Edited body" });
    fireEvent.click(screen.getByRole("button", { name: "Duyệt đăng ngay" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith("campaign-1", "approve", { publishMode: "NOW" }));
  });

  it("requires a future schedule and sends it as an explicit timestamp", async () => {
    render(<AiContentView />);
    fireEvent.click(screen.getByRole("button", { name: "Review nội dung" }));
    fireEvent.click(screen.getByRole("button", { name: "Hẹn lịch đăng" }));
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
    expect(screen.getByRole("button", { name: "Duyệt đăng ngay" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hẹn lịch đăng" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeDisabled();
    expect(screen.getByText(/nút duyệt mở khi tạo xong tất cả/)).toBeInTheDocument();
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("shows the platforms still missing after a failed run", () => {
    mocks.state = "FAILED";
    mocks.secondAccount = true;
    render(<AiContentView />);
    const progress = screen.getByLabelText("Tiến độ tạo nội dung theo kênh");
    expect(within(progress).getByText("Tumblr").closest("li")).toHaveTextContent("Chưa tạo được");
    expect(within(progress).getByText("DEV").closest("li")).toHaveTextContent("Đã tạo");
  });
});
