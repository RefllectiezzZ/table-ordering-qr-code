-- ============================================================================
-- Retention cleanup and query performance indexes (additive only).
-- No data deletion, no scheduled jobs.
-- ============================================================================

-- Retention cleanup scans by status + created_at across all restaurants.
create index if not exists orders_created_at_idx
  on public.orders (created_at);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at);

create index if not exists orders_restaurant_status_created_at_idx
  on public.orders (restaurant_id, status, created_at desc);

-- Public menu product/category lookups.
create index if not exists menu_products_restaurant_active_idx
  on public.menu_products (restaurant_id, category_id, is_active, is_available);

create index if not exists menu_categories_restaurant_active_sort_idx
  on public.menu_categories (restaurant_id, is_active, sort_order);

-- Table session floor views and retention helpers.
create index if not exists table_sessions_restaurant_status_opened_idx
  on public.table_sessions (restaurant_id, status, opened_at desc);
