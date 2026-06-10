# Launch Gates

Checklist that must be fully green before charging customers / public launch.

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
- [ ] Logs checked: no secrets, no tokens, no customer PII
- [ ] First platform admin provisioned through a controlled, documented process

## Legal

- [ ] Terms reviewed by a qualified professional
- [ ] Privacy policy reviewed (incl. data retention defaults finalised)
- [ ] Allergen & translation disclaimer reviewed
- [ ] Contact details published

## Functional smoke (see docs/testing/smoke-test.md)

- [ ] Admin smoke: create/activate/suspend restaurant, create users
- [ ] Restaurant smoke: categories, products, tables, branding
- [ ] Public QR smoke: menu loads, language switcher, invalid token page,
      suspended restaurant page
- [ ] Order creation smoke: order placed, idempotency verified, kitchen board
      updates new → preparing → ready → delivered
- [ ] CSV translation smoke: export → edit → preview → commit → menu updated
- [ ] Tenant isolation smoke: restaurant A cannot access restaurant B data
