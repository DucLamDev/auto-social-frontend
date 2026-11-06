import { aiApprovalRunning, type AiProviderOption, type AiRole, type Content, type ContentVariant, type PlatformAccount } from "@/types/domain";

export const MAX_AUTOMATION_PLATFORMS = 50;

export function getAutomationAccountBlocker(account: PlatformAccount): string | undefined {
  if (!account.enabled || account.status === "DISABLED") return "Tài khoản đang tắt.";
  // The Chrome extension posts for any forum; it only needs the account to be connected.
  if (account.settings?.delivery === "extension") return account.settings.extensionAutoSubmit === false ? "Chưa bật tự động bấm Đăng." : account.status === "CONNECTED" ? undefined : "Tài khoản chưa kết nối.";
  if (account.platform?.mode === "MANUAL") {
    return account.platform.connectorStatus === "API_REVIEW_REQUIRED"
      ? "Chưa có connector API đã duyệt cho nền tảng này."
      : "Chưa có API connector hoặc adapter Playwright đã kiểm thử; điểm đến này chỉ hỗ trợ bàn giao thủ công.";
  }
  if (account.status !== "CONNECTED") {
    return account.platform?.mode === "BROWSER_ASSISTED"
      ? "Session Playwright chưa sẵn sàng; hãy đăng nhập hoặc kết nối lại ở trang Tài khoản."
      : "Tài khoản chưa kết nối.";
  }
  if (account.platform?.mode !== "BROWSER_ASSISTED") return undefined;
  if (account.settings?.browserAutoSubmit !== true) {
    return "Chưa bật tự bấm nút đăng cuối cùng trong cấu hình Playwright.";
  }
  if ("automationPermissionAttested" in (account.settings ?? {})
    && account.settings?.automationPermissionAttested !== true) {
    return "Chưa xác nhận quyền sử dụng automation cho điểm đến này.";
  }
  return undefined;
}

export function isAutomationAccountEligible(account: PlatformAccount) {
  const supportedMode = ["OFFICIAL_API", "COMPATIBLE_API", "BROWSER_ASSISTED"]
    .includes(account.platform?.mode ?? "") || account.settings?.delivery === "extension";
  return supportedMode && !getAutomationAccountBlocker(account);
}

export function isCampaignReadyContent(content: Content) {
  return content.status === "GENERATED" || content.status === "APPROVED";
}

export function getApprovedVariantForAccount(account: PlatformAccount, variants: ContentVariant[]) {
  const platformSlug = account.platform?.slug;
  if (!platformSlug) return undefined;
  return variants.find((variant) => variant.status === "APPROVED" && variant.platformSlug === platformSlug);
}

export function getEligibleAccounts(accounts: PlatformAccount[], variants: ContentVariant[]) {
  return accounts.filter((account) => account.enabled && account.status === "CONNECTED" && Boolean(getApprovedVariantForAccount(account, variants)));
}

export function normalizeAutomationAccountIds(accountIds: string[]) {
  return [...new Set(accountIds)].sort();
}

function automationPlatformKey(account: PlatformAccount) {
  return account.platform?.slug ?? account.platformId;
}

export function countAutomationPlatforms(accounts: PlatformAccount[], accountIds: string[]) {
  const selectedIds = new Set(accountIds);
  return new Set(accounts.filter((account) => selectedIds.has(account.id)).map(automationPlatformKey)).size;
}

export function defaultAutomationAccountIds(accounts: PlatformAccount[]) {
  const platformKeys = new Set<string>();
  return accounts.filter((account) => {
    const platformKey = automationPlatformKey(account);
    if (platformKeys.has(platformKey)) return true;
    if (platformKeys.size >= MAX_AUTOMATION_PLATFORMS) return false;
    platformKeys.add(platformKey);
    return true;
  }).map((account) => account.id);
}

export function canAddAutomationAccount(accounts: PlatformAccount[], accountIds: string[], account: PlatformAccount) {
  const selectedIds = new Set(accountIds);
  const selectedKeys = new Set(accounts
    .filter((item) => selectedIds.has(item.id))
    .map(automationPlatformKey));
  return selectedKeys.has(automationPlatformKey(account)) || selectedKeys.size < MAX_AUTOMATION_PLATFORMS;
}

export function deriveAutomationCampaignName(name: string, brief: string) {
  const explicitName = name.replace(/\s+/g, " ").trim();
  if (explicitName) return explicitName;
  const normalizedBrief = brief.replace(/\s+/g, " ").trim();
  const codePoints = Array.from(normalizedBrief);
  return codePoints.length <= 120 ? normalizedBrief : `${codePoints.slice(0, 119).join("").trimEnd()}…`;
}

export function includeImageAltText(brief: string, altText?: string) {
  const normalizedBrief = brief.trim();
  const normalizedAltText = altText?.replace(/\s+/g, " ").trim();
  return normalizedAltText
    ? `${normalizedBrief}\n\nNgữ cảnh ảnh để tạo caption/alt text chính xác (không viết nội dung phụ thuộc vào việc ảnh xuất hiện vì một số kênh có thể dùng bản chỉ có văn bản): ${normalizedAltText}`
    : normalizedBrief;
}

/** A planned image not created yet: the post is not ready to approve. */
export const imagePending = (variant: Pick<ContentVariant, "image">) => variant.image?.status === "pending" || variant.image?.status === "generating";

/** What an approval left out: accounts of the approved platform that were not ready, drafts kept waiting. */
export type ReviewOutcome = {
  skippedAccounts?: { name: string; platform: string; reasonLabel: string }[];
  waitingVariantIds?: string[];
  /** Drafts kept waiting because they are longer than their destination allows (backend 1.17.0+). */
  overLimitVariants?: { id: string; platform: string; length: number; maxChars: number; message: string }[];
  /** Drafts kept waiting because the final AI approver has not approved their current text. */
  unapprovedVariants?: { id: string; platform: string; message: string }[];
};

/** One warning for the reviewer after an approval, or null when every account received its post. */
export function reviewOutcomeWarning(outcome: ReviewOutcome | void | undefined, platformOf: (variantId: string) => string | undefined): string | null {
  const parts: string[] = [];
  const skipped = outcome?.skippedAccounts ?? [];
  if (skipped.length) {
    parts.push(`Không đăng lên ${skipped.length} tài khoản chưa sẵn sàng: ${skipped.map((account) => `${account.name.includes(account.platform) ? account.name : `${account.name} · ${account.platform}`} (${account.reasonLabel})`).join("; ")}.`);
  }
  const overLimit = outcome?.overLimitVariants ?? [];
  const unapproved = outcome?.unapprovedVariants ?? [];
  // Over-limit and unapproved drafts are also listed as waiting; they wait for a shorter text or
  // for the final AI approval, not for an account.
  const notForAccount = new Set([...overLimit, ...unapproved].map((variant) => variant.id));
  const waiting = [...new Set((outcome?.waitingVariantIds ?? []).filter((id) => !notForAccount.has(id)).map((id) => platformOf(id) ?? "một nền tảng"))];
  if (waiting.length) {
    parts.push(`Bài ${waiting.join(", ")} vẫn chờ duyệt vì chưa có tài khoản nào sẵn sàng. Kết nối lại tài khoản ở trang Tài khoản rồi bấm "Duyệt & đăng bài này".`);
  }
  if (overLimit.length) {
    parts.push(`Chưa đăng ${overLimit.length} bài dài quá giới hạn ký tự: ${overLimit.map((variant) => `${variant.platform} ${variant.length}/${variant.maxChars}`).join(", ")}. Rút gọn bài (hoặc dùng "Viết lại bằng AI") rồi duyệt lại.`);
  }
  if (unapproved.length) {
    parts.push(`Chưa đăng ${unapproved.length} bài chưa được AI duyệt cuối: ${unapproved.map((variant) => variant.message.trim() ? `${variant.platform} (${variant.message.trim().replace(/[.。]+$/u, "")})` : variant.platform).join("; ")}. Sửa bài hoặc chờ AI duyệt xong rồi duyệt lại.`);
  }
  return parts.length ? parts.join(" ") : null;
}

/** The AI editor's score in a draft's review note ("… (AI chấm 8/10)"), or null when it was not scored. */
export function aiScore(reason?: string | null): number | null {
  const match = /AI chấm (\d{1,2})\/10/.exec(reason ?? "");
  return match ? Number(match[1]) : null;
}

/**
 * The separate fixes in a "Cần xem lại (AI chấm 7/10): a; b; c" review note. The
 * server joins them with "; ", and a fix may itself contain "; " followed by a
 * lower-case word, so only a "; " before a capital letter or a quote starts a new one.
 */
export function reviewPoints(reason?: string | null): string[] {
  const text = (reason ?? "")
    .replace(/^\s*Cần xem lại\s*\([^)]*\)\s*:\s*/u, "")
    // A post the final approver refused: "AI duyệt cuối (Claude Opus) từ chối: a; b (AI chấm 6/10)".
    .replace(/^\s*AI duyệt cuối\s*\(.*?\)\s*từ chối\s*:\s*/u, "")
    .replace(/\s*\(AI chấm \d{1,2}\/10\)\s*$/u, "")
    .trim();
  return text ? [...new Set(text.split(/;\s+(?=[\p{Lu}"'“‘(])/u).map((point) => point.trim()).filter(Boolean))] : [];
}

export const DEFAULT_APPROVE_MIN_SCORE = 7;
const APPROVE_MIN_SCORE_KEY = "auto-social:approve-min-score";

/** A whole score from 1 to 10; anything else falls back to the default. */
export function normalizeMinScore(value: unknown): number {
  const score = Math.round(Number(value));
  return Number.isFinite(score) && score >= 1 && score <= 10 ? score : DEFAULT_APPROVE_MIN_SCORE;
}

/** The "approve posts scoring at least N" threshold this browser remembers. */
export function readApproveMinScore(): number {
  try { return normalizeMinScore(window.localStorage.getItem(APPROVE_MIN_SCORE_KEY) ?? DEFAULT_APPROVE_MIN_SCORE); }
  catch { return DEFAULT_APPROVE_MIN_SCORE; }
}

export function saveApproveMinScore(score: number) {
  try { window.localStorage.setItem(APPROVE_MIN_SCORE_KEY, String(normalizeMinScore(score))); } catch { /* private mode: keep it for this page only */ }
}

/** Short name of an AI model for a chip: "Claude Opus" → "Opus", "GPT (VPSTTT AI)" → "GPT", "OpenAI · gpt-5" → "OpenAI". */
export function shortAiLabel(label?: string | null): string {
  const text = (label ?? "").trim();
  if (!text) return "AI duyệt cuối";
  return text.replace(/^Claude\s+/i, "").replace(/\s*\(.*\)\s*$/u, "").split(" · ")[0]!.trim() || text;
}

/** Name of the writer model chosen for a run, as the server names its AI roles. */
export function writerLabel(option: Pick<AiProviderOption, "id" | "label" | "model">): string {
  const claude = /^claude:(\w+)/i.exec(option.model);
  if (option.id === "vpsttt" && claude) return `Claude ${claude[1]!.charAt(0).toUpperCase()}${claude[1]!.slice(1).toLowerCase()}`;
  if (option.id === "vpsttt" && /^gpt:/i.test(option.model)) return "GPT (VPSTTT AI)";
  return option.model ? `${option.label} · ${option.model}` : option.label;
}

/** True when the writer is the same provider and model as a reviewing role (an empty role model is the provider's configured one). */
export function sameAiModel(writer: Pick<AiProviderOption, "id" | "model">, role: Pick<AiRole, "provider" | "model">): boolean {
  const model = (value: string) => value.trim().toLowerCase();
  return writer.id === role.provider && (!role.model.trim() || model(role.model) === model(writer.model));
}

export type ApprovalGateState = "approved" | "running" | "rejected" | "failed" | "missing" | "stale" | "off";
export type ApprovalGate = { ok: boolean; state: ApprovalGateState; message: string };

/**
 * Whether the final AI approver lets this post be approved. With the gate on, only a post whose
 * current text the approver said yes to may be approved or published; a rejected one never can
 * until it is edited or rewritten (the server then re-approves it on its own).
 */
export function approvalGate(variant: Pick<ContentVariant, "aiApproval" | "aiApprovalCurrent">, approvalEnabled: boolean): ApprovalGate {
  if (!approvalEnabled) return { ok: true, state: "off", message: "" };
  const approval = variant.aiApproval;
  if (!approval) return { ok: false, state: "missing", message: "Chưa được AI duyệt cuối." };
  const label = approval.approverLabel.trim() || "AI duyệt cuối";
  // A run lost to a server restart never ends by itself: it can be started again, like a failed one.
  if (approval.status === "running" && !aiApprovalRunning(approval)) return { ok: false, state: "failed", message: `Lượt duyệt của ${label} bị gián đoạn. Cho AI duyệt lại.` };
  // A verdict (or a run) on an older text says nothing about this one. Only an explicit false means the text changed.
  if (variant.aiApprovalCurrent === false) return { ok: false, state: "stale", message: "Bài đã sửa sau lần duyệt cuối, chờ AI duyệt lại." };
  if (approval.status === "running") return { ok: false, state: "running", message: `${label} đang đọc bài…` };
  if (approval.status === "failed") return { ok: false, state: "failed", message: `${label} chưa duyệt được bài này. Cho AI duyệt lại.` };
  if (approval.status === "rejected") return { ok: false, state: "rejected", message: `${label} từ chối bài này. Sửa bài hoặc viết lại bằng AI; bài mới được duyệt lại tự động.` };
  return { ok: true, state: "approved", message: `${label} đã duyệt bài này.` };
}
