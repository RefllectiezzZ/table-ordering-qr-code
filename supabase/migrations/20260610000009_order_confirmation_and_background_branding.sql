-- ============================================================================
-- Order confirmation toggle + public menu background branding settings.
-- Additive only — preserves existing behavior via defaults.
-- ============================================================================

alter table public.restaurants
  add column if not exists require_order_confirmation boolean not null default true,
  add column if not exists public_menu_background_image_url text,
  add column if not exists public_menu_background_mode text not null default 'cover',
  add column if not exists public_menu_background_position text not null default 'center',
  add column if not exists public_menu_background_overlay text not null default 'light',
  add column if not exists public_menu_background_overlay_opacity integer not null default 60,
  add column if not exists public_menu_surface_style text not null default 'solid';

alter table public.restaurants
  add constraint restaurants_public_menu_background_mode_check
    check (public_menu_background_mode in ('cover', 'repeat', 'pattern', 'blurred_cover')),
  add constraint restaurants_public_menu_background_position_check
    check (public_menu_background_position in ('center', 'top', 'bottom')),
  add constraint restaurants_public_menu_background_overlay_check
    check (public_menu_background_overlay in ('none', 'light', 'dark', 'brand_tint', 'cream')),
  add constraint restaurants_public_menu_background_overlay_opacity_check
    check (public_menu_background_overlay_opacity between 0 and 90),
  add constraint restaurants_public_menu_surface_style_check
    check (public_menu_surface_style in ('solid', 'glass', 'paper', 'dark_translucent'));

comment on column public.restaurants.require_order_confirmation is
  'When true, first orders from a new device require staff confirmation before kitchen.';

comment on column public.restaurants.public_menu_background_image_url is
  'Optional atmosphere background for the public QR menu (/t/[token]). Does not override template colors.';

-- ============================================================================
-- Supabase Storage bucket for restaurant branding backgrounds (platform admin).
--
-- Layout (tenant-scoped paths, enforced by the upload route handler):
--   restaurant-branding/restaurants/{restaurant_id}/branding/background-{uuid}.webp
--
-- Access model mirrors product-images: public read, service-role write only.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-branding',
  'restaurant-branding',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
