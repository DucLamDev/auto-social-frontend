export class ApiError extends Error {
  constructor(message: string, public readonly code = "API_ERROR", public readonly status = 0, public readonly details?: Record<string, unknown>, public readonly requestId?: string) { super(message); this.name = "ApiError"; }
}
export function getErrorMessage(error: unknown) { if (error instanceof ApiError) return error.message; if (error instanceof Error) return error.message; return "Đã xảy ra lỗi không xác định."; }
