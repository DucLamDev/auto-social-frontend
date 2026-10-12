import { describe, expect, it } from "vitest";
import type { ContentVariant, PlatformAccount } from "@/types/domain";
import { canAddAutomationAccount, countAutomationPlatforms, defaultAutomationAccountIds, deriveAutomationCampaignName, getApprovedVariantForAccount, getAutomationAccountBlocker, getEligibleAccounts, includeImageAltText, isAutomationAccountEligible, isCampaignReadyContent, MAX_AUTOMATION_PLATFORMS, normalizeAutomationAccountIds } from "./campaign-utils";

const account: PlatformAccount = { id: "a1", platformId: "p1", platform: { id: "p1", name: "LinkedIn", slug: "linkedin" }, name: "Company", enabled: true, status: "CONNECTED" };
const variants: ContentVariant[] = [
  { id: "generated-new", contentId: "c1", platform: "LinkedIn", platformSlug: "linkedin", body: "new", status: "GENERATED" },
  { id: "approved", contentId: "c1", platform: "LinkedIn", platformSlug: "linkedin", body: "approved", status: "APPROVED" },
  { id: "wrong-platform", contentId: "c1", platform: "X", platformSlug: "x", body: "x", status: "APPROVED" },
];

describe("campaign eligibility", () => {
  it("accepts generated and approved canonical content", () => {
    expect(isCampaignReadyContent({ id: "1", title: "A", status: "GENERATED", createdAt: "2026-01-01" })).toBe(true);
    expect(isCampaignReadyContent({ id: "2", title: "B", status: "DRAFT", createdAt: "2026-01-01" })).toBe(false);
  });
  it("selects the approved variant for the exact account platform", () => {
    expect(getApprovedVariantForAccount(account, variants)?.id).toBe("approved");
  });
  it("excludes accounts without a matching approved variant", () => {
    const xAccount: PlatformAccount = { ...account, id: "a2", platform: { id: "p2", name: "X", slug: "x" }, status: "DISABLED" };
    expect(getEligibleAccounts([account, xAccount], variants).map((item) => item.id)).toEqual(["a1"]);
  });
  it("canonicalizes automation destinations for a stable idempotency fingerprint", () => {
    expect(normalizeAutomationAccountIds(["account-b", "account-a", "account-b"]))
      .toEqual(["account-a", "account-b"]);
  });
  it("uses an explicit campaign name or derives a bounded name from the brief", () => {
    expect(deriveAutomationCampaignName("  VPS   tháng 10 ", "ignored")).toBe("VPS tháng 10");
    const derived = deriveAutomationCampaignName("", "Nền tảng VPS cho lập trình viên ".repeat(10));
    expect(Array.from(derived)).toHaveLength(120);
    expect(derived.endsWith("…")).toBe(true);
  });
  it("adds optional image context to the AI brief without changing a brief that has no alt text", () => {
    expect(includeImageAltText("  Nội dung gốc  ")).toBe("Nội dung gốc");
    expect(includeImageAltText("Nội dung gốc", "  Dashboard   VPS  "))
      .toBe("Nội dung gốc\n\nNgữ cảnh ảnh để tạo caption/alt text chính xác (không viết nội dung phụ thuộc vào việc ảnh xuất hiện vì một số kênh có thể dùng bản chỉ có văn bản): Dashboard VPS");
  });
  it("preselects at most 12 distinct platforms while retaining same-platform accounts", () => {
    const manyAccounts = Array.from({ length: MAX_AUTOMATION_PLATFORMS + 1 }, (_, index): PlatformAccount => ({
      id: `account-${index}`,
      platformId: `platform-${index}`,
      platform: { id: `platform-${index}`, name: `Platform ${index}`, slug: `platform-${index}` },
      name: `Account ${index}`,
      enabled: true,
      status: "CONNECTED",
    }));
    const secondAccountOnFirstPlatform: PlatformAccount = {
      ...manyAccounts[0]!,
      id: "account-first-secondary",
      name: "First secondary",
    };
    const candidates = [...manyAccounts, secondAccountOnFirstPlatform];
    const selected = defaultAutomationAccountIds(candidates);

    expect(countAutomationPlatforms(candidates, selected)).toBe(MAX_AUTOMATION_PLATFORMS);
    expect(selected).toContain("account-first-secondary");
    expect(selected).not.toContain(`account-${MAX_AUTOMATION_PLATFORMS}`);
    expect(canAddAutomationAccount(candidates, selected, manyAccounts[MAX_AUTOMATION_PLATFORMS]!)).toBe(false);
    expect(canAddAutomationAccount(candidates, selected, secondAccountOnFirstPlatform)).toBe(true);
  });
  it("requires a connected, explicitly enabled Playwright session for one-step automation", () => {
    const browserAccount: PlatformAccount = {
      ...account,
      platform: { id: "voz", name: "VOZ", slug: "voz-forums", mode: "BROWSER_ASSISTED" },
      settings: { browserAutoSubmit: true, automationPermissionAttested: true },
    };
    expect(isAutomationAccountEligible(browserAccount)).toBe(true);
    expect(getAutomationAccountBlocker({ ...browserAccount, status: "RECONNECT_REQUIRED" })).toContain("Session Playwright");
    expect(getAutomationAccountBlocker({ ...browserAccount, settings: { ...browserAccount.settings, browserAutoSubmit: false } })).toContain("tự bấm");
    expect(getAutomationAccountBlocker({ ...browserAccount, settings: { browserAutoSubmit: true, automationPermissionAttested: false } })).toContain("quyền sử dụng automation");
  });
  it("never represents a manual handoff destination as eligible for one-click automation", () => {
    const manual: PlatformAccount = {
      ...account,
      platform: { id: "medium", name: "Medium", slug: "medium", mode: "MANUAL", connectorStatus: "MANUAL_ONLY" },
    };
    expect(isAutomationAccountEligible(manual)).toBe(false);
    expect(getAutomationAccountBlocker(manual)).toContain("chỉ hỗ trợ bàn giao thủ công");
  });
});
