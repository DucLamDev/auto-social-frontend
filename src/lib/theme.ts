export type Theme = "light" | "dark";

/** localStorage key of the theme the user picked; without it the app follows the OS setting. */
export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in <head> before the first paint (see app/layout.tsx), so a dark page never flashes
 * white: the saved choice, else the OS setting, becomes data-theme on <html>.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch { return null; }
}

export function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
