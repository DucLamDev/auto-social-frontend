import { describe, expect, it } from "vitest";
import { getNeedsActionMessage } from "./needs-action-feedback";

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
});
