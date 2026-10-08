import type { Content, ContentVariant, PlatformAccount } from "@/types/domain";

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
