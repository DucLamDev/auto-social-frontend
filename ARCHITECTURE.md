# Frontend Architecture

## Boundary

This repository does not import backend source, connect to PostgreSQL, consume RabbitMQ, or call OpenAI/social APIs directly. Its only integration boundary is the backend HTTP API.

```text
Browser
  ├─ App Router pages/layouts
  │    └─ feature views
  │         ├─ local UI state + React Hook Form
  │         └─ TanStack Query hooks
  │              └─ resource services / response adapters
  │                   └─ API envelope client
  │                        └─ https://api.example.com/api/v1
  └─ HttpOnly refresh cookie (managed by backend)
```

## Layers

- `src/app`: routes, layouts, metadata, health endpoint. Pages stay thin.
- `src/features`: screen behavior and composition. Features use hooks, never raw `fetch`.
- `src/components`: reusable presentation, layout, permissions and platform UI.
- `src/hooks`: TanStack Query keys, queries, mutations, invalidation and auth state.
- `src/services`: HTTP boundary. The client handles envelopes, auth headers, one refresh/retry, network errors and safe error mapping. Resource adapters convert relational API data into UI view models.
- `src/generated/api`: generated OpenAPI contract.
- `src/schemas`: immediate client validation; backend validation remains authoritative.
- `src/types`: display/view-model types, not duplicated request DTOs.
- `src/config`: public build configuration.

## Components and state

Route pages/layouts are Server Components by default. Stateful features, forms, query providers and interactive shell elements are explicit Client Components. TanStack Query owns remote state; local React state owns transient selections and dialogs.

## Authentication

Login receives a short-lived access token while the backend sets a rotating refresh token as an HttpOnly cookie. The access token is held in memory with per-tab `sessionStorage` fallback. A single-flight refresh prevents simultaneous 401 responses from rotating the session more than once. Failed refresh clears access state and sends the user to `/login`.

For cross-origin deployment, the API must allow the exact frontend origin with credentials, both origins must use HTTPS, and cookie attributes must match the domain topology.

## Authorization and errors

Backend guards are authoritative. `PermissionGate` improves usability by removing invalid controls for `VIEWER` and restricting system controls to `ADMIN`. It is not a security boundary.

API failures become `ApiError` with safe message, code, status, details and request ID. Screens have loading, empty, error and permission states. Mutations show toast feedback and invalidate only related query keys.

## Background publishing

Publishing remains asynchronous. Job queries poll without blocking navigation or editing. The query boundary can later consume SSE/WebSocket events without restructuring feature screens.
