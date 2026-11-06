import { describe, expect, it } from "vitest";
import { getNeedsActionMessage, isExtensionClaimStuck } from "./needs-action-feedback";

describe("getNeedsActionMessage", () => {
  it("preserves the specific reason that the extension could not submit", () => {
    expect(getNeedsActionMessage({ kind: "EXTENSION_ACTION", reason: "WAITING_USER", message: "Chưa chọn được cộng đồng nhận bài." })).toBe("Chưa chọn được cộng đồng nhận bài.");
    expect(getNeedsActionMessage({ kind: "EXTENSION_ACTION", reason: "SUBMIT_UNCONFIRMED" })).toContain("chưa thấy bài mới");
  });
  it("turns browser challenge codes into actionable operator guidance", () => {
    expect(getNeedsActionMessage({ kind: "BROWSER_LOGIN", reason: "TWO_FACTOR_REQUIRED" })).toContain("Chromium helper");
    expect(getNeedsActionMessage({ kind: "BROWSER_REVIEW", reason: "EDITOR_NOT_FOUND" })).toContain("box/đường dẫn");
    expect(getNeedsActionMessage({ kind: "BROWSER_REVIEW", reason: "AUTOMATION_BUSY" })).toContain("Đợi tác vụ");
  });

  it("does not suggest bypassing platform policy", () => {
    expect(getNeedsActionMessage({ kind: "POLICY_BLOCKED", message: "Blocked" })).toContain("bàn giao an toàn");
  });

  it("explains the new extension stops: too long, editor did not keep the text, job being posted", () => {
    expect(getNeedsActionMessage({ kind: "EXTENSION_ACTION", reason: "CONTENT_TOO_LONG" })).toContain("Rút gọn bài");
    expect(getNeedsActionMessage({ kind: "EXTENSION_ACTION", reason: "CONTENT_MISMATCH" })).toContain("không giữ đúng nội dung");
    expect(getNeedsActionMessage({ kind: "EXTENSION_PENDING", claimedAt: "2026-11-04T09:00:00Z" })).toContain("đang đăng");
    expect(getNeedsActionMessage({ kind: "EXTENSION_PENDING" })).toContain("Đang chờ tiện ích");
    expect(getNeedsActionMessage({ kind: "EXTENSION_PENDING", outdatedExtension: { deviceName: "Chrome VPS", engine: "vanilla" } }))
      .toBe('Tiện ích Chrome trên "Chrome VPS" là bản cũ, chưa đăng được nền tảng này nên bỏ qua bài. Cập nhật tiện ích lên bản mới nhất rồi bấm Tải lại ở chrome://extensions; bài sẽ tự đăng.');
  });
});

describe("isExtensionClaimStuck", () => {
  it("is true only for a job claimed more than 10 minutes ago", () => {
    const now = Date.parse("2026-11-04T10:00:00Z");
    expect(isExtensionClaimStuck({ kind: "EXTENSION_PENDING", claimedAt: "2026-11-04T09:49:00Z" }, now)).toBe(true);
    expect(isExtensionClaimStuck({ kind: "EXTENSION_PENDING", claimedAt: "2026-11-04T09:55:00Z" }, now)).toBe(false);
    expect(isExtensionClaimStuck({ kind: "EXTENSION_PENDING" }, now)).toBe(false);
    expect(isExtensionClaimStuck({ kind: "EXTENSION_ACTION", claimedAt: "2026-11-04T09:00:00Z" }, now)).toBe(false);
    expect(isExtensionClaimStuck(undefined, now)).toBe(false);
  });
});
