import { describe, expect, it } from "vitest";
import type { ContentVariant } from "@/types/domain";
import { variantsPollInterval } from "./use-resources";

const variant = (extra: Partial<ContentVariant> = {}): ContentVariant => ({ id: "v1", contentId: "c1", platform: "DEV", platformSlug: "devto", body: "Bài", status: "GENERATED", ...extra });
const approval = (status: NonNullable<ContentVariant["aiApproval"]>["status"], startedAt = new Date().toISOString()) => ({ status, approver: "vpsttt:claude:opus", approverLabel: "Claude Opus", startedAt });

describe("variant list polling", () => {
  it("keeps polling while the final AI approver is still reading a post, so its verdict shows by itself", () => {
    expect(variantsPollInterval([variant({ aiApproval: approval("approved") }), variant({ id: "v2", aiApproval: approval("running") })], false)).toBe(3_000);
    expect(variantsPollInterval([variant({ aiApproval: approval("approved") }), variant({ id: "v2", aiApproval: approval("rejected") })], false)).toBe(false);
    // A run lost to a server restart never ends: stop polling for it.
    expect(variantsPollInterval([variant({ aiApproval: approval("running", new Date(Date.now() - 11 * 60_000).toISOString()) })], false)).toBe(false);
  });

  it("polls a live review all the time and stops when nothing is being worked on", () => {
    expect(variantsPollInterval([variant()], true)).toBe(2_000);
    expect(variantsPollInterval([variant({ aiRevision: { status: "generating" } })], false)).toBe(3_000);
    expect(variantsPollInterval([variant()], false)).toBe(false);
    expect(variantsPollInterval(undefined, false)).toBe(false);
  });
});
