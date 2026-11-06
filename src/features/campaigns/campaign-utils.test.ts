import { describe, expect, it } from "vitest";
import type { AiApproval, ContentVariant, PlatformAccount } from "@/types/domain";
import { canAddAutomationAccount, countAutomationPlatforms, defaultAutomationAccountIds, deriveAutomationCampaignName, getApprovedVariantForAccount, getAutomationAccountBlocker, getEligibleAccounts, includeImageAltText, isAutomationAccountEligible, isCampaignReadyContent, MAX_AUTOMATION_PLATFORMS, normalizeAutomationAccountIds, reviewOutcomeWarning, aiScore, normalizeMinScore, reviewPoints, approvalGate, sameAiModel, shortAiLabel, writerLabel } from "./campaign-utils";

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

describe("review outcome warning", () => {
  const platformOf = (id: string) => ({ "variant-x": "X" } as Record<string, string>)[id];

  it("stays silent when every account received its post", () => {
    expect(reviewOutcomeWarning(undefined, platformOf)).toBeNull();
    expect(reviewOutcomeWarning({ skippedAccounts: [], waitingVariantIds: [] }, platformOf)).toBeNull();
  });

  it("says which drafts wait for a shorter text instead of an account", () => {
    const platformOf = (id: string) => ({ v1: "Mastodon", v2: "Bluesky" } as Record<string, string>)[id];
    const warning = reviewOutcomeWarning({ waitingVariantIds: ["v1", "v2"], overLimitVariants: [{ id: "v1", platform: "Mastodon", length: 545, maxChars: 500, message: "…" }] }, platformOf);
    expect(warning).toContain("Chưa đăng 1 bài dài quá giới hạn ký tự: Mastodon 545/500.");
    expect(warning).toContain("Bài Bluesky vẫn chờ duyệt vì chưa có tài khoản nào sẵn sàng.");
    expect(warning).not.toContain("Bài Mastodon, Bluesky");
  });

  it("names each skipped account with its reason and each platform kept waiting", () => {
    expect(reviewOutcomeWarning({
      skippedAccounts: [{ name: "Main", platform: "DEV", reasonLabel: "tài khoản đang tắt" }, { name: "DEV · team", platform: "DEV", reasonLabel: "chưa bật \"Tự bấm Đăng\"" }],
      waitingVariantIds: ["variant-x", "gone"],
    }, platformOf)).toBe("Không đăng lên 2 tài khoản chưa sẵn sàng: Main · DEV (tài khoản đang tắt); DEV · team (chưa bật \"Tự bấm Đăng\"). Bài X, một nền tảng vẫn chờ duyệt vì chưa có tài khoản nào sẵn sàng. Kết nối lại tài khoản ở trang Tài khoản rồi bấm \"Duyệt & đăng bài này\".");
  });

  it("names the drafts kept waiting for the final AI approval apart from those waiting for an account", () => {
    const platformOf = (id: string) => ({ v1: "Mastodon", v2: "Bluesky", v3: "DEV" } as Record<string, string>)[id];
    const warning = reviewOutcomeWarning({
      waitingVariantIds: ["v1", "v2", "v3"],
      unapprovedVariants: [{ id: "v1", platform: "Mastodon", message: "Claude Opus từ chối bài này." }, { id: "v3", platform: "DEV", message: "" }],
    }, platformOf);
    expect(warning).toContain("Chưa đăng 2 bài chưa được AI duyệt cuối: Mastodon (Claude Opus từ chối bài này); DEV.");
    expect(warning).toContain("Bài Bluesky vẫn chờ duyệt vì chưa có tài khoản nào sẵn sàng.");
    expect(warning).not.toContain("Bài Mastodon");
    expect(reviewOutcomeWarning({ waitingVariantIds: ["v1"], unapprovedVariants: [{ id: "v1", platform: "Mastodon", message: "Chưa duyệt" }] }, platformOf)).not.toContain("tài khoản");
  });
});

describe("final AI approval gate", () => {
  const approval = (status: AiApproval["status"], extra: Partial<AiApproval> = {}): AiApproval => ({ status, approver: "vpsttt:claude:opus", approverLabel: "Claude Opus", startedAt: new Date().toISOString(), ...extra });

  it("lets every post through when the approver is off (or the backend has no AI roles)", () => {
    expect(approvalGate({ aiApproval: approval("rejected"), aiApprovalCurrent: true }, false)).toEqual({ ok: true, state: "off", message: "" });
    expect(approvalGate({}, false).ok).toBe(true);
  });

  it("only passes a post the approver said yes to for its current text", () => {
    expect(approvalGate({ aiApproval: approval("approved"), aiApprovalCurrent: true }, true)).toMatchObject({ ok: true, state: "approved" });
    // Older payloads without the flag are judged by the verdict; the server checks the text itself.
    expect(approvalGate({ aiApproval: approval("approved") }, true)).toMatchObject({ ok: true, state: "approved" });
    expect(approvalGate({ aiApproval: approval("approved"), aiApprovalCurrent: false }, true)).toEqual({ ok: false, state: "stale", message: "Bài đã sửa sau lần duyệt cuối, chờ AI duyệt lại." });
    expect(approvalGate({ aiApproval: null }, true)).toEqual({ ok: false, state: "missing", message: "Chưa được AI duyệt cuối." });
    expect(approvalGate({}, true)).toMatchObject({ ok: false, state: "missing" });
  });

  it("explains a running, refused or failed approval with the approver's name", () => {
    expect(approvalGate({ aiApproval: approval("running"), aiApprovalCurrent: true }, true)).toEqual({ ok: false, state: "running", message: "Claude Opus đang đọc bài…" });
    // A run on an older text, and a run lost to a server restart, can be started again.
    expect(approvalGate({ aiApproval: approval("running"), aiApprovalCurrent: false }, true).state).toBe("stale");
    expect(approvalGate({ aiApproval: approval("running", { startedAt: new Date(Date.now() - 11 * 60_000).toISOString() }), aiApprovalCurrent: true }, true)).toMatchObject({ ok: false, state: "failed", message: expect.stringContaining("bị gián đoạn") });
    expect(approvalGate({ aiApproval: approval("rejected"), aiApprovalCurrent: true }, true)).toMatchObject({ ok: false, state: "rejected", message: expect.stringContaining("Claude Opus từ chối bài này") });
    expect(approvalGate({ aiApproval: approval("rejected"), aiApprovalCurrent: false }, true).state).toBe("stale");
    expect(approvalGate({ aiApproval: approval("failed", { error: "timeout" }), aiApprovalCurrent: true }, true)).toMatchObject({ ok: false, state: "failed", message: expect.stringContaining("Claude Opus chưa duyệt được") });
    expect(approvalGate({ aiApproval: approval("running", { approverLabel: " " }) }, true).message).toBe("AI duyệt cuối đang đọc bài…");
  });
});

describe("AI role names", () => {
  it("names the writer the way the server names its roles", () => {
    expect(writerLabel({ id: "vpsttt", label: "VPSTTT AI", model: "gpt:gpt-5" })).toBe("GPT (VPSTTT AI)");
    expect(writerLabel({ id: "vpsttt", label: "VPSTTT AI", model: "claude:sonnet" })).toBe("Claude Sonnet");
    expect(writerLabel({ id: "openai", label: "OpenAI", model: "gpt-5-mini" })).toBe("OpenAI · gpt-5-mini");
  });

  it("shortens a model name for a chip", () => {
    expect(shortAiLabel("Claude Opus")).toBe("Opus");
    expect(shortAiLabel("GPT (VPSTTT AI)")).toBe("GPT");
    expect(shortAiLabel("OpenAI · gpt-5-mini")).toBe("OpenAI");
    expect(shortAiLabel("")).toBe("AI duyệt cuối");
  });

  it("finds a writer that is the same provider and model as a judge", () => {
    const writer = { id: "vpsttt" as const, model: "claude:sonnet" };
    expect(sameAiModel(writer, { provider: "vpsttt", model: "claude:sonnet" })).toBe(true);
    expect(sameAiModel(writer, { provider: "vpsttt", model: "" })).toBe(true);
    expect(sameAiModel(writer, { provider: "vpsttt", model: "claude:opus" })).toBe(false);
    expect(sameAiModel({ id: "openai", model: "claude:sonnet" }, { provider: "vpsttt", model: "claude:sonnet" })).toBe(false);
  });
});

describe("AI score in a review note", () => {
  it("reads the score the AI editor gave, or nothing when the draft was not scored", () => {
    expect(aiScore("Hợp người đọc (AI chấm 8/10)")).toBe(8);
    expect(aiScore("Cần xem lại (AI chấm 5/10): Mở bài chung chung")).toBe(5);
    expect(aiScore("Hợp người đọc (AI chưa chấm được)")).toBeNull();
    expect(aiScore(null)).toBeNull();
  });
});

describe("recommendations in a review note", () => {
  it("splits the fixes the server joined with \"; \", keeping a fix that itself continues after \"; \"", () => {
    const reason = "Cần xem lại (AI chấm 7/10): Thông tin chưa có căn cứ: I write for vpsttt (the brief does not state this); Lời mở đầu hơi chung chung; nên mở bằng một tình huống cụ thể.; Câu 'Nothing above depends on them' khiến phần giới thiệu yếu; 'The VM works' là lỗi mẫu";
    expect(reviewPoints(reason)).toEqual([
      "Thông tin chưa có căn cứ: I write for vpsttt (the brief does not state this)",
      "Lời mở đầu hơi chung chung; nên mở bằng một tình huống cụ thể.",
      "Câu 'Nothing above depends on them' khiến phần giới thiệu yếu",
      "'The VM works' là lỗi mẫu",
    ]);
  });

  it("returns one point for a single fix, nothing for an empty note, and drops repeats", () => {
    expect(reviewPoints("Cần xem lại (AI chưa chấm được): điểm dưới 7/10")).toEqual(["điểm dưới 7/10"]);
    expect(reviewPoints("Cần xem lại (AI chấm 5/10): Thiếu số liệu; Thiếu số liệu")).toEqual(["Thiếu số liệu"]);
    expect(reviewPoints("")).toEqual([]);
    expect(reviewPoints(null)).toEqual([]);
  });

  it("reads the points of a post the final approver refused", () => {
    expect(reviewPoints("AI duyệt cuối (GPT (VPSTTT AI)) từ chối: Giọng quảng cáo lộ liễu; Seeding vụng (AI chấm 6/10)")).toEqual(["Giọng quảng cáo lộ liễu", "Seeding vụng"]);
    expect(reviewPoints("AI duyệt cuối (Claude Opus) từ chối: Nhắc tên đối thủ")).toEqual(["Nhắc tên đối thủ"]);
  });

  it("separates a refusal from the review after it, and takes the approver's full reasons over a shortened note", () => {
    // As older backends stored it: the refusal cut at 450 characters, then the review.
    const note = "AI duyệt cuối (Claude Opus) từ chối: Không phải câu hỏi thật; Xoá ghi chú nội bộ cho operator, k. Cần xem lại (AI chấm 6/10): AI đánh giá không hợp nơi đăng: cần ca lỗi thật; Câu discl";
    expect(reviewPoints(note)).toEqual([
      "Không phải câu hỏi thật", "Xoá ghi chú nội bộ cho operator, k", "AI đánh giá không hợp nơi đăng: cần ca lỗi thật", "Câu discl",
    ]);
    expect(reviewPoints(note, ["Không phải câu hỏi thật", "Xoá ghi chú nội bộ cho operator", "Câu 'Disclosure: this brief…' lộ brief: viết lại tự nhiên"])).toEqual([
      "Không phải câu hỏi thật", "Xoá ghi chú nội bộ cho operator", "Câu 'Disclosure: this brief…' lộ brief: viết lại tự nhiên",
      "AI đánh giá không hợp nơi đăng: cần ca lỗi thật", "Câu discl",
    ]);
    // A note without a refusal ignores the approver's reasons.
    expect(reviewPoints("Cần xem lại (AI chấm 5/10): Thiếu số liệu", ["Khác"])).toEqual(["Thiếu số liệu"]);
  });
});

describe("minimum AI score to approve", () => {
  it("keeps a whole score from 1 to 10 and falls back to 7 otherwise", () => {
    expect(normalizeMinScore("8")).toBe(8);
    expect(normalizeMinScore(10)).toBe(10);
    expect(normalizeMinScore("6.6")).toBe(7);
    for (const bad of ["", "0", "11", "abc", null]) expect(normalizeMinScore(bad)).toBe(7);
  });
});
