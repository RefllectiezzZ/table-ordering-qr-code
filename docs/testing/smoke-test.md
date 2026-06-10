# Smoke Test (Manual, End-to-End)

Run after every significant change. Expected time: ~20 minutes.

## 0. Setup

1. `cp .env.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. Apply migrations from `supabase/migrations/` **in filename order**
   (Supabase SQL editor or `supabase db push`).
3. Optional: apply `supabase/seed.sql` (Demo Brunch + demo tokens).
4. `npm install && npm run dev`.

### Create the first platform admin

1. Supabase Dashboard → Authentication → Users → **Add user** (email + password,
   auto-confirm).
2. SQL editor:

   ```sql
   insert into public.profiles (id, email, full_name, role)
   values ('<auth-user-uuid>', '<email>', 'Platform Admin', 'platform_admin');
   ```

## 1. Admin flow

- [ ] Visit `/admin` while logged out → redirected to `/login`.
- [ ] Log in as the platform admin → `/login` redirects to `/admin`.
- [ ] Overview shows restaurant/order counters.
- [ ] `/admin/restaurants` → **Create restaurant** ("Smoke Bistro") → appears as `draft`.
- [ ] Open its detail page → **Add user**: owner email + initial password → user
      appears in the list.
- [ ] Add a second user with role staff.
- [ ] **Activate** the restaurant → status becomes `active`.

## 2. Restaurant owner flow

- [ ] Log out (sign out button), log in as the owner → lands on `/restaurant/orders`.
- [ ] Visiting `/admin` as owner redirects away (to `/restaurant`).
- [ ] Categories: create "Pratos" with PT+EN names → listed.
- [ ] Products: create "Bitoque" at `9,50`, category "Pratos", allergens gluten+eggs,
      PT+EN names → listed with 9,50 €.
- [ ] Tables: create table number `1`, label `Mesa 1` → QR code and URL shown.
- [ ] Branding: change primary color and welcome message → saved.

## 3. Public QR flow

- [ ] Open the table URL (`/t/<token>`) in a private window (no login).
- [ ] Branding colors, welcome message and "Mesa 1" appear.
- [ ] Language switcher shows the enabled languages; switching changes product
      names and allergen labels.
- [ ] Add 2× Bitoque with an item note; open the cart; add an order note; submit.
- [ ] Confirmation shows an order number and total.
- [ ] Press the browser back/refresh and resubmit the same cart — no duplicate
      order appears in the dashboard (idempotency).
- [ ] Visit `/t/not-a-real-token` → friendly invalid QR page.

## 4. Kitchen flow

- [ ] As owner (or staff) on `/restaurant/orders`: the order appears in **New**
      (highlighted) within ~8s without a manual refresh.
- [ ] Move it new → preparing → ready → delivered; it changes columns each time.
- [ ] Log in as the staff user: orders are visible and status updates work;
      the nav shows only Orders + Menu.

## 5. Translations CSV flow

- [ ] `/restaurant/translations` → **Download translation CSV** → file contains the
      product with its IDs, price and allergens.
- [ ] Edit the CSV: fill `name_es`/`description_es`. Import it → preview shows
      rows found, matched IDs and fields to update.
- [ ] Commit → success message.
- [ ] Public menu in Spanish shows the new translation.
- [ ] Edit the CSV again and corrupt one `product_id` (e.g. flip a digit) →
      preview marks the row invalid and commit is blocked unless "skip invalid
      rows" is checked.

## 6. Suspension & isolation

- [ ] As admin, suspend the restaurant → its `/t/<token>` page shows
      "Menu indisponível" and POSTing an order returns 409.
- [ ] Reactivate it → menu works again.
- [ ] Create a second restaurant B with its own owner. Log in as owner A and try
      to update one of B's products via the API
      (`POST /api/restaurant/products/<id-of-B>/update`) → 404, nothing changes.
- [ ] Owner A's dashboard never lists B's data anywhere.

## 7. Health

- [ ] `GET /api/health` returns `{ "status": "ok", ... }` and nothing sensitive.
