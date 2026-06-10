# Known Limitations & Follow-ups

Honest inventory of what this MVP does not do (yet), organised by what it
blocks. Nothing here is hidden or resolved-by-wording: section 1 is fine for
local testing, section 2 **must** be cleared before a real paid/public pilot,
section 3 is the post-MVP backlog, section 4 is the current dependency/audit
status.

## 1. Current MVP limitations (accepted for local testing)

Deliberate simplifications. They do not block local/manual testing of the full
flow and carry no security risk.

- **No image uploads** — branding and product images are URL fields. The
  schema already has the URL columns, so adding Supabase Storage later needs
  no migration.
- **Polling, not realtime**: the kitchen board refreshes every 8 seconds via a
  `no-store` GET endpoint.
- **No sound notification** on the kitchen board (browsers require a user
  gesture for audio). New orders pulse visually instead.
- **No order editing/refunds/partial cancels** — only validated status
  transitions. The board shows open orders plus the last 24h of closed ones
  (by design).
- **No pagination** in dashboards; fine for small restaurants, revisit at
  scale.
- Translation import cannot **delete** a translation language, only add/update
  (empty description clears the description, empty name leaves the language
  untouched).
- Category sorting is numeric `sort_order` only, no drag-and-drop UI.
- `dietary_tags` are free-text chips; no controlled vocabulary yet.
- **Manual smoke tests instead of automated E2E** — unit tests cover the
  security-critical pure logic (tokens, money, CSV, transitions, order
  building); `docs/testing/smoke-test.md` is the manual end-to-end procedure.
- TypeScript row types are **hand-written** (`src/types/database.ts`), not
  generated from the schema; update them by hand on schema changes.
- The same-origin guard on private mutations relies on `Origin` /
  `Sec-Fetch-Site` headers (sent by all modern browsers); it intentionally
  rejects non-browser clients without those headers — there is no separate
  API-token surface for programmatic access in the MVP.
- Audit logging covers main mutations but is best-effort (failures don't block
  the mutation and are not retried).
- No restaurant deletion in the UI (status `suspended`/`draft` covers MVP
  needs; deletion cascades exist at the DB level).

## 2. Launch gates — must be cleared before a real paid/public pilot

These are tracked as checkboxes in `docs/launch/launch-gates.md`.

- **MFA** for admin/restaurant accounts (currently password-only).
- **Distributed rate limiting** for `POST /api/public/orders`. The current
  limiter (20/min per IP + table token, 429 + `Retry-After`) is in-memory and
  single-process: it resets on deploy and is not shared across serverless
  instances. Good enough for a pilot, not for wider public scale —
  replace with Redis/Upstash or Vercel/Cloudflare edge limiting.
  (`/login` has no app-level limiter; Supabase Auth rate-limits upstream.)
- **CAPTCHA / abuse heuristics** on the public order endpoint, if pilot data
  shows abuse the rate limiter doesn't catch.
- **Legal review** of terms/privacy/allergen disclaimer — the current pages
  are drafts and not legal advice.
- **Final data retention policy** — the numbers in the privacy draft are
  placeholders.
- **Production monitoring and log review** — uptime check on `/api/health`,
  error tracking, and a pass over logs to confirm no secrets/PII.
- **Storage policy review when image uploads are added** — Supabase Storage
  buckets need their own RLS-equivalent policies before going live with
  uploads.
- **Final manual smoke test with realistic restaurant data** (full
  `docs/testing/smoke-test.md` run against the production project).

## 3. Post-MVP product/engineering follow-ups

Backlog — valuable, but neither local testing nor a small pilot depends on
them.

- Supabase Storage image uploads (logo, cover, product photos).
- Supabase Realtime for the kitchen board (replace polling).
- Kitchen sound notification (needs a user-gesture-gated audio setup).
- Email invite flow for restaurant users (today: admin sets an initial
  password, shared out-of-band).
- Password reset / account recovery UI (Supabase's built-in recovery can be
  enabled meanwhile).
- Role editing and user deactivation UI.
- Controlled first-admin bootstrap (today: manual SQL insert, documented in
  `docs/testing/smoke-test.md`).
- Drag-and-drop sorting for categories/products.
- Controlled vocabulary for dietary tags.
- Automated integration/E2E tests (Playwright or similar) to replace the
  manual smoke procedure.
- Generated DB types (`supabase gen types`) replacing the hand-written ones.

## 4. Dependency / audit status

**Status (June 2026): 2 moderate advisories, upstream, intentionally not
"fixed". No dependency changes made.**

- `npm audit` flags GHSA-qx2v-qp2m-jg93 (PostCSS < 8.5.10, "XSS via unescaped
  `</style>` in stringified CSS output") via `postcss@8.4.31`, which is an
  **exact pin inside `next@16.2.9` itself** (`node_modules/next/node_modules/postcss`).
- Investigation results:
  - `next@16.2.9` is the **latest stable** release (`latest` dist-tag). The
    patched range only exists in pre-release channels
    (`16.3.0-canary.6+` / `16.3.0-preview.x`) — not acceptable for this project.
  - `npm audit fix --dry-run` offers exactly one "fix": a breaking downgrade
    to `next@9.3.3`. Never apply it (`npm audit fix --force` is forbidden here).
  - An npm `overrides` entry could force a newer postcss into Next, but
    overriding a framework's exact internal pin trades real compatibility risk
    for zero practical security gain (see below), so it was rejected.
  - Every other `postcss` in the tree (`@tailwindcss/postcss`, `vite`) already
    resolves to patched `8.5.15`.
- **Practical exposure: effectively none.** The vulnerable code path requires
  stringifying *untrusted* CSS. In this project Next's bundled postcss runs at
  build time over our own first-party CSS only; no user-supplied CSS is ever
  processed.
- **What to monitor:** re-run `npm audit` on every dependency bump and watch
  for a stable Next release that includes the postcss bump (16.3.0 stable or a
  16.2.x backport), then update `next` + `eslint-config-next` together as a
  normal patch/minor upgrade.
