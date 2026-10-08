import type { Platform, PlatformAccount } from "@/types/domain";

const problemStatuses: PlatformAccount["status"][] = [
  "RECONNECT_REQUIRED",
  "EXPIRED",
  "ERROR",
  "DISCONNECTED",
];

export function getPlatformConnectionStatus(
  platform: Platform,
  accounts: PlatformAccount[],
): PlatformAccount["status"] | NonNullable<Platform["connectorStatus"]> {
  const platformAccounts = accounts.filter((account) => account.platformId === platform.id);

  if (platformAccounts.some((account) => account.enabled && account.status === "CONNECTED")) {
    return "CONNECTED";
  }

  const problemStatus = problemStatuses.find((status) =>
    platformAccounts.some((account) => account.enabled && account.status === status),
  );
  if (problemStatus) return problemStatus;

  if (platformAccounts.length > 0) return "DISABLED";
  return platform.connectorStatus ?? "API_RESEARCH_REQUIRED";
}
