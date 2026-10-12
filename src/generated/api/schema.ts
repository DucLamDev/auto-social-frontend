export interface paths {
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Authenticate and create a rotating refresh session */
        post: operations["Auth_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["Auth_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["Auth_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Auth_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Users_list"];
        put?: never;
        post: operations["Users_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platforms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Platforms_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platforms/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Platforms_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["Platforms_toggle"];
        trace?: never;
    };
    "/api/v1/connectors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Connectors_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platform-accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlatformAccounts_list"];
        put?: never;
        post: operations["PlatformAccounts_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platform-accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlatformAccounts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["PlatformAccounts_setEnabled"];
        trace?: never;
    };
    "/api/v1/platform-accounts/{id}/credential": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["PlatformAccounts_updateCredential"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platform-accounts/{id}/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["PlatformAccounts_updateSettings"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platform-accounts/{id}/browser-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["PlatformAccounts_revokeBrowserSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/platform-accounts/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PlatformAccounts_testConnection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/content-sources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContentSources_list"];
        put?: never;
        post: operations["ContentSources_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/content-sources/{id}/fetch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContentSources_fetch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/contents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Contents_list"];
        put?: never;
        post: operations["Contents_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/contents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Contents_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/contents/{id}/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["Contents_generate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Ai_providers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/source-articles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SourceArticles_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/source-articles/{id}/promote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["SourceArticles_promote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/content-variants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContentVariants_list"];
        put?: never;
        post: operations["ContentVariants_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/content-variants/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ContentVariants_update"];
        trace?: never;
    };
    "/api/v1/content-variants/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ContentVariants_updateStatus"];
        trace?: never;
    };
    "/api/v1/prompts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Prompts_list"];
        put?: never;
        post: operations["Prompts_createVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Campaigns_list"];
        put?: never;
        post: operations["Campaigns_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Campaigns_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/automate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["Campaigns_automate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["Campaigns_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublishJobs_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublishJobs_metrics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/{id}/manual-payload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublishJobs_manualPayload"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublishJobs_retry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/{id}/resume-browser": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublishJobs_resumeBrowser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/{id}/reconcile-not-found": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublishJobs_reconcileNotFound"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publish-jobs/{id}/mark-published": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublishJobs_markPublished"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/published-posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublishedPosts_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Media_list"];
        put?: never;
        post: operations["Media_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Logs_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/logs/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Logs_listPublishLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/logs/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Logs_listAuditLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Settings_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["Settings_upsert"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/oauth/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OAuth_providers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/oauth/{provider}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OAuth_start"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/oauth/{provider}/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OAuth_callback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Health_health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Health_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiMetaContractDto: {
            requestId: string;
            /** Format: date-time */
            timestamp: string;
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
        };
        UserContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: email */
            email: string;
            displayName: string;
            roles: ("ADMIN" | "EDITOR" | "VIEWER")[];
        };
        AuthSessionContractDto: {
            accessToken: string;
            user: components["schemas"]["UserContractDto"];
        };
        LoginDto: {
            /** @example admin@example.com */
            email: string;
            /** Format: password */
            password: string;
        };
        RefreshDto: {
            /** @description Optional when sent in the httpOnly refresh_token cookie */
            refreshToken?: string;
        };
        MutationResultContractDto: {
            loggedOut?: boolean;
            queued?: boolean;
            published?: boolean;
        };
        AdminUserContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: email */
            email: string;
            displayName: string;
            enabled: boolean;
            /** Format: date-time */
            lastLoginAt?: string | null;
            /** Format: date-time */
            createdAt: string;
            roles?: {
                [key: string]: unknown;
            }[];
        };
        CreateUserDto: {
            email: string;
            displayName: string;
            password: string;
            roles: ("ADMIN" | "EDITOR" | "VIEWER")[];
        };
        PlatformCapabilityContractDto: {
            text: boolean;
            image: boolean;
            video: boolean;
            article: boolean;
            delete: boolean;
            schedule: boolean;
            analytics: boolean;
            maxText?: number | null;
            maxImages?: number | null;
            metadata?: {
                [key: string]: unknown;
            };
        };
        PlatformContractDto: {
            /** Format: uuid */
            id: string;
            slug: string;
            name: string;
            connectorKey: string;
            groupKey: string;
            defaultSettings: {
                [key: string]: unknown;
            };
            /** @enum {string} */
            mode: "OFFICIAL_API" | "COMPATIBLE_API" | "BROWSER_ASSISTED" | "MANUAL";
            /** @enum {string} */
            availability: "READY" | "API_REVIEW_REQUIRED" | "API_RESEARCH_REQUIRED" | "CREDENTIAL_REQUIRED" | "MANUAL_ONLY";
            /** Format: uri */
            docsUrl?: string | null;
            enabled: boolean;
            capability?: components["schemas"]["PlatformCapabilityContractDto"] | null;
            _count?: {
                accounts?: number;
            };
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        TogglePlatformDto: {
            enabled: boolean;
        };
        ConnectorDescriptorContractDto: {
            platform: string;
            /** @enum {string} */
            mode: "OFFICIAL_API" | "COMPATIBLE_API" | "BROWSER_ASSISTED" | "MANUAL";
            capability: {
                [key: string]: unknown;
            };
        };
        PlatformSummaryContractDto: {
            slug: string;
            name: string;
            connectorKey: string;
            groupKey: string;
            defaultSettings: {
                [key: string]: unknown;
            };
            /** @enum {string} */
            mode: "OFFICIAL_API" | "COMPATIBLE_API" | "BROWSER_ASSISTED" | "MANUAL";
            /** @enum {string} */
            availability: "READY" | "API_REVIEW_REQUIRED" | "API_RESEARCH_REQUIRED" | "CREDENTIAL_REQUIRED" | "MANUAL_ONLY";
            capability?: components["schemas"]["PlatformCapabilityContractDto"];
        };
        CredentialSummaryContractDto: {
            status: string;
            /** Format: date-time */
            expiresAt?: string | null;
            /** Format: date-time */
            updatedAt: string;
        };
        OAuthTokenSummaryContractDto: {
            scopes: string[];
            /** Format: date-time */
            expiresAt?: string | null;
            /** Format: date-time */
            updatedAt: string;
        };
        PlatformAccountContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            platformId: string;
            name: string;
            username?: string | null;
            externalId?: string | null;
            enabled: boolean;
            /** @enum {string} */
            status: "CONNECTED" | "EXPIRED" | "RECONNECT_REQUIRED" | "DISABLED" | "ERROR";
            platform: components["schemas"]["PlatformSummaryContractDto"];
            settings?: {
                [key: string]: unknown;
            };
            /** Format: date-time */
            lastTestedAt?: string | null;
            credential?: components["schemas"]["CredentialSummaryContractDto"] | null;
            oauthToken?: components["schemas"]["OAuthTokenSummaryContractDto"] | null;
            /** @description True only when an encrypted Playwright storage state is configured; the state itself is never returned. */
            browserSessionConfigured?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreatePlatformAccountDto: {
            /** @example wordpress */
            platformSlug: string;
            name: string;
            username?: string;
            externalId?: string;
            settings?: {
                [key: string]: unknown;
            };
            /** @default true */
            enabled: boolean;
            /** @description Write-only credential object. It is encrypted and never returned. */
            credential?: {
                [key: string]: unknown;
            };
        };
        UpdateCredentialDto: {
            credential: {
                [key: string]: unknown;
            };
            /** @description Non-secret connector settings to merge into the existing account settings. */
            settings?: {
                [key: string]: unknown;
            };
        };
        UpdatePlatformAccountSettingsDto: {
            /** @description Non-secret connector settings to merge. Credentials and encrypted browser session state are left unchanged. */
            settings: {
                [key: string]: unknown;
            };
        };
        UpdatePlatformAccountDto: {
            enabled: boolean;
        };
        ConnectionTestContractDto: {
            ok: boolean;
            accountName?: string;
            manual?: boolean;
            ready?: boolean;
            message?: string;
            details?: {
                [key: string]: unknown;
            };
        };
        ContentSourceContractDto: {
            /** Format: uuid */
            id: string;
            name: string;
            /** @enum {string} */
            type: "MANUAL" | "URL" | "RSS" | "SITEMAP" | "WORDPRESS";
            /** Format: uri */
            url?: string | null;
            enabled: boolean;
            /** Format: date-time */
            lastFetchedAt?: string | null;
            /** Format: date-time */
            nextFetchAt?: string | null;
            _count?: {
                articles?: number;
            };
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateContentSourceDto: {
            name: string;
            /** @enum {string} */
            type: "MANUAL" | "URL" | "RSS" | "SITEMAP" | "WORDPRESS";
            url?: string;
            config?: {
                [key: string]: unknown;
            };
        };
        FetchResultContractDto: {
            discovered: number;
            inserted: number;
            duplicates: number;
        };
        SourceSummaryContractDto: {
            /** Format: uuid */
            id: string;
            name: string;
            /** @enum {string} */
            type: "MANUAL" | "URL" | "RSS" | "SITEMAP" | "WORDPRESS";
        };
        ContentSourceLinkContractDto: {
            source: components["schemas"]["SourceSummaryContractDto"];
        };
        ContentContractDto: {
            /** Format: uuid */
            id: string;
            title: string;
            body: string;
            summary?: string | null;
            language: string;
            /** Format: uri */
            canonicalUrl?: string | null;
            /** @enum {string} */
            status: "DRAFT" | "FETCHED" | "AI_GENERATING" | "GENERATED" | "WAITING_REVIEW" | "APPROVED" | "ARCHIVED";
            sourceArticle?: components["schemas"]["ContentSourceLinkContractDto"] | null;
            _count?: {
                variants?: number;
                campaigns?: number;
            };
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateContentDto: {
            title: string;
            body: string;
            summary?: string;
            /** @default vi */
            language: string;
            canonicalUrl?: string;
        };
        PlatformNameContractDto: {
            slug: string;
            name: string;
        };
        ContentVariantContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            contentId: string;
            /** Format: uuid */
            platformId: string;
            title?: string | null;
            body: string;
            hashtags: string[];
            summary?: string | null;
            cta?: string | null;
            recommended: boolean;
            reason?: string | null;
            mediaRecommendation?: {
                [key: string]: unknown;
            } | null;
            /** @enum {string} */
            status: "DRAFT" | "GENERATED" | "APPROVED" | "REJECTED";
            version: number;
            platform?: components["schemas"]["PlatformNameContractDto"];
            content?: {
                [key: string]: unknown;
            };
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        GenerateContentDto: {
            /**
             * @example [
             *       "linkedin",
             *       "wordpress"
             *     ]
             */
            platforms: string[];
            /**
             * @description AI provider for this generation run. Uses the backend default when omitted.
             * @enum {string}
             */
            aiProvider?: "openai" | "deepseek" | "gemini";
        };
        AiProviderContractDto: {
            /** @enum {string} */
            id: "openai" | "deepseek" | "gemini";
            label: string;
            model: string;
            configured: boolean;
            isDefault: boolean;
        };
        SourceArticleContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            sourceId: string;
            title: string;
            description?: string | null;
            /** Format: uri */
            canonicalUrl?: string | null;
            author?: string | null;
            /** Format: date-time */
            publishedAt?: string | null;
            images: string[];
            tags: string[];
            categories: string[];
            /** @enum {string} */
            status: "DISCOVERED" | "FETCHED" | "DUPLICATE" | "FAILED";
            errorMessage?: string | null;
            source: components["schemas"]["SourceSummaryContractDto"];
            content?: {
                /** Format: uuid */
                id?: string;
                /** @enum {unknown} */
                status?: "DRAFT" | "FETCHED" | "AI_GENERATING" | "GENERATED" | "WAITING_REVIEW" | "APPROVED" | "ARCHIVED";
            } | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateContentVariantDto: {
            /** Format: uuid */
            contentId: string;
            /** @example devto */
            platformSlug: string;
            title?: string;
            body: string;
            hashtags?: string[];
        };
        UpdateVariantDto: {
            title?: string;
            body?: string;
            summary?: string;
            hashtags?: string[];
            cta?: string;
            recommended?: boolean;
            /** @enum {string} */
            status?: "DRAFT" | "GENERATED" | "APPROVED" | "REJECTED";
        };
        UpdateVariantStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "GENERATED" | "APPROVED" | "REJECTED";
        };
        PromptTemplateContractDto: {
            /** Format: uuid */
            id: string;
            name: string;
            systemPrompt: string;
            userTemplate: string;
            schema: {
                [key: string]: unknown;
            };
            version: number;
            active: boolean;
            platform?: {
                [key: string]: unknown;
            };
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        UpsertPromptDto: {
            /** @example linkedin */
            platformSlug: string;
            name: string;
            systemPrompt: string;
            /** @description Supports {{platform}}, {{title}}, {{body}}, {{summary}}, {{canonicalUrl}} */
            userTemplate: string;
            schema?: {
                [key: string]: unknown;
            };
            /** @default true */
            active: boolean;
        };
        CampaignProgressContractDto: {
            total: number;
            published: number;
            failed: number;
            needsAction: number;
            active: number;
            scheduled: number;
            cancelled: number;
        };
        CampaignContractDto: {
            /** Format: uuid */
            id: string;
            name: string;
            /** Format: uuid */
            contentId: string;
            /** @enum {string} */
            status: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "CANCELLED";
            /** Format: date-time */
            scheduledAt?: string | null;
            timezone: string;
            progress?: components["schemas"]["CampaignProgressContractDto"];
            content?: {
                [key: string]: unknown;
            };
            targets?: {
                [key: string]: unknown;
            }[];
            _count?: {
                targets?: number;
            };
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CampaignTargetDto: {
            platformAccountId: string;
            contentVariantId: string;
            overrides?: {
                [key: string]: unknown;
            };
        };
        CreateCampaignDto: {
            name: string;
            contentId: string;
            /** @description ISO-8601 timestamp with an explicit offset */
            scheduledAt?: string;
            /**
             * @default UTC
             * @example Asia/Ho_Chi_Minh
             */
            timezone: string;
            targets: components["schemas"]["CampaignTargetDto"][];
        };
        AutomatedCampaignContractDto: {
            campaign: components["schemas"]["CampaignContractDto"];
            content: components["schemas"]["ContentContractDto"];
            generatedVariants: number;
            jobsCreated: number;
            /** @description Whether the campaign was activated for immediate or scheduled delivery. */
            activated: boolean;
        };
        AutomateCampaignDto: {
            /** @example Ra mắt sản phẩm VPS mới */
            name: string;
            /**
             * @description Thông tin nguồn để AI viết các biến thể riêng cho từng nền tảng.
             * @example Quảng bá gói VPS hiệu năng cao cho lập trình viên, tập trung vào backup và hỗ trợ 24/7.
             */
            brief: string;
            platformAccountIds: string[];
            /** @description Previously uploaded, unattached media assets to attach to the generated source content. */
            mediaAssetIds?: string[];
            /**
             * @description AI provider for this automation run. Uses the backend default when omitted.
             * @enum {string}
             */
            aiProvider?: "openai" | "deepseek" | "gemini";
            /** @description ISO-8601 timestamp with Z or an explicit UTC offset. */
            scheduledAt?: string;
            /**
             * @default UTC
             * @example Asia/Ho_Chi_Minh
             */
            timezone: string;
            /**
             * @description Activate the generated campaign automatically. A future scheduledAt is still queued for that time.
             * @default true
             */
            publishImmediately: boolean;
        };
        PublishJobContractDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            status: "SCHEDULED" | "QUEUED" | "PUBLISHING" | "PROCESSING" | "PUBLISHED" | "RETRY" | "FAILED" | "NEEDS_ACTION" | "POSSIBLE_DUPLICATE" | "CANCELLED";
            /** Format: uuid */
            platformAccountId: string;
            /** Format: date-time */
            scheduledAt: string;
            attemptCount: number;
            maxAttempts: number;
            /** Format: date-time */
            nextAttemptAt?: string | null;
            lastErrorCode?: string | null;
            lastErrorMessage?: string | null;
            platformAccount?: {
                [key: string]: unknown;
            };
            target?: {
                [key: string]: unknown;
            };
            publishedPost?: {
                [key: string]: unknown;
            } | null;
            attempts?: {
                [key: string]: unknown;
            }[];
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        PublishJobMetricsContractDto: {
            publishedToday: number;
            scheduled: number;
            processing: number;
            failed: number;
        };
        ManualPayloadContractDto: {
            /** Format: uuid */
            jobId: string;
            /** @enum {string} */
            status: "SCHEDULED" | "QUEUED" | "PUBLISHING" | "PROCESSING" | "PUBLISHED" | "RETRY" | "FAILED" | "NEEDS_ACTION" | "POSSIBLE_DUPLICATE" | "CANCELLED";
            platform: string;
            accountName: string;
            title?: string | null;
            body: string;
            summary?: string | null;
            hashtags: string[];
            cta?: string | null;
            /** Format: uri */
            canonicalUrl?: string | null;
            media: {
                /** @enum {string} */
                type: "image" | "video" | "document";
                /** Format: uri */
                url: string;
                altText?: string;
                mimeType?: string;
            }[];
            suggestedExternalPostId?: string;
            /** Format: uri */
            openUrl?: string;
        };
        ReconcileNotFoundDto: {
            /**
             * @description Explicit confirmation that the operator checked topics and moderation queues
             * @example true
             */
            confirmedNotFound: boolean;
        };
        ManualPublishedDto: {
            externalPostId: string;
            url?: string;
        };
        PublishedPostContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            publishJobId: string;
            /** Format: uuid */
            platformAccountId: string;
            externalPostId: string;
            /** Format: uri */
            url?: string | null;
            /** Format: date-time */
            publishedAt: string;
            platformAccount?: {
                [key: string]: unknown;
            };
            job?: {
                [key: string]: unknown;
            };
        };
        MediaAssetContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            contentId?: string | null;
            /** Format: uuid */
            variantId?: string | null;
            /** @enum {string} */
            type: "IMAGE" | "VIDEO" | "DOCUMENT";
            storageKey: string;
            /** Format: uri */
            publicUrl?: string | null;
            mimeType: string;
            /** @description Decimal byte count serialized as a string */
            sizeBytes: string;
            checksum: string;
            /**
             * @description Media metadata. Uploaded accessible descriptions are returned as altText.
             * @example {
             *       "altText": "A dashboard showing campaign performance."
             *     }
             */
            metadata: {
                [key: string]: unknown;
            };
            /** Format: date-time */
            createdAt: string;
        };
        PublishAttemptLogContractDto: {
            /** Format: uuid */
            id: string;
            attemptNumber: number;
            status: string;
            errorCode?: string | null;
            errorMessage?: string | null;
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            finishedAt?: string | null;
            responseMetadata?: {
                [key: string]: unknown;
            } | null;
            job?: {
                [key: string]: unknown;
            };
        };
        AuditLogContractDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            actorId?: string | null;
            action: string;
            entityType: string;
            entityId?: string | null;
            requestId?: string | null;
            ipAddress?: string | null;
            /** Format: date-time */
            createdAt: string;
            actor?: {
                [key: string]: unknown;
            } | null;
            before?: {
                [key: string]: unknown;
            } | null;
            after?: {
                [key: string]: unknown;
            } | null;
        };
        SystemSettingContractDto: {
            key: string;
            value: {
                [key: string]: unknown;
            };
            description?: string | null;
            secret: boolean;
            /** Format: date-time */
            updatedAt: string;
        };
        UpdateSettingDto: {
            value: {
                [key: string]: unknown;
            };
        };
        OAuthProviderContractDto: {
            provider: string;
            platform?: string;
            status: string;
            callback?: string;
        };
        OAuthStartContractDto: {
            /** Format: uri */
            authorizationUrl: string;
        };
        HealthContractDto: {
            /** @enum {string} */
            status: "ok";
            service: string;
            /** Format: date-time */
            timestamp: string;
        };
        ReadinessContractDto: {
            /** @enum {string} */
            status: "ready";
            /** @enum {string} */
            database: "up";
            /** @enum {string} */
            redis: "up" | "down";
            /** @enum {string} */
            rabbitmq: "up" | "down";
            /** Format: date-time */
            timestamp: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    Auth_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AuthSessionContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Auth_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AuthSessionContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Auth_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MutationResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Auth_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["UserContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Users_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AdminUserContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Users_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AdminUserContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Platforms_list: {
        parameters: {
            query?: {
                page?: number;
                limit?: number;
                search?: string;
                group?: "SOCIAL" | "BLOGGING" | "COMMUNITY" | "FORUM" | "DEVELOPER" | "MEDIA" | "COMMERCE" | "EVENT";
                mode?: "OFFICIAL_API" | "COMPATIBLE_API" | "BROWSER_ASSISTED" | "MANUAL";
                availability?: "READY" | "API_REVIEW_REQUIRED" | "API_RESEARCH_REQUIRED" | "CREDENTIAL_REQUIRED" | "MANUAL_ONLY";
                enabled?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Platforms_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Platforms_toggle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TogglePlatformDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Connectors_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ConnectorDescriptorContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlatformAccountDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_setEnabled: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformAccountDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_updateCredential: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCredentialDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_updateSettings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlatformAccountSettingsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_revokeBrowserSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PlatformAccountContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PlatformAccounts_testConnection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ConnectionTestContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentSources_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentSourceContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentSources_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateContentSourceDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentSourceContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentSources_fetch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["FetchResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Contents_list: {
        parameters: {
            query?: {
                page?: number;
                limit?: number;
                search?: string;
                status?: "DRAFT" | "FETCHED" | "AI_GENERATING" | "GENERATED" | "WAITING_REVIEW" | "APPROVED" | "ARCHIVED";
                sourceId?: string;
                from?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Contents_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateContentDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Contents_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Contents_generate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateContentDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentVariantContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Ai_providers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AiProviderContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    SourceArticles_list: {
        parameters: {
            query?: {
                page?: number;
                limit?: number;
                search?: string;
                status?: "DISCOVERED" | "FETCHED" | "DUPLICATE" | "FAILED";
                sourceId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["SourceArticleContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    SourceArticles_promote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentVariants_list: {
        parameters: {
            query: {
                contentId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentVariantContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentVariants_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateContentVariantDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentVariantContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentVariants_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateVariantDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentVariantContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    ContentVariants_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateVariantStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ContentVariantContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Prompts_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PromptTemplateContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Prompts_createVersion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertPromptDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PromptTemplateContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Campaigns_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["CampaignContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Campaigns_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCampaignDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["CampaignContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Campaigns_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["CampaignContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Campaigns_automate: {
        parameters: {
            query?: never;
            header: {
                /** @description A UUID or another unique 8-128 character key. Reuse it only when retrying the same request. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AutomateCampaignDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AutomatedCampaignContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Campaigns_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["CampaignContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_list: {
        parameters: {
            query?: {
                page?: number;
                limit?: number;
                status?: "SCHEDULED" | "QUEUED" | "PUBLISHING" | "PROCESSING" | "PUBLISHED" | "RETRY" | "FAILED" | "NEEDS_ACTION" | "POSSIBLE_DUPLICATE" | "CANCELLED";
                search?: string;
                from?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PublishJobContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_metrics: {
        parameters: {
            query: {
                /** @description Start of the user-local day converted to UTC */
                todayFrom: string;
                /** @description End of the user-local day converted to UTC */
                todayTo: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PublishJobMetricsContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_manualPayload: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ManualPayloadContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_retry: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MutationResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_resumeBrowser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MutationResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_reconcileNotFound: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReconcileNotFoundDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MutationResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishJobs_markPublished: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ManualPublishedDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MutationResultContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    PublishedPosts_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PublishedPostContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Media_list: {
        parameters: {
            query?: {
                page?: number;
                limit?: number;
                contentId?: string;
                variantId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MediaAssetContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Media_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                    /** Format: uuid */
                    contentId?: string;
                    /** Format: uuid */
                    variantId?: string;
                    /** @description Accessible description stored with the media asset metadata. */
                    altText?: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["MediaAssetContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Logs_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PublishAttemptLogContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Logs_listPublishLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["PublishAttemptLogContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Logs_listAuditLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["AuditLogContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Settings_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["SystemSettingContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Settings_upsert: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSettingDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["SystemSettingContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    OAuth_providers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["OAuthProviderContractDto"][];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    OAuth_start: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                provider: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["OAuthStartContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    OAuth_callback: {
        parameters: {
            query: {
                state: string;
                code: string;
            };
            header?: never;
            path: {
                provider: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OAuth completed; redirects to the frontend accounts page */
            303: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Health_health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["HealthContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    Health_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success: boolean;
                        data: components["schemas"]["ReadinessContractDto"];
                        meta: components["schemas"]["ApiMetaContractDto"];
                    };
                };
            };
            /** @description Standard application error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success: boolean;
                        error: {
                            code: string;
                            message: string;
                            details?: unknown;
                        };
                        meta: {
                            requestId: string;
                            /** Format: date-time */
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
}

