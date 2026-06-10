-- ============================================================================
-- Row Level Security: helper functions and policies.
--
-- Access model:
--   * platform_admin        -> full read/manage on all tenants.
--   * restaurant_owner      -> manage data of their own restaurant only.
--   * restaurant_staff      -> read menu/tables, read/update orders of their
--                              own restaurant only.
--   * anon (public)         -> NO direct table access. The public QR menu and
--                              public order creation are served exclusively by
--                              server-only route handlers using the service
--                              role key, which select a minimal, safe field
--                              set after resolving the QR token.
--
-- All profile writes, public order inserts and audit log inserts are done by
-- server-only code with the service role key (which bypasses RLS), after
-- strict validation. No INSERT/UPDATE policies exist for those paths on
-- purpose: the absence of a policy means "denied" for regular keys.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read profiles without
-- recursive RLS). They only ever reveal data about the *calling* user, so
-- exposing them to the authenticated role is safe. Execution is revoked from
-- anon and public.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'platform_admin', false);
$$;

create or replace function public.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() in ('restaurant_owner', 'restaurant_staff')
      and public.current_user_restaurant_id() = target_restaurant_id,
    false
  );
$$;

create or replace function public.is_restaurant_owner(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() = 'restaurant_owner'
      and public.current_user_restaurant_id() = target_restaurant_id,
    false
  );
$$;

revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.current_user_restaurant_id() from public, anon;
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_restaurant_member(uuid) from public, anon;
revoke execute on function public.is_restaurant_owner(uuid) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_restaurant_id() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_restaurant_member(uuid) to authenticated;
grant execute on function public.is_restaurant_owner(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_category_translations enable row level security;
alter table public.menu_products enable row level security;
alter table public.menu_product_translations enable row level security;
alter table public.allergens enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- Reads: own profile, or platform admin. Writes: service role only.
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_platform_admin()));

-- ----------------------------------------------------------------------------
-- restaurants
-- ----------------------------------------------------------------------------
create policy "restaurants_select_admin_or_member"
  on public.restaurants for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(id)));

create policy "restaurants_insert_admin"
  on public.restaurants for insert to authenticated
  with check ((select public.is_platform_admin()));

create policy "restaurants_update_admin_or_owner"
  on public.restaurants for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(id)));

create policy "restaurants_delete_admin"
  on public.restaurants for delete to authenticated
  using ((select public.is_platform_admin()));

-- ----------------------------------------------------------------------------
-- restaurant_tables
-- ----------------------------------------------------------------------------
create policy "tables_select_admin_or_member"
  on public.restaurant_tables for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "tables_insert_admin_or_owner"
  on public.restaurant_tables for insert to authenticated
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "tables_update_admin_or_owner"
  on public.restaurant_tables for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "tables_delete_admin_or_owner"
  on public.restaurant_tables for delete to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

-- ----------------------------------------------------------------------------
-- menu_categories
-- ----------------------------------------------------------------------------
create policy "categories_select_admin_or_member"
  on public.menu_categories for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "categories_insert_admin_or_owner"
  on public.menu_categories for insert to authenticated
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "categories_update_admin_or_owner"
  on public.menu_categories for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "categories_delete_admin_or_owner"
  on public.menu_categories for delete to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

-- ----------------------------------------------------------------------------
-- menu_category_translations (scoped through the parent category)
-- ----------------------------------------------------------------------------
create policy "category_translations_select_admin_or_member"
  on public.menu_category_translations for select to authenticated
  using (
    exists (
      select 1 from public.menu_categories c
      where c.id = category_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_member(c.restaurant_id)))
    )
  );

create policy "category_translations_insert_admin_or_owner"
  on public.menu_category_translations for insert to authenticated
  with check (
    exists (
      select 1 from public.menu_categories c
      where c.id = category_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(c.restaurant_id)))
    )
  );

create policy "category_translations_update_admin_or_owner"
  on public.menu_category_translations for update to authenticated
  using (
    exists (
      select 1 from public.menu_categories c
      where c.id = category_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(c.restaurant_id)))
    )
  )
  with check (
    exists (
      select 1 from public.menu_categories c
      where c.id = category_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(c.restaurant_id)))
    )
  );

create policy "category_translations_delete_admin_or_owner"
  on public.menu_category_translations for delete to authenticated
  using (
    exists (
      select 1 from public.menu_categories c
      where c.id = category_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(c.restaurant_id)))
    )
  );

-- ----------------------------------------------------------------------------
-- menu_products
-- ----------------------------------------------------------------------------
create policy "products_select_admin_or_member"
  on public.menu_products for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "products_insert_admin_or_owner"
  on public.menu_products for insert to authenticated
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "products_update_admin_or_owner"
  on public.menu_products for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "products_delete_admin_or_owner"
  on public.menu_products for delete to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

-- ----------------------------------------------------------------------------
-- menu_product_translations (scoped through the parent product)
-- ----------------------------------------------------------------------------
create policy "product_translations_select_admin_or_member"
  on public.menu_product_translations for select to authenticated
  using (
    exists (
      select 1 from public.menu_products p
      where p.id = product_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_member(p.restaurant_id)))
    )
  );

create policy "product_translations_insert_admin_or_owner"
  on public.menu_product_translations for insert to authenticated
  with check (
    exists (
      select 1 from public.menu_products p
      where p.id = product_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(p.restaurant_id)))
    )
  );

create policy "product_translations_update_admin_or_owner"
  on public.menu_product_translations for update to authenticated
  using (
    exists (
      select 1 from public.menu_products p
      where p.id = product_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(p.restaurant_id)))
    )
  )
  with check (
    exists (
      select 1 from public.menu_products p
      where p.id = product_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(p.restaurant_id)))
    )
  );

create policy "product_translations_delete_admin_or_owner"
  on public.menu_product_translations for delete to authenticated
  using (
    exists (
      select 1 from public.menu_products p
      where p.id = product_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(p.restaurant_id)))
    )
  );

-- ----------------------------------------------------------------------------
-- allergens (static reference data, readable by any authenticated user;
-- public menu reads go through the server). Writes: service role only.
-- ----------------------------------------------------------------------------
create policy "allergens_select_authenticated"
  on public.allergens for select to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- orders
-- Members (owner AND staff) can read and update orders of their restaurant.
-- Public order creation is service-role only (no anon insert policy).
-- ----------------------------------------------------------------------------
create policy "orders_select_admin_or_member"
  on public.orders for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "orders_update_admin_or_member"
  on public.orders for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_member(restaurant_id)));

create policy "orders_delete_admin"
  on public.orders for delete to authenticated
  using ((select public.is_platform_admin()));

-- ----------------------------------------------------------------------------
-- order_items (scoped through the parent order)
-- ----------------------------------------------------------------------------
create policy "order_items_select_admin_or_member"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_member(o.restaurant_id)))
    )
  );

-- ----------------------------------------------------------------------------
-- audit_logs (read-only for admins and restaurant members; inserts are
-- service-role only)
-- ----------------------------------------------------------------------------
create policy "audit_logs_select_admin_or_member"
  on public.audit_logs for select to authenticated
  using (
    (select public.is_platform_admin())
    or (restaurant_id is not null and (select public.is_restaurant_member(restaurant_id)))
  );

-- ----------------------------------------------------------------------------
-- import_batches
-- ----------------------------------------------------------------------------
create policy "import_batches_select_admin_or_owner"
  on public.import_batches for select to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "import_batches_insert_admin_or_owner"
  on public.import_batches for insert to authenticated
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "import_batches_update_admin_or_owner"
  on public.import_batches for update to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)))
  with check ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

create policy "import_batches_delete_admin_or_owner"
  on public.import_batches for delete to authenticated
  using ((select public.is_platform_admin()) or (select public.is_restaurant_owner(restaurant_id)));

-- ----------------------------------------------------------------------------
-- import_rows (scoped through the parent batch)
-- ----------------------------------------------------------------------------
create policy "import_rows_select_admin_or_owner"
  on public.import_rows for select to authenticated
  using (
    exists (
      select 1 from public.import_batches b
      where b.id = import_batch_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(b.restaurant_id)))
    )
  );

create policy "import_rows_insert_admin_or_owner"
  on public.import_rows for insert to authenticated
  with check (
    exists (
      select 1 from public.import_batches b
      where b.id = import_batch_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(b.restaurant_id)))
    )
  );

create policy "import_rows_delete_admin_or_owner"
  on public.import_rows for delete to authenticated
  using (
    exists (
      select 1 from public.import_batches b
      where b.id = import_batch_id
        and ((select public.is_platform_admin()) or (select public.is_restaurant_owner(b.restaurant_id)))
    )
  );
