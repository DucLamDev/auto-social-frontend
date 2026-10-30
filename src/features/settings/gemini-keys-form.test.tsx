import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiKeysForm } from "./gemini-keys-form";

const mocks = vi.hoisted(() => ({ query: vi.fn(), update: vi.fn(), setQueryData: vi.fn(), invalidateQueries: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({ useGeminiKeys: mocks.query }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { updateGeminiKeys: mocks.update } }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ setQueryData: mocks.setQueryData, invalidateQueries: mocks.invalidateQueries }) }));

const settings = { revision: "initial-revision", source: "saved", maxKeys: 10, slots: Array.from({ length: 10 }, (_, index) => ({ slot: index + 1, configured: index === 0, active: index === 0, retryAt: null })) };
describe("Gemini key settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({ data: settings });
    mocks.update.mockResolvedValue({ ...settings, revision: "saved-revision" });
    mocks.invalidateQueries.mockResolvedValue(undefined);
  });

  it("renders exactly ten secret fields and preserves saved keys when left blank", async () => {
    render(<GeminiKeysForm />);
    expect(screen.getAllByLabelText(/^Gemini API key \d+$/)).toHaveLength(10);
    expect(screen.getByLabelText("Gemini API key 1")).toHaveValue("");
    expect(screen.getByLabelText("Gemini API key 2")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Lưu API key Gemini" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Gemini API key 2"), { target: { value: " test-new-key-2 " } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu API key Gemini" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ revision: "initial-revision", changes: [{ slot: 2, apiKey: "test-new-key-2" }] }));
    await waitFor(() => expect(screen.getByLabelText("Gemini API key 2")).toHaveValue(""));
    expect(JSON.stringify(mocks.setQueryData.mock.calls)).not.toContain("test-new-key-2");
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["ai-providers"] });
  });

  it("requires an explicit clear action and supports undo before saving", async () => {
    render(<GeminiKeysForm />);
    fireEvent.click(screen.getByRole("button", { name: "Xóa Gemini key 1" }));
    expect(screen.getByLabelText("Gemini API key 1")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Giữ Gemini key 1" }));
    expect(screen.getByRole("button", { name: "Lưu API key Gemini" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Xóa Gemini key 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu API key Gemini" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ revision: "initial-revision", changes: [{ slot: 1, clear: true }] }));
  });

  it("keeps new input available when saving fails", async () => {
    mocks.update.mockRejectedValue(new Error("Cấu hình đã thay đổi"));
    render(<GeminiKeysForm />);
    fireEvent.change(screen.getByLabelText("Gemini API key 10"), { target: { value: "test-key-ten" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu API key Gemini" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Cấu hình đã thay đổi"));
    expect(screen.getByLabelText("Gemini API key 10")).toHaveValue("test-key-ten");
  });
});
