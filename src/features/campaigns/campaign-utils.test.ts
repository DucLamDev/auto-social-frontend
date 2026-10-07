import { describe, expect, it } from "vitest";
import type { ContentVariant, PlatformAccount } from "@/types/domain";
import { getApprovedVariantForAccount, getEligibleAccounts, isCampaignReadyContent } from "./campaign-utils";

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
});
