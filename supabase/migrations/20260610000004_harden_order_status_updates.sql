-- ============================================================================
-- Harden order updates with column-level privileges.
--
-- Problem: RLS scopes *which rows* a restaurant member may update, but the
-- table-level UPDATE privilege that Supabase grants by default covers *every
-- column*. A member using their own session directly against PostgREST could
-- therefore rewrite customer_note, table_id, client_order_token, etc. on
-- orders of their own restaurant. The application only ever updates `status`.
--
-- Fix: narrow the UPDATE privilege for the `authenticated` role to the
-- `status` column only. Postgres column-level grants compose cleanly with
-- RLS: RLS keeps deciding which rows are reachable, the grant decides which
-- columns are assignable. The `updated_at` trigger still fires (trigger
-- column assignments are not subject to the caller's column privileges).
--
-- Effects:
--   * owner/staff/admin can still update orders.status of reachable rows
--     (the existing status API keeps working unchanged),
--   * any direct attempt to update other columns fails with 42501
--     (permission denied), even on the user's own restaurant,
--   * the service role is unaffected (used for public order creation),
--   * anon additionally loses its default write privileges on orders
--     (it never had RLS policies, this is belt-and-braces).
--
-- INSERT/DELETE table privileges for `authenticated` are intentionally left
-- as-is: RLS already denies INSERT to everyone (no policy) and restricts
-- DELETE to platform admins.
-- ============================================================================

revoke update on table public.orders from authenticated;
grant update (status) on table public.orders to authenticated;

revoke insert, update, delete on table public.orders from anon;
