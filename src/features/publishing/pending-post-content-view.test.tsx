import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishJobContent } from "@/services/resources.service";
import { PendingPostContentView } from "./pending-post-content-view";

const mocks = vi.hoisted(() => ({ usePublishJobContent: vi.fn(), refetch: vi.fn(), copy: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({ usePublishJobContent: mocks.usePublishJobContent }));

const post: PublishJobContent = {
  jobId: "job-pending", status: "NEEDS_ACTION", platform: "caddy", platformName: "Caddy Community", accountName: "Caddy team",
  moderationPending: true, title: "Reverse proxy configuration", body: '## Example\n\n<script>alert("test")</script>',
  hashtags: ["caddy"], media: [], reviewUrl: "https://caddy.community/my/activity/pending", reviewUrlKind: "pending_queue",
};
function show(data: PublishJobContent) {
  mocks.usePublishJobContent.mockReturnValue({ data, isPending: false, isError: false, isFetching: false, refetch: mocks.refetch });
  render(<PendingPostContentView id={data.jobId} />);
}

describe("pending post content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.copy.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: mocks.copy } });
  });
  it("shows current stored text safely and links to the provider queue without claiming a post permalink", async () => {
    show(post);
    expect(mocks.usePublishJobContent).toHaveBeenCalledWith("job-pending");
    expect(screen.getByRole("heading", { name: post.title! })).toBeInTheDocument();
    expect(screen.getByTestId("post-body").textContent).toBe(post.body);
    expect(screen.getByTestId("post-body").querySelector("script")).toBeNull();
    expect(screen.getByText(/Đây là phiên bản hiện lưu/)).toBeInTheDocument();
    expect(screen.getByText("Đã gửi · chờ duyệt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hàng đợi trên diễn đàn" })).toHaveAttribute("href", post.reviewUrl);
    expect(screen.queryByRole("button", { name: /Đăng|Gửi lại|Duyệt/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sao chép nội dung" }));
    await waitFor(() => expect(mocks.copy).toHaveBeenCalledWith(`${post.title}\n\n${post.body}\n\n#caddy`));
  });
  it("keeps content readable when provider and media links are invalid", () => {
    show({ ...post, reviewUrl: "javascript:alert(1)", canonicalUrl: "https://user:secret@example.com", media: [{ type: "image", url: "data:text/html,test" }] });
    expect(screen.getByTestId("post-body")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xem hàng đợi trên diễn đàn" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1); // Back to the local queue only.
  });
  it("preserves a bookmarked detail page after approval with the updated status", () => {
    show({ ...post, status: "PUBLISHED", moderationPending: false });
    expect(screen.getByText("Đã đăng")).toBeInTheDocument();
    expect(screen.queryByText("Đã gửi · chờ duyệt")).not.toBeInTheDocument();
    expect(screen.getByTestId("post-body")).toBeInTheDocument();
  });
  it("shows retrieval failure and lets the user reload without submitting anything", () => {
    mocks.usePublishJobContent.mockReturnValue({ isPending: false, isError: true, error: new Error("Không tìm thấy bài viết"), refetch: mocks.refetch });
    render(<PendingPostContentView id="missing" />);
    expect(screen.getByText("Không tìm thấy bài viết")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});
