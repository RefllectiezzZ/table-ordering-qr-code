-- ============================================================================
-- Restaurant opening hours.
--
-- Adds per-weekday operating hours used to block PUBLIC ORDER SUBMISSION
-- outside operating hours. The public menu stays visible while closed.
--
-- Model (MVP):
--   * one interval per weekday (opens_at .. closes_at) or is_closed,
--   * overnight intervals are supported: closes_at <= opens_at means the
--     interval spills past midnight into the next day (e.g. 18:00 -> 02:00),
--   * split lunch/dinner schedules (two intervals per day) are NOT supported
--     yet — documented as a follow-up,
--   * a restaurant with NO rows at all is treated as "not configured" and
--     keeps accepting orders (only the dashboard/admin show a notice),
--   * times are interpreted in the restaurant's timezone column
--     (default Europe/Lisbon), evaluated server-side. Client clocks are
--     never trusted for order validation.
--
-- Writes go through the owner's user-scoped client (RLS below) from a
-- validated route handler; platform admins can also manage rows. The public
-- side reads via the service-role server helpers only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- restaurants: timezone used to evaluate the schedule server-side
-- ----------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists timezone text not null default 'Europe/Lisbon';

-- ----------------------------------------------------------------------------
-- restaurant_opening_hours
--   weekday: 0 = Sunday, 1 = Monday, ... 6 = Saturday (JS Date#getDay order)
-- ----------------------------------------------------------------------------
create table if not exists public.restaurant_opening_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  notes text check (notes is null or char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_opening_hours_unique unique (restaurant_id, weekday),
  -- Closed days may leave times null; open days need a real interval.
  -- opens_at = closes_at is rejected (ambiguous: zero-length or 24 h).
  constraint restaurant_opening_hours_times_check check (
    is_closed
    or (opens_at is not null and closes_at is not null and opens_at <> closes_at)
  )
);

create index if not exists restaurant_opening_hours_restaurant_id_idx
  on public.restaurant_opening_hours (restaurant_id, weekday);

drop trigger if exists restaurant_opening_hours_set_updated_at
  on public.restaurant_opening_hours;
create trigger restaurant_opening_hours_set_updated_at
  before update on public.restaurant_opening_hours
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
--   * platform admin: full manage (support / oversight),
--   * owner: manage their own restaurant's schedule,
--   * staff: read-only (the dashboard shows the schedule),
--   * anon: nothing — the public menu reads through server-only code.
-- ----------------------------------------------------------------------------
alter table public.restaurant_opening_hours enable row level security;

create policy "opening_hours_select_admin_or_member"
  on public.restaurant_opening_hours for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "opening_hours_insert_admin_or_owner"
  on public.restaurant_opening_hours for insert to authenticated
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "opening_hours_update_admin_or_owner"
  on public.restaurant_opening_hours for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "opening_hours_delete_admin_or_owner"
  on public.restaurant_opening_hours for delete to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

-- Defense in depth: anon never touches this table directly.
revoke all on table public.restaurant_opening_hours from anon;
