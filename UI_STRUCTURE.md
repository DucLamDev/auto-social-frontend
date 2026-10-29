# UI Structure

## Routes

| Route | Purpose | Primary roles |
| --- | --- | --- |
| `/login` | JWT/cookie authentication | Public |
| `/dashboard` | Metrics, 7-day throughput, recent jobs | All |
| `/platforms` | Connector modes, availability and capabilities | All; ADMIN toggles |
| `/accounts` | OAuth **Kết nối** / per-row **Kết nối lại**, write-only credential forms, real connection test, **Kiểm tra tất cả**, status and enable/disable | All; mutations restricted |
| `/sources` | URL/RSS/Sitemap/WordPress/manual ingestion | ADMIN, EDITOR |
| `/contents` | Canonical content library and filters | All |
| `/studio/[contentId]` | Original/variant editor, media attach, generate/save/approve | ADMIN, EDITOR |
| `/campaigns` | Content + target selection, publish/schedule | ADMIN, EDITOR |
| `/calendar` | Day/week/month schedule | All |
| `/publishing` | Polling queue, retry and manual publish | All; mutations restricted |
| `/prompts` | Versioned platform prompts | All; ADMIN edits |
| `/logs` | Publish attempts for all roles; mutation audit tab for ADMIN | All / ADMIN audit |
| `/settings` | AI/storage/system metadata; runtime vẫn lấy từ deployment env | ADMIN |

## Reusable UI

- `components/ui`: repository-owned shadcn-style buttons, cards, form controls, badges, tables, modal, pagination, skeleton and async states.
- `components/layout`: responsive sidebar/topbar shell and page headings.
- `components/auth`: authentication guard and role-aware control visibility.
- `components/platforms`: consistent platform marks without external image dependencies.

Desktop has a collapsible sidebar and dense tables. On tablet/mobile the sidebar becomes an overlay, page actions stack, modals fit the viewport, grids collapse, and operational tables scroll horizontally.

## State conventions

- Initial query: skeleton, never a blank page.
- Empty data/filter: contextual explanation and next action.
- Query failure: safe message and retry.
- Mutation: affected control disabled with success/failure toast.
- Unauthorized: refresh once, then redirect to login.
- Forbidden: hide mutation or render a permission state.
- Background work: visible polling indicator without locking the UI.

Green indicates complete/connected, blue scheduled/processing, amber review/action/retry, red failure/expiry, and gray draft/inactive. Every color also has a text label.
