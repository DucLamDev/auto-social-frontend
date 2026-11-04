import type { PlatformAccount } from "@/types/domain";

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const isSelectedExtensionAccount = (account: PlatformAccount) => record(account.settings?.extensionImport).selected === true;
export const chromeSession = (account: PlatformAccount) => record(account.settings?.extensionSession);
export const isChromeBound = (account: PlatformAccount) => typeof chromeSession(account).deviceId === "string";
export function accountConnectionState(account: PlatformAccount, checkStatus?: string): "connected" | "authenticated" | "needs_action" | "running" {
  if (isChromeBound(account)) {
    if (checkStatus === "QUEUED" || checkStatus === "RUNNING") return "running";
    if (record(account.settings?.extensionSetup).status === "ACCESS_RESTRICTED") return "needs_action";
    if (checkStatus !== "AUTHENTICATED") return "needs_action";
    return account.settings?.delivery === "extension" && account.enabled && account.status === "CONNECTED" ? "connected" : "authenticated";
  }
  return account.enabled && account.status === "CONNECTED" ? "connected" : "needs_action";
}
export type ConnectionState = ReturnType<typeof accountConnectionState>;
// Restricted Chrome accounts and never-checked accounts are counted as needing action, like the filter.
export type ConnectionCounts = Record<ConnectionState | "total", number>;
/** Counts behind the status filter; `statusOf` gives the latest Chrome login-check status of an account. */
export function countConnectionStates(accounts: PlatformAccount[], statusOf: (account: PlatformAccount) => string | undefined): ConnectionCounts {
  const counts: ConnectionCounts = { total: 0, connected: 0, authenticated: 0, needs_action: 0, running: 0 };
  for (const account of accounts) {
    counts.total += 1;
    counts[accountConnectionState(account, statusOf(account))] += 1;
  }
  return counts;
}
/**
 * Accounts tab: posting through the Chrome extension (extension delivery, a bound
 * Chrome profile or a row of the extension accounts file) or through an API /
 * OAuth / Playwright / manual route.
 */
export type AccountChannel = "extension" | "api";
export const accountChannel = (account: PlatformAccount): AccountChannel =>
  account.settings?.delivery === "extension" || isChromeBound(account) || Object.keys(record(account.settings?.extensionImport)).length > 0 ? "extension" : "api";

/** Flow audit statuses for which signing in again cannot make the account post. */
const CANNOT_POST = new Set(["FLOW_REQUIRED", "UNAVAILABLE", "MANUAL_ONLY", "DESTINATION_UNAVAILABLE"]);
export type PostingAudit = { status: string; implemented?: boolean; message?: string };
/**
 * True when the account has no posting flow, so signing in again cannot make it
 * post. The backend audit wins; without it the platform's flow id decides (a
 * stored setup status may predate the flow).
 */
export function cannotPostAutomatically(account: PlatformAccount, posting?: PostingAudit) {
  if (account.settings?.delivery === "extension") return false;
  if (posting) return CANNOT_POST.has(posting.status);
  return typeof account.platform?.defaultSettings?.extensionFlowId !== "string";
}

/**
 * Where a Chrome account stands for posting. `posting` is the backend flow audit
 * (from the login checks): it knows the flow's default page even when the
 * platform defaults stored in the database are older.
 */
export function extensionSetupMessage(account: PlatformAccount, posting?: PostingAudit) {
  if (record(account.settings?.extensionSetup).status === "ACCESS_RESTRICTED") return "Đã gán Chrome · quyền đăng bài bị hạn chế";
  if (account.settings?.delivery === "extension") return account.settings.extensionAutoSubmit === false ? "Chờ bạn bấm Đăng" : "Tự bấm Đăng";
  if (cannotPostAutomatically(account, posting)) {
    return `Chưa đăng tự động được${posting?.message ? `: ${posting.message.split(/(?<=\.)\s/)[0]}` : " (chưa có luồng đăng)"}`;
  }
  if ((posting?.status ?? record(account.settings?.extensionSetup).status) === "DESTINATION_REQUIRED") return "Cần chọn trang đăng · bấm Tiện ích";
  return "Bấm Test để tự kết nối";
}
