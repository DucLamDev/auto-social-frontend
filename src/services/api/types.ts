export interface ApiSuccess<T> { success: true; data: T; meta?: Record<string, unknown> & { requestId?: string; timestamp?: string; page?: number; limit?: number; total?: number; totalPages?: number }; }
export interface ApiFailure { success: false; error: { code: string; message: string; details?: Record<string, unknown> }; meta?: { requestId?: string; timestamp?: string }; }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export interface ListResult<T> { items: T[]; meta?: ApiSuccess<T[]>["meta"]; }
export interface RequestOptions extends Omit<RequestInit, "body"> { body?: unknown; query?: Record<string, string | number | boolean | null | undefined>; skipAuthRefresh?: boolean; }
