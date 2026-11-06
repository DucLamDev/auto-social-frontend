import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Status } from "@/types/domain";
import { ContentStatusBar } from "./content-status-bar";

describe("ContentStatusBar", () => {
  it("counts runs per status, shows the approved share and filters by the chosen tab", () => {
    const onChange = vi.fn();
    const campaigns = ["QUEUED", "PROCESSING", "WAITING_REVIEW", "APPROVED", "DRAFT"].map((automationState) => ({ automationState: automationState as Status }));
    render(<ContentStatusBar campaigns={campaigns} variantCount={12} value="ALL" onChange={onChange} />);
    expect(screen.getByRole("tab", { name: "Tất cả 5" })).toHaveAttribute("aria-selected", "true");
    // Queued and generating runs are both "Đang tạo"; an old draft run only counts under "Tất cả".
    expect(screen.getByRole("tab", { name: "Đang tạo 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Có lỗi 0" })).toBeInTheDocument();
    expect(screen.getByText("20% đã duyệt")).toBeInTheDocument();
    expect(screen.getByText(/5 lượt nội dung · 12 biến thể/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "5 lượt nội dung: 2 đang tạo, 1 chờ duyệt, 1 đã duyệt" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Chờ duyệt 1" }));
    expect(onChange).toHaveBeenCalledWith("WAITING_REVIEW");
  });
});
