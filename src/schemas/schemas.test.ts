import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";
import { campaignSchema } from "./campaign";
import { sourceSchema } from "./source";

describe("form schemas", () => {
  it("validates login input", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "correct-horse" }).success).toBe(true);
  });
  it("requires URL for remote sources and body for manual content", () => {
    expect(sourceSchema.safeParse({ name: "Feed", type: "RSS", url: "invalid" }).success).toBe(false);
    expect(sourceSchema.safeParse({ name: "Manual", type: "MANUAL", content: "Nội dung thủ công đủ dài để lưu." }).success).toBe(true);
  });
  it("requires a campaign destination", () => {
    expect(campaignSchema.safeParse({ name: "Launch", contentId: "content", accountIds: [] }).success).toBe(false);
    expect(campaignSchema.safeParse({ name: "Launch", contentId: "content", accountIds: ["account"] }).success).toBe(true);
  });
});
