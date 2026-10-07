import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { EmptyState, ErrorState } from "./states";
describe("shared async states", () => {
  it("renders an accessible empty state", () => { render(<EmptyState title="Không có job" description="Hàng đợi đang trống" />); expect(screen.getByText("Không có job")).toBeInTheDocument(); });
  it("renders API error copy and retry", () => { render(<ErrorState error={new Error("API offline")} onRetry={() => undefined} />); expect(screen.getByText("API offline")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument(); });
  it("disables a loading button", () => { render(<Button loading>Đang lưu</Button>); expect(screen.getByRole("button", { name: "Đang lưu" })).toBeDisabled(); });
});
