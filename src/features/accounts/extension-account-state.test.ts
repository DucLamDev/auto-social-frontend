import { describe, it, expect } from "vitest";
import { accountConnectionState } from "./extension-account-state";
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
});
