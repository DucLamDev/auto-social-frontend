import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountImportModal } from "./account-import-modal";

const importExtensionAccounts = vi.hoisted(() => vi.fn());
vi.mock("@/services/resources.service", () => ({ resourcesService: { importExtensionAccounts } }));
vi.mock("@/hooks/use-resources", () => ({
  useExtensionDevices: () => ({ data: [{ id: "device-1", name: "Chrome văn phòng", createdAt: "2026-11-01T00:00:00Z" }] }),
  useResourceMutation: (fn: () => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));

function upload() {
  const file = new File(["Social Network,User\nMedium,writer@example.test\n"], "accounts.csv", { type: "text/csv" });
  fireEvent.change(screen.getByLabelText("File tài khoản"), { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: "Nhập file & kết nối" }));
  return file;
}

describe("account file import", () => {
  beforeEach(() => importExtensionAccounts.mockReset().mockResolvedValue({ imported: 1, queued: 1, batchId: "b", rows: [] }));

  it("has no shared Google login: each row signs in with its own account", () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    expect(screen.queryByLabelText(/Google dùng chung/)).toBeNull();
    expect(screen.queryByLabelText(/Mật khẩu Google/)).toBeNull();
    expect(screen.queryByLabelText(/Khoá TOTP Google/)).toBeNull();
    expect(screen.getByText(/của chính email Google ở dòng đó/)).toBeInTheDocument();
  });

  it("sends only the file and the chosen Chrome", async () => {
    render(<AccountImportModal open onClose={() => undefined} />);
    const file = upload();
    await waitFor(() => expect(importExtensionAccounts).toHaveBeenCalledWith(file, "device-1"));
    await screen.findByText(/Đã nhập 1 tài khoản/);
  });
});
