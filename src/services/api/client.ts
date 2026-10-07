import { API_V1_URL } from "@/config/env";
import { ApiError } from "./errors";
import { tokenStore } from "./token-store";
import type { ApiResponse, ListResult, RequestOptions } from "./types";

let refreshPromise: Promise<string | null> | null = null;
function createUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_V1_URL}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(query ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value)); });
  return url.toString();
}
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${API_V1_URL}/auth/refresh`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
    .then(async (response) => { if (!response.ok) return null; const result = (await response.json()) as ApiResponse<{ accessToken?: string }>; const token = result.success ? result.data.accessToken ?? null : null; if (token) tokenStore.set(token); return token; })
    .catch(() => null).finally(() => { refreshPromise = null; });
  return refreshPromise;
}
export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { body, query, skipAuthRefresh, headers: extraHeaders, ...init } = options;
  const token = tokenStore.get(); const headers = new Headers(extraHeaders); headers.set("Accept", "application/json");
  if (body !== undefined && !(body instanceof FormData)) headers.set("Content-Type", "application/json"); if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try { response = await fetch(createUrl(path, query), { ...init, credentials: "include", headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }); }
  catch (cause) { throw new ApiError("Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và cấu hình API.", "NETWORK_ERROR", 0, cause instanceof Error ? { cause: cause.message } : undefined); }
  const canRefresh = path !== "/auth/login" && path !== "/auth/refresh";
  if (response.status === 401 && !retried && !skipAuthRefresh && canRefresh) { const token = await refreshAccessToken(); if (token) return apiRequest<T>(path, options, true); }
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) { const failure = payload && !payload.success ? payload : null; if (response.status === 401) tokenStore.clear(); throw new ApiError(failure?.error.message || `Yêu cầu thất bại (${response.status}).`, failure?.error.code || "HTTP_ERROR", response.status, failure?.error.details, failure?.meta?.requestId || response.headers.get("x-request-id") || undefined); }
  return payload.data;
}
export async function apiList<T>(path: string, options: RequestOptions = {}): Promise<ListResult<T>> {
  const { body, query, skipAuthRefresh, headers: extraHeaders, ...init } = options;
  const token = tokenStore.get(); const headers = new Headers(extraHeaders); headers.set("Accept", "application/json"); if (body !== undefined) headers.set("Content-Type", "application/json"); if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try { response = await fetch(createUrl(path, query), { ...init, credentials: "include", headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch (cause) { throw new ApiError("Không thể kết nối tới máy chủ.", "NETWORK_ERROR", 0, cause instanceof Error ? { cause: cause.message } : undefined); }
  if (response.status === 401 && !skipAuthRefresh) { const nextToken = await refreshAccessToken(); if (nextToken) return apiList<T>(path, { ...options, skipAuthRefresh: true }); tokenStore.clear(); }
  const payload = (await response.json().catch(() => null)) as ApiResponse<T[]> | null;
  if (!response.ok || !payload?.success) { const failure = payload && !payload.success ? payload : null; if (response.status === 401) tokenStore.clear(); throw new ApiError(failure?.error.message || `Yêu cầu thất bại (${response.status}).`, failure?.error.code || "HTTP_ERROR", response.status, failure?.error.details, failure?.meta?.requestId); }
  return { items: payload.data, meta: payload.meta };
}
