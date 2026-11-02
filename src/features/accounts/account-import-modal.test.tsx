import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountImportModal } from "./account-import-modal";

const importExtensionAccounts = vi.hoisted(() => vi.fn());
vi.mock("@/services/resources.service", () => ({ resourcesService: { importExtensionAccounts } }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionDevices: () => ({ data: [{ id: "device-1", name: "Chrome văn phòng", createdAt: "2026-11-01T00:00:00Z" }] }),
  useResourceMutation: (fn: () => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));

const TOTP = "JBSWY3DPEHPK3PXP";

function fill({ email = "", password = "", totp = "" }: { email?: string; password?: string; totp?: string }) {
  const file = new File(["Social Network,User\nMedium,writer@example.test\n"], "accounts.csv", { type: "text/csv" });
  fireEvent.change(screen.getByLabelText("File tài khoản"), { target: { files: [file] } });
  if (email) fireEvent.change(screen.getByLabelText("Google dùng chung (tùy chọn)"), { target: { value: email } });
  if (password) fireEvent.change(screen.getByLabelText("Mật khẩu Google (tùy chọn)"), { target: { value: password } });
  if (totp) fireEvent.change(screen.getByLabelText("Khoá TOTP Google (tùy chọn)"), { target: { value: totp } });
  fireEvent.click(screen.getByRole("button", { name: "Nhập file & kết nối" }));
  return file;
}

describe("account import with a shared Google account", () => {
  beforeEach(() => importExtensionAccounts.mockReset().mockResolvedValue({ imported: 1, queued: 1, batchId: "b", rows: [] }));

  it("sends the Google password and TOTP key with the shared email, then clears both fields", async () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    const file = fill({ email: "company@example.test", password: "google-password", totp: ` ${TOTP} ` }); // vpsttt-secretscan: ignore (mật khẩu giả cho test)
    await waitFor(() => expect(importExtensionAccounts).toHaveBeenCalledWith(file, "device-1", "company@example.test", { password: "google-password", totpSecret: ` ${TOTP} ` })); // vpsttt-secretscan: ignore (mật khẩu giả cho test)
    await screen.findByText(/Đã nhập 1 tài khoản/);
    expect(screen.getByLabelText("Mật khẩu Google (tùy chọn)")).toHaveValue("");
    expect(screen.getByLabelText("Khoá TOTP Google (tùy chọn)")).toHaveValue("");
    expect(screen.getByLabelText("Mật khẩu Google (tùy chọn)")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Khoá TOTP Google (tùy chọn)")).toHaveAttribute("type", "password");
  });

  it("refuses a six-digit code in place of the TOTP key", async () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    fill({ email: "company@example.test", totp: "123 456" });
    expect(await screen.findByRole("alert")).toHaveTextContent("không phải khoá TOTP");
    expect(importExtensionAccounts).not.toHaveBeenCalled();
  });

  it("requires the shared Google email when Google secrets are entered", async () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    fill({ password: "google-password" }); // vpsttt-secretscan: ignore (mật khẩu giả cho test)
    expect(await screen.findByRole("alert")).toHaveTextContent("email Google dùng chung");
    expect(importExtensionAccounts).not.toHaveBeenCalled();
  });

  it("keeps the previous request when no Google secrets are entered", async () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    const file = fill({ email: "company@example.test" });
    await waitFor(() => expect(importExtensionAccounts).toHaveBeenCalledWith(file, "device-1", "company@example.test", { password: "", totpSecret: "" }));
  });
});
