import { describe, expect, it } from "vitest";
import type { Platform, PlatformAccount } from "@/types/domain";
import { getPlatformConnectionStatus } from "./platform-connection-status";

const platform: Platform = {
  id: "devto-id",
  name: "dev.to",
  slug: "devto",
  mode: "OFFICIAL_API",
  enabled: true,
  connectorStatus: "CREDENTIAL_REQUIRED",
  capabilities: {
    text: true,
    image: false,
    video: false,
    article: true,
    delete: false,
    schedule: false,
    analytics: false,
  },
};

const account = (status: PlatformAccount["status"], enabled = true): PlatformAccount => ({
  id: `account-${status}`,
  platformId: platform.id,
  name: "dev.to account",
  enabled,
  status,
});

describe("getPlatformConnectionStatus", () => {
  it("shows the connector requirement when the user has no account", () => {
    expect(getPlatformConnectionStatus(platform, [])).toBe("CREDENTIAL_REQUIRED");
  });

  it("shows connected when at least one enabled account is connected", () => {
    expect(getPlatformConnectionStatus(platform, [account("RECONNECT_REQUIRED"), account("CONNECTED")])).toBe("CONNECTED");
  });

  it("shows the actionable account state instead of the static connector requirement", () => {
    expect(getPlatformConnectionStatus(platform, [account("RECONNECT_REQUIRED")])).toBe("RECONNECT_REQUIRED");
  });

  it("shows disabled when all configured accounts are disabled", () => {
    expect(getPlatformConnectionStatus(platform, [account("DISABLED", false)])).toBe("DISABLED");
  });
});
