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

    await resourcesService.generateVariants("content-1");

    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://localhost:3001/api/v1/contents/content-1/generate");
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ platforms: ["devto"] }),
    }));
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

  it("uploads multipart media attached to the selected variant", async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: "media-1",
      variantId: "variant-1",
      type: "IMAGE",
      storageKey: "media/2026-10-08/photo.webp",
      publicUrl: "https://cdn.example.com/photo.webp",
      mimeType: "image/webp",
      sizeBytes: "5",
      createdAt: "2026-10-08T00:00:00.000Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resourcesService.uploadMedia(new File(["image"], "photo.webp", { type: "image/webp" }), { variantId: "variant-1" });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3001/api/v1/media");
    expect(request.method).toBe("POST");
    expect(new Headers(request.headers).has("Content-Type")).toBe(false);
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("variantId")).toBe("variant-1");
    expect((request.body as FormData).get("file")).toBeInstanceOf(File);
    expect(result).toEqual(expect.objectContaining({ id: "media-1", sizeBytes: 5 }));
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
});
