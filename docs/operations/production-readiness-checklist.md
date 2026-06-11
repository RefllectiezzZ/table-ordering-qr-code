# Production readiness checklist (pilot)

Baseline checklist before onboarding a real restaurant to a controlled pilot.

## Environment separation

- [ ] Production Supabase project separate from development.
- [ ] Production Vercel project (or equivalent host) separate from preview/dev.
- [ ] `NEXT_PUBLIC_APP_URL` set to the production HTTPS domain.
- [ ] `RATE_LIMIT_SECRET` set to a strong random server-only value (not committed).
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` set to a monitored inbox.
- [ ] Optional: `NEXT_PUBLIC_PLATFORM_NAME`, `NEXT_PUBLIC_LEGAL_ENTITY_NAME`.

## Database

- [ ] All migrations in `supabase/migrations/` applied in filename order.
- [ ] Migration `20260610000012_pilot_readiness_legal_alerts_rate_limits.sql` applied.
- [ ] Smoke test against production DB (read-only checks where possible).

## Domain and DNS

- [ ] Custom domain configured on Vercel.
- [ ] DNS (e.g. Cloudflare) points to production.
- [ ] HTTPS certificate active.

## Smoke test (production)

- [ ] Landing page loads.
- [ ] `/legal/privacy`, `/legal/terms`, `/legal/data-processing`, `/legal/support` load without auth.
- [ ] Owner can log in and reach `/restaurant`.
- [ ] Public menu `/t/<token>` loads for an active table.
- [ ] Test order reaches kitchen/staff board.
- [ ] Table bill shows non-payment disclaimer.
- [ ] Rate limiting returns 429 only under abuse (not normal use).

## Restaurant onboarding

- [ ] Restaurant created and activated by platform admin.
- [ ] Owner account created and linked.
- [ ] Menu categories and products published (allergens reviewed).
- [ ] Branding/template configured.
- [ ] Opening hours and timezone set.
- [ ] Table security mode chosen (confirmation on/off, sessions on/off).
- [ ] Tables created; QR codes printed and placed.

## QR print check

- [ ] QR URL uses production domain.
- [ ] QR scans correctly on iOS and Android.
- [ ] Table number/label matches physical table.

## Staff training

- [ ] Staff know how to confirm first orders (if enhanced security on).
- [ ] Kitchen board open on a dedicated device; sound opt-in demonstrated.
- [ ] Staff know how to pause orders in settings.
- [ ] Staff understand table bill is not payment/invoice.
- [ ] Fallback: paper menu and verbal orders if platform unavailable.
