import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishJob } from "@/types/domain";
import { PublishingView } from "./publishing-view";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  mutateAsync: vi.fn(),
  usePublishJobs: vi.fn(),
  manualPayload: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  usePublishJobs: mocks.usePublishJobs,
  useResourceMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
}));

vi.mock("@/services/resources.service", () => ({
  resourcesService: {
    manualPayload: mocks.manualPayload,
    retryJob: vi.fn(),
    resumeBrowserJob: vi.fn(),
    reconcileNotFound: vi.fn(),
    markPublished: vi.fn(),
  },
}));

function renderJob(job: PublishJob, moderationOnly = false) {
  mocks.usePublishJobs.mockReturnValue({
    data: {
      items: [job],
      meta: { page: 1, totalPages: 1, total: 1 },
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: mocks.refetch,
  });
  render(<PublishingView moderationOnly={moderationOnly} />);
}

const baseJob: PublishJob = {
  id: "job-1",
  platform: "Discourse",
  account: "Forum staging",
  contentTitle: "Test topic",
  status: "NEEDS_ACTION",
  attempt: 1,
  maxAttempts: 3,
};

describe("PublishingView provider reconciliation", () => {
  it("requests the moderation queue and labels the forum link separately from a post permalink", () => {
    renderJob({ ...baseJob, reviewUrl: "https://forum.example.com/my/activity/pending", reviewUrlKind: "pending_queue", needsAction: { kind: "MODERATION" } }, true);
    expect(mocks.usePublishJobs).toHaveBeenCalledWith(expect.objectContaining({ reviewState: "MODERATION", status: "NEEDS_ACTION" }));
    expect(screen.getByRole("heading", { name: "Bài chờ duyệt" })).toBeInTheDocument();
    expect(screen.getByText("Chưa có link công khai của bài viết.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hàng đợi trên diễn đàn" })).toHaveAttribute("href", "https://forum.example.com/my/activity/pending");
    expect(screen.getByRole("link", { name: "Xem nội dung" })).toHaveAttribute("href", "/pending-posts/job-1");
    expect(screen.queryByRole("button", { name: /Retry|Giao lại/ })).not.toBeInTheDocument();
  });

  it("keeps local content accessible when the provider omits or returns an unsafe URL", () => {
    renderJob({ ...baseJob, reviewUrl: "javascript:alert(1)", needsAction: { kind: "MODERATION", url: "https://user:password@forum.example/" } }, true);
    expect(screen.getByRole("link", { name: "Xem nội dung" })).toHaveAttribute("href", "/pending-posts/job-1");
    expect(screen.queryByRole("link", { name: "Mở bài viết" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mở diễn đàn để kiểm tra" })).not.toBeInTheDocument();
  });

  beforeEach(() => {
    mocks.refetch.mockReset();
    mocks.mutateAsync.mockReset();
    mocks.usePublishJobs.mockReset();
    mocks.manualPayload.mockReset();
  });

  it("does not offer a second post for a topic already in moderation", () => {
    renderJob({
      ...baseJob,
      needsAction: {
        kind: "MODERATION",
        externalPostId: "42",
        url: "https://forum.example.com/t/test/42",
      },
    });

    expect(screen.getByText("Chờ forum duyệt")).toBeInTheDocument();
    expect(screen.getByText("Đã gửi · chờ duyệt")).toBeInTheDocument();
    expect(screen.queryByText("Cần thao tác")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy & mở" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đã được duyệt" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận forum đã duyệt" })).toBeInTheDocument();
    expect(screen.getByLabelText("External post ID")).toHaveValue("42");
    expect(screen.getByLabelText("Published URL (không bắt buộc)")).toHaveValue(
      "https://forum.example.com/t/test/42",
    );
  });

  it("requires explicit reconciliation before the same uncertain job can be sent again", () => {
    renderJob({
      ...baseJob,
      id: "job-uncertain",
      needsAction: { kind: "RECONCILIATION", canRetryAfterNotFound: true },
    });

    expect(screen.getByText("Cần đối soát")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy & mở" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Không tìm thấy" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận không có topic hoặc bài chờ duyệt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đã kiểm tra, gửi lại" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: "Đã tìm thấy bài" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận đã tìm thấy topic" })).toBeInTheDocument();
    expect(screen.getByLabelText("External post ID")).toHaveValue("");
  });

  it("does not offer resend when the provider already accepted the topic", () => {
    renderJob({
      ...baseJob,
      id: "job-provider-accepted",
      needsAction: {
        kind: "RECONCILIATION",
        externalPostId: "42",
        canRetryAfterNotFound: false,
      },
    });

    expect(screen.getByText("Cần đối soát")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Không tìm thấy" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đã tìm thấy bài" })).toBeInTheDocument();
  });

  it("opens the manual destination synchronously and copies media links with the payload", async () => {
    const replace = vi.fn();
    const close = vi.fn();
    const popup = { opener: window, location: { replace }, close } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(popup);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    mocks.manualPayload.mockResolvedValue({
      content: "Post body\n\nẢnh 1: https://cdn.example.com/post.webp\nAlt text: Dashboard",
      platformUrl: "https://medium.com/new-story",
      media: [{ type: "image", url: "https://cdn.example.com/post.webp", altText: "Dashboard" }],
    });
    renderJob({ ...baseJob, platform: "Medium", account: "Medium handoff" });

    fireEvent.click(screen.getByRole("button", { name: "Copy & mở" }));

    expect(open).toHaveBeenCalledWith("about:blank", "_blank");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("https://cdn.example.com/post.webp")));
    expect(replace).toHaveBeenCalledWith("https://medium.com/new-story");
    expect(close).not.toHaveBeenCalled();
  });

  it("shows the reconnect command and guarded resume flow for a Playwright login challenge", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    mocks.mutateAsync.mockResolvedValue({ queued: true });
    renderJob({
      ...baseJob,
      id: "job-browser-login",
      platform: "Voz Forums",
      account: "VOZ Production",
      accountStatus: "CONNECTED",
      accountEnabled: true,
      needsAction: {
        kind: "BROWSER_LOGIN",
        accountId: "account-browser",
        reason: "LOGIN_REQUIRED",
        message: "The platform requires a new login",
        canResumeBrowser: true,
      },
    });

    expect(screen.getByText("Cần đăng nhập lại")).toBeInTheDocument();
    expect(screen.getByText(/Session đã hết.*chạy helper/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tài khoản" })).toHaveAttribute("href", "/accounts");
    fireEvent.click(screen.getByRole("button", { name: "Lệnh đăng nhập" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("corepack pnpm browser:login account-browser"));

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục sau đăng nhập" }));
    expect(screen.getByRole("dialog", { name: "Tiếp tục job Playwright" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đã xử lý, tiếp tục" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith("job-browser-login"));
  });

  it("waits for live account status to become connected before enabling browser resume", () => {
    renderJob({
      ...baseJob,
      id: "job-browser-waiting-login",
      platform: "Voz Forums",
      accountStatus: "RECONNECT_REQUIRED",
      accountEnabled: true,
      needsAction: {
        kind: "BROWSER_LOGIN",
        accountId: "account-browser",
        reason: "LOGIN_REQUIRED",
        canResumeBrowser: true,
      },
    });

    expect(screen.getByRole("button", { name: "Hoàn tất kết nối trước" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Tiếp tục sau đăng nhập" })).not.toBeInTheDocument();
  });

  it("distinguishes a known pre-submit browser stop from uncertain reconciliation", () => {
    renderJob({
      ...baseJob,
      id: "job-browser-editor",
      platform: "Voz Forums",
      needsAction: {
        kind: "BROWSER_REVIEW",
        reason: "EDITOR_NOT_FOUND",
        message: "The editor changed before submission",
        url: "https://voz.vn/f/example.1/post-thread",
        canResumeBrowser: true,
      },
    });

    expect(screen.getByText("Playwright đã dừng an toàn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở điểm đến" })).toHaveAttribute("href", "https://voz.vn/f/example.1/post-thread");
    expect(screen.getByRole("button", { name: "Chạy lại adapter" })).toBeInTheDocument();
    expect(screen.queryByText("Cần đối soát")).not.toBeInTheDocument();
  });
});
