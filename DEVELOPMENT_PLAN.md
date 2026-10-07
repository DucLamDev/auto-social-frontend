# Development Plan

Status legend: `[ ] TODO`, `[-] IN PROGRESS`, `[x] DONE`, `[!] BLOCKED`.

## Foundation

- [x] Independent Next.js App Router repository
  - Dependencies: Node.js 22, pnpm
  - Files: `package.json`, `src/app`, configs
  - Test command: `corepack pnpm typecheck && corepack pnpm build`
  - Notes: strict TypeScript; no shared workspace or backend imports.
- [x] Tailwind and shadcn-style primitives
  - Dependencies: Tailwind CSS, CVA, lucide-react
  - Files: `src/app/globals.css`, `src/components/ui`
  - Test command: `corepack pnpm lint`
- [x] API/OpenAPI architecture
  - Dependencies: backend `/api/docs-json`
  - Files: `src/services`, `src/generated`, `scripts/generate-api.mjs`
  - Test command: `corepack pnpm test`
  - Notes: response adapters match current backend relational shapes.
- [x] Authentication and RBAC UX
  - Dependencies: backend auth endpoints and CORS/cookie configuration
  - Files: `src/features/auth`, `src/components/auth`, `src/hooks/use-auth.ts`
  - Test command: `corepack pnpm typecheck`

## Product screens

- [x] Responsive application shell and dashboard
  - Files: `src/components/layout`, `src/features/dashboard`
  - Test command: `corepack pnpm build`
- [x] Platforms, accounts and OAuth provider picker
  - Dependencies: backend platforms/accounts/oauth endpoints
  - Files: `src/features/platforms`, `src/features/accounts`
  - Test command: `corepack pnpm test && corepack pnpm typecheck`
  - Notes: LinkedIn/Google OAuth is enabled only when backend reports `READY`; eight credential connectors use write-only create/replace forms followed by a real connection test.
- [x] Sources, content library and Content Studio
  - Dependencies: backend crawler/content/AI endpoints
  - Files: `src/features/sources`, `src/features/contents`, `src/features/studio`
  - Test command: `corepack pnpm test && corepack pnpm build`
  - Notes: Content Library uses backend pagination/search/status metadata; Studio uploads multipart media to the selected variant with 50 MiB/MIME UX validation.
- [x] Campaigns, calendar and publishing operations
  - Dependencies: approved variants and enabled accounts
  - Files: `src/features/campaigns`, `src/features/calendar`, `src/features/publishing`
  - Test command: `corepack pnpm typecheck`
- [x] Prompt, logs and settings administration
  - Dependencies: ADMIN role for mutation/settings routes
  - Files: `src/features/prompts`, `src/features/logs`, `src/features/settings`
  - Test command: `corepack pnpm build`
  - Notes: Logs separates publish attempts and ADMIN-only audit activity with actor fallback.
- [x] Loading, empty, error, permission and responsive states
  - Files: `src/components/ui/states.tsx`, all feature views
  - Test command: `corepack pnpm test`

## Delivery

- [x] Frontend unit/component tests
  - Files: `src/**/*.test.ts(x)`
  - Test command: `corepack pnpm test` (7 files / 24 tests at handoff)
- [x] Standalone Docker image and local Compose
  - Files: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
  - Test command: `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .`
  - Notes: artifact is included; Next standalone output builds successfully.
- [!] Local Docker image validation
  - Dependencies: running Docker Desktop/Linux engine
  - Files: `Dockerfile`
  - Test command: `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .`
  - Notes: blocked in the current host because the Docker daemon is stopped and the service requires elevation; CI performs this check.
- [x] Independent CI pipeline
  - Files: `.github/workflows/ci.yml`
  - Test command: workflow runs lint, typecheck, test, Next build and Docker build.
- [x] Production dependency audit
  - Files: `package.json`, `pnpm-lock.yaml`, CI workflow
  - Test command: `corepack pnpm audit --prod`
  - Notes: no production advisory at handoff.
- [ ] SSE/WebSocket transport
  - Status: deferred; polling is the MVP transport
  - Dependencies: backend realtime endpoint
  - Files: future query event bridge
  - Test command: future integration tests
  - Notes: current query architecture can accept events without screen rewrites.
- [!] Live social-account integration test
  - Dependencies: approved apps and real test credentials
  - Files: no credentials committed
  - Test command: connector-specific backend integration suite
  - Notes: `CREDENTIAL_REQUIRED` / `API_REVIEW_REQUIRED`, as applicable.
