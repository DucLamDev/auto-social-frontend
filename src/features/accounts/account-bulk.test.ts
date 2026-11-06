import { describe, expect, it } from "vitest";
import type { PlatformAccount } from "@/types/domain";
import { accountNames, duplicateGroups, extraDuplicates } from "./account-bulk";

const account = (id: string, input: Partial<PlatformAccount> = {}): PlatformAccount => ({ id, platformId: "discourse", name: id, enabled: true, status: "CONNECTED", ...input });

describe("duplicate accounts", () => {
  it("groups the same handle on the same site and keeps the best copy of each group", () => {
    const accounts = [
      account("old", { username: "VPSTTT", status: "RECONNECT_REQUIRED", settings: { baseUrl: "https://forum.a.test" } }),
      account("best", { username: "@vpsttt", publishedCount: 4, settings: { baseUrl: "https://forum.a.test/latest" } }),
      account("same-name", { username: "vpsttt", publishedCount: 1, settings: { baseUrl: "https://forum.a.test" } }),
      // Same handle on another forum of the same platform is a different account.
      account("other-site", { username: "vpsttt", settings: { baseUrl: "https://forum.b.test" } }),
      account("no-username", { name: "Đội A" }),
      account("no-username-2", { name: " đội a " }),
    ];
    expect(duplicateGroups(accounts).map((group) => group.map((item) => item.id))).toEqual([["old", "best", "same-name"], ["no-username", "no-username-2"]]);
    const extras = extraDuplicates(accounts, (item) => item.status === "CONNECTED" ? "connected" : "needs_action");
    expect(extras.map((item) => item.id)).toEqual(["same-name", "old", "no-username-2"]);
    expect(accountNames(accounts, 2)).toBe("old, best và 4 tài khoản khác");
  });
});
