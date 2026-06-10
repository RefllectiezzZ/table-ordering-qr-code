-- ============================================================================
-- Seed the 14 EU-regulated allergens (Regulation (EU) No 1169/2011, Annex II).
-- Codes are stable identifiers stored on menu_products.allergen_codes.
-- Names are display translations; they must stay in sync with
-- src/lib/allergens.ts.
-- ============================================================================

insert into public.allergens (code, name_pt, name_en, name_es, name_fr) values
  ('gluten',      'Glúten',                 'Gluten',                'Gluten',                 'Gluten'),
  ('crustaceans', 'Crustáceos',             'Crustaceans',           'Crustáceos',             'Crustacés'),
  ('eggs',        'Ovos',                   'Eggs',                  'Huevos',                 'Œufs'),
  ('fish',        'Peixe',                  'Fish',                  'Pescado',                'Poisson'),
  ('peanuts',     'Amendoins',              'Peanuts',               'Cacahuetes',             'Arachides'),
  ('soy',         'Soja',                   'Soybeans',              'Soja',                   'Soja'),
  ('milk',        'Leite',                  'Milk',                  'Leche',                  'Lait'),
  ('nuts',        'Frutos de casca rija',   'Tree nuts',             'Frutos de cáscara',      'Fruits à coque'),
  ('celery',      'Aipo',                   'Celery',                'Apio',                   'Céleri'),
  ('mustard',     'Mostarda',               'Mustard',               'Mostaza',                'Moutarde'),
  ('sesame',      'Sementes de sésamo',     'Sesame seeds',          'Granos de sésamo',       'Graines de sésame'),
  ('sulfites',    'Dióxido de enxofre e sulfitos', 'Sulphur dioxide and sulphites', 'Dióxido de azufre y sulfitos', 'Anhydride sulfureux et sulfites'),
  ('lupin',       'Tremoço',                'Lupin',                 'Altramuces',             'Lupin'),
  ('molluscs',    'Moluscos',               'Molluscs',              'Moluscos',               'Mollusques')
on conflict (code) do nothing;
