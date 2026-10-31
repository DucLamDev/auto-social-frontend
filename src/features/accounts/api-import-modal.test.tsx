import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiImportModal } from "./api-import-modal";

const importApiAccounts = vi.hoisted(() => vi.fn());
const oauthStart = vi.hoisted(() => vi.fn());
vi.mock("@/services/resources.service", () => ({ resourcesService: { importApiAccounts, oauthStart } }));
vi.mock("@/hooks/use-resources", () => ({
  useResourceMutation: (fn: () => Promise<unknown>) => ({ mutateAsync: fn, isPending: false }),
}));

function chooseFile(name = "api-accounts.csv", size = 10) {
  const file = new File(["x".repeat(size)], name, { type: "text/csv" });
  fireEvent.change(screen.getByLabelText("File cấu hình"), { target: { files: [file] } });
  return file;
}

describe("API configuration import", () => {
  beforeEach(() => { importApiAccounts.mockReset(); oauthStart.mockReset(); });

  it("uploads the chosen file and lists every row with its status and reason", async () => {
    importApiAccounts.mockResolvedValue({ total: 3, connected: 1, needsAttention: 2, rows: [
      { row: 2, platform: "dev.to", slug: "devto", name: "dev.to · alice", status: "CONNECTED", message: "Đã kết nối (Alice)." },
      { row: 3, platform: "Bluesky", slug: "bluesky", name: "Bluesky · bob", status: "INVALID_ROW", message: "Cần App Password dạng xxxx-xxxx-xxxx-xxxx." },
      { row: 4, platform: "Instagram", slug: "instagram", name: "Instagram", status: "OAUTH_REQUIRED", message: "Instagram cần bấm Kết nối." },
    ] });
    render(<ApiImportModal open onClose={() => undefined} />);
    expect(screen.getByRole("link", { name: "Tải file mẫu" })).toHaveAttribute("href", "/templates/api-accounts.csv");
    const file = chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Nhập & kiểm tra" }));

    await waitFor(() => expect(screen.getByText("Đã kết nối 1/3 dòng, 2 dòng cần xem lại.")).toBeInTheDocument());
    expect(importApiAccounts).toHaveBeenCalledWith(file);
    expect(screen.getByText("Dòng 3")).toBeInTheDocument();
    expect(screen.getByText("Dòng không hợp lệ")).toBeInTheDocument();
    expect(screen.getByText("Cần App Password dạng xxxx-xxxx-xxxx-xxxx.")).toBeInTheDocument();
  });

  it("offers the Connect button only for OAuth rows and starts the right provider", async () => {
    importApiAccounts.mockResolvedValue({ total: 2, connected: 1, needsAttention: 1, rows: [
      { row: 2, platform: "dev.to", slug: "devto", name: "dev.to · alice", status: "CONNECTED", message: "Đã kết nối." },
      { row: 3, platform: "Instagram", slug: "instagram", name: "Instagram", status: "OAUTH_REQUIRED", message: "Instagram cần bấm Kết nối." },
    ] });
    oauthStart.mockRejectedValue(new Error("Backend chưa cấu hình App ID"));
    render(<ApiImportModal open onClose={() => undefined} />);
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Nhập & kiểm tra" }));

    const connect = await screen.findByRole("button", { name: "Kết nối" });
    expect(screen.getAllByRole("button", { name: "Kết nối" })).toHaveLength(1);
    fireEvent.click(connect);
    await waitFor(() => expect(oauthStart).toHaveBeenCalledWith("instagram"));
  });

  it("refuses files over 2 MiB and shows server errors", async () => {
    render(<ApiImportModal open onClose={() => undefined} />);
    chooseFile("big.csv", 2 * 1024 * 1024 + 1);
    fireEvent.click(screen.getByRole("button", { name: "Nhập & kiểm tra" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("tối đa 2 MiB");
    expect(importApiAccounts).not.toHaveBeenCalled();

    importApiAccounts.mockRejectedValue(new Error("Không đọc được file. Cần cột Nền tảng và Khoá bí mật"));
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Nhập & kiểm tra" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cần cột Nền tảng và Khoá bí mật");
  });

  it("keeps the submit button disabled until a file is chosen", () => {
    render(<ApiImportModal open onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: "Nhập & kiểm tra" })).toBeDisabled();
  });
});
