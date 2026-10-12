# Social Publisher Frontend

Responsive operations dashboard for Social Publisher. This is an independent Next.js repository; it communicates with the backend only through the versioned REST contract at `NEXT_PUBLIC_API_URL/api/v1`.

## Stack

- Next.js App Router, React, strict TypeScript
- Tailwind CSS with shadcn-style local primitives
- TanStack Query for server state and polling
- React Hook Form + Zod for validated forms
- `openapi-typescript` generation workflow
- Vitest + Testing Library
- Multi-stage standalone Docker image

## Local development

Requirements: Node.js 22+ and Corepack.

```bash
cp .env.example .env.local
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:3000`. The API defaults to `http://localhost:3001`; change `NEXT_PUBLIC_API_URL` before building for another environment.

## Commands

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm api:generate
```

`api:generate` reads `${NEXT_PUBLIC_API_URL}/api/docs-json`, or `OPENAPI_SCHEMA_URL` when explicitly set, and replaces `src/generated/api/schema.ts`. The backend remains the source of truth.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Public origin of the NestJS backend, without `/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | No | Display name; defaults to `Social Publisher` |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | No | Default polling hint; defaults to `10000` |
| `NEXT_PUBLIC_DEFAULT_DISCOURSE_URL` | No | Public HTTPS forum URL prefilled only for new Discourse accounts |
| `NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME` | No | Public API username prefilled only for new Discourse accounts |
| `NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID` | No | Public numeric category ID prefilled only for new Discourse accounts |

Never place AI provider keys (OpenAI, DeepSeek, or Gemini), social/API tokens (including a Discourse API key), database URLs, or storage secrets in frontend environment variables.

The Studio and automated-campaign form load the safe provider catalog from `GET /api/v1/ai/providers` and let the user choose a configured provider for each generation. The browser sends only the provider ID; API keys and model configuration stay in the backend environment. Providers without a backend key are shown as unavailable, so Gemini remains disabled until `GEMINI_API_KEY` is configured and the backend is restarted. `AI_DEFAULT_PROVIDER` determines the initial selection and the backend fallback when a request omits a provider.

Social credentials entered on `/accounts` are sent directly to the backend write-only credential endpoints, encrypted there, and never returned to the browser. Studio media uploads use the authenticated multipart `/media` endpoint and attach the asset to the selected content variant.

## Main publishing workflow

The `/platforms` screen shows the backend catalog of **65 destinations** in 8 groups: Social, Blogging, Community, Forum, Developer, Media, Commerce, and Event. It requests 12 cards per page from the backend and supports search plus group, connector-mode, support-level, and enabled-state filters; changing a filter resets pagination to page 1.

For the shortest workflow, open `/campaigns`, click **Tạo tự động**, enter **Mô tả bài đăng**, optionally add **Ảnh minh hoạ** and **Mô tả ảnh / alt text**, choose OpenAI, DeepSeek, or Gemini under **Nhà cung cấp AI**, select the destinations, then run now or schedule. One request creates canonical content and a tailored, SEO-aware variant for each destination. The title is optional in the UI and can be derived from the brief. One automation request supports at most 12 distinct platforms; use separate campaigns for a wider rollout.

Destination behavior is explicit:

- **Kênh tự động qua API** uses an official or compatible API. A successful public post is `PUBLISHED`; a draft or moderated submission can correctly remain `NEEDS_ACTION`.
- **Kênh bàn giao thủ công** is selectable in the same one-shot flow and is labeled accordingly. AI still prepares the platform-specific title/body/tags and retains the optional image, but the job stops at `NEEDS_ACTION`. On `/publishing`, use **Copy & mở**, finish the post in the official editor, then choose **Đã đăng** and record its external ID/URL.
- Browser-assisted or unsupported automation is not silently treated as a working API connector.

`/accounts` → **Kết nối / cấu hình** separates API destinations from manual handoff destinations and paginates/searches both lists. Medium is manual: creating it stores only safe account/settings metadata and the official editor URL; no Medium or RapidAPI credential is requested. The RapidAPI screen supplied with this project shows a read-only, unofficial endpoint and is not used for publishing.

Catalog aliases reuse connector forms through `connectorKey` and merge their `defaultSettings`. For example, selecting TrueNAS or Level1Techs opens the Discourse form with that forum URL prefilled; selecting Mastodon.social or social.vivaldi.net opens the Mastodon form with its instance URL/visibility prefilled. The user must still provide a credential issued by that exact site—credentials never transfer between aliases.

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.social.example.com -t social-publisher-frontend .
docker run --rm -p 3000:3000 social-publisher-frontend
```

Because `NEXT_PUBLIC_*` values are compiled into browser bundles, every environment must build with the correct API origin. See [DEPLOYMENT.md](./DEPLOYMENT.md).

If a newly added provider selector, image field, or platform list is missing, the browser is usually serving a stale Docker image. Rebuild and recreate it from this repository:

```powershell
docker compose up -d --build --force-recreate frontend
```

If Docker still reuses an old layer:

```powershell
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

Then hard-refresh the browser (`Ctrl+F5`). Recreate backend `api` and `worker` as well whenever AI environment variables or backend source changed. Rotating/revoking any token previously pasted into chat or exposed in a screenshot is required before real publishing; never copy such a value into frontend env.

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [API integration](./API_INTEGRATION.md)
- [UI and route structure](./UI_STRUCTURE.md)
- [VPS deployment](./DEPLOYMENT.md)
- [Development plan](./DEVELOPMENT_PLAN.md)
