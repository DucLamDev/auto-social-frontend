import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExtensionLoginCheckPanel } from "./extension-login-check-panel";
const rows = vi.hoisted(() => ({ allSignedIn: false }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionLoginChecks: () => ({ data: [
    { id: "one", name: "Medium fixture", platform: "Medium", configured: true, issues: [], check: { status: "AUTHENTICATED", detectedUsername: "fixture" } },
    { id: "two", name: "Forum fixture", platform: "Forum", configured: false, issues: ["MISSING_PASSWORD"], check: null },
    { id: "three", name: "Bluesky fixture", platform: "Bluesky", configured: true, issues: [], check: rows.allSignedIn ? { status: "AUTHENTICATED" } : { status: "NEEDS_ACTION", message: "Chrome đang đăng nhập tài khoản khác" } },
  ] }),
}));
describe("login check panel", () => {
  it("separates successful login from posting/API readiness and shows missing credentials", () => {
    render(<ExtensionLoginCheckPanel />);
    expect(screen.getByText(/chưa xác nhận quyền đăng bài/)).toBeInTheDocument();
    expect(screen.getByText("Thiếu mật khẩu")).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập thành công")).toBeInTheDocument();
  });
  it("has no bulk login button: it points to the Test button of each account not signed in", () => {
    render(<ExtensionLoginCheckPanel />);
    expect(screen.queryByRole("button", { name: /hàng loạt/ })).not.toBeInTheDocument();
    expect(screen.getByText("1 tài khoản chưa đăng nhập: bấm Test ở dòng của tài khoản đó trong bảng.")).toBeInTheDocument();
  });
  it("says when every configured account is signed in", () => {
    rows.allSignedIn = true;
    render(<ExtensionLoginCheckPanel />);
    expect(screen.getByText("Mọi tài khoản đã cấu hình đều đã đăng nhập hoặc đang được kiểm tra.")).toBeInTheDocument();
    rows.allSignedIn = false;
  });
});
