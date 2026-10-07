import { afterEach, describe, expect, it, vi } from "vitest";
import { apiList, apiRequest } from "./client";
import { tokenStore } from "./token-store";

afterEach(() => { vi.unstubAllGlobals(); tokenStore.clear(); });
describe("apiRequest", () => {
  it("unwraps the standard success envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: "1" }, meta: {} }), { status: 200, headers: { "content-type": "application/json" } })));
    await expect(apiRequest<{ id: string }>("/example")).resolves.toEqual({ id: "1" });
  });
  it("maps API failures to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: "PLATFORM_RATE_LIMITED", message: "Slow down" }, meta: { requestId: "req-1" } }), { status: 429, headers: { "content-type": "application/json" } })));
    await expect(apiRequest("/example", { skipAuthRefresh: true })).rejects.toEqual(expect.objectContaining({ code: "PLATFORM_RATE_LIMITED", status: 429, requestId: "req-1" }));
  });
  it("provides a useful network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(apiRequest("/example")).rejects.toEqual(expect.objectContaining({ code: "NETWORK_ERROR", status: 0 }));
  });
  it("refreshes once and retries auth/me after a reload", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: { code: "AUTH_TOKEN_INVALID", message: "Expired" } }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { accessToken: "new-token" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: "user-1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest<{ id: string }>("/auth/me")).resolves.toEqual({ id: "user-1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retriedRequest = fetchMock.mock.calls[2]?.[1] as RequestInit;
    expect(new Headers(retriedRequest.headers).get("Authorization")).toBe("Bearer new-token");
  });
  it("clears stale auth state when a list request cannot refresh", async () => {
    tokenStore.set("expired-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: { code: "AUTH_TOKEN_INVALID", message: "Expired" } }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: { code: "AUTH_TOKEN_INVALID", message: "Refresh expired" } }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiList("/contents")).rejects.toEqual(expect.objectContaining({ status: 401 }));
    expect(tokenStore.get()).toBeNull();
  });
});
