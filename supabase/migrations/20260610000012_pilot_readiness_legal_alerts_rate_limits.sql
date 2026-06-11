-- Pilot readiness: public order attempt tracking for server-side rate limiting.
-- Raw IP addresses are never stored; only HMAC-derived key_hash values.

create table public.public_order_attempts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete cascade,
  key_hash text not null,
  bucket_start timestamptz not null,
  created_at timestamptz not null default now(),
  accepted boolean not null default false,
  reason text null
);

create index public_order_attempts_key_bucket_idx
  on public.public_order_attempts (key_hash, bucket_start);

create index public_order_attempts_restaurant_created_idx
  on public.public_order_attempts (restaurant_id, created_at desc);

create index public_order_attempts_created_idx
  on public.public_order_attempts (created_at);

create index public_order_attempts_table_created_idx
  on public.public_order_attempts (table_id, created_at desc)
  where accepted = true;

alter table public.public_order_attempts enable row level security;

-- No policies: service role bypasses RLS; anon/authenticated cannot read or write.

comment on table public.public_order_attempts is
  'Short-lived anti-abuse counters for public order creation. Stores HMAC hashes only — never raw IPs. Rows older than 7–30 days may be purged via admin maintenance.';
