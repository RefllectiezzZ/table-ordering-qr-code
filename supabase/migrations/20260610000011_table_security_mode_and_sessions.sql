-- ============================================================================
-- Table security mode: optional table sessions for bill/checkout flow.
-- Additive only — existing restaurants keep sessions enabled by default.
-- ============================================================================

alter table public.restaurants
  add column if not exists enable_table_sessions boolean not null default true;

comment on column public.restaurants.enable_table_sessions is
  'Controls whether public orders are grouped into table sessions for table bill/checkout flow.';

comment on column public.restaurants.require_order_confirmation is
  'Requires enable_table_sessions and is intended for stronger saved-QR protection.';

alter table public.restaurants
  drop constraint if exists restaurants_order_confirmation_requires_sessions;

alter table public.restaurants
  add constraint restaurants_order_confirmation_requires_sessions
    check (not (require_order_confirmation = true and enable_table_sessions = false));
