import { describe, expect, it } from "vitest";
import { isAutoRefreshPlatform, oauthProviderForPlatform, readOAuthResult } from "./oauth";

describe("OAuth helpers", () => {
  it("maps platforms to the provider that links them", () => {
    expect(oauthProviderForPlatform("blogger")).toBe("google");
    expect(oauthProviderForPlatform("threads")).toBe("threads");
    expect(oauthProviderForPlatform("tumblr")).toBe("tumblr");
    expect(oauthProviderForPlatform("medium")).toBeUndefined();
    expect(isAutoRefreshPlatform("instagram")).toBe(true);
    expect(isAutoRefreshPlatform("linkedin")).toBe(false);
  });

  it("turns the backend redirect into a readable result", () => {
    expect(readOAuthResult("?oauth=success&provider=instagram&accounts=1")).toEqual({ ok: true, provider: "Instagram", message: "Đã kết nối Instagram thành công" });
    expect(readOAuthResult("?oauth=success&provider=google&accounts=3")?.message).toBe("Đã kết nối 3 tài khoản Google · Blogger");
    expect(readOAuthResult("?oauth=error&provider=threads&reason=INVALID_STATE")?.message).toContain("hết hạn");
    expect(readOAuthResult("?oauth=error&provider=threads&reason=weird")?.message).toContain("thử lại");
    expect(readOAuthResult("?tab=1")).toBeNull();
  });
});

describe("oauthProviderNote", () => {
  it("only blames missing app settings when that is the reason", async () => {
    const { oauthProviderNote } = await import("./oauth");
    expect(oauthProviderNote("threads", "READY")).toContain("tự gia hạn");
    expect(oauthProviderNote("instagram", "CREDENTIAL_REQUIRED")).toBe("Backend chưa cấu hình App ID/Secret");
    expect(oauthProviderNote("x", "API_RESEARCH_REQUIRED")).toBe("Chưa hỗ trợ kết nối tự động");
  });
});
