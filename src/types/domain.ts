export type UserRole = "ADMIN" | "EDITOR" | "VIEWER";
export type Status = "DRAFT" | "FETCHED" | "AI_GENERATING" | "GENERATED" | "WAITING_REVIEW" | "APPROVED" | "SCHEDULED" | "QUEUED" | "PUBLISHING" | "PROCESSING" | "PUBLISHED" | "RETRY" | "FAILED" | "NEEDS_ACTION" | "POSSIBLE_DUPLICATE" | "ACTIVE" | "INACTIVE" | "CONNECTED" | "EXPIRED" | "RECONNECT_REQUIRED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "CANCELLED" | "ARCHIVED" | "REJECTED";
export type ConnectorMode = "OFFICIAL_API" | "COMPATIBLE_API" | "BROWSER_ASSISTED" | "MANUAL";
export type PlatformGroup = "SOCIAL" | "BLOGGING" | "COMMUNITY" | "FORUM" | "DEVELOPER" | "MEDIA" | "COMMERCE" | "EVENT";
export type PlatformAvailability = "READY" | "API_REVIEW_REQUIRED" | "CREDENTIAL_REQUIRED" | "API_RESEARCH_REQUIRED" | "MANUAL_ONLY";
export type SourceType = "MANUAL" | "URL" | "RSS" | "SITEMAP" | "WORDPRESS";
export type AiProviderId = "openai" | "deepseek" | "gemini";
export interface AiProviderOption { id: AiProviderId; label: string; model: string; configured: boolean; isDefault: boolean; }
export interface User { id: string; email: string; name: string; role: UserRole; avatarUrl?: string | null; }
export type PlatformAutomationStatus = "READY_AFTER_CREDENTIALS" | "READY_AFTER_LOGIN" | "API_CONNECTOR_REQUIRED" | "BROWSER_RECIPE_REVIEW_REQUIRED" | "POLICY_BLOCKED" | "PLATFORM_RESEARCH_REQUIRED";
export interface PlatformAutomationMetadata { status: PlatformAutomationStatus; route: "API" | "PLAYWRIGHT" | "NONE"; automaticPublishing: boolean; connectorKey?: string; browserRecipe?: string; browserRecipeRevision?: number; loginCaptureRequired?: boolean; permissionAttestationRequired?: boolean; autoSubmitDefault?: boolean; mediaUploadSupported?: boolean; requiredAccountSettings?: string[]; reasonCode?: string; }
export interface Capability { text: boolean; image: boolean; video: boolean; article: boolean; delete: boolean; schedule: boolean; analytics: boolean; metadata?: { automation?: PlatformAutomationMetadata }; }
export interface Platform { id: string; name: string; slug: string; mode: ConnectorMode; groupKey?: PlatformGroup; connectorKey?: string; enabled: boolean; connectorStatus?: PlatformAvailability; docsUrl?: string | null; defaultSettings?: Record<string, unknown>; capabilities: Capability; accountCount?: number; }
export interface PlatformAccount { id: string; platformId: string; platform?: Pick<Platform, "id" | "name" | "slug"> & Partial<Pick<Platform, "mode" | "connectorStatus" | "connectorKey" | "defaultSettings">>; name: string; username?: string | null; externalId?: string | null; settings?: Record<string, unknown>; enabled: boolean; status: "CONNECTED" | "EXPIRED" | "RECONNECT_REQUIRED" | "DISCONNECTED" | "DISABLED" | "ERROR"; lastCheckedAt?: string | null; browserSessionConfigured?: boolean; credential?: { status?: string; expiresAt?: string | null; updatedAt?: string | null } | null; oauthConfigured?: boolean; oauthToken?: { expiresAt?: string | null; updatedAt?: string | null } | null; }
export interface ContentSource { id: string; name: string; type: SourceType; url?: string | null; enabled: boolean; status: "ACTIVE" | "PAUSED" | "ERROR"; articleCount?: number; lastFetchedAt?: string | null; }
export interface SourceArticle { id: string; sourceId: string; title: string; description?: string | null; canonicalUrl?: string | null; author?: string | null; publishedAt?: string | null; tags: string[]; status: "DISCOVERED" | "FETCHED" | "DUPLICATE" | "FAILED"; errorMessage?: string | null; createdAt: string; source: { id: string; name: string; type: SourceType }; content?: { id: string; status: Status } | null; }
export interface Content { id: string; title: string; description?: string | null; body?: string; canonicalUrl?: string | null; status: Status; source?: { id: string; name: string; type?: SourceType } | null; tags?: string[]; imageUrl?: string | null; variantsCount?: number; createdAt: string; updatedAt?: string; }
export interface ContentVariant { id: string; contentId: string; platform: string; platformSlug: string; title?: string | null; body: string; summary?: string | null; hashtags?: string[]; cta?: string | null; status: Status; recommended?: boolean; reason?: string | null; updatedAt?: string; }
export interface MediaAsset { id: string; contentId?: string | null; variantId?: string | null; type: "IMAGE" | "VIDEO" | "DOCUMENT"; storageKey: string; publicUrl?: string | null; mimeType: string; sizeBytes: number; altText?: string | null; createdAt: string; }
export interface Campaign { id: string; name: string; content?: Pick<Content, "id" | "title">; status: Status; targetsCount?: number; publishedCount?: number; failedCount?: number; needsActionCount?: number; activeCount?: number; scheduledCount?: number; scheduledAt?: string | null; createdAt: string; }
export type PublishNeedsAction = {
  kind: "MODERATION" | "RECONCILIATION" | "BROWSER_LOGIN" | "BROWSER_REVIEW" | "POLICY_BLOCKED";
  externalPostId?: string;
  url?: string;
  canRetryAfterNotFound?: boolean;
  canResumeBrowser?: boolean;
  accountId?: string;
  reason?: string;
  message?: string;
  challengeKind?: string;
};
export interface PublishJob { id: string; campaignId?: string; platform: string; account: string; accountStatus?: PlatformAccount["status"]; accountEnabled?: boolean; contentTitle: string; status: Status; attempt: number; maxAttempts?: number; scheduledAt?: string | null; startedAt?: string | null; finishedAt?: string | null; publishedUrl?: string | null; error?: { code: string; message: string } | null; needsAction?: PublishNeedsAction; }
export interface PromptTemplate { id: string; platform: string; platformSlug: string; name: string; systemPrompt: string; userPrompt?: string; version: number; active: boolean; updatedAt: string; }
export interface AuditLog { id: string; action: string; resource: string; resourceId?: string | null; actor?: { name: string; email?: string } | null; status?: "SUCCESS" | "FAILED"; requestId?: string; metadata?: Record<string, unknown>; createdAt: string; }
export interface DashboardMetrics { publishedToday: number; scheduled: number; failed: number; processing: number; connectedAccounts: number; enabledPlatforms: number; trend?: Array<{ date: string; published: number; failed: number }>; recentJobs?: PublishJob[]; }
export interface SystemSettings { ai: { model?: string; temperature?: number; configured?: boolean }; storage: { provider?: string; bucket?: string; configured?: boolean }; system: { timezone?: string; defaultLocale?: string; pollingInterval?: number }; }
