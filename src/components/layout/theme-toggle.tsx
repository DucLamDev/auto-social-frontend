"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

/** Switches the whole app between the light and the dark theme; the choice is remembered on this browser. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // Before hydration the server's light theme is shown; the icon follows once the real theme is read.
  const dark = theme === "dark";
  const label = dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
  return <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={label} title={label}
    className={cn("grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-foreground", className)}>
    {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
  </button>;
}
