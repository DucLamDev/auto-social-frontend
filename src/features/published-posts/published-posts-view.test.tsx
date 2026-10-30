import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishedPost } from "@/types/domain";
import { PublishedPostsView } from "./published-posts-view";

const mocks = vi.hoisted(() => ({ usePublishedPosts: vi.fn(), refetch: vi.fn(), copy: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({
  usePublishedPosts: mocks.usePublishedPosts,
  useAccounts: () => ({ data: { items: [
    { id: "account-1", name: "NGINX vpsttt", platformId: "nginx", platform: { id: "nginx", name: "NGINX", slug: "nginx" } },
    { id: "account-2", name: "Mastodon vpsttt", platformId: "mastodon", platform: { id: "mastodon", name: "Mastodon", slug: "mastodon" } },
  ] } }),
}));

const post: PublishedPost = {
  id: "post-1", publishJobId: "job-1", title: "Hướng dẫn NGINX", publishedAt: "2026-10-30T06:00:00Z",
  url: "https://community.nginx.org/t/guide/123", campaign: { id: "campaign-1", name: "Kiến thức web" },
  account: { id: "account-1", name: "NGINX vpsttt" }, platform: { id: "nginx", name: "NGINX", slug: "nginx" },
};

function queryResult(items: PublishedPost[]) {
  return { data: { items, meta: { page: 1, total: items.length, totalPages: 1 } }, isPending: false, isError: false, isFetching: false, refetch: mocks.refetch };
}

describe("Published post history", () => {
  beforeEach(() => {
    mocks.usePublishedPosts.mockReset().mockReturnValue(queryResult([post]));
    mocks.refetch.mockReset();
    mocks.copy.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: mocks.copy } });
  });

  it("opens the exact result URL and copies it, preserving account and campaign context", async () => {
    render(<PublishedPostsView />);
    const link = screen.getByRole("link", { name: "Mở bài: Hướng dẫn NGINX" });
    expect(link).toHaveAttribute("href", post.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Kiến thức web")).toBeInTheDocument();
    expect(screen.getAllByText("NGINX vpsttt").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Sao chép link: Hướng dẫn NGINX" }));
    await waitFor(() => expect(mocks.copy).toHaveBeenCalledWith(post.url));
  });

  it("never invents links or opens executable/credential-bearing URLs", () => {
    mocks.usePublishedPosts.mockReturnValue(queryResult([null, "javascript:alert(1)", "https://user:secret@example.com/post", "not a URL"].map((url, index) => ({ ...post, id: `post-${index}`, url }))));
    render(<PublishedPostsView />);
    expect(screen.queryByRole("link", { name: /Mở bài:/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sao chép link:/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Đã đăng, chưa có link hợp lệ từ nền tảng.")).toHaveLength(4);
  });

  it("resets pagination and dependent account filter when narrowing the results", () => {
    const result = queryResult([post]);
    result.data.meta = { page: 1, total: 30, totalPages: 2 };
    mocks.usePublishedPosts.mockReturnValue(result);
    render(<PublishedPostsView />);
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(mocks.usePublishedPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    fireEvent.change(screen.getByRole("combobox", { name: "Lọc tài khoản" }), { target: { value: "account-1" } });
    expect(mocks.usePublishedPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, accountId: "account-1" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Lọc nền tảng" }), { target: { value: "mastodon" } });
    expect(mocks.usePublishedPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, platformId: "mastodon", accountId: undefined }));
    expect(screen.queryByRole("option", { name: "NGINX vpsttt" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Tìm tiêu đề, tài khoản hoặc link…"), { target: { value: " NGINX " } });
    expect(mocks.usePublishedPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: "NGINX" }));
    fireEvent.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
    expect(mocks.usePublishedPosts).toHaveBeenLastCalledWith({ page: 1, limit: 25, search: undefined, platformId: undefined, accountId: undefined });
  });

  it("shows empty history and provides a route to pending jobs", () => {
    mocks.usePublishedPosts.mockReturnValue(queryResult([]));
    render(<PublishedPostsView />);
    expect(screen.getByText("Chưa có bài đăng thành công")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tiến trình đăng bài" })).toHaveAttribute("href", "/publishing");
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("offers a retry after an API failure without pretending the list is empty", () => {
    mocks.usePublishedPosts.mockReturnValue({ ...queryResult([]), isError: true, error: new Error("Không tải được lịch sử") });
    render(<PublishedPostsView />);
    expect(screen.queryByText("Chưa có bài đăng thành công")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});
