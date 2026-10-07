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

Accounts reads `GET /oauth/providers`, enables only providers reported as `READY`, calls `GET /oauth/:provider/start`, and navigates to its authorization URL. The backend owns state, expiry, token exchange, encryption and callback redirect.

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
