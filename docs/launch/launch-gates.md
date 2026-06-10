# Launch Gates

Checklist that must be fully green before charging customers / public launch.
Mirrors section 2 of `docs/known-limitations.md` — keep both in sync.

## Infrastructure

- [ ] Production Supabase project created and migrations applied
- [ ] Production env vars configured (URL, anon key, service role key, app URL)
- [ ] Service role key verified server-only (never in client bundles, never in logs)
- [ ] Vercel project (Pro plan) configured — later, out of scope for this PR
- [ ] Domain/DNS via Cloudflare — later, out of scope for this PR
- [ ] Backups enabled on Supabase; restore procedure tested
- [ ] Monitoring/alerting plan (uptime check on `/api/health`, error tracking)

## Security

- [ ] RLS enabled on all tables in production (verify with Supabase advisors)
- [ ] Supabase security advisors run with no critical findings
- [x] Baseline rate limiting on `POST /api/public/orders` (in-memory, 20/min
      per IP + table token) — implemented in the MVP
- [ ] Production-grade **distributed** rate limiting (Redis/Upstash or
      Vercel/Cloudflare edge) replacing the in-memory baseline before wider
      public scale
- [ ] MFA enabled/offered for admin and restaurant accounts (future hardening)
- [ ] CAPTCHA / abuse heuristics on the public order endpoint, if pilot traffic
      shows abuse the rate limiter + first-order confirmation don't catch
- [x] First-order staff confirmation + table-session browser authorizations
      protect fixed printed QR codes — implemented in this MVP
- [ ] `product-images` storage bucket verified in production: created by the
      migration, public read, **no** anon/authenticated write policies
- [ ] Logs checked: no secrets, no tokens, no customer PII
- [ ] First platform admin provisioned through a controlled, documented process

## Legal

- [ ] Terms reviewed by a qualified professional
- [ ] Privacy policy reviewed (incl. data retention defaults finalised)
- [ ] Allergen & translation disclaimer reviewed
- [ ] Contact details published

## Functional smoke (see docs/testing/smoke-test.md)

- [ ] Admin smoke: create/activate/suspend restaurant, create users
- [ ] Restaurant smoke: categories, products (PT-only creation, image upload),
      tables, branding
- [ ] Public QR smoke: menu loads, language switcher, invalid token page,
      suspended restaurant page, paused-orders banner
- [ ] Order creation smoke: order placed, idempotency verified, kitchen board
      updates new → preparing → ready → delivered
- [ ] First-order confirmation smoke: unauthorized browser →
      pending_confirmation → staff confirm → session opens → same browser
      orders straight to new → other browser still needs confirmation →
      reject path → session close revokes authorizations
- [ ] Orders filter smoke: quick filters + custom date/time range persist in
      the URL and survive refresh
- [ ] CSV translation smoke: export → edit → preview → commit → menu updated
- [ ] Tenant isolation smoke: restaurant A cannot access restaurant B
      data/orders/sessions/images
- [ ] Final full smoke run with realistic restaurant-like data (menu size,
      table count, order volume) against the production project

## Pilot readiness checklist (per restaurant)

- [ ] Restaurant created and activated
- [ ] Branding configured (colors readable on the public menu)
- [ ] Accepting-orders setting reviewed (and pause message drafted)
- [ ] At least one table active, QR printed
- [ ] At least one category active
- [ ] At least one product active and available (with photo where possible)
- [ ] Public QR tested on a real phone (390px-class viewport)
- [ ] Test order created from a fresh/private browser
- [ ] First-order confirmation tested (confirm + reject)
- [ ] Staff dashboard tested on the device the restaurant will actually use
- [ ] Table session close flow tested (authorizations revoked)
- [ ] Translation CSV export/import tested if the menu is multilingual
- [ ] Legal/disclaimer pages reviewed with the restaurant
