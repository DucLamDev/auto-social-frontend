import { describe, expect, it } from "vitest";
import type { Platform } from "@/types/domain";
import { getPlatformAutomationLabel } from "./automation-status";

function platform(status: NonNullable<Platform["capabilities"]["metadata"]>["automation"] extends infer T ? T : never): Platform {
  return {
    id: "p",
    slug: "platform",
    name: "Platform",
    mode: "MANUAL",
    enabled: true,
    capabilities: {
      text: true, image: false, video: false, article: true, delete: false, schedule: false, analytics: false,
      metadata: { automation: status },
    },
  };
}

describe("getPlatformAutomationLabel", () => {
  it("does not imply that policy-blocked or unreviewed destinations are automated", () => {
    expect(getPlatformAutomationLabel(platform({ status: "POLICY_BLOCKED", route: "NONE", automaticPublishing: false }))).toContain("chính sách");
    expect(getPlatformAutomationLabel(platform({ status: "BROWSER_RECIPE_REVIEW_REQUIRED", route: "NONE", automaticPublishing: false }))).toContain("cần recipe");
    expect(getPlatformAutomationLabel(platform({ status: "API_CONNECTOR_REQUIRED", route: "API", automaticPublishing: false }))).toContain("connector API");
  });

  it("identifies a reviewed Playwright destination as ready only after login", () => {
    expect(getPlatformAutomationLabel(platform({ status: "READY_AFTER_LOGIN", route: "PLAYWRIGHT", automaticPublishing: true }))).toContain("cần đăng nhập một lần");
  });
});
