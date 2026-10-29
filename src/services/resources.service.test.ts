import { afterEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/services/api/token-store";
import { resourcesService } from "./resources.service";

function apiResponse(data: unknown) {
  return new Response(JSON.stringify({
    success: true,
    data,
    meta: { requestId: "req-test", timestamp: "2026-10-08T00:00:00.000Z" },
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("resourcesService contract adapters", () => {
  it("forwards platform pagination and catalog filters to the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: [{
        id: "platform-approved-editor",
        slug: "approved-editor",
        name: "Approved Editor",
        mode: "BROWSER_ASSISTED",
        availability: "CREDENTIAL_REQUIRED",
        connectorKey: "browser-assisted",
        groupKey: "BLOGGING",
        defaultSettings: { publishMode: "draft" },
        enabled: true,
        capability: { text: true, article: true },
        _count: { accounts: 1 },
      }],
      meta: {
        requestId: "req-platform-page",
        timestamp: "2026-10-09T00:00:00.000Z",
        page: 2,
        limit: 12,
        total: 22,
        totalPages: 2,
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await resourcesService.platforms({
      page: 2,
      limit: 12,
      search: "approved",
      group: "BLOGGING",
      mode: "BROWSER_ASSISTED",
      availability: "CREDENTIAL_REQUIRED",
      enabled: false,
    });

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(Object.fromEntries(requested.searchParams)).toEqual({
      page: "2",
      limit: "12",
      search: "approved",
      group: "BLOGGING",
      mode: "BROWSER_ASSISTED",
      availability: "CREDENTIAL_REQUIRED",
      enabled: "false",
    });
    expect(response.meta).toMatchObject({ page: 2, limit: 12, total: 22, totalPages: 2 });
    expect(response.items[0]).toEqual(expect.objectContaining({
      slug: "approved-editor",
      groupKey: "BLOGGING",
      connectorKey: "browser-assisted",
      defaultSettings: { publishMode: "draft" },
      accountCount: 1,
    }));
  });

  it("loads the public AI provider catalog without requiring browser-side secrets", async () => {
    const providers = [
      { id: "openai", label: "OpenAI", model: "gpt-5-mini", configured: false, isDefault: false },
      { id: "deepseek", label: "DeepSeek", model: "deepseek-flash", configured: true, isDefault: true },
      { id: "gemini", label: "Google Gemini", model: "gemini-3.8-flash", configured: false, isDefault: false },
    ];
    const fetchMock = vi.fn().mockResolvedValue(apiResponse(providers));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resourcesService.aiProviders()).resolves.toEqual(providers);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/ai/providers",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(JSON.stringify(providers)).not.toMatch(/api[_-]?key|secret/i);
  });

  it("maps the explicit encrypted browser-session readiness flag without exposing storage state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "account-browser",
      platformId: "platform-voz",
      name: "VOZ",
      enabled: true,
      status: "CONNECTED",
      browserSessionConfigured: true,
      settings: { browserAutoSubmit: true },
      platform: {
        slug: "voz-forums",
        name: "Voz Forums",
        mode: "BROWSER_ASSISTED",
        availability: "READY",
        connectorKey: "browser-assisted",
      },
      credential: { status: "ACTIVE" },
    }])));

    const response = await resourcesService.accounts();
    expect(response.items[0]?.browserSessionConfigured).toBe(true);
    expect(response.items[0]).not.toHaveProperty("storageState");
    expect(response.items[0]?.credential).toEqual({ status: "ACTIVE" });
  });

  it("maps the campaign progress fields returned by the backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "campaign-1",
      name: "Launch",
      status: "RUNNING",
      createdAt: "2026-10-08T00:00:00.000Z",
      content: { id: "content-1", title: "Launch post" },
      _count: { targets: 9 },
      progress: {
        total: 8,
        published: 3,
        failed: 1,
        needsAction: 2,
        active: 1,
        scheduled: 1,
        cancelled: 0,
      },
    }])));

    const response = await resourcesService.campaigns();

    expect(response.items[0]).toEqual(expect.objectContaining({
      targetsCount: 8,
      publishedCount: 3,
      failedCount: 1,
      needsActionCount: 2,
      activeCount: 1,
      scheduledCount: 1,
    }));
  });

  it("maps crawled articles and promotes through the source-article endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiResponse([{
        id: "article-1",
        sourceId: "source-1",
        title: "Crawled article",
        canonicalUrl: "https://example.com/article",
        tags: ["release"],
        status: "FETCHED",
        createdAt: "2026-10-08T00:00:00.000Z",
        source: { id: "source-1", name: "Example", type: "RSS" },
        content: null,
      }]))
      .mockResolvedValueOnce(apiResponse({
        id: "content-1",
        title: "Crawled article",
        body: "Body",
        status: "FETCHED",
        createdAt: "2026-10-08T00:00:00.000Z",
        sourceArticle: { source: { id: "source-1", name: "Example", type: "RSS" } },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const articles = await resourcesService.sourceArticles();
    const content = await resourcesService.promoteSourceArticle("article-1");

    expect(articles.items[0]).toEqual(expect.objectContaining({
      id: "article-1",
      status: "FETCHED",
      source: { id: "source-1", name: "Example", type: "RSS" },
    }));
    expect(content).toEqual(expect.objectContaining({ id: "content-1", source: expect.objectContaining({ id: "source-1" }) }));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:3001/api/v1/source-articles/article-1/promote");
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ method: "POST" }));
  });

  it("adapts audit entity fields to the log view model", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "audit-1",
      action: "HTTP_PATCH_PLATFORM-ACCOUNTS",
      entityType: "platform-accounts",
      entityId: "account-1",
      actor: { displayName: "Admin", email: "admin@example.com" },
      requestId: "request-1",
      after: { enabled: false },
      createdAt: "2026-10-08T00:00:00.000Z",
    }, {
      id: "audit-2",
      action: "HTTP_POST_MEDIA",
      entityType: "media",
      actorId: "12345678-abcd-0000-0000-000000000000",
      createdAt: "2026-10-08T00:01:00.000Z",
    }, {
      id: "audit-3",
      action: "SYSTEM_JOB",
      entityType: "publish-jobs",
      actorId: null,
      createdAt: "2026-10-08T00:02:00.000Z",
    }])));

    const response = await resourcesService.logs();

    expect(response.items[0]).toEqual(expect.objectContaining({
      resource: "platform-accounts",
      resourceId: "account-1",
      actor: { name: "Admin", email: "admin@example.com" },
      requestId: "request-1",
      metadata: { enabled: false },
    }));
    expect(response.items[1]?.actor).toEqual({ name: "User 12345678" });
    expect(response.items[2]?.actor).toEqual({ name: "System" });
  });

  it("uses the write-only credential endpoints without requesting secrets back", async () => {
    const account = {
      id: "account-1",
      platformId: "platform-1",
      name: "WordPress",
      enabled: true,
      status: "RECONNECT_REQUIRED",
      platform: { slug: "wordpress", name: "WordPress", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED" },
      credential: { status: "ACTIVE", updatedAt: "2026-10-08T00:00:00.000Z" },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiResponse(account))
      .mockResolvedValueOnce(apiResponse(account));
    vi.stubGlobal("fetch", fetchMock);

    await resourcesService.createAccount({ platformSlug: "wordpress", name: "Blog", credential: { applicationPassword: "secret" } });
    await resourcesService.updateAccountCredential("account-1", {
      credential: { applicationPassword: "new-secret" },
      settings: { publishStatus: "draft" },
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3001/api/v1/platform-accounts");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: "POST", body: expect.stringContaining("applicationPassword") }));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:3001/api/v1/platform-accounts/account-1/credential");
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({
        credential: { applicationPassword: "new-secret" },
        settings: { publishStatus: "draft" },
      }),
    }));
  });

  it("creates and tests a manual destination without sending a fake credential", async () => {
    const account = {
      id: "account-medium",
      platformId: "platform-medium",
      name: "Medium handoff",
      enabled: true,
      status: "CONNECTED",
      settings: { manualUrl: "https://medium.com/new-story" },
      platform: { slug: "medium", name: "Medium", mode: "MANUAL", connectorKey: "manual", availability: "MANUAL_ONLY" },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiResponse(account))
      .mockResolvedValueOnce(apiResponse({ ok: true, manual: true, ready: true, message: "Manual handoff ready" }));
    vi.stubGlobal("fetch", fetchMock);

    await resourcesService.createAccount({
      platformSlug: "medium",
      name: "Medium handoff",
      settings: { manualUrl: "https://medium.com/new-story" },
      enabled: true,
    });
    await expect(resourcesService.testAccount("account-medium")).resolves.toEqual(expect.objectContaining({
      ok: true,
      manual: true,
      ready: true,
    }));

    const createBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body));
    expect(createBody).not.toHaveProperty("credential");
    expect(createBody.settings).toEqual({ manualUrl: "https://medium.com/new-story" });
  });

  it("updates Playwright settings without sending or replacing encrypted browser state", async () => {
    const account = {
      id: "account-browser",
      platformId: "platform-voz",
      name: "VOZ",
      enabled: true,
      status: "CONNECTED",
      settings: { forumPath: "/f/cong-nghe.10", browserAutoSubmit: true },
      platform: { slug: "voz-forums", name: "Voz Forums", mode: "BROWSER_ASSISTED", connectorKey: "browser-assisted" },
      credential: { status: "ACTIVE" },
    };
    const fetchMock = vi.fn().mockResolvedValue(apiResponse(account));
    vi.stubGlobal("fetch", fetchMock);

    await resourcesService.updateAccountSettings("account-browser", {
      forumPath: "/f/cong-nghe.10",
      browserAutoSubmit: true,
      automationPermissionAttested: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/platform-accounts/account-browser/settings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          settings: {
            forumPath: "/f/cong-nghe.10",
            browserAutoSubmit: true,
            automationPermissionAttested: true,
          },
        }),
      }),
    );
    expect(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body)).not.toContain("storageState");
  });

  it("revokes a Playwright session through DELETE and maps the returned safe account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: "account-browser",
      platformId: "platform-voz",
      name: "VOZ",
      enabled: true,
      status: "RECONNECT_REQUIRED",
      lastTestedAt: null,
      browserSessionConfigured: false,
      settings: { forumPath: "/f/cong-nghe.10", browserAutoSubmit: true },
      platform: { slug: "voz-forums", name: "Voz Forums", mode: "BROWSER_ASSISTED", connectorKey: "browser-assisted" },
      credential: { status: "ACTIVE" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resourcesService.revokeBrowserSession("account-browser");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/platform-accounts/account-browser/browser-session",
      expect.objectContaining({ method: "DELETE", body: undefined }),
    );
    expect(result).toEqual(expect.objectContaining({
      id: "account-browser",
      status: "RECONNECT_REQUIRED",
      browserSessionConfigured: false,
      settings: { forumPath: "/f/cong-nghe.10", browserAutoSubmit: true },
    }));
    expect(result).not.toHaveProperty("storageState");
  });

  it("creates a manual content variant through the dedicated endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: "variant-1",
      contentId: "content-1",
      platformId: "platform-devto",
      title: "Manual DEV article",
      body: "Markdown body",
      hashtags: ["nodejs"],
      status: "GENERATED",
      platform: { slug: "devto", name: "dev.to" },
      updatedAt: "2026-10-08T00:00:00.000Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resourcesService.createVariant({
      contentId: "content-1",
      platformSlug: "devto",
      title: "Manual DEV article",
      body: "Markdown body",
      hashtags: ["nodejs"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/content-variants",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          contentId: "content-1",
          platformSlug: "devto",
          title: "Manual DEV article",
          body: "Markdown body",
          hashtags: ["nodejs"],
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: "variant-1", platformSlug: "devto" }));
  });

  it("generates AI variants only for unique connected accounts on enabled platforms", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiResponse([
        { id: "platform-devto", slug: "devto", name: "dev.to", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED", enabled: true },
        { id: "platform-discourse", slug: "discourse", name: "Discourse", mode: "COMPATIBLE_API", availability: "CREDENTIAL_REQUIRED", enabled: true },
        { id: "platform-x", slug: "x", name: "X", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED", enabled: false },
      ]))
      .mockResolvedValueOnce(apiResponse([
        { id: "account-1", platformId: "platform-devto", name: "DEV one", enabled: true, status: "CONNECTED", platform: { slug: "devto", name: "dev.to", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED" } },
        { id: "account-2", platformId: "platform-devto", name: "DEV two", enabled: true, status: "CONNECTED", platform: { slug: "devto", name: "dev.to", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED" } },
        { id: "account-3", platformId: "platform-discourse", name: "Forum", enabled: true, status: "RECONNECT_REQUIRED", platform: { slug: "discourse", name: "Discourse", mode: "COMPATIBLE_API", availability: "CREDENTIAL_REQUIRED" } },
        { id: "account-4", platformId: "platform-x", name: "Disabled X", enabled: true, status: "CONNECTED", platform: { slug: "x", name: "X", mode: "OFFICIAL_API", availability: "CREDENTIAL_REQUIRED" } },
      ]))
      .mockResolvedValueOnce(apiResponse([{
        id: "variant-1",
        contentId: "content-1",
        platformId: "platform-devto",
        title: "AI article",
        body: "Body",
        hashtags: [],
        status: "GENERATED",
        platform: { slug: "devto", name: "dev.to" },
        updatedAt: "2026-10-08T00:00:00.000Z",
      }]));
    vi.stubGlobal("fetch", fetchMock);

    await resourcesService.generateVariants("content-1", undefined, "deepseek");

    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://localhost:3001/api/v1/contents/content-1/generate");
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ platforms: ["devto"], aiProvider: "deepseek" }),
    }));
  });

  it("keeps complete manual handoff content including CTA, canonical URL and media alt text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse({
      title: "VPS guide",
      summary: "A practical guide",
      body: "Full article body",
      hashtags: ["vps", "linux"],
      cta: "Read the benchmark",
      canonicalUrl: "https://example.com/vps-guide",
      media: [{
        type: "image",
        url: "https://cdn.example.com/dashboard.webp",
        altText: "VPS dashboard",
        mimeType: "image/webp",
      }],
      openUrl: "https://medium.com/new-story",
    })));

    const payload = await resourcesService.manualPayload("job-manual");

    expect(payload.platformUrl).toBe("https://medium.com/new-story");
    expect(payload.media).toEqual([expect.objectContaining({
      url: "https://cdn.example.com/dashboard.webp",
      altText: "VPS dashboard",
    })]);
    expect(payload.content).toContain("Read the benchmark");
    expect(payload.content).toContain("Nguồn: https://example.com/vps-guide");
    expect(payload.content).toContain("Ảnh 1: https://cdn.example.com/dashboard.webp");
    expect(payload.content).toContain("Alt text: VPS dashboard");
  });

  it("separates jobs waiting for the Chrome extension from ones that need the operator", async () => {
    const job = (lastErrorCode: string | null, lastErrorMessage: string | null) => ({
      id: `job-${lastErrorCode ?? "pending"}`,
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      lastErrorCode,
      lastErrorMessage,
      platformAccount: { name: "Voz", platform: { slug: "voz-forums", name: "Voz Forums" } },
      target: { campaign: { id: "c", name: "C" }, contentVariant: { id: "v", title: "T" } },
      attempts: [{ id: "a", attemptNumber: 1, status: "SUCCEEDED", startedAt: "2026-10-24T00:00:00.000Z", responseMetadata: { extensionQueued: true } }],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([job(null, null), job("EXTENSION_CAPTCHA_REQUIRED", "Hoàn thành CAPTCHA")])));

    const response = await resourcesService.publishJobs();

    expect(response.items[0]?.needsAction).toEqual({ kind: "EXTENSION_PENDING" });
    expect(response.items[0]?.error).toBeNull();
    expect(response.items[1]?.needsAction).toEqual({ kind: "EXTENSION_ACTION", reason: "CAPTCHA_REQUIRED", message: "Hoàn thành CAPTCHA" });
    expect(response.items[1]?.error).toBeNull();
  });

  it("distinguishes an already-submitted moderation job from manual publishing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-1",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      platformAccount: {
        name: "Forum staging",
        platform: { slug: "discourse", name: "Discourse" },
      },
      target: {
        campaign: { id: "campaign-1", name: "Forum test" },
        contentVariant: { id: "variant-1", title: "Test topic" },
      },
      attempts: [{
        id: "attempt-1",
        attemptNumber: 1,
        status: "SUCCEEDED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: {
          moderationQueue: true,
          externalPostId: "42",
          url: "https://forum.example.com/t/test/42",
        },
      }],
    }])));

    const response = await resourcesService.publishJobs();

    expect(response.items[0]?.needsAction).toEqual({
      kind: "MODERATION",
      externalPostId: "42",
      url: "https://forum.example.com/t/test/42",
    });
  });

  it("marks an ambiguous Discourse submission for reconciliation instead of manual reposting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-uncertain",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      platformAccount: {
        name: "Forum staging",
        platform: { slug: "discourse", name: "Discourse" },
      },
      target: {
        campaign: { id: "campaign-1", name: "Forum test" },
        contentVariant: { id: "variant-1", title: "Test topic" },
      },
      attempts: [{
        id: "attempt-1",
        attemptNumber: 1,
        status: "SUCCEEDED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: {
          reconciliationRequired: true,
          submissionUncertain: true,
          providerExternalId: "sp-provider-id",
        },
      }],
    }])));

    const response = await resourcesService.publishJobs();

    expect(response.items[0]?.needsAction).toEqual({
      kind: "RECONCILIATION",
      canRetryAfterNotFound: true,
    });
  });

  it("does not offer provider-accepted persistence recovery jobs for resend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-persist-recovery",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      platformAccount: {
        name: "Forum staging",
        platform: { slug: "discourse", name: "Discourse" },
      },
      target: {
        campaign: { id: "campaign-1", name: "Forum test" },
        contentVariant: { id: "variant-1", title: "Test topic" },
      },
      attempts: [{
        id: "attempt-1",
        attemptNumber: 1,
        status: "SUCCEEDED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: {
          reconciliationRequired: true,
          submissionUncertain: true,
          providerAccepted: true,
          persistenceRecoveryRequired: true,
          externalPostId: "42",
        },
      }],
    }])));

    const response = await resourcesService.publishJobs();

    expect(response.items[0]?.needsAction).toEqual({
      kind: "RECONCILIATION",
      externalPostId: "42",
      canRetryAfterNotFound: false,
    });
  });

  it("maps a stale worker delivery to explicit reconciliation instead of manual reposting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-worker-crash",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      lastErrorCode: "WORKER_CRASH_UNCERTAIN_RESULT",
      lastErrorMessage: "Verify the provider before publishing again",
      platformAccount: {
        name: "Forum staging",
        platform: { slug: "discourse", name: "Discourse" },
      },
      target: {
        campaign: { id: "campaign-1", name: "Forum test" },
        contentVariant: { id: "variant-1", title: "Test topic" },
      },
      attempts: [{
        id: "attempt-1",
        attemptNumber: 1,
        status: "STARTED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: null,
      }],
    }])));

    const response = await resourcesService.publishJobs();

    expect(response.items[0]?.needsAction).toEqual({
      kind: "RECONCILIATION",
      canRetryAfterNotFound: true,
    });
  });

  it("maps a Playwright login challenge to a reconnect action with a safe CLI account id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-browser-login",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      platformAccount: {
        id: "account-browser",
        name: "VOZ",
        enabled: true,
        status: "RECONNECT_REQUIRED",
        platform: { slug: "voz-forums", name: "Voz Forums" },
      },
      target: { campaign: { id: "campaign-1", name: "VOZ post" } },
      attempts: [{
        id: "attempt-browser",
        attemptNumber: 1,
        status: "SUCCEEDED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: {
          browserAssisted: true,
          accountReconnectRequired: true,
          reason: "LOGIN_REQUIRED",
          challengeKind: "LOGIN_REQUIRED",
          message: "The platform requires a new login",
          actionUrl: "https://voz.vn/login",
        },
      }],
    }])));

    const response = await resourcesService.publishJobs();
    expect(response.items[0]?.needsAction).toEqual({
      kind: "BROWSER_LOGIN",
      accountId: "account-browser",
      reason: "LOGIN_REQUIRED",
      challengeKind: "LOGIN_REQUIRED",
      message: "The platform requires a new login",
      url: "https://voz.vn/login",
      canResumeBrowser: true,
    });
    expect(response.items[0]).toEqual(expect.objectContaining({
      accountStatus: "RECONNECT_REQUIRED",
      accountEnabled: true,
    }));
  });

  it("maps a known pre-submit browser stop as safely resumable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([{
      id: "job-browser-editor",
      status: "NEEDS_ACTION",
      attemptCount: 1,
      maxAttempts: 3,
      platformAccount: { id: "account-browser", name: "VOZ", platform: { slug: "voz-forums", name: "Voz Forums" } },
      target: { campaign: { id: "campaign-1", name: "VOZ post" } },
      attempts: [{
        id: "attempt-browser",
        attemptNumber: 1,
        status: "SUCCEEDED",
        startedAt: "2026-10-08T00:00:00.000Z",
        responseMetadata: {
          browserAssisted: true,
          reason: "EDITOR_NOT_FOUND",
          message: "Editor changed before anything was submitted",
        },
      }],
    }])));

    const response = await resourcesService.publishJobs();
    expect(response.items[0]?.needsAction).toEqual(expect.objectContaining({
      kind: "BROWSER_REVIEW",
      accountId: "account-browser",
      reason: "EDITOR_NOT_FOUND",
      canResumeBrowser: true,
    }));
  });

  it("sends explicit operator confirmation when retrying an absent reconciled topic", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({ queued: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resourcesService.reconcileNotFound("job-uncertain"))
      .resolves.toEqual({ queued: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/publish-jobs/job-uncertain/reconcile-not-found",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ confirmedNotFound: true }),
      }),
    );
  });

  it("uses the guarded browser resume endpoint after an operator resolves a pre-submit stop", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({ queued: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resourcesService.resumeBrowserJob("job-browser"))
      .resolves.toEqual({ queued: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/publish-jobs/job-browser/resume-browser",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("uploads multipart media attached to the selected variant", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: "media-1",
      variantId: "variant-1",
      type: "IMAGE",
      storageKey: "media/2026-10-08/photo.webp",
      publicUrl: "https://cdn.example.com/photo.webp",
      mimeType: "image/webp",
      sizeBytes: "5",
      metadata: { altText: "Ảnh dashboard VPS" },
      createdAt: "2026-10-08T00:00:00.000Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resourcesService.uploadMedia(new File(["image"], "photo.webp", { type: "image/webp" }), { variantId: "variant-1", altText: "Ảnh dashboard VPS" });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3001/api/v1/media");
    expect(request.method).toBe("POST");
    expect(new Headers(request.headers).has("Content-Type")).toBe(false);
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("variantId")).toBe("variant-1");
    expect((request.body as FormData).get("altText")).toBe("Ảnh dashboard VPS");
    expect((request.body as FormData).get("file")).toBeInstanceOf(File);
    expect(result).toEqual(expect.objectContaining({ id: "media-1", sizeBytes: 5, altText: "Ảnh dashboard VPS" }));
  });

  it("forwards content pagination and filters to the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: [{
        id: "content-21",
        title: "Launch",
        body: "Body",
        status: "APPROVED",
        createdAt: "2026-10-08T00:00:00.000Z",
      }],
      meta: {
        requestId: "req-page",
        timestamp: "2026-10-08T00:00:00.000Z",
        page: 2,
        limit: 20,
        total: 41,
        totalPages: 3,
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await resourcesService.contents({
      page: 2,
      limit: 20,
      search: "launch",
      status: "APPROVED",
      sourceId: "00000000-0000-4000-8000-000000000001",
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-08T23:59:59.999Z",
    });

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(Object.fromEntries(requested.searchParams)).toEqual({
      page: "2",
      limit: "20",
      search: "launch",
      status: "APPROVED",
      sourceId: "00000000-0000-4000-8000-000000000001",
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-08T23:59:59.999Z",
    });
    expect(response.meta).toMatchObject({ page: 2, total: 41, totalPages: 3 });
    expect(response.items[0]?.id).toBe("content-21");
  });

  it("starts an AI automation with an idempotency key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      campaign: {
        id: "campaign-auto",
        name: "VPS launch",
        status: "RUNNING",
        createdAt: "2026-10-08T00:00:00.000Z",
        progress: { total: 2, active: 2 },
      },
      content: {
        id: "content-auto",
        title: "VPS launch",
        body: "Generated source brief",
        status: "APPROVED",
        createdAt: "2026-10-08T00:00:00.000Z",
      },
      generatedVariants: 2,
      jobsCreated: 2,
      activated: true,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      name: "VPS launch",
      brief: "Promote the new VPS plan to developers.",
      platformAccountIds: ["account-devto", "account-discourse"],
      mediaAssetIds: ["media-1"],
      aiProvider: "deepseek" as const,
      timezone: "Asia/Ho_Chi_Minh",
      publishImmediately: true,
    };
    const result = await resourcesService.automateCampaign(input, "automation-request-1");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3001/api/v1/campaigns/automate");
    expect(request).toEqual(expect.objectContaining({ method: "POST", body: JSON.stringify(input) }));
    expect(new Headers(request.headers).get("Idempotency-Key")).toBe("automation-request-1");
    expect(result).toEqual(expect.objectContaining({
      generatedVariants: 2,
      jobsCreated: 2,
      activated: true,
      campaign: expect.objectContaining({ id: "campaign-auto", targetsCount: 2 }),
      content: expect.objectContaining({ id: "content-auto" }),
    }));
  });
});
