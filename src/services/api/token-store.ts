const TOKEN_KEY = "sp_access_token";
let memoryToken: string | null = null;
export const tokenStore = {
  get() { if (memoryToken) return memoryToken; if (typeof window === "undefined") return null; memoryToken = window.sessionStorage.getItem(TOKEN_KEY); return memoryToken; },
  set(token: string) { memoryToken = token; if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token); },
  clear() { memoryToken = null; if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY); },
};
