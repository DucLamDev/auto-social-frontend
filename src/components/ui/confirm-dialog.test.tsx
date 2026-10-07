import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("requires an explicit confirmation before calling the action", () => {
    const confirm = vi.fn();
    const close = vi.fn();
    render(<ConfirmDialog open title="Publish now?" description="This calls the provider." onClose={close} onConfirm={confirm} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(confirm).toHaveBeenCalledOnce();
  });
});
