import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExtensionLoginCheckPanel } from "./extension-login-check-panel";
const queue = vi.hoisted(() => vi.fn().mockResolvedValue({ queued: 1, skipped: 1, batchId: "fixture" }));
vi.mock("@/components/auth/permission-gate", () => ({ PermissionGate: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { queueExtensionLoginChecks: queue } }));
const rows = vi.hoisted(() => ({ allSignedIn: false }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionLoginChecks: () => ({ data: [
    { id: "one", name: "Medium fixture", platform: "Medium", configured: true, issues: [], check: { status: "AUTHENTICATED", detectedUsername: "fixture" } },
    { id: "two", name: "Forum fixture", platform: "Forum", configured: false, issues: ["MISSING_PASSWORD"], check: null },
    { id: "three", name: "Bluesky fixture", platform: "Bluesky", configured: true, issues: [], check: rows.allSignedIn ? { status: "AUTHENTICATED" } : { status: "NEEDS_ACTION", message: "Chrome đang đăng nhập tài khoản khác" } },
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
  it("tests only the accounts not signed in yet and says which ones it leaves out", async () => {
    render(<ExtensionLoginCheckPanel />);
    expect(screen.getByText(/Sẽ test 1 tài khoản chưa đăng nhập · bỏ qua 1 tài khoản đã đăng nhập thành công/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Test đăng nhập hàng loạt" }));
    await waitFor(() => expect(queue).toHaveBeenCalledWith(undefined, false, true, true));
  });
  it("has nothing to run when every configured account is signed in", () => {
    rows.allSignedIn = true;
    render(<ExtensionLoginCheckPanel />);
    expect(screen.getByRole("button", { name: "Test đăng nhập hàng loạt" })).toBeDisabled();
    expect(screen.getByText(/Không còn tài khoản nào cần test · bỏ qua 2 tài khoản/)).toBeInTheDocument();
    rows.allSignedIn = false;
  });
});
