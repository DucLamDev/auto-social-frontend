import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrandProfileForm } from "./brand-profile-form";

const mocks = vi.hoisted(() => ({ query: vi.fn(), update: vi.fn(), setQueryData: vi.fn() }));
vi.mock("@/hooks/use-resources", () => ({ useBrandProfile: mocks.query }));
vi.mock("@/services/resources.service", () => ({ resourcesService: { updateBrandProfile: mocks.update } }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ setQueryData: mocks.setQueryData }) }));

const suggested = {
  brandName: "VPSTTT", oneLiner: "Nhà cung cấp VPS và proxy tại Việt Nam.",
  facts: ["Máy chủ đặt tại các datacenter VNPT, Viettel, FPT, CMC ở Việt Nam"], disclosure: "Mình làm ở VPSTTT.", avoid: ["Rẻ nhất"],
};
const nothingSaved = { profile: null, invalid: false, updatedAt: null, suggested };
const save = () => fireEvent.click(screen.getByRole("button", { name: "Lưu hồ sơ thương hiệu" }));

function addLink(label: string, url: string) {
  fireEvent.click(screen.getByRole("button", { name: "Thêm liên kết" }));
  fireEvent.change(screen.getByLabelText("Tên liên kết 1"), { target: { value: label } });
  fireEvent.change(screen.getByLabelText("Địa chỉ liên kết 1"), { target: { value: url } });
}

describe("brand profile settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockImplementation((profile: unknown) => Promise.resolve({ profile, invalid: false, updatedAt: "2026-11-20T08:00:00.000Z", suggested }));
  });

  it("starts from the suggestion when nothing is saved, and sends it trimmed, without blank lines", async () => {
    mocks.query.mockReturnValue({ data: nothingSaved });
    render(<BrandProfileForm />);
    expect(screen.getByText("Chưa lưu")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên thương hiệu")).toHaveValue("VPSTTT");
    expect(screen.getByLabelText("Thông tin AI được dùng")).toHaveValue(suggested.facts[0]);
    fireEvent.change(screen.getByLabelText("Thông tin AI được dùng"), { target: { value: " Datacenter VNPT \n\n  Hỗ trợ tiếng Việt  \n" } });
    addLink(" Bảng giá ", "https://vpsttt.com/bang-gia");
    save();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({
      ...suggested, facts: ["Datacenter VNPT", "Hỗ trợ tiếng Việt"], links: [{ label: "Bảng giá", url: "https://vpsttt.com/bang-gia" }],
    }));
    expect(mocks.setQueryData).toHaveBeenCalledWith(["brand-profile"], expect.objectContaining({ invalid: false }));
  });

  it("only saves a saved profile once something changed, and says when the AI ignores the saved one", () => {
    mocks.query.mockReturnValue({ data: { profile: { ...suggested, defaultLanguage: "vi" }, invalid: false, updatedAt: "2026-11-20T08:00:00.000Z", suggested } });
    const { unmount } = render(<BrandProfileForm />);
    expect(screen.getByText("AI đang dùng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu hồ sơ thương hiệu" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Giọng văn"), { target: { value: "Ngắn gọn, như kỹ sư nói với kỹ sư" } });
    expect(screen.getByRole("button", { name: "Lưu hồ sơ thương hiệu" })).toBeEnabled();
    unmount();

    mocks.query.mockReturnValue({ data: { ...nothingSaved, invalid: true } });
    render(<BrandProfileForm />);
    expect(screen.getByText("AI đang bỏ qua")).toBeInTheDocument();
    expect(screen.getByText(/Hồ sơ đang lưu không hợp lệ/)).toBeInTheDocument();
  });

  it("points at a link that is not a full web address, and keeps the input when the server refuses", async () => {
    mocks.query.mockReturnValue({ data: nothingSaved });
    render(<BrandProfileForm />);
    addLink("Bảng giá", "vpsttt.com/bang-gia");
    save();
    expect(await screen.findByText(/Liên kết 1: địa chỉ phải là một trang web đầy đủ/)).toBeInTheDocument();
    expect(screen.getByLabelText("Địa chỉ liên kết 1")).toHaveFocus();
    expect(mocks.update).not.toHaveBeenCalled();

    mocks.update.mockRejectedValue(new Error("Hồ sơ thương hiệu dài quá 8 KB. Bớt vài dòng thông tin rồi lưu lại."));
    fireEvent.change(screen.getByLabelText("Địa chỉ liên kết 1"), { target: { value: "https://vpsttt.com/bang-gia" } });
    save();
    expect(await screen.findByText(/dài quá 8 KB/)).toBeInTheDocument();
    expect(screen.getByLabelText("Địa chỉ liên kết 1")).toHaveValue("https://vpsttt.com/bang-gia");
  });
});
