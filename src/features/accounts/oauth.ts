/** OAuth provider that links accounts of a platform; Blogger signs in through Google. */
const PLATFORM_PROVIDER: Record<string, string> = { instagram: "instagram", threads: "threads", linkedin: "linkedin", blogger: "google" };

/** Platforms whose token the backend renews on its own (no repeated sign-in). */
const AUTO_REFRESH_PLATFORMS = new Set(["instagram", "threads", "blogger"]);

const PROVIDER_LABELS: Record<string, string> = { google: "Google · Blogger", instagram: "Instagram", threads: "Threads", linkedin: "LinkedIn", x: "X", reddit: "Reddit", tiktok: "TikTok" };

const PROVIDER_NOTES: Record<string, string> = {
  instagram: "Tài khoản Business/Creator. Đăng nhập một lần, token tự gia hạn.",
  threads: "Đăng nhập một lần, token tự gia hạn.",
  google: "Đăng nhập Google một lần, token tự gia hạn.",
  linkedin: "Token 60 ngày, hệ thống nhắc trước khi hết hạn.",
};

const ERROR_REASONS: Record<string, string> = {
  denied: "Bạn đã huỷ hoặc không cấp quyền trên trang đăng nhập.",
  invalid_callback: "Trang đăng nhập trả về thiếu thông tin. Hãy thử kết nối lại.",
  INVALID_STATE: "Phiên kết nối đã hết hạn (quá 10 phút) hoặc đã dùng. Hãy bấm Kết nối lại.",
  PLATFORM_AUTH_FAILED: "Nền tảng từ chối đổi mã đăng nhập. Kiểm tra App ID/Secret và Redirect URL trong cấu hình backend.",
  CONNECTOR_NEEDS_ACTION: "Backend chưa cấu hình App ID/Secret cho nền tảng này.",
  FORBIDDEN: "Tài khoản này đã được người dùng khác kết nối.",
  RESOURCE_NOT_FOUND: "Không tìm thấy trang/blog nào để đăng trong tài khoản này.",
};

export function oauthProviderForPlatform(slug?: string | null): string | undefined {
  return slug ? PLATFORM_PROVIDER[slug] : undefined;
}

export function isAutoRefreshPlatform(slug?: string | null): boolean {
  return Boolean(slug && AUTO_REFRESH_PLATFORMS.has(slug));
}

export function oauthProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function oauthProviderNote(provider: string, status: string): string {
  if (status === "CREDENTIAL_REQUIRED") return "Backend chưa cấu hình App ID/Secret";
  if (status !== "READY") return "Chưa hỗ trợ kết nối tự động";
  return PROVIDER_NOTES[provider] ?? "Sẵn sàng kết nối";
}

export function oauthErrorMessage(reason: string | null): string {
  return (reason && ERROR_REASONS[reason]) || "Kết nối không thành công. Hãy thử lại hoặc kiểm tra log backend.";
}

/** Reads and clears the `?oauth=` result the backend appends after the provider redirect. */
export function readOAuthResult(search: string): { ok: boolean; provider: string; message: string } | null {
  const params = new URLSearchParams(search);
  const outcome = params.get("oauth");
  if (outcome !== "success" && outcome !== "error") return null;
  const provider = oauthProviderLabel(params.get("provider") || "tài khoản");
  if (outcome === "success") {
    const count = Number(params.get("accounts") ?? "1");
    return { ok: true, provider, message: count > 1 ? `Đã kết nối ${count} tài khoản ${provider}` : `Đã kết nối ${provider} thành công` };
  }
  return { ok: false, provider, message: `Không kết nối được ${provider}: ${oauthErrorMessage(params.get("reason"))}` };
}
