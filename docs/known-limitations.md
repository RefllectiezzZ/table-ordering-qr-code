# Known Limitations & Follow-ups

Honest list of what this MVP does not do (yet). Items marked **launch gate**
must be resolved before paid/public launch.

## Security / hardening

- **Rate limiting on `POST /api/public/orders` is a single-process, in-memory
  baseline** (20/min per IP + table token, 429 + `Retry-After`). It resets on
  deploy/restart and is not shared across serverless instances, so it is
  best-effort for MVP/pilot only. A distributed limiter (Redis/Upstash or
  Vercel/Cloudflare) is still required before wider public scale.
  **Launch gate.** `/login` has no app-level limiter (Supabase Auth applies its
  own rate limits upstream).
- **No MFA** for restaurant/admin accounts. Documented as future hardening.
  **Launch gate.**
- **No CAPTCHA / abuse heuristics** on the public order endpoint.
- The same-origin guard on private mutations relies on `Origin` /
  `Sec-Fetch-Site` headers (sent by all modern browsers); it intentionally
  rejects non-browser clients without those headers — there is no separate
  API-token surface for programmatic access in the MVP.
- Audit logging covers main mutations but is best-effort (failures don't block
  the mutation and are not retried).

## Product

- **No image uploads** — branding and product images are URL fields. Supabase
  Storage integration is the natural follow-up (schema already has the URL
  columns; no migration needed).
- **No sound notification** on the kitchen board (browsers require a user
  gesture for audio). New orders pulse visually instead; sound is a follow-up.
- **Polling, not realtime**: the order board refreshes every 8 seconds via a
  GET endpoint. Supabase Realtime is a follow-up optimization.
- **No order editing/refunds/partial cancels** — only status transitions.
- **No pagination** in dashboards; fine for small restaurants, revisit at scale.
- Order board shows open orders plus the last 24h of closed ones (by design).
- Translation import cannot **delete** a translation language, only add/update
  (empty description clears the description, empty name leaves the language
  untouched).
- Category sort is by `sort_order` with no drag-and-drop UI.
- `dietary_tags` are free-text chips; no controlled vocabulary yet.

## Platform administration

- **User management is minimal**: platform admin creates owner/staff users with
  an initial password (shared out-of-band). No email invitations, no password
  reset flow surfaced in-app (Supabase's built-in recovery can be enabled),
  no user deactivation UI, no role editing UI.
- The **first platform admin** is provisioned manually via SQL
  (docs/testing/smoke-test.md). Acceptable for MVP; a controlled bootstrap
  procedure is a follow-up.
- No restaurant deletion in the UI (status `suspended`/`draft` covers MVP needs;
  deletion cascades exist at the DB level).

## Engineering

- `npm audit` reports 2 moderate advisories from a transitive `postcss` pinned
  inside `next` itself (GHSA-qx2v-qp2m-jg93). Not fixable without a breaking
  downgrade ("fix" would install next@9); waiting on an upstream Next.js patch
  release. Tracked; re-check on every dependency bump.
- Unit tests cover the security-critical pure logic (tokens, money, CSV,
  transitions, order building). There are **no integration/E2E tests** —
  `docs/testing/smoke-test.md` is the manual E2E procedure for now.
- TypeScript row types are hand-written (`src/types/database.ts`) instead of
  generated from the schema; regenerate-by-hand on schema changes.
- Legal pages are drafts and **not legal advice**. **Launch gate.**
- Data retention defaults in the privacy draft are placeholders. **Launch gate.**
