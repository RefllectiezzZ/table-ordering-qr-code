# Security Guardrails

These invariants must hold for every change. Review them before merging
anything that touches data access.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is read exclusively in
  `src/lib/supabase/service-role.ts`, which imports the `server-only` package —
  importing it from a client component is a build-time error.
- Never commit real secrets. `.env*` is gitignored; `.env.example` contains
  placeholders only.
- Never log secrets, keys, tokens or passwords. Error logs only record error
  codes/short identifiers (see route handlers — `console.error("...", error.code)`).
- No secrets in prompts, docs, or PR text.

## Database access

- RLS is enabled on **every** table (see
  `supabase/migrations/20260610000002_rls_policies.sql`).
- The anon role has no table access; the public menu and public order creation go
  through server-only modules using the service-role client with strict token
  resolution and minimal field selection.
- Dashboard/API mutations use the **user-scoped** server client wherever
  possible, so RLS re-validates tenant scope underneath the application checks.
- The service-role client is only used where unavoidable: public menu/order flow,
  audit-log writes, admin user creation (Supabase Auth admin API).
- SECURITY DEFINER helper functions only reflect data about the calling user and
  have EXECUTE revoked from `anon`/`public`.
- **Column-level privilege hardening on `orders`**
  (`supabase/migrations/20260610000004_harden_order_status_updates.sql`): the
  `authenticated` role may only UPDATE `orders.status` — RLS scopes the rows,
  the column grant scopes the columns. A restaurant member using their session
  directly against PostgREST cannot rewrite `customer_note`, `table_id`,
  `client_order_token` or any other order column, even within their own
  restaurant. `anon` additionally has all write privileges on `orders` revoked.
  The status API is unaffected (it only ever updates `status`); the service
  role (public order creation) bypasses grants as before.

## HTTP surface

- All mutations are POST route handlers under `/api/**` with zod validation
  (`src/lib/validation/schemas.ts`). No GET mutations.
- **Same-origin guard on every private mutation** (`src/lib/security/origin.ts`,
  applied to all `/api/admin/**` and `/api/restaurant/**` POST handlers and to
  `POST /auth/signout`): unsafe methods must carry an `Origin` matching the
  request host, or — when `Origin` is absent — a `Sec-Fetch-Site` of
  `same-origin`/`same-site`/`none`. Requests with neither header are rejected
  with a generic 403. This is CSRF defense in depth on top of SameSite auth
  cookies. `POST /api/public/orders` is deliberately exempt (unauthenticated,
  token-scoped) and is rate-limited instead.
- **Public order rate limiting** (`src/lib/security/rate-limit.ts`): in-memory
  sliding window, 20 submissions per 60s per `IP + table_token`, returning 429
  with `Retry-After`. Generous enough that idempotent retries of the same
  `client_order_token` are never blocked. This is a single-process baseline —
  a distributed limiter (Redis/Upstash or platform-level) remains a launch
  gate before wider public scale.
- Never trust from the client: `restaurant_id`, `table_id`, product prices,
  roles, statuses. They are derived server-side from the session or the QR token.
- Order item prices are read from `menu_products` at insert time
  (`src/lib/order-items.ts`), never from the request body.
- Products in a public order must belong to the token's restaurant and be
  active + available; suspended restaurants, inactive tables and paused
  ordering (`restaurants.accepts_orders = false`) are rejected.
- Public order creation is idempotent via the unique
  `(restaurant_id, client_order_token)` constraint; unique-violation races return
  the existing order.
- Order status changes validate transitions (`src/lib/orders.ts`); terminal
  states cannot be reopened. `pending_confirmation` can only be left through
  the dedicated confirm/reject endpoints — the generic status route refuses
  it, so the table-session attachment can never be skipped.

## First-order confirmation & table sessions (saved-QR abuse defense)

- Printed QR codes are fixed; abuse protection is operational, not
  cryptographic rotation:
  - an order without a valid browser authorization starts as
    `pending_confirmation` and is **never** shown as kitchen-ready;
  - staff confirm/reject from the reception area
    (`POST /api/restaurant/orders/[id]/confirm|reject`);
  - confirmation creates/joins the table's open `table_sessions` row
    (race-safe partial unique index: one open session per table).
- Browser authorizations (`table_session_access_tokens`):
  - only the SHA-256 hash is stored; the raw token is delivered exactly once
    through `GET /api/public/orders/status`, gated by the order's own
    `client_order_token` (random UUID known only to the ordering device) and a
    partial unique index on `source_order_id`;
  - tokens are scoped to (restaurant, table, session), expire after 8 hours
    and are revoked when the session closes;
  - an invalid/expired/revoked token silently degrades the order to
    `pending_confirmation` — same external behavior as no token, so nothing
    can be probed.
- Closing a session (`POST /api/restaurant/table-sessions/[id]/close`)
  revokes all of its authorizations and is blocked while open orders remain
  unless staff explicitly confirm (force flag after a warning). Orders are
  never deleted by closing.
- All staff session/confirmation endpoints derive `restaurant_id` from the
  authenticated profile, validate the order/table/session against it through
  the user-scoped client (RLS re-checks), and only then perform the
  service-role writes that the narrowed column grants require.
- `GET /api/public/orders/status` requires BOTH the table QR token and the
  order's `client_order_token`; it returns only the order's short code,
  number and status (plus the one-time session token) and is rate-limited per
  IP + table token.

## Product image uploads (Supabase Storage)

- Bucket `product-images` is public-read (menu photos), write-restricted:
  no anon/authenticated storage policies exist, so the only write path is
  `POST /api/restaurant/products/upload-image` (owner-only, same-origin).
- The storage path is built **server-side** from the session's
  `restaurant_id` plus a random UUID filename — clients never influence the
  path, so cross-tenant overwrites are impossible.
- Validation: 5 MB cap and JPEG/PNG/WebP checked by **magic bytes**, not just
  the declared content type; the bucket enforces the same limits as metadata.

## Auth redirects

- Sign-out (`POST /auth/signout`) redirects to a fixed app path built from
  `NEXT_PUBLIC_APP_URL` (`src/lib/app-url.ts`) — never from `request.url`,
  which can carry a wrong `https://` scheme behind proxies (the
  "https://localhost:3000" bug), and never from user input (no open-redirect
  surface). The localhost fallback applies only when the env var is unset.
- Post-login redirects accept only same-origin relative paths
  (`safeRedirect` in `src/components/auth/login-form.tsx`).

## Caching

- No unsafe static caching of private or tenant-scoped pages: every dashboard
  page, the public token page and all API routes are `force-dynamic`; polling
  responses set `Cache-Control: no-store`.
- The auth proxy applies the cache headers provided by `@supabase/ssr` whenever
  auth cookies are written, so responses carrying session tokens are never CDN-cached.

## Tokens

- Table QR tokens: 32 chars, `crypto.getRandomValues`, 64-char URL-safe alphabet
  (~192 bits). Format-checked before any DB lookup. Never reused or reassigned.
- `client_order_token`: browser-generated UUID for idempotency only — it carries
  no authority and is unique per (restaurant, submission).

## PII

- Public customers are never asked for personal data; orders store table, items,
  notes and timestamps only.
- Audit log metadata is minimal and structured (no notes, no free-form customer
  content, no secrets).

## Documented follow-ups (not yet implemented)

- Distributed rate limiting on `POST /api/public/orders` (Redis/Upstash or
  Vercel/Cloudflare) — the current in-memory limiter is per-process
  best-effort and resets on deploy; replace before wider public launch.
- MFA for restaurant/admin accounts — launch gate for production hardening.
- Kitchen sound notification (visual highlight implemented; audio needs a user
  gesture to satisfy browser autoplay rules).
