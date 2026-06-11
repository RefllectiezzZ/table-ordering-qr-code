# Incident response runbook

## Severity guide

| Severity | Example |
| --- | --- |
| Sev1 | Restaurant cannot receive any orders |
| Sev2 | Degraded ordering or staff workflow |
| Sev3 | Wrong menu content (prices, allergens) |
| Sev4 | Question or change request |

## Public menu is down

1. Confirm scope: one restaurant or all tenants.
2. Check Vercel deployment status and Supabase status.
3. Ask restaurant to pause QR promotion; use paper/verbal ordering.
4. Communicate ETA when known.

**Customer message (PT):**  
"O menu digital está temporariamente indisponível. Por favor peça ajuda à nossa equipa para fazer o pedido."

## Orders not appearing on kitchen board

1. Verify restaurant `accepts_orders` and opening hours.
2. Check if orders are stuck in `pending_confirmation` (staff tab).
3. Refresh board; check browser network errors.
4. Verify `/api/restaurant/orders` returns data for authenticated staff.

## Kitchen screen freezes

1. Hard refresh the page.
2. Close other heavy tabs; keep one board tab open.
3. Re-login if session expired.
4. Use another device as fallback.

## Wrong prices or allergens published

1. Owner fixes products in `/restaurant/products` immediately.
2. If widespread, pause orders until corrected.
3. Inform affected customers if orders were placed at wrong price.
4. Document root cause (who changed what).

## Spam / abuse on public orders

1. Abuse may trigger 429 `rate_limited` for offending clients.
2. Pause orders temporarily if kitchen is flooded.
3. Review `public_order_attempts` counts (service role) if needed.
4. No raw IPs are stored; investigation uses hashed keys and timestamps.

## Database migration fails

1. Stop deployment pipeline.
2. Capture error from Supabase SQL editor or CLI.
3. Do not apply dependent migrations.
4. Follow [backup-restore-runbook.md](./backup-restore-runbook.md).

## Data must be restored

1. Get explicit approval from platform admin.
2. Restore in staging first when possible.
3. Communicate downtime to pilot restaurant.
4. After restore: verify orders, menus, and staff login.

## Escalation checklist

- [ ] Incident owner assigned
- [ ] Severity classified
- [ ] Restaurant owner notified (Sev1–Sev3)
- [ ] Workaround in place (pause orders / manual service)
- [ ] Root cause documented post-incident
