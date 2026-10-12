import { describe, expect, it } from "vitest";
import { ApiError, getAiGenerationErrorMessage } from "./errors";

describe("getAiGenerationErrorMessage", () => {
  it("explains a temporary Gemini outage and keeps the request id", () => {
    const error = new ApiError(
      "Google Gemini is temporarily unavailable",
      "INFRASTRUCTURE_UNAVAILABLE",
      503,
      undefined,
      "request-123",
    );

    expect(getAiGenerationErrorMessage(error)).toContain("Google Gemini đang quá tải");
    expect(getAiGenerationErrorMessage(error)).toContain("request-123");
  });

  it("explains exhausted DeepSeek quota", () => {
    const error = new ApiError(
      "DeepSeek account has insufficient balance or quota",
      "INFRASTRUCTURE_UNAVAILABLE",
      503,
    );

    expect(getAiGenerationErrorMessage(error)).toBe("DeepSeek đã hết số dư hoặc quota. Hãy nạp quota hoặc chọn AI khác.");
  });

  it("preserves ordinary errors", () => {
    expect(getAiGenerationErrorMessage(new Error("Validation failed"))).toBe("Validation failed");
  });
});
