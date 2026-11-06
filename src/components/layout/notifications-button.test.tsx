import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountHealth } from "@/services/resources.service";
import { NotificationsButton } from "./notifications-button";

const state = vi.hoisted(() => ({ data: undefined as AccountHealth | undefined, isError: false, refetch: vi.fn() }));

vi.mock("@/hooks/use-resources", () => ({
  useAccountHealth: () => ({ data: state.data, isPending: !state.data && !state.isError, isError: state.isError, error: state.isError ? new Error("Không tải được thông báo") : null, refetch: state.refetch }),
}));

const empty: AccountHealth = {
  total: 0,
  accounts: { problems: [], expiringSoon: [] },
  jobs: { needsAction: 0, failed: 0, possibleDuplicate: 0, retrying: 0, waitingExtension: 0 },
  extension: { devicesOnline: 1, offline: false },
  alertsEnabled: false,
  generatedAt: "2026-11-06T00:00:00.000Z",
};

const busy: AccountHealth = {
  ...empty,
  total: 12,
  accounts: {
    problems: [{ id: "q", name: "Quora · VPSTTT", status: "RECONNECT_REQUIRED", platform: "quora", platformName: "Quora", expiresAt: null, autoRefresh: false }],
    expiringSoon: [],
  },
  jobs: { needsAction: 7, failed: 1, possibleDuplicate: 0, retrying: 0, waitingExtension: 0 },
};

describe("NotificationsButton", () => {
  beforeEach(() => { state.data = undefined; state.isError = false; state.refetch.mockReset(); });

  it("opens the list in a modal on the current page instead of going to the Dashboard", () => {
    state.data = busy;
    render(<NotificationsButton />);
    const bell = screen.getByRole("button", { name: "Thông báo: 12 việc cần xử lý" });
    expect(bell).toHaveTextContent("12");
    expect(bell).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(bell);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Thông báo")).toBeInTheDocument();
    expect(within(dialog).getByText("12 việc cần xử lý")).toBeInTheDocument();
    expect(within(dialog).getByText("Quora · Quora · VPSTTT")).toBeInTheDocument();
    expect(within(dialog).getByText("Bài cần thao tác")).toBeInTheDocument();
    expect(within(dialog).getByText("Bài thất bại")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Mở Tài khoản" })).toHaveAttribute("href", "/accounts");
    expect(within(dialog).getByRole("link", { name: "Xem trên Dashboard" })).toHaveAttribute("href", "/dashboard#can-xu-ly");

    // Following a link closes the modal.
    fireEvent.click(within(dialog).getByRole("link", { name: "Mở Xuất bản" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape and says when nothing needs the operator", () => {
    state.data = empty;
    render(<NotificationsButton />);
    fireEvent.click(screen.getByRole("button", { name: "Thông báo: Không có việc cần xử lý" }));
    expect(screen.getByText(/Mọi tài khoản đang kết nối tốt/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows loading and a retryable error inside the modal", () => {
    const { unmount } = render(<NotificationsButton />);
    fireEvent.click(screen.getByRole("button", { name: /Thông báo/ }));
    expect(within(screen.getByRole("dialog")).queryByText("Bài cần thao tác")).not.toBeInTheDocument();
    unmount();
    state.isError = true;
    render(<NotificationsButton />);
    fireEvent.click(screen.getByRole("button", { name: /Thông báo/ }));
    expect(screen.getByText("Không tải được thông báo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });
});
