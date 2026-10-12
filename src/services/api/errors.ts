export class ApiError extends Error {
  constructor(message: string, public readonly code = "API_ERROR", public readonly status = 0, public readonly details?: Record<string, unknown>, public readonly requestId?: string) { super(message); this.name = "ApiError"; }
}
export function getErrorMessage(error: unknown) { if (error instanceof ApiError) return error.message; if (error instanceof Error) return error.message; return "Đã xảy ra lỗi không xác định."; }

function requestIdSuffix(error: ApiError) {
  return error.requestId ? ` Mã yêu cầu: ${error.requestId}.` : "";
}

/** Turns provider-facing AI errors into actionable Vietnamese UI copy. */
export function getAiGenerationErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return getErrorMessage(error);

  const message = error.message.toLowerCase();
  const provider = message.includes("gemini")
    ? "Google Gemini"
    : message.includes("deepseek")
      ? "DeepSeek"
      : message.includes("openai")
        ? "OpenAI"
        : "Nhà cung cấp AI";
  let actionable = error.message;

  if (message.includes("insufficient balance") || message.includes("insufficient quota")) {
    actionable = `${provider} đã hết số dư hoặc quota. Hãy nạp quota hoặc chọn AI khác.`;
  } else if (error.code === "PLATFORM_AUTH_FAILED" || message.includes("rejected the configured api credentials")) {
    actionable = `API key của ${provider} không hợp lệ hoặc không có quyền sử dụng model. Hãy cập nhật key trong backend.`;
  } else if (error.code === "PLATFORM_RATE_LIMITED" || error.status === 429) {
    actionable = `${provider} đang giới hạn tốc độ. Hãy đợi một lúc hoặc chọn AI khác rồi thử lại.`;
  } else if (error.status === 504 || message.includes("timed out")) {
    actionable = `${provider} phản hồi quá chậm. Hãy thử lại hoặc chọn AI khác.`;
  } else if (error.status === 503 || message.includes("temporarily unavailable")) {
    actionable = `${provider} đang quá tải hoặc tạm thời không khả dụng. Dữ liệu đã nhập vẫn được giữ; hãy chọn AI khác hoặc đợi vài phút rồi thử lại.`;
  }

  return `${actionable}${requestIdSuffix(error)}`;
}
