# API Integration

## Contract workflow

```text
NestJS DTO/controller → Swagger → /api/docs-json
                                  ↓
                         pnpm api:generate
                                  ↓
                    src/generated/api/schema.ts
```

With the backend running:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 corepack pnpm api:generate
```

PowerShell:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001"
corepack pnpm api:generate
```

Use `OPENAPI_SCHEMA_URL=file:///absolute/path/openapi.json` for an exported schema. Commit generated contract changes together with consuming UI changes; do not hand-edit generated output.

## Envelope

The client appends `/api/v1` to `NEXT_PUBLIC_API_URL` and unwraps `{ "success": true, "data": ..., "meta": ... }`. Failures shaped as `{ "success": false, "error": { "code": "...", "message": "..." } }` become `ApiError` instances.

`src/generated/api/client.ts` exposes an `openapi-fetch` client parameterized by the generated `paths`. Feature UI uses `resourcesService` and query hooks so envelope handling and response adaptation stay centralized. It must not call `fetch`, depend on Prisma models, or inspect secrets directly.

## Adapters

The backend uses relational shapes such as `capability`, `_count`, nested `platformAccount`, campaign targets and attempts. `resources.service.ts` imports the generated OpenAPI component schemas for the stable transport models, narrows only relational objects that OpenAPI intentionally leaves generic, then maps them into display-focused models (`capabilities`, `accountCount`, flattened publish jobs). This keeps pages readable while making backend contract changes fail TypeScript checks.

The high-volume collections `GET /contents`, `GET /source-articles`, `GET /publish-jobs` and `GET /media` are server-paginated. Their screens forward the supported filters (including source/date/status where applicable); rows arrive in `data`, while `page`, `limit`, `total` and `totalPages` come from envelope `meta`. Do not apply a second client-side filter to a partial page. Dashboard counters use `GET /publish-jobs/metrics` so totals are not inferred from the visible job page.

## Authentication

1. `POST /auth/login` sends email/password.
2. The API returns an access token and sets an HttpOnly refresh cookie.
3. `GET /auth/me` returns `displayName` and role list; the adapter selects the highest UI role.
4. A protected 401 triggers one `POST /auth/refresh`, then one retry.
5. Logout clears the backend session cookie and local access state.

Login or refresh can return `429 AUTH_RATE_LIMITED`. Show the API message and let the user wait; do not automatically retry an authentication burst.

Never log or persist the refresh token in JavaScript.

## OAuth

Accounts reads `GET /oauth/providers`, enables only providers reported as `READY` (LinkedIn, Google/Blogger, Instagram, Threads, Tumblr when the backend has their app settings), calls `GET /oauth/:provider/start`, and navigates to its authorization URL. The backend owns state, expiry, token exchange, encryption, automatic refresh and callback redirect. The callback returns to `/accounts?oauth=success&provider=…&accounts=N` or `/accounts?oauth=error&provider=…&reason=<code>`; `features/accounts/oauth.ts` turns both into a toast and clears the query. OAuth accounts get a per-row **Kết nối lại** button that restarts the provider flow. Blogger and Tumblr rows have a **Đăng ngay / Lưu nháp** switch that sends `PUT /platform-accounts/:id/settings` with `{ publishImmediately }` (API accounts accept only `publishImmediately`, `rateLimit`, `rateWindowSeconds` there).

## Account health

`GET /account-health` (`useAccountHealth`, polled every `max(3 × pollInterval, 30s)`) returns accounts needing reconnection, tokens expiring within 7 days that the system cannot renew, and counts of `NEEDS_ACTION`/`FAILED`/`POSSIBLE_DUPLICATE`/`RETRY` jobs. It feeds the Dashboard **Cần xử lý** panel and the top bar bell badge. ADMIN can run `POST /account-health/check` (**Kiểm tra tất cả** on Accounts) to refresh due Meta tokens and test every connection immediately.

OAuth and credential connectors are deliberately separate flows. WordPress, dev.to, Discord, Bluesky, Mastodon, Instagram, Threads and X use the generic platform-account contract:

1. Create with `POST /platform-accounts` and a write-only `credential` object, or replace an existing secret with `PUT /platform-accounts/:id/credential`.
2. Call `POST /platform-accounts/:id/test` against the real provider.
3. Treat the account as connected only after the backend returns `ok: true`; the backend owns the resulting status and `lastTestedAt`.

The UI never tries to fetch existing secret values. Replacing credentials requires every required credential field again. Connector-specific non-secret settings are sent only when creating an account because the current API does not expose a general account-metadata update endpoint.

WordPress, dev.to/Forem, Mastodon and Bluesky base URLs must resolve to public HTTPS destinations. The backend may reject private/reserved DNS answers, DNS rebinding or unsafe/cross-origin redirects even when the string looks like a valid URL.

## Logs and media

- `/logs` has two data sources: `GET /logs/publish` for per-attempt publishing results and ADMIN-only `GET /logs/audit` for mutations. Audit `actorId` is used as a safe fallback when the response has no joined actor object.
- Studio requests `GET /media?variantId=...` so filtering happens before pagination, and uploads with multipart `POST /media` (`file` + `variantId`). The backend validates ownership, one concurrent upload per user, 50 MiB limit and magic bytes, then stores a canonical extension. At publish time it merges/deduplicates Content-level and Variant-level media. There is no detach/delete endpoint in the current contract, so the UI does not pretend that removal is supported.

## Endpoint change checklist

1. Change backend DTO/controller and Swagger first.
2. Export or serve the OpenAPI document.
3. Regenerate the schema.
4. Add a small response adapter only when the API shape is not directly presentational.
5. Add a stable query key/hook.
6. Implement loading, empty, error, permission and mutation feedback states.
7. Run the complete quality suite.

## Chrome extension delivery

Accounts shows `ExtensionPanel` (`GET/POST /extension/devices`, `DELETE /extension/devices/:id`; the pairing token is
displayed once) and, for every non-`OFFICIAL_API` account, a **Tiện ích** dialog that calls
`PUT /extension/accounts/:id` with `{ enabled, engine, targetUrl, autoSubmit }`. Accounts with
`settings.delivery === "extension"` are eligible for automated campaigns even on `MANUAL` platforms. Publish jobs whose
latest attempt has `extensionQueued` map to `needsAction.kind` `EXTENSION_PENDING` (no `lastErrorCode`) or
`EXTENSION_ACTION` (`lastErrorCode` `EXTENSION_*`); the latter offers **Đã đăng** and
`POST /extension/jobs/:id/requeue`. The extension itself talks only to `/extension/agent/*` with its device token.
