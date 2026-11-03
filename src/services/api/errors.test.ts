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

  it("tells the operator what to check when the IDE AI API refuses the key or the request", () => {
    const refused = new ApiError(
      "VPSTTT AI refused the key. Check VPSTTT_AI_API_KEY, the key's allowed IPs and that the IDE AI API is enabled for its owner",
      "PLATFORM_AUTH_FAILED",
      502,
    );
    expect(getAiGenerationErrorMessage(refused)).toContain("IP được phép của key");
    const rejected = new ApiError("VPSTTT AI rejected the request (unsupported parameter, model or input size)", "PLATFORM_API_ERROR", 502);
    expect(getAiGenerationErrorMessage(rejected)).toContain("VPSTTT_AI_MODEL");
    const busy = new ApiError("VPSTTT AI rate limit was reached. Try again later", "PLATFORM_RATE_LIMITED", 429);
    expect(getAiGenerationErrorMessage(busy)).toBe("VPSTTT AI đang giới hạn tốc độ. Hãy đợi một lúc hoặc chọn AI khác rồi thử lại.");
  });

  it("preserves ordinary errors", () => {
    expect(getAiGenerationErrorMessage(new Error("Validation failed"))).toBe("Validation failed");
  });

  it("explains automatic key rotation and the earliest retry without exposing keys", () => {
    const error = new ApiError("All configured Gemini API keys are quota-limited", "PLATFORM_RATE_LIMITED", 429,
      { configuredKeys: 4, retryAt: "2026-10-30T13:40:00Z" }, "quota-request");
    const message = getAiGenerationErrorMessage(error);
    expect(message).toContain("Cả 4 key Gemini");
    expect(message).toContain("đã tự chuyển key");
    expect(message).toContain("Có thể thử lại từ");
    expect(message).toContain("dùng chung quota");
    expect(message).toContain("quota-request");
  });

  it("still explains quota errors from older backends without retry metadata", () => {
    const message = getAiGenerationErrorMessage(new ApiError("All configured Gemini API keys are quota-limited", "PLATFORM_RATE_LIMITED", 429));
    expect(message).toContain("Tất cả key Gemini");
    expect(message).not.toContain("Invalid Date");
  });
});
