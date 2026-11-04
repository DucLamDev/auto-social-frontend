import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const nav = vi.hoisted(() => ({ pathname: "/contents" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const renderSidebar = () => render(<Sidebar collapsed={false} mobileOpen={false} onCollapse={() => {}} onMobileClose={() => {}} />);

describe("Sidebar", () => {
  it("shows the VPSTTT logo, named only when the menu is collapsed and no app name is shown", () => {
    const { container, rerender } = renderSidebar();
    expect(container.querySelector('img[src="/logo_light(100x100).png"]')).toHaveAttribute("alt", "");
    rerender(<Sidebar collapsed mobileOpen={false} onCollapse={() => {}} onMobileClose={() => {}} />);
    expect(screen.getByRole("img", { name: "Social Publisher" })).toHaveAttribute("src", "/logo_light(100x100).png");
  });


  it("has no separate Content Studio entry", () => {
    renderSidebar();
    expect(screen.queryByRole("link", { name: "Content Studio" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thư viện nội dung" })).toHaveAttribute("href", "/contents");
  });

  it("keeps the library highlighted while a library item is open in Studio", () => {
    nav.pathname = "/studio/content-1";
    renderSidebar();
    expect(screen.getByRole("link", { name: "Thư viện nội dung" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Content đợi duyệt" })).not.toHaveAttribute("aria-current");
  });
});
