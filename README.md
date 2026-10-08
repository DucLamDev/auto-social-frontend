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

Never place OpenAI keys, social/API tokens (including a Discourse API key), database URLs, or storage secrets in frontend environment variables.

Social credentials entered on `/accounts` are sent directly to the backend write-only credential endpoints, encrypted there, and never returned to the browser. Studio media uploads use the authenticated multipart `/media` endpoint and attach the asset to the selected content variant.

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.social.example.com -t social-publisher-frontend .
docker run --rm -p 3000:3000 social-publisher-frontend
```

Because `NEXT_PUBLIC_*` values are compiled into browser bundles, every environment must build with the correct API origin. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [API integration](./API_INTEGRATION.md)
- [UI and route structure](./UI_STRUCTURE.md)
- [VPS deployment](./DEPLOYMENT.md)
- [Development plan](./DEVELOPMENT_PLAN.md)
