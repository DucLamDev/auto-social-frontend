import type { Content, ContentVariant, PlatformAccount } from "@/types/domain";

export const MAX_AUTOMATION_PLATFORMS = 12;

export function getAutomationAccountBlocker(account: PlatformAccount): string | undefined {
  if (!account.enabled || account.status === "DISABLED") return "Tài khoản đang tắt.";
  // The Chrome extension posts for any forum; it only needs the account to be connected.
  if (account.settings?.delivery === "extension") return account.status === "CONNECTED" ? undefined : "Tài khoản chưa kết nối.";
  if (account.platform?.mode === "MANUAL") {
    return account.platform.connectorStatus === "API_REVIEW_REQUIRED"
      ? "Chưa có connector API đã duyệt cho nền tảng này."
      : "Chưa có API connector hoặc adapter Playwright đã kiểm thử; điểm đến này chỉ hỗ trợ bàn giao thủ công.";
  }
  if (account.status !== "CONNECTED") {
    return account.platform?.mode === "BROWSER_ASSISTED"
      ? "Session Playwright chưa sẵn sàng; hãy đăng nhập hoặc kết nối lại ở trang Tài khoản."
      : "Tài khoản chưa kết nối.";
  }
  if (account.platform?.mode !== "BROWSER_ASSISTED") return undefined;
  if (account.settings?.browserAutoSubmit !== true) {
    return "Chưa bật tự bấm nút đăng cuối cùng trong cấu hình Playwright.";
  }
  if ("automationPermissionAttested" in (account.settings ?? {})
    && account.settings?.automationPermissionAttested !== true) {
    return "Chưa xác nhận quyền sử dụng automation cho điểm đến này.";
  }
  return undefined;
}

export function isAutomationAccountEligible(account: PlatformAccount) {
  const supportedMode = ["OFFICIAL_API", "COMPATIBLE_API", "BROWSER_ASSISTED"]
    .includes(account.platform?.mode ?? "") || account.settings?.delivery === "extension";
  return supportedMode && !getAutomationAccountBlocker(account);
}

export function isCampaignReadyContent(content: Content) {
  return content.status === "GENERATED" || content.status === "APPROVED";
}

export function getApprovedVariantForAccount(account: PlatformAccount, variants: ContentVariant[]) {
  const platformSlug = account.platform?.slug;
  if (!platformSlug) return undefined;
  return variants.find((variant) => variant.status === "APPROVED" && variant.platformSlug === platformSlug);
}

export function getEligibleAccounts(accounts: PlatformAccount[], variants: ContentVariant[]) {
  return accounts.filter((account) => account.enabled && account.status === "CONNECTED" && Boolean(getApprovedVariantForAccount(account, variants)));
}

export function normalizeAutomationAccountIds(accountIds: string[]) {
  return [...new Set(accountIds)].sort();
}

function automationPlatformKey(account: PlatformAccount) {
  return account.platform?.slug ?? account.platformId;
}

export function countAutomationPlatforms(accounts: PlatformAccount[], accountIds: string[]) {
  const selectedIds = new Set(accountIds);
  return new Set(accounts.filter((account) => selectedIds.has(account.id)).map(automationPlatformKey)).size;
}

export function defaultAutomationAccountIds(accounts: PlatformAccount[]) {
  const platformKeys = new Set<string>();
  return accounts.filter((account) => {
    const platformKey = automationPlatformKey(account);
    if (platformKeys.has(platformKey)) return true;
    if (platformKeys.size >= MAX_AUTOMATION_PLATFORMS) return false;
    platformKeys.add(platformKey);
    return true;
  }).map((account) => account.id);
}

export function canAddAutomationAccount(accounts: PlatformAccount[], accountIds: string[], account: PlatformAccount) {
  const selectedIds = new Set(accountIds);
  const selectedKeys = new Set(accounts
    .filter((item) => selectedIds.has(item.id))
    .map(automationPlatformKey));
  return selectedKeys.has(automationPlatformKey(account)) || selectedKeys.size < MAX_AUTOMATION_PLATFORMS;
}

export function deriveAutomationCampaignName(name: string, brief: string) {
  const explicitName = name.replace(/\s+/g, " ").trim();
  if (explicitName) return explicitName;
  const normalizedBrief = brief.replace(/\s+/g, " ").trim();
  const codePoints = Array.from(normalizedBrief);
  return codePoints.length <= 120 ? normalizedBrief : `${codePoints.slice(0, 119).join("").trimEnd()}…`;
}

export function includeImageAltText(brief: string, altText?: string) {
  const normalizedBrief = brief.trim();
  const normalizedAltText = altText?.replace(/\s+/g, " ").trim();
  return normalizedAltText
    ? `${normalizedBrief}\n\nNgữ cảnh ảnh để tạo caption/alt text chính xác (không viết nội dung phụ thuộc vào việc ảnh xuất hiện vì một số kênh có thể dùng bản chỉ có văn bản): ${normalizedAltText}`
    : normalizedBrief;
}
