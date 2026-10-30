import { apiList, apiRequest } from "@/services/api/client";
import type { ListResult } from "@/services/api/types";
import type { AiProviderId, AiProviderOption, AuditLog, Campaign, Capability, ConnectorMode, Content, ContentSource, ContentVariant, MediaAsset, Platform, PlatformAccount, PlatformAvailability, PlatformGroup, PromptTemplate, PublishJob, SourceArticle, Status, SystemSettings } from "@/types/domain";
import type { components } from "@/generated/api/schema";
import type { PublishedPost } from "@/types/domain";

export type AccountConnectionTestResult = components["schemas"]["ConnectionTestContractDto"];
export type PublishJobContent = {
  jobId: string; status: Status; platform: string; platformName?: string; accountName: string;
  moderationPending: boolean; contentUpdatedAt?: string;
  reviewUrl?: string; reviewUrlKind?: PublishJob["reviewUrlKind"];
  title?: string | null; body: string; hashtags: string[]; canonicalUrl?: string | null;
  media: Array<{ type: string; url: string; altText?: string; mimeType?: string }>;
};
export type AccountHealth = components["schemas"]["AccountHealthContractDto"];
export type AttentionAccount = components["schemas"]["AttentionAccountContractDto"];
export type MaintenanceRun = components["schemas"]["MaintenanceRunContractDto"];
export type ExtensionDevice = { id: string; name: string; lastSeenAt?: string | null; createdAt: string };
export type GeminiKeysSettings = { revision: string; source: "environment" | "saved"; maxKeys: number; slots: Array<{ slot: number; configured: boolean; active: boolean; retryAt: string | null }> };
export type GeminiKeysUpdate = { revision: string; changes: Array<{ slot: number; apiKey?: string; clear?: boolean }> };
export type AccountImportResult = { imported: number; queued: number; batchId: string; rows: Array<{ id?: string; row: string; name: string; setup?: string; issue?: string }> };
export type ExtensionLoginCheckRow = { id: string; name: string; platform: string; configured: boolean; autoLogin?: boolean; issues: string[]; deviceId?: string;
  check: { id: string; status: string; message?: string | null; detectedUsername?: string | null; finishedAt?: string | null } | null };
export type ExtensionEngine = "xenforo" | "discourse" | "phpbb" | "medium" | "substack" | "quora" | "reddit" | "slideshare" | "aws-builder" | "tinhte" | "pixelfed" | "mastodon" | "bluesky" | "tumblr" | "devto";
export type ExtensionDeliveryInput = { enabled: boolean; engine?: ExtensionEngine; targetUrl?: string; autoSubmit?: boolean; tags?: string[]; category?: string; flair?: string };
export type ExtensionSessionInput = { deviceId: string; expectedUsername: string; profileUrl?: string; identitySelector?: string; provider: "password" | "google"; autoLogin: boolean; autoTotp: boolean; loginUrl?: string; loginUsername?: string; password?: string; totpSecret?: string };

type QueryValue = string | number | boolean | null | undefined;
export type ListParams = { [key: string]: QueryValue; page?: number; limit?: number; search?: string; status?: string; sourceId?: string; platformId?: string; contentId?: string; variantId?: string; from?: string; to?: string; group?: PlatformGroup; mode?: ConnectorMode; availability?: PlatformAvailability; enabled?: boolean };
type Contract = components["schemas"];
type RawPlatform = Contract["PlatformContractDto"] & { connectorKey?: string; groupKey?: PlatformGroup; defaultSettings?: Record<string, unknown> };
type RawAccount = Omit<Contract["PlatformAccountContractDto"], "platform"> & {
  browserSessionConfigured?: boolean;
  platform?: NonNullable<Contract["PlatformAccountContractDto"]["platform"]> & {
    connectorKey?: string;
    defaultSettings?: Record<string, unknown>;
  };
};
type RawSource = Contract["ContentSourceContractDto"];
type RawSourceArticle = Omit<Contract["SourceArticleContractDto"], "content"> & { content?: SourceArticle["content"] };
type RawVariant = Contract["ContentVariantContractDto"];
type RawContent = Contract["ContentContractDto"] & { variants?: RawVariant[] };
type RawCampaign = { id: string; name: string; status: Status; scheduledAt?: string | null; createdAt: string; content?: { id: string; title: string }; _count?: { targets?: number }; targets?: Array<{ publishJobs?: RawJob[] }>; progress?: { total?: number; published?: number; failed?: number; needsAction?: number; active?: number; scheduled?: number; cancelled?: number } };
type RawAttempt = Contract["PublishAttemptLogContractDto"] & { responseMetadata?: unknown };
type RawPublishedPost = {
  id: string; publishJobId: string; url: string | null; publishedAt: string;
  platformAccount: PublishedPost["account"] & { platform: PublishedPost["platform"] };
  job: { target: { campaign: PublishedPost["campaign"]; contentVariant: { title: string | null } } };
};
type RawJob = { reviewUrl?: string; reviewUrlKind?: PublishJob["reviewUrlKind"]; id: string; status: Status; scheduledAt?: string | null; attemptCount: number; maxAttempts: number; lastErrorCode?: string | null; lastErrorMessage?: string | null; platformAccount?: { id?: string; name: string; enabled?: boolean; status?: PlatformAccount["status"]; platform?: { slug: string; name: string } }; target?: { campaign?: { id: string; name: string }; contentVariant?: { id?: string; title?: string | null } }; publishedPost?: { url?: string | null } | null; attempts?: RawAttempt[] };
type RawPrompt = Omit<Contract["PromptTemplateContractDto"], "platform"> & { platform?: { slug: string; name: string } | null };
type RawSetting = Contract["SystemSettingContractDto"];
type RawPublishLog = Omit<Contract["PublishAttemptLogContractDto"], "job"> & { job: RawJob };
type RawAuditLog = Omit<Contract["AuditLogContractDto"], "actor"> & { actor?: { displayName?: string; email?: string } | null };
type RawMedia = Contract["MediaAssetContractDto"] & { metadata?: unknown };

export type AutomateCampaignInput = {
  name: string;
  brief: string;
  platformAccountIds: string[];
  mediaAssetIds?: string[];
  aiProvider: AiProviderId;
  scheduledAt?: string;
  timezone: string;
  publishImmediately: boolean;
};

type RawAutomateCampaignResult = {
  campaign: RawCampaign;
  content: RawContent;
  generatedVariants: number;
  jobsCreated: number;
  activated: boolean;
};

const defaultCapability: Capability = { text: false, image: false, video: false, article: false, delete: false, schedule: false, analytics: false };
const mapPlatform = (item: RawPlatform): Platform => ({ id: item.id, name: item.name, slug: item.slug, mode: item.mode, groupKey: item.groupKey, connectorKey: item.connectorKey, enabled: item.enabled, connectorStatus: item.availability as Platform["connectorStatus"], docsUrl: item.docsUrl, defaultSettings: item.defaultSettings, capabilities: { ...defaultCapability, ...item.capability }, accountCount: item._count?.accounts ?? 0 });
const mapAccount = (item: RawAccount): PlatformAccount => ({ id: item.id, platformId: item.platformId, platform: item.platform ? { id: item.platformId, name: item.platform.name, slug: item.platform.slug, mode: item.platform.mode, connectorStatus: item.platform.availability as Platform["connectorStatus"], connectorKey: item.platform.connectorKey, defaultSettings: item.platform.defaultSettings } : undefined, name: item.name, username: item.username, externalId: item.externalId, settings: item.settings ?? undefined, enabled: item.enabled, status: item.status, lastCheckedAt: item.lastTestedAt, browserSessionConfigured: item.browserSessionConfigured, credential: item.credential, oauthConfigured: Boolean(item.oauthToken), oauthToken: item.oauthToken });
const mapSource = (item: RawSource): ContentSource => ({ id: item.id, name: item.name, type: item.type, url: item.url, enabled: item.enabled, status: item.enabled ? "ACTIVE" : "PAUSED", articleCount: item._count?.articles ?? 0, lastFetchedAt: item.lastFetchedAt });
const mapVariant = (item: RawVariant): ContentVariant => ({ id: item.id, contentId: item.contentId, platform: item.platform?.name ?? item.platform?.slug ?? "Platform", platformSlug: item.platform?.slug ?? "unknown", title: item.title, body: item.body, summary: item.summary, hashtags: item.hashtags, cta: item.cta, status: item.status, recommended: item.recommended, reason: item.reason, updatedAt: item.updatedAt });
const mapContent = (item: RawContent): Content => ({ id: item.id, title: item.title, body: item.body, description: item.summary, canonicalUrl: item.canonicalUrl, status: item.status, source: item.sourceArticle?.source ?? null, variantsCount: item._count?.variants ?? item.variants?.length ?? 0, createdAt: item.createdAt, updatedAt: item.updatedAt });
const mapMedia = (item: RawMedia): MediaAsset => {
  const metadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
    ? item.metadata as Record<string, unknown>
    : {};
  return {
    ...item,
    sizeBytes: Number(item.sizeBytes),
    ...(typeof metadata.altText === "string" ? { altText: metadata.altText } : {}),
  };
};
const mapCampaign = (item: RawCampaign): Campaign => { const jobs = item.targets?.flatMap((target) => target.publishJobs ?? []) ?? []; return { id: item.id, name: item.name, content: item.content, status: item.status, targetsCount: item.progress?.total ?? item._count?.targets ?? item.targets?.length ?? 0, publishedCount: item.progress?.published ?? jobs.filter((job) => job.status === "PUBLISHED").length, failedCount: item.progress?.failed ?? jobs.filter((job) => ["FAILED", "POSSIBLE_DUPLICATE"].includes(job.status)).length, needsActionCount: item.progress?.needsAction ?? jobs.filter((job) => job.status === "NEEDS_ACTION").length, activeCount: item.progress?.active ?? jobs.filter((job) => ["QUEUED", "PUBLISHING", "PROCESSING", "RETRY"].includes(job.status)).length, scheduledCount: item.progress?.scheduled ?? jobs.filter((job) => job.status === "SCHEDULED").length, scheduledAt: item.scheduledAt, createdAt: item.createdAt }; };
const mapJob = (item: RawJob): PublishJob => {
  const latest = item.attempts?.[0];
  const metadata = latest?.responseMetadata
    && typeof latest.responseMetadata === "object"
    && !Array.isArray(latest.responseMetadata)
    ? latest.responseMetadata as Record<string, unknown>
    : {};
  const commonProviderFields = {
    ...(typeof metadata.externalPostId === "string" ? { externalPostId: metadata.externalPostId } : {}),
    ...(typeof metadata.url === "string" ? { url: metadata.url } : {}),
  };
  const browserFields = {
    ...(item.platformAccount?.id ? { accountId: item.platformAccount.id } : {}),
    ...(typeof metadata.reason === "string" ? { reason: metadata.reason } : {}),
    ...(typeof metadata.message === "string" ? { message: metadata.message } : {}),
    ...(typeof metadata.challengeKind === "string" ? { challengeKind: metadata.challengeKind } : {}),
    ...(typeof metadata.actionUrl === "string" ? { url: metadata.actionUrl } : commonProviderFields),
  };
  const workerCrashUncertain = item.lastErrorCode === "WORKER_CRASH_UNCERTAIN_RESULT";
  const extensionCode = item.lastErrorCode?.startsWith("EXTENSION_") ? item.lastErrorCode.slice("EXTENSION_".length) : undefined;
  const providerAction = extensionCode === "MODERATION_PENDING" || metadata.moderationQueue === true
    ? { kind: "MODERATION" as const, ...commonProviderFields, ...(item.lastErrorMessage ? { message: item.lastErrorMessage } : {}) }
    : metadata.extensionQueued === true && item.status === "NEEDS_ACTION"
    ? extensionCode
      ? { kind: "EXTENSION_ACTION" as const, reason: extensionCode, ...(item.lastErrorMessage ? { message: item.lastErrorMessage } : {}) }
      : { kind: "EXTENSION_PENDING" as const }
    : metadata.reconciliationRequired === true || workerCrashUncertain
      ? {
          kind: "RECONCILIATION" as const,
          ...commonProviderFields,
          canRetryAfterNotFound: workerCrashUncertain
            || (metadata.submissionUncertain === true
              && metadata.providerAccepted !== true
              && metadata.persistenceRecoveryRequired !== true),
        }
      : metadata.policyBlocked === true
        ? { kind: "POLICY_BLOCKED" as const, ...browserFields }
        : metadata.browserAssisted === true && metadata.accountReconnectRequired === true
          ? { kind: "BROWSER_LOGIN" as const, ...browserFields, canResumeBrowser: true }
          : metadata.browserAssisted === true
            ? {
                kind: "BROWSER_REVIEW" as const,
                ...browserFields,
                canResumeBrowser: [
                  "AUTOMATION_BUSY",
                  "AUTOMATION_DISABLED",
                  "AUTOMATION_FAILED",
                  "EDITOR_NOT_FOUND",
                  "SUBMISSION_CONFIRMATION_REQUIRED",
                ].includes(String(metadata.reason ?? "")),
              }
      : undefined;
  return {
    id: item.id,
    campaignId: item.target?.campaign?.id,
    platform: item.platformAccount?.platform?.name ?? "Platform",
    account: item.platformAccount?.name ?? "—",
    accountStatus: item.platformAccount?.status,
    accountEnabled: item.platformAccount?.enabled,
    contentTitle: item.target?.contentVariant?.title || item.target?.campaign?.name || "Nội dung không có tiêu đề",
    status: item.status,
    attempt: item.attemptCount,
    maxAttempts: item.maxAttempts,
    scheduledAt: item.scheduledAt,
    startedAt: latest?.startedAt,
    finishedAt: latest?.finishedAt,
    publishedUrl: item.publishedPost?.url,
    reviewUrl: item.reviewUrl,
    reviewUrlKind: item.reviewUrlKind,
    // Extension states are explained by needsAction, not shown as a red error.
    error: (item.lastErrorCode || latest?.errorCode) && !(metadata.extensionQueued === true && item.status === "NEEDS_ACTION")
      ? {
          code: item.lastErrorCode || latest?.errorCode || "PUBLISH_ERROR",
          message: item.lastErrorMessage || latest?.errorMessage || "Xuất bản thất bại",
        }
      : null,
    needsAction: providerAction?.kind === "MODERATION" && item.status !== "NEEDS_ACTION" ? undefined : providerAction,
  };
};
const filterItems = <T>(items: T[], params: ListParams | undefined, text: (item: T) => string, status?: (item: T) => string) => items.filter((item) => (!params?.search || text(item).toLowerCase().includes(params.search.toLowerCase())) && (!params?.status || !status || status(item) === params.status));
const result = <T, U>(raw: ListResult<T>, items: U[]): ListResult<U> => ({ items, meta: raw.meta });

export const resourcesService = {
  extensionLoginChecks: () => apiRequest<ExtensionLoginCheckRow[]>("/extension/login-checks"),
  queueExtensionLoginChecks: (accountIds?: string[], verifyOnly = false) => apiRequest<{ batchId: string; queued: number }>("/extension/login-checks", { method: "POST", body: { accountIds, verifyOnly } }),
  aiProviders: () => apiRequest<AiProviderOption[]>("/ai/providers"),
  geminiKeys: () => apiRequest<GeminiKeysSettings>("/ai/gemini-keys"),
  updateGeminiKeys: (input: GeminiKeysUpdate) => apiRequest<GeminiKeysSettings>("/ai/gemini-keys", { method: "PUT", body: input }),
  async platforms(params?: ListParams) { const raw = await apiList<RawPlatform>("/platforms", { query: { page: params?.page, limit: params?.limit, search: params?.search, group: params?.group, mode: params?.mode, availability: params?.availability, enabled: params?.enabled } }); return result(raw, raw.items.map(mapPlatform)); },
  async updatePlatform(slug: string, input: Pick<Platform, "enabled">) { return mapPlatform(await apiRequest<RawPlatform>(`/platforms/${slug}`, { method: "PATCH", body: input })); },
  async accounts(params?: ListParams) { const raw = await apiList<RawAccount>("/platform-accounts"); let items = raw.items.map(mapAccount); if (params?.platformId) items = items.filter((item) => item.platformId === params.platformId); return result(raw, filterItems(items, params, (item) => `${item.name} ${item.username ?? ""} ${item.platform?.name ?? ""}`, (item) => item.status)); },
  async createAccount(input: { platformSlug: string; name: string; username?: string; externalId?: string; settings?: Record<string, unknown>; credential?: Record<string, unknown>; enabled?: boolean }) { return mapAccount(await apiRequest<RawAccount>("/platform-accounts", { method: "POST", body: input })); },
  async updateAccountCredential(id: string, input: { credential: Record<string, unknown>; settings?: Record<string, unknown> }) { return mapAccount(await apiRequest<RawAccount>(`/platform-accounts/${id}/credential`, { method: "PUT", body: input })); },
  async updateAccountSettings(id: string, settings: Record<string, unknown>) { return mapAccount(await apiRequest<RawAccount>(`/platform-accounts/${id}/settings`, { method: "PUT", body: { settings } })); },
  async revokeBrowserSession(id: string) { return mapAccount(await apiRequest<RawAccount>(`/platform-accounts/${id}/browser-session`, { method: "DELETE" })); },
  async updateAccount(id: string, input: Pick<PlatformAccount, "enabled">) { return mapAccount(await apiRequest<RawAccount>(`/platform-accounts/${id}`, { method: "PATCH", body: input })); },
  testAccount: (id: string) => apiRequest<AccountConnectionTestResult>(`/platform-accounts/${id}/test`, { method: "POST" }),
  oauthProviders: () => apiRequest<Array<{ provider: string; platform?: string; status: string; callback?: string }>>("/oauth/providers"),
  async oauthStart(provider: string) { return apiRequest<{ authorizationUrl: string }>(`/oauth/${provider}/start`); },
  accountHealth: () => apiRequest<AccountHealth>("/account-health"),
  runAccountCheck: () => apiRequest<MaintenanceRun>("/account-health/check", { method: "POST" }),
  extensionDevices: () => apiRequest<ExtensionDevice[]>("/extension/devices"),
  importExtensionAccounts: (file: File, deviceId: string, googleEmail?: string) => {
    const body = new FormData(); body.set("file", file); body.set("deviceId", deviceId); if (googleEmail?.trim()) body.set("googleEmail", googleEmail.trim());
    return apiRequest<AccountImportResult>("/extension/accounts/import", { method: "POST", body });
  },
  createExtensionDevice: (name: string) => apiRequest<ExtensionDevice & { token: string }>("/extension/devices", { method: "POST", body: { name } }),
  revokeExtensionDevice: (id: string) => apiRequest<{ revoked: boolean }>(`/extension/devices/${id}`, { method: "DELETE" }),
  configureExtensionDelivery: (accountId: string, input: ExtensionDeliveryInput) => apiRequest<{ enabled: boolean }>(`/extension/accounts/${accountId}`, { method: "PUT", body: input }),
  configureExtensionSession: (accountId: string, input: ExtensionSessionInput) => apiRequest<{ deviceId: string; passwordConfigured: boolean; totpConfigured: boolean }>(`/extension/accounts/${accountId}/session`, { method: "PUT", body: input }),
  requeueExtensionJob: (id: string) => apiRequest<{ queued: boolean }>(`/extension/jobs/${id}/requeue`, { method: "POST" }),
  async sources(params?: ListParams) { const raw = await apiList<RawSource>("/content-sources"); return result(raw, filterItems(raw.items.map(mapSource), params, (item) => `${item.name} ${item.url ?? ""}`, (item) => item.status)); },
  async createSource(input: { name: string; type: string; url?: string; content?: string }) { if (input.type === "MANUAL") return apiRequest<RawContent>("/contents", { method: "POST", body: { title: input.name, body: input.content, language: "vi" } }).then(mapContent); return apiRequest<RawSource>("/content-sources", { method: "POST", body: { name: input.name, type: input.type, url: input.url } }).then(mapSource); },
  syncSource: (id: string) => apiRequest<{ discovered: number; inserted: number; duplicates: number }>(`/content-sources/${id}/fetch`, { method: "POST" }),
  async sourceArticles(params?: ListParams) { const raw = await apiList<RawSourceArticle>("/source-articles", { query: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status, sourceId: params?.sourceId } }); const items = raw.items.map((item): SourceArticle => ({ id: item.id, sourceId: item.sourceId, title: item.title, description: item.description, canonicalUrl: item.canonicalUrl, author: item.author, publishedAt: item.publishedAt, tags: item.tags ?? [], status: item.status, errorMessage: item.errorMessage, createdAt: item.createdAt, source: item.source, content: item.content })); return result(raw, items); },
  async promoteSourceArticle(id: string) { return mapContent(await apiRequest<RawContent>(`/source-articles/${id}/promote`, { method: "POST" })); },
  async contents(params?: ListParams) { const raw = await apiList<RawContent>("/contents", { query: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status, sourceId: params?.sourceId, from: params?.from, to: params?.to } }); return result(raw, raw.items.map(mapContent)); },
  async content(id: string) { return mapContent(await apiRequest<RawContent>(`/contents/${id}`)); },
  async variants(contentId: string) { const raw = await apiList<RawVariant>("/content-variants", { query: { contentId } }); return result(raw, raw.items.map(mapVariant)); },
  async createVariant(input: { contentId: string; platformSlug: string; title?: string; body: string; hashtags?: string[] }) { return mapVariant(await apiRequest<RawVariant>("/content-variants", { method: "POST", body: input })); },
  async generateVariants(contentId: string, platforms?: string[], aiProvider?: AiProviderId) {
    let requested = platforms;
    if (requested === undefined) {
      const [platformResult, accountResult] = await Promise.all([
        resourcesService.platforms({ limit: 100 }),
        resourcesService.accounts({ status: "CONNECTED" }),
      ]);
      const enabledPlatformIds = new Set(platformResult.items.filter((item) => item.enabled).map((item) => item.id));
      requested = accountResult.items
        .filter((account) => account.enabled && account.status === "CONNECTED" && enabledPlatformIds.has(account.platformId))
        .map((account) => account.platform?.slug)
        .filter((slug): slug is string => Boolean(slug));
    }
    const slugs = [...new Set(requested.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
    if (!slugs.length) throw new Error("Chưa có tài khoản đích đã kết nối và đang bật để tạo biến thể AI.");
    if (slugs.length > 12) throw new Error("Mỗi lần chỉ có thể tạo tối đa 12 biến thể AI. Hãy tắt bớt tài khoản đích và thử lại.");
    const variants = await apiRequest<RawVariant[]>(`/contents/${contentId}/generate`, { method: "POST", body: { platforms: slugs, aiProvider } });
    return variants.map(mapVariant);
  },
  async updateVariant(id: string, input: Partial<ContentVariant>) { return mapVariant(await apiRequest<RawVariant>(`/content-variants/${id}`, { method: "PATCH", body: input })); },
  async approveVariant(id: string) { return mapVariant(await apiRequest<RawVariant>(`/content-variants/${id}/status`, { method: "PATCH", body: { status: "APPROVED" } })); },
  async campaigns(params?: ListParams) { const raw = await apiList<RawCampaign>("/campaigns"); return result(raw, filterItems(raw.items.map(mapCampaign), params, (item) => `${item.name} ${item.content?.title ?? ""}`, (item) => item.status)); },
  async createCampaign(input: { name: string; contentId: string; targets: Array<{ platformAccountId: string; contentVariantId: string }>; scheduledAt?: string; timezone: string }) { return mapCampaign(await apiRequest<RawCampaign>("/campaigns", { method: "POST", body: input })); },
  async automateCampaign(input: AutomateCampaignInput, idempotencyKey: string) {
    const raw = await apiRequest<RawAutomateCampaignResult>("/campaigns/automate", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: input,
    });
    return {
      ...raw,
      campaign: mapCampaign(raw.campaign),
      content: mapContent(raw.content),
    };
  },
  async publishCampaign(id: string) { const campaign = await apiRequest<RawCampaign>(`/campaigns/${id}/publish`, { method: "POST" }); return { campaign: mapCampaign(campaign), jobsCreated: campaign.targets?.flatMap((target) => target.publishJobs ?? []).length ?? 0 }; },
  async publishJobs(params?: ListParams) { const raw = await apiList<RawJob>("/publish-jobs", { query: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status, reviewState: params?.reviewState, from: params?.from, to: params?.to } }); return result(raw, raw.items.map(mapJob)); },
  async publishedPosts(params?: ListParams): Promise<ListResult<PublishedPost>> {
    const raw = await apiList<RawPublishedPost>("/published-posts", { query: params });
    return result(raw, raw.items.map((item) => ({
      id: item.id, publishJobId: item.publishJobId, url: item.url, publishedAt: item.publishedAt,
      title: item.job.target.contentVariant.title?.trim() || item.job.target.campaign.name,
      campaign: item.job.target.campaign,
      account: { id: item.platformAccount.id, name: item.platformAccount.name },
      platform: item.platformAccount.platform,
    })));
  },
  publishJobMetrics: (todayFrom: string, todayTo: string) => apiRequest<{ publishedToday: number; scheduled: number; processing: number; failed: number }>("/publish-jobs/metrics", { query: { todayFrom, todayTo } }),
  retryJob: (id: string) => apiRequest<{ queued: boolean }>(`/publish-jobs/${id}/retry`, { method: "POST" }),
  resumeBrowserJob: (id: string) => apiRequest<{ queued: boolean }>(`/publish-jobs/${id}/resume-browser`, { method: "POST" }),
  reconcileNotFound: (id: string) => apiRequest<{ queued: boolean }>(`/publish-jobs/${id}/reconcile-not-found`, { method: "POST", body: { confirmedNotFound: true } }),
  publishJobContent: (id: string) => apiRequest<PublishJobContent>(`/publish-jobs/${encodeURIComponent(id)}/manual-payload`),
  async manualPayload(id: string) {
    const value = await apiRequest<{
      title?: string | null;
      body: string;
      summary?: string | null;
      hashtags?: string[];
      cta?: string | null;
      canonicalUrl?: string | null;
      media?: Array<{ type: string; url: string; altText?: string; mimeType?: string }>;
      openUrl?: string;
    }>(`/publish-jobs/${id}/manual-payload`);
    const media = value.media ?? [];
    const mediaText = media.map((item, index) => [
      `${item.type === "image" ? "Ảnh" : "Media"} ${index + 1}: ${item.url}`,
      item.altText ? `Alt text: ${item.altText}` : undefined,
    ].filter(Boolean).join("\n")).join("\n\n");
    return {
      content: [
        value.title,
        value.summary,
        value.body,
        value.hashtags?.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "),
        value.cta,
        value.canonicalUrl ? `Nguồn: ${value.canonicalUrl}` : undefined,
        mediaText,
      ].filter(Boolean).join("\n\n"),
      platformUrl: value.openUrl,
      media,
    };
  },
  markPublished: (id: string, input: { externalPostId: string; url?: string }) => apiRequest<{ published: boolean }>(`/publish-jobs/${id}/mark-published`, { method: "POST", body: input }),
  async prompts(params?: ListParams) { const raw = await apiList<RawPrompt>("/prompts"); return result(raw, filterItems(raw.items.map((item): PromptTemplate => ({ id: item.id, platform: item.platform?.name ?? item.platform?.slug ?? "Global", platformSlug: item.platform?.slug ?? "global", name: item.name, systemPrompt: item.systemPrompt, userPrompt: item.userTemplate, version: item.version, active: item.active, updatedAt: item.updatedAt })), params, (item) => `${item.platform} ${item.name}`)); },
  async updatePrompt(id: string, input: Pick<PromptTemplate, "systemPrompt" | "userPrompt" | "active">) { const current = (await resourcesService.prompts()).items.find((item) => item.id === id); if (!current) throw new Error("Không tìm thấy prompt template."); const raw = await apiRequest<RawPrompt>("/prompts", { method: "POST", body: { platformSlug: current.platformSlug, name: current.name, systemPrompt: input.systemPrompt, userTemplate: input.userPrompt ?? "{{body}}", active: input.active } }); return { ...current, ...input, id: raw.id, version: raw.version, updatedAt: raw.updatedAt }; },
  async logs(params?: ListParams) { const raw = await apiList<RawAuditLog>("/logs/audit"); const items = raw.items.map((item): AuditLog => ({ id: item.id, action: item.action, resource: item.entityType, resourceId: item.entityId, actor: item.actor ? { name: item.actor.displayName ?? item.actor.email ?? "System", email: item.actor.email } : item.actorId ? { name: `User ${item.actorId.slice(0, 8)}` } : { name: "System" }, requestId: item.requestId ?? undefined, metadata: item.after ?? undefined, createdAt: item.createdAt })); return result(raw, filterItems(items, params, (item) => `${item.action} ${item.resource} ${item.resourceId ?? ""} ${item.actor?.name ?? ""}`, (item) => item.status ?? "")); },
  async publishLogs(params?: ListParams) { const raw = await apiList<RawPublishLog>("/logs/publish"); const items = raw.items.map((entry): PublishJob => ({ ...mapJob(entry.job), id: entry.id, attempt: entry.attemptNumber, status: entry.job.status, startedAt: entry.startedAt, finishedAt: entry.finishedAt, error: entry.errorCode ? { code: entry.errorCode, message: entry.errorMessage || "Publish attempt failed" } : null })); return result(raw, filterItems(items, params, (item) => `${item.platform} ${item.account} ${item.contentTitle}`, (item) => item.status)); },
  async media(params?: ListParams) { const raw = await apiList<RawMedia>("/media", { query: { page: params?.page, limit: params?.limit, contentId: params?.contentId, variantId: params?.variantId } }); return result(raw, raw.items.map(mapMedia)); },
  async uploadMedia(file: File, target: { contentId?: string; variantId?: string; altText?: string } = {}) { const body = new FormData(); body.set("file", file); if (target.contentId) body.set("contentId", target.contentId); if (target.variantId) body.set("variantId", target.variantId); if (target.altText?.trim()) body.set("altText", target.altText.trim()); return mapMedia(await apiRequest<RawMedia>("/media", { method: "POST", body })); },
  async settings() { const raw = await apiList<RawSetting>("/settings"); const byKey = new Map(raw.items.map((item) => [item.key, item.value])); const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; return { ai: object(byKey.get("ai")), storage: object(byKey.get("storage")), system: object(byKey.get("system")) } as SystemSettings; },
  async updateSettings(input: Partial<SystemSettings>) { await Promise.all(Object.entries(input).map(([key, value]) => apiRequest<RawSetting>(`/settings/${key}`, { method: "PUT", body: { value } }))); return resourcesService.settings(); },
};
