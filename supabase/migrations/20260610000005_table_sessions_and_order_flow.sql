-- ============================================================================
-- Table sessions, first-order confirmation and order availability.
--
-- Adds the operational layer that protects fixed/printed QR codes from abuse:
--
--   * restaurants.accepts_orders / paused_message  -> pause public ordering
--   * orders.status gains pending_confirmation + rejected
--   * orders.order_number                          -> short per-restaurant number
--   * table_sessions                               -> one open "tab" per table
--   * table_session_access_tokens                  -> hashed browser
--     authorizations granted after staff confirms the first order
--
-- Tenant model is unchanged: every new table is scoped by restaurant_id and
-- protected by RLS. Writes to the new tables happen exclusively through
-- server-only route handlers (service role) after the caller's membership has
-- been verified — the absence of INSERT/UPDATE policies means "denied" for
-- the anon and authenticated roles, exactly like public order creation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- restaurants: order availability switch
-- ----------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists accepts_orders boolean not null default true,
  add column if not exists paused_message text;

-- ----------------------------------------------------------------------------
-- orders: new statuses
--
-- pending_confirmation -> first order from a browser that holds no valid
--                         session authorization; must be confirmed by staff
--                         before the kitchen sees it.
-- rejected             -> staff declined a pending order; terminal.
-- ----------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status in (
      'pending_confirmation',
      'new',
      'preparing',
      'ready',
      'delivered',
      'cancelled',
      'rejected'
    )
  );

-- ----------------------------------------------------------------------------
-- table_sessions: one operational "tab" per table occupation.
--
-- Opened when staff confirms the first order of a new group (or manually from
-- the dashboard). Closed when the customers leave. Orders attach to the open
-- session at confirmation time; closing the session revokes the browser
-- authorizations granted during it.
-- ----------------------------------------------------------------------------
create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opened_by uuid references auth.users (id) on delete set null,
  closed_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index table_sessions_restaurant_id_idx
  on public.table_sessions (restaurant_id, status);
create index table_sessions_table_id_idx
  on public.table_sessions (table_id, status);

-- Hard guarantee: a table can never have two open sessions at once.
create unique index table_sessions_one_open_per_table
  on public.table_sessions (table_id)
  where status = 'open';

create trigger table_sessions_set_updated_at
  before update on public.table_sessions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- orders: attach to a session + short kitchen-friendly number
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists table_session_id uuid references public.table_sessions (id) on delete set null,
  add column if not exists order_number integer;

create index orders_table_session_id_idx on public.orders (table_session_id);

create unique index orders_restaurant_order_number_unique
  on public.orders (restaurant_id, order_number)
  where order_number is not null;

-- Per-restaurant counter for order numbers. The upsert inside the trigger
-- takes a row lock on the counter row, so concurrent inserts for the same
-- restaurant serialize and numbers are never duplicated.
create table public.restaurant_order_counters (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  last_number integer not null default 0
);

alter table public.restaurant_order_counters enable row level security;
-- No policies on purpose: only the trigger below (and the service role)
-- ever touches the counters.

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_number is null then
    insert into public.restaurant_order_counters as c (restaurant_id, last_number)
    values (new.restaurant_id, 1)
    on conflict (restaurant_id)
      do update set last_number = c.last_number + 1
    returning last_number into new.order_number;
  end if;
  return new;
end;
$$;

create trigger orders_assign_order_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

-- Backfill existing orders with stable historical numbers (oldest first) and
-- initialize the counters so new orders continue the sequence.
with numbered as (
  select id,
         row_number() over (partition by restaurant_id order by created_at, id) as rn
  from public.orders
  where order_number is null
)
update public.orders o
set order_number = numbered.rn
from numbered
where o.id = numbered.id;

insert into public.restaurant_order_counters (restaurant_id, last_number)
select restaurant_id, coalesce(max(order_number), 0)
from public.orders
group by restaurant_id
on conflict (restaurant_id)
  do update set last_number = greatest(
    public.restaurant_order_counters.last_number,
    excluded.last_number
  );

-- ----------------------------------------------------------------------------
-- table_session_access_tokens: hashed browser authorizations.
--
-- After staff confirms a device's first order, that device receives one raw
-- opaque token (delivered exactly once through the public status endpoint).
-- Only the SHA-256 hash is stored. The token authorizes direct-to-kitchen
-- orders for that table session until the session closes or the token
-- expires.
-- ----------------------------------------------------------------------------
create table public.table_session_access_tokens (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  table_session_id uuid not null references public.table_sessions (id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  source_order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index table_session_access_tokens_session_idx
  on public.table_session_access_tokens (table_session_id, status);

-- One authorization per confirmed source order: the public status endpoint
-- uses this to issue the raw token exactly once.
create unique index table_session_access_tokens_source_order_unique
  on public.table_session_access_tokens (source_order_id)
  where source_order_id is not null;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.table_sessions enable row level security;
alter table public.table_session_access_tokens enable row level security;

-- Staff/owners read sessions of their own restaurant (floor view, order
-- board); platform admins read all. Writes are service-role only: open,
-- close and attach flows run in validated server-only route handlers.
create policy "table_sessions_select_admin_or_member"
  on public.table_sessions for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

-- Access tokens are never readable from the browser or the dashboard — not
-- even hashed. No policies at all: service-role only.

-- Defense in depth: take away default table privileges from anon entirely
-- and write privileges from authenticated (RLS already denies, this makes it
-- structural).
revoke all on table public.table_sessions from anon;
revoke insert, update, delete on table public.table_sessions from authenticated;
revoke all on table public.table_session_access_tokens from anon, authenticated;
revoke all on table public.restaurant_order_counters from anon, authenticated;
