import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishJob } from "@/types/domain";
import { PublishingView } from "./publishing-view";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  mutateAsync: vi.fn(),
  usePublishJobs: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/hooks/use-resources", () => ({
  usePublishJobs: mocks.usePublishJobs,
  useResourceMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
}));

function renderJob(job: PublishJob) {
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
  render(<PublishingView />);
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
  beforeEach(() => {
    mocks.refetch.mockReset();
    mocks.mutateAsync.mockReset();
    mocks.usePublishJobs.mockReset();
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
});
