import type { PlatformAccount } from "@/types/domain";
import type { ConnectionState } from "./extension-account-state";

const SITE_SETTINGS = ["baseUrl", "siteUrl", "instanceUrl", "serviceUrl", "extensionTargetUrl", "extensionLoginTarget"];

function hostOf(value: unknown): string {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  const text = record ? record.url ?? record.loginUrl ?? record.origin : value;
  if (typeof text !== "string" || !text.trim()) return "";
  try { return new URL(text).host.toLowerCase(); } catch { return ""; }
}

/** Site the account posts to, for platforms that cover many sites (Discourse, Mastodon…); "" when not set. */
function siteOf(account: PlatformAccount): string {
  for (const key of SITE_SETTINGS) {
    const host = hostOf(account.settings?.[key]);
    if (host) return host;
  }
  return "";
}

/**
 * Accounts that look like the same social account: same platform, same site and the
 * same handle (the username, or the display name when there is no username).
 */
export function accountIdentity(account: PlatformAccount): string {
  const handle = (account.username ?? "").trim().replace(/^@/, "").toLowerCase() || account.name.trim().toLowerCase();
  return [account.platformId, siteOf(account), handle].join("|");
}

/** Groups of two or more accounts that look like the same social account. */
export function duplicateGroups(accounts: PlatformAccount[]): PlatformAccount[][] {
  const groups = new Map<string, PlatformAccount[]>();
  for (const account of accounts) {
    const key = accountIdentity(account);
    groups.set(key, [...(groups.get(key) ?? []), account]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

const STATE_RANK: Record<ConnectionState, number> = { connected: 3, authenticated: 2, running: 1, needs_action: 0 };

/**
 * The copies to remove: each duplicate group keeps its best account (connected first,
 * then the one with more posts, then the enabled one, then the first in the list).
 */
export function extraDuplicates(accounts: PlatformAccount[], stateOf: (account: PlatformAccount) => ConnectionState): PlatformAccount[] {
  return duplicateGroups(accounts).flatMap((group) => [...group]
    .sort((a, b) => STATE_RANK[stateOf(b)] - STATE_RANK[stateOf(a)]
      || (b.publishedCount ?? 0) - (a.publishedCount ?? 0)
      || Number(b.enabled) - Number(a.enabled))
    .slice(1));
}

/** Runs `task` on every item, a few at a time; failures do not stop the others. */
export async function runForEach<T>(items: T[], task: (item: T) => Promise<unknown>, concurrency = 4) {
  const ok: T[] = [];
  const failed: Array<{ item: T; error: unknown }> = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++] as T;
      try { await task(item); ok.push(item); } catch (error) { failed.push({ item, error }); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return { ok, failed };
}

/** Names for a confirmation or a toast: "A, B, C và 2 tài khoản khác". */
export function accountNames(accounts: Array<Pick<PlatformAccount, "name">>, shown = 3): string {
  const names = accounts.slice(0, shown).map((account) => account.name).join(", ");
  return accounts.length > shown ? `${names} và ${accounts.length - shown} tài khoản khác` : names;
}
