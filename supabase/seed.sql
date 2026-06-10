-- ============================================================================
-- LOCAL / DEMO SEED ONLY. Do not run against production.
--
-- Creates the "Demo Brunch" restaurant with two tables, three categories and
-- three products, fully translated (PT/EN/ES/FR). Demo QR tokens are fixed so
-- local testing has stable URLs (the public landing page does NOT link to
-- them):
--
--   http://localhost:3000/t/demo-mesa-1-k3v9q2x8w7z4
--   http://localhost:3000/t/demo-mesa-2-p5r8t1y6u3s0
--
-- Real tables generated through the dashboard always receive
-- cryptographically random tokens; these readable ones exist only for the
-- local demo.
--
-- To create your first platform admin after signing the user up via the
-- Supabase dashboard (Authentication > Users > Add user):
--
--   insert into public.profiles (id, email, full_name, role)
--   values ('<auth-user-uuid>', '<email>', 'Platform Admin', 'platform_admin');
--
-- To attach an owner/staff user to the demo restaurant:
--
--   insert into public.profiles (id, email, full_name, role, restaurant_id)
--   values ('<auth-user-uuid>', '<email>', 'Demo Owner', 'restaurant_owner',
--           '11111111-1111-4111-8111-111111111111');
-- ============================================================================

-- Restaurant ------------------------------------------------------------------
insert into public.restaurants
  (id, name, slug, status, primary_color, background_color, welcome_message, default_language, enabled_languages)
values
  ('11111111-1111-4111-8111-111111111111', 'Demo Brunch', 'demo-brunch', 'active',
   '#b45309', '#fffbeb', 'Bem-vindo ao Demo Brunch! Faça o seu pedido diretamente da mesa.',
   'pt', array['pt', 'en', 'es', 'fr'])
on conflict (id) do nothing;

-- Tables ----------------------------------------------------------------------
insert into public.restaurant_tables (id, restaurant_id, table_number, public_token, label, status) values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', '1', 'demo-mesa-1-k3v9q2x8w7z4', 'Mesa 1', 'active'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', '2', 'demo-mesa-2-p5r8t1y6u3s0', 'Mesa 2', 'active')
on conflict (id) do nothing;

-- Categories ------------------------------------------------------------------
insert into public.menu_categories (id, restaurant_id, sort_order, is_active) values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 0, true),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 1, true),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', 2, true)
on conflict (id) do nothing;

insert into public.menu_category_translations (category_id, language, name) values
  ('33333333-3333-4333-8333-333333333301', 'pt', 'Croissants'),
  ('33333333-3333-4333-8333-333333333301', 'en', 'Croissants'),
  ('33333333-3333-4333-8333-333333333301', 'es', 'Cruasanes'),
  ('33333333-3333-4333-8333-333333333301', 'fr', 'Croissants'),
  ('33333333-3333-4333-8333-333333333302', 'pt', 'Bebidas'),
  ('33333333-3333-4333-8333-333333333302', 'en', 'Drinks'),
  ('33333333-3333-4333-8333-333333333302', 'es', 'Bebidas'),
  ('33333333-3333-4333-8333-333333333302', 'fr', 'Boissons'),
  ('33333333-3333-4333-8333-333333333303', 'pt', 'Panquecas'),
  ('33333333-3333-4333-8333-333333333303', 'en', 'Pancakes'),
  ('33333333-3333-4333-8333-333333333303', 'es', 'Tortitas'),
  ('33333333-3333-4333-8333-333333333303', 'fr', 'Pancakes')
on conflict (category_id, language) do nothing;

-- Products --------------------------------------------------------------------
insert into public.menu_products
  (id, restaurant_id, category_id, price_cents, is_available, is_active, sort_order, allergen_codes)
values
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333301', 350, true, true, 0, array['gluten', 'milk', 'nuts', 'eggs']),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333302', 220, true, true, 0, array['milk']),
  ('44444444-4444-4444-8444-444444444403', '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333303', 650, true, true, 0, array['gluten', 'eggs', 'milk'])
on conflict (id) do nothing;

insert into public.menu_product_translations (product_id, language, name, description) values
  ('44444444-4444-4444-8444-444444444401', 'pt', 'Croissant de Nutella', 'Croissant folhado recheado com Nutella.'),
  ('44444444-4444-4444-8444-444444444401', 'en', 'Nutella Croissant', 'Flaky croissant filled with Nutella.'),
  ('44444444-4444-4444-8444-444444444401', 'es', 'Cruasán de Nutella', 'Cruasán hojaldrado relleno de Nutella.'),
  ('44444444-4444-4444-8444-444444444401', 'fr', 'Croissant au Nutella', 'Croissant feuilleté fourré au Nutella.'),
  ('44444444-4444-4444-8444-444444444402', 'pt', 'Cappuccino', 'Café espresso com espuma de leite cremosa.'),
  ('44444444-4444-4444-8444-444444444402', 'en', 'Cappuccino', 'Espresso with creamy milk foam.'),
  ('44444444-4444-4444-8444-444444444402', 'es', 'Capuchino', 'Espresso con espuma de leche cremosa.'),
  ('44444444-4444-4444-8444-444444444402', 'fr', 'Cappuccino', 'Espresso avec une mousse de lait onctueuse.'),
  ('44444444-4444-4444-8444-444444444403', 'pt', 'Panqueca de frutos vermelhos', 'Panqueca fofa com frutos vermelhos frescos e xarope de ácer.'),
  ('44444444-4444-4444-8444-444444444403', 'en', 'Red Berry Pancake', 'Fluffy pancake with fresh red berries and maple syrup.'),
  ('44444444-4444-4444-8444-444444444403', 'es', 'Tortita de frutos rojos', 'Tortita esponjosa con frutos rojos frescos y sirope de arce.'),
  ('44444444-4444-4444-8444-444444444403', 'fr', 'Pancake aux fruits rouges', 'Pancake moelleux aux fruits rouges frais et sirop d''érable.')
on conflict (product_id, language) do nothing;
