import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentsView } from "./contents-view";

vi.mock("@/hooks/use-resources", () => ({
  useSources: () => ({ data: { items: [] } }),
  useContents: () => ({
    data: { items: [{ id: "content-1", title: "Giới thiệu sản phẩm", description: "Mô tả", status: "APPROVED", variantsCount: 13, createdAt: "2026-11-04T00:00:00Z" }], meta: { page: 1, totalPages: 1, total: 1 } },
    isPending: false,
    isError: false,
  }),
}));

describe("ContentsView", () => {
  it("opens the item in Studio straight from its title", () => {
    render(<ContentsView />);
    expect(screen.getByRole("link", { name: "Giới thiệu sản phẩm" })).toHaveAttribute("href", "/studio/content-1");
    expect(screen.getByRole("link", { name: /Mở Studio/ })).toHaveAttribute("href", "/studio/content-1");
  });
});
