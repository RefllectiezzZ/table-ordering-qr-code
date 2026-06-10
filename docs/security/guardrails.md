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

## HTTP surface

- All mutations are POST route handlers under `/api/**` with zod validation
  (`src/lib/validation/schemas.ts`). No GET mutations.
- Never trust from the client: `restaurant_id`, `table_id`, product prices,
  roles, statuses. They are derived server-side from the session or the QR token.
- Order item prices are read from `menu_products` at insert time
  (`src/lib/order-items.ts`), never from the request body.
- Products in a public order must belong to the token's restaurant and be
  active + available; suspended restaurants and inactive tables are rejected.
- Public order creation is idempotent via the unique
  `(restaurant_id, client_order_token)` constraint; unique-violation races return
  the existing order.
- Order status changes validate transitions (`src/lib/orders.ts`); terminal
  states cannot be reopened.

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

- Rate limiting on `POST /api/public/orders` (per-IP/per-token) — required before
  paid launch; mitigate today by suspending abusive restaurants/tables.
- MFA for restaurant/admin accounts — launch gate for production hardening.
- Kitchen sound notification (visual highlight implemented; audio needs a user
  gesture to satisfy browser autoplay rules).
