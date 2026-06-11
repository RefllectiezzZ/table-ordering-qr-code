# Backup and restore runbook

This PR documents procedures; it does **not** configure automatic backups.

## Backup policy (baseline)

- Rely on Supabase project backups (plan-dependent) for Postgres.
- Rely on Vercel deployment history for application code rollbacks.
- Before risky migrations: manual SQL export or `pg_dump` snapshot in non-production first.

## Verify backups exist

1. Supabase Dashboard → Database → Backups: confirm schedule and retention for the **production** project.
2. Note last successful backup timestamp before major changes.
3. Document who has Dashboard access.

## Manual export before risky migration

1. Announce maintenance window to pilot restaurant if needed.
2. Supabase Dashboard → SQL → export critical tables (`orders`, `order_items`, `menu_products`, `restaurants`) or use `pg_dump`.
3. Store export in secure, access-controlled storage (not in the git repo).
4. Record migration filename and git commit SHA.

## Restore principles

1. **Approve restore** with platform admin + restaurant owner for production data loss scenarios.
2. **Test restore in non-production** when possible (clone project or restore to staging).
3. Prefer **point-in-time recovery** (Supabase Pro+) over partial manual imports when available.
4. Application rollback: redeploy previous Vercel deployment; database may still need separate restore.

## Migration rollback

- If a migration fails mid-apply: stop, assess partial state, do not re-run blindly.
- Prepare a reverse SQL script only when the forward migration is reversible.
- If forward migration is not reversible, restore from backup instead.

## `public_order_attempts` cleanup

Rows older than 7–30 days may be purged manually via admin maintenance or a future cron. Not automated in this release.

## What is NOT automated here

- No in-app backup API integration.
- No automatic restore triggers.
- No cross-region replication setup by this application.
