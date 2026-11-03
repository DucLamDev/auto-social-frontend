import { describe, it, expect } from "vitest";
import { accountConnectionState, countConnectionStates } from "./extension-account-state";
import type { PlatformAccount } from "@/types/domain";
const account = { id: "a", platformId: "p", name: "A", enabled: true, status: "CONNECTED", settings: { extensionSession: { deviceId: "d" }, delivery: "extension" } } as PlatformAccount;
describe("connection filtering", () => {
  it("distinguishes configured publishing, login-only and pending verification", () => {
    expect(accountConnectionState(account, "AUTHENTICATED")).toBe("connected");
    expect(accountConnectionState({ ...account, settings: { extensionSession: { deviceId: "d" } } }, "AUTHENTICATED")).toBe("authenticated");
    expect(accountConnectionState(account, "NEEDS_ACTION")).toBe("needs_action");
    expect(accountConnectionState(account, "QUEUED")).toBe("running");
    expect(accountConnectionState(account)).toBe("needs_action");
  });
  it("counts every account exactly once per state", () => {
    const statuses: Record<string, string | undefined> = { a: "AUTHENTICATED", b: "RUNNING", c: undefined, d: "AUTHENTICATED" };
    const accounts = [account, { ...account, id: "b" }, { ...account, id: "c" }, { ...account, id: "d", settings: { extensionSession: { deviceId: "d" } } }];
    expect(countConnectionStates(accounts, (item) => statuses[item.id])).toEqual({ total: 4, connected: 1, authenticated: 1, needs_action: 1, running: 1 });
    expect(countConnectionStates([], () => undefined)).toEqual({ total: 0, connected: 0, authenticated: 0, needs_action: 0, running: 0 });
  });
});
