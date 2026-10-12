import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";
import { AUTOMATION_IMAGE_MAX_BYTES, automationCampaignSchema, campaignSchema } from "./campaign";
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
  it("requires explicit publishing consent and a future timestamp for scheduled automation", () => {
    const base = {
      name: "Launch automation",
      brief: "Mô tả sản phẩm đủ chi tiết để AI tạo nội dung quảng bá.",
      accountIds: ["account"],
      aiProvider: "deepseek",
      runMode: "NOW",
      scheduledAt: "",
      confirmAutoPublish: true,
    };
    expect(automationCampaignSchema.safeParse(base).success).toBe(true);
    expect(automationCampaignSchema.safeParse({ ...base, name: "" }).success).toBe(true);
    expect(automationCampaignSchema.safeParse({ ...base, aiProvider: "unknown" }).success).toBe(false);
    expect(automationCampaignSchema.safeParse({ ...base, confirmAutoPublish: false }).success).toBe(false);
    expect(automationCampaignSchema.safeParse({
      ...base,
      runMode: "SCHEDULED",
      scheduledAt: "2020-01-01T00:00",
    }).success).toBe(false);
    expect(automationCampaignSchema.safeParse({
      ...base,
      runMode: "SCHEDULED",
      scheduledAt: "2099-01-01T00:00",
    }).success).toBe(true);
    expect(automationCampaignSchema.safeParse({
      ...base,
      image: new File(["image"], "post.png", { type: "image/png" }),
      imageAltText: "Ảnh minh hoạ",
    }).success).toBe(true);
    expect(automationCampaignSchema.safeParse({
      ...base,
      image: new File(["not-an-image"], "post.svg", { type: "image/svg+xml" }),
    }).success).toBe(false);
    const oversized = new File(["image"], "large.webp", { type: "image/webp" });
    Object.defineProperty(oversized, "size", { value: AUTOMATION_IMAGE_MAX_BYTES + 1 });
    expect(automationCampaignSchema.safeParse({ ...base, image: oversized }).success).toBe(false);
  });
});
