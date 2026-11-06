"use client";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, savedTheme, systemTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

// The theme lives on <html data-theme>; components read it through this small store.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = (): Theme => document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
// The server renders the light theme; the inline script in <head> has already set the real one.
const serverSnapshot = (): Theme => "light";

export function setTheme(theme: Theme) {
  try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* private mode: still switch for this visit */ }
  applyTheme(theme);
  notify();
}

export function useTheme() {
  return { theme: useSyncExternalStore(subscribe, snapshot, serverSnapshot), setTheme };
}

/** Keeps <html data-theme> right: the saved choice, otherwise the OS setting (followed live until the user picks one). */
export function ThemeSync() {
  // Re-apply before paint: React's dev remount clears the attribute the inline script set.
  useLayoutEffect(() => {
    applyTheme(savedTheme() ?? systemTheme());
    notify();
  }, []);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const follow = () => {
      if (savedTheme()) return;
      applyTheme(media.matches ? "dark" : "light");
      notify();
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  return null;
}
