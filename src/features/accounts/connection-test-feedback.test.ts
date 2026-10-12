import { describe, expect, it } from "vitest";
import { ApiError } from "@/services/api/errors";
import { getBrowserConnectionErrorMessage, getTagPolicyWarning } from "./connection-test-feedback";

describe("getTagPolicyWarning", () => {
  it("does not warn for an ordinary successful connection test", () => {
    expect(getTagPolicyWarning({ ok: true, details: {} })).toBeUndefined();
  });

  it("tells the user to add default tags and run a staging post below the reported lower bound", () => {
    const warning = getTagPolicyWarning({
      ok: true,
      details: {
        tagPolicyRequiresStagingVerification: true,
        configuredTagCountBelowReportedLowerBound: true,
        configuredDefaultTagCount: 1,
        reportedTagCountLowerBound: 2,
        requiredTagGroups: [{ name: "product", minCount: 1 }],
      },
    });

    expect(warning).toContain("ít nhất 2 tag");
    expect(warning).toContain("mới cấu hình 1");
    expect(warning).toContain("defaultTags");
    expect(warning).toContain("staging");
  });

  it("still requires staging when the reported count is met because tag groups need server validation", () => {
    const warning = getTagPolicyWarning({
      ok: true,
      details: {
        tagPolicyRequiresStagingVerification: true,
        configuredTagCountBelowReportedLowerBound: false,
        configuredDefaultTagCount: 2,
        reportedTagCountLowerBound: 2,
        requiredTagGroups: [
          { name: "product", minCount: 1 },
          { name: "version", minCount: 1 },
        ],
      },
    });

    expect(warning).toContain("2 nhóm tag bắt buộc");
    expect(warning).toContain("staging");
    expect(warning).toContain("chỉ xác nhận quyền API");
  });

  it("explains that configured tags need staging validation even without a reported forum minimum", () => {
    const warning = getTagPolicyWarning({
      ok: true,
      details: {
        tagPolicyRequiresStagingVerification: true,
        configuredTagCountBelowReportedLowerBound: false,
        configuredDefaultTagCount: 3,
        reportedTagCountLowerBound: 0,
        requiredTagGroups: [],
      },
    });

    expect(warning).toContain("Đã cấu hình 3 defaultTags");
    expect(warning).toContain("tag tồn tại");
    expect(warning).toContain("được phép sử dụng");
    expect(warning).toContain("staging");
    expect(warning).not.toContain("Forum có chính sách tag");
  });

  it("does not show a success warning for a failed test", () => {
    expect(getTagPolicyWarning({
      ok: false,
      details: { tagPolicyRequiresStagingVerification: true },
    })).toBeUndefined();
  });
});

describe("getBrowserConnectionErrorMessage", () => {
  it("turns an authentication challenge into a reconnect instruction without exposing details", () => {
    const message = getBrowserConnectionErrorMessage(new ApiError(
      "The login page is visible",
      "CONNECTOR_NEEDS_ACTION",
      409,
      { reason: "LOGIN_REQUIRED" },
      "request-42",
    ));
    expect(message).toContain("helper đăng nhập");
    expect(message).toContain("request-42");
  });

  it("distinguishes a changed editor from an expired session", () => {
    expect(getBrowserConnectionErrorMessage(new ApiError(
      "Expected editor missing",
      "CONNECTOR_NEEDS_ACTION",
      409,
      { reason: "EDITOR_NOT_FOUND" },
    ))).toContain("box/đường dẫn");
  });
});
