import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { BrowserLoginGuide, buildBrowserLoginCommand } from "./browser-login-guide";

const account: PlatformAccount = {
  id: "66f018af-d8a8-4dd8-b584-1ffbd67a8f78",
  platformId: "voz-platform",
  platform: { id: "voz-platform", slug: "voz-forums", name: "Voz Forums", mode: "BROWSER_ASSISTED" },
  name: "VOZ Production",
  enabled: true,
  status: "RECONNECT_REQUIRED",
};

describe("BrowserLoginGuide", () => {
  it("shows a copyable CLI command without requesting a social password", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<BrowserLoginGuide account={account} busy={false} onClose={vi.fn()} onVerify={vi.fn()} />);

    expect(screen.getByLabelText("Lệnh đăng nhập Playwright")).toHaveTextContent(buildBrowserLoginCommand(account.id));
    expect(screen.queryByLabelText(/mật khẩu/i)).not.toBeInTheDocument();
    expect(screen.getByText(/không nhận mật khẩu, OTP hoặc CAPTCHA/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sao chép" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(buildBrowserLoginCommand(account.id)));
  });

  it("lets the operator verify the encrypted session after the helper completes", async () => {
    const onVerify = vi.fn().mockResolvedValue(true);
    render(<BrowserLoginGuide account={account} busy={false} onClose={vi.fn()} onVerify={onVerify} />);
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra session" }));
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith(account));
  });
});
