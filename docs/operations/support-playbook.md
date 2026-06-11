# Support playbook

## Channels

- Primary: `NEXT_PUBLIC_SUPPORT_EMAIL` (fallback: support@example.com)
- In-app: `/legal/support`, `/restaurant/help`

## Severity levels

| Level | Description | Target response |
| --- | --- | --- |
| Sev1 | Restaurant cannot receive orders | Urgent |
| Sev2 | Degraded ordering/staff workflow | Same day |
| Sev3 | Menu/content issue | Next business window |
| Sev4 | Question/change request | Best effort |

## First response steps

1. Acknowledge receipt with ticket reference.
2. Classify severity.
3. Collect information (see below).
4. Apply workaround (pause orders, manual service).
5. Escalate to engineering for Sev1–Sev2.

## Information to collect

- Restaurant name and slug
- Approximate time issue started
- Affected table QR or order ID (if any)
- Browser/device for staff board issues
- Screenshot or screen recording if safe

## Do NOT request

- Passwords
- `SUPABASE_SERVICE_ROLE_KEY`
- `RATE_LIMIT_SECRET`
- Customer payment card data (not collected by platform)

## Pause orders

Restaurant owner → `/restaurant/settings` → toggle availability off.  
Communicate paused message to diners if needed.

## Fallback process

If platform unavailable: restaurant continues with normal in-house service (paper menu, staff taking orders verbally). Close table sessions manually when platform returns.

## Related runbooks

- [production-readiness-checklist.md](./production-readiness-checklist.md)
- [backup-restore-runbook.md](./backup-restore-runbook.md)
- [incident-response-runbook.md](./incident-response-runbook.md)
