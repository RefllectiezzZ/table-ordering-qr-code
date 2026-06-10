-- ============================================================================
-- Initial schema for the multi-tenant QR table ordering SaaS.
--
-- Tenant model:
--   * Every business entity is scoped by restaurant_id.
--   * Public access flows exclusively through restaurant_tables.public_token.
--   * qr_token -> restaurant_tables.id -> restaurants.id
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- restaurants
-- ----------------------------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status text not null default 'draft' check (status in ('active', 'suspended', 'draft')),
  logo_url text,
  cover_image_url text,
  primary_color text not null default '#111827',
  secondary_color text,
  background_color text not null default '#ffffff',
  welcome_message text,
  default_language text not null default 'pt' check (default_language in ('pt', 'en', 'es', 'fr')),
  enabled_languages text[] not null default array['pt', 'en', 'es', 'fr'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- profiles (application profile for Supabase auth users)
--
-- One user belongs to at most one restaurant. platform_admin users have
-- restaurant_id NULL; restaurant_owner / restaurant_staff must have one.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null check (role in ('platform_admin', 'restaurant_owner', 'restaurant_staff')),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_restaurant_check check (
    (role = 'platform_admin' and restaurant_id is null)
    or (role in ('restaurant_owner', 'restaurant_staff') and restaurant_id is not null)
  )
);

create index profiles_restaurant_id_idx on public.profiles (restaurant_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- restaurant_tables
-- ----------------------------------------------------------------------------
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_number text not null,
  public_token text unique not null,
  label text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_tables_number_unique unique (restaurant_id, table_number)
);

create index restaurant_tables_restaurant_id_idx on public.restaurant_tables (restaurant_id);

create trigger restaurant_tables_set_updated_at
  before update on public.restaurant_tables
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_categories
-- ----------------------------------------------------------------------------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_categories_restaurant_id_idx on public.menu_categories (restaurant_id);

create trigger menu_categories_set_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_category_translations
-- ----------------------------------------------------------------------------
create table public.menu_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  language text not null check (language in ('pt', 'en', 'es', 'fr')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_category_translations_unique unique (category_id, language)
);

create index menu_category_translations_category_id_idx
  on public.menu_category_translations (category_id);

create trigger menu_category_translations_set_updated_at
  before update on public.menu_category_translations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_products
-- ----------------------------------------------------------------------------
create table public.menu_products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  is_available boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  allergen_codes text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_products_restaurant_id_idx on public.menu_products (restaurant_id);
create index menu_products_category_id_idx on public.menu_products (category_id);

create trigger menu_products_set_updated_at
  before update on public.menu_products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_product_translations
-- ----------------------------------------------------------------------------
create table public.menu_product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.menu_products (id) on delete cascade,
  language text not null check (language in ('pt', 'en', 'es', 'fr')),
  name text not null,
  description text,
  auto_translated boolean not null default false,
  reviewed_by_restaurant boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_product_translations_unique unique (product_id, language)
);

create index menu_product_translations_product_id_idx
  on public.menu_product_translations (product_id);

create trigger menu_product_translations_set_updated_at
  before update on public.menu_product_translations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- allergens (static EU reference data; seeded in a later migration)
-- ----------------------------------------------------------------------------
create table public.allergens (
  code text primary key,
  name_pt text not null,
  name_en text not null,
  name_es text not null,
  name_fr text not null
);

-- ----------------------------------------------------------------------------
-- orders
--
-- client_order_token is generated by the customer's browser and used for
-- idempotency: retrying the same submission never creates a duplicate order.
-- ----------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id),
  status text not null default 'new' check (status in ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  customer_note text,
  client_order_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_client_token_unique unique (restaurant_id, client_order_token)
);

create index orders_restaurant_id_status_idx on public.orders (restaurant_id, status);
create index orders_restaurant_id_created_at_idx on public.orders (restaurant_id, created_at desc);
create index orders_table_id_idx on public.orders (table_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- order_items
--
-- unit_price_cents is snapshotted server-side from menu_products at order
-- time. Client-provided prices are never trusted.
-- ----------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.menu_products (id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  item_note text,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ----------------------------------------------------------------------------
-- audit_logs (no secrets, no customer PII)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_restaurant_id_created_at_idx
  on public.audit_logs (restaurant_id, created_at desc);

-- ----------------------------------------------------------------------------
-- import_batches (CSV translation/menu import staging)
-- ----------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  type text not null check (type in ('menu_import', 'translation_import')),
  status text not null default 'preview' check (status in ('preview', 'committed', 'failed', 'cancelled')),
  original_filename text,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create index import_batches_restaurant_id_idx on public.import_batches (restaurant_id);

-- ----------------------------------------------------------------------------
-- import_rows
-- ----------------------------------------------------------------------------
create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb not null default '{}'::jsonb,
  status text not null default 'valid' check (status in ('valid', 'invalid', 'warning')),
  errors text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index import_rows_batch_id_idx on public.import_rows (import_batch_id);
