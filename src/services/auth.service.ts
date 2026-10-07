import { apiRequest } from "@/services/api/client";
import { tokenStore } from "@/services/api/token-store";
import type { LoginInput } from "@/schemas/auth";
import type { User } from "@/types/domain";

interface RawUser { id: string; email: string; displayName: string; roles: Array<"ADMIN" | "EDITOR" | "VIEWER">; }
interface RawAuthPayload { accessToken: string; user: RawUser; }
function mapUser(user: RawUser): User { return { id: user.id, email: user.email, name: user.displayName, role: user.roles.includes("ADMIN") ? "ADMIN" : user.roles.includes("EDITOR") ? "EDITOR" : "VIEWER" }; }
export const authService = {
  async login(input: LoginInput) { const result = await apiRequest<RawAuthPayload>("/auth/login", { method: "POST", body: input, skipAuthRefresh: true }); tokenStore.set(result.accessToken); return { accessToken: result.accessToken, user: mapUser(result.user) }; },
  async me() { return mapUser(await apiRequest<RawUser>("/auth/me")); },
  async logout() { try { await apiRequest<void>("/auth/logout", { method: "POST", body: {} }); } finally { tokenStore.clear(); } },
};
