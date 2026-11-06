import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeToggle } from "./theme-toggle";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  window.localStorage.removeItem(THEME_STORAGE_KEY);
});

describe("ThemeToggle", () => {
  it("switches the whole page between light and dark and remembers the choice", () => {
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Chuyển sang giao diện tối" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Chuyển sang giao diện sáng" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
