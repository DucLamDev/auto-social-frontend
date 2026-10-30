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
export function extensionSetupMessage(account: PlatformAccount) {
  if (record(account.settings?.extensionSetup).status === "ACCESS_RESTRICTED") return "Đã gán Chrome · quyền đăng bài bị hạn chế";
  if (account.settings?.delivery === "extension") return account.settings.extensionAutoSubmit === false ? "Chờ bạn bấm Đăng" : "Tự bấm Đăng";
  return typeof account.platform?.defaultSettings?.extensionFlowId === "string"
    ? "Cần cấu hình nơi đăng bài" : "Đã gán Chrome · chưa có luồng đăng tự động";
}
