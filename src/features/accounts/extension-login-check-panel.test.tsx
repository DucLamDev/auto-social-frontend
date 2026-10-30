import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExtensionLoginCheckPanel } from "./extension-login-check-panel";
const queue = vi.hoisted(() => vi.fn().mockResolvedValue({ queued: 1, batchId: "fixture" }));
vi.mock("@/components/auth/permission-gate", () => ({ PermissionGate: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { queueExtensionLoginChecks: queue } }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionLoginChecks: () => ({ data: [
    { id: "one", name: "Medium fixture", platform: "Medium", configured: true, issues: [], check: { status: "AUTHENTICATED", detectedUsername: "fixture" } },
    { id: "two", name: "Forum fixture", platform: "Forum", configured: false, issues: ["MISSING_PASSWORD"], check: null },
  ] }),
  useResourceMutation: (fn: () => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));
describe("bulk login panel", () => {
  it("separates successful login from posting/API readiness and shows missing credentials", () => {
    render(<ExtensionLoginCheckPanel />);
    expect(screen.getByText(/chưa xác nhận quyền đăng bài/)).toBeInTheDocument();
    expect(screen.getByText("Thiếu mật khẩu")).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập thành công")).toBeInTheDocument();
  });
  it("queues authentication checks from the web", async () => {
    render(<ExtensionLoginCheckPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Test đăng nhập hàng loạt" }));
    await waitFor(() => expect(queue).toHaveBeenCalledWith());
  });
});
