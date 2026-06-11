-- Public menu template settings (safe internal presets, no arbitrary HTML/CSS/JS).
-- Platform admin controls template selection per restaurant.

alter table public.restaurants
  add column if not exists public_menu_template text not null default 'brunch_editorial'
    check (public_menu_template in (
      'brunch_editorial',
      'fine_dining_dark',
      'modern_cafe',
      'street_food_bold',
      'minimal_clean'
    )),
  add column if not exists public_menu_density text not null default 'comfortable'
    check (public_menu_density in ('compact', 'comfortable', 'spacious')),
  add column if not exists public_menu_card_style text not null default 'image_right'
    check (public_menu_card_style in (
      'image_right',
      'image_left',
      'image_top',
      'text_only_elegant'
    )),
  add column if not exists public_menu_hero_style text not null default 'editorial'
    check (public_menu_hero_style in (
      'editorial',
      'immersive_cover',
      'compact_card',
      'split_brand'
    )),
  add column if not exists public_menu_background_style text not null default 'soft_gradient'
    check (public_menu_background_style in (
      'soft_gradient',
      'paper_texture',
      'dark_luxury',
      'clean_white',
      'bold_blocks'
    )),
  add column if not exists public_menu_cart_style text not null default 'floating_glass'
    check (public_menu_cart_style in (
      'floating_glass',
      'bottom_bar',
      'drawer_card'
    )),
  add column if not exists public_menu_show_images boolean not null default true;

comment on column public.restaurants.public_menu_template is
  'Internal React/Tailwind template preset for /t/[token] public menu.';
comment on column public.restaurants.public_menu_show_images is
  'When false, product cards render without photos (text-first layouts).';
