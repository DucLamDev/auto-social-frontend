# UI Structure

## Routes

| Route | Purpose | Primary roles |
| --- | --- | --- |
| `/login` | JWT/cookie authentication | Public |
| `/dashboard` | Metrics, 7-day throughput, recent jobs | All |
| `/platforms` | Redirects to `/accounts?tab=api` (the catalogue is chosen in **Kết nối tài khoản API**; a disabled platform is switched on when an account is added for it) | — |
| `/accounts` | Two tabs (`?tab=extension` default, `?tab=api`), each with **Tạo nội dung hàng loạt & đăng** (`/campaigns?automate=1&channel=…` preselects that tab's accounts). **Đăng bằng tiện ích Chrome**: paired Chromes, **Thêm social** (one row, only it is signed in), **Nhập file tài khoản** (re-upload skips unchanged socials), **Kết nối / cấu hình** (Chrome flows), per-row **Test** and why an account cannot post yet. **Đăng qua API**: **Kết nối tài khoản API** (OAuth **Kết nối**, write-only credential forms, Playwright, manual handoff), **Nhập file cấu hình API** (ADMIN, template `/templates/api-accounts.csv`), per-row **Kết nối lại** / **Test**. No bulk check button. Status and enable/disable | All; mutations restricted |
| `/sources` | URL/RSS/Sitemap/WordPress/manual ingestion | ADMIN, EDITOR |
| `/contents` | Canonical content library and filters; title or **Mở Studio** opens the item | All |
| `/studio/[contentId]` | Studio of one library item (no menu entry; sidebar keeps **Thư viện nội dung** lit): original/variant editor, media attach, generate/save/approve | ADMIN, EDITOR |
| `/studio` | Redirects to `/contents` | — |
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
