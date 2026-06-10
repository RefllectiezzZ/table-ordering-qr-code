# Smoke Test (Manual, End-to-End)

Run after every significant change. Expected time: ~30 minutes.

## 0. Setup

1. `cp .env.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. Apply migrations from `supabase/migrations/` **in filename order**
   (Supabase SQL editor or `supabase db push`). This includes the
   `product-images` storage bucket and the table-session tables.
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

## 1. Auth & language basics

- [ ] Visit `/admin` while logged out → redirected to `/login`.
- [ ] Log in as the platform admin → `/login` redirects to `/admin`.
- [ ] Sign out → lands on `http://localhost:3000/` (or the configured
      `NEXT_PUBLIC_APP_URL`), **not** `https://localhost:3000`.
- [ ] Landing page: switch PT ↔ EN with the toggle; headline and sections change.
- [ ] `/terms`, `/privacy`, `/allergen-disclaimer`: PT by default, EN after the
      toggle.
- [ ] Admin header: switch PT ↔ EN; nav and headings change.

## 2. Admin flow

- [ ] Overview shows restaurant/order counters.
- [ ] `/admin/restaurants` → **Create restaurant** ("Smoke Bistro") → appears as `draft`.
- [ ] Open its detail page → **Add user**: owner email + initial password → user
      appears in the list.
- [ ] Add a second user with role staff.
- [ ] **Activate** the restaurant → status becomes `active`.

## 3. Restaurant owner flow

- [ ] Log out, log in as the owner → lands on `/restaurant/orders`.
- [ ] Visiting `/admin` as owner redirects away (to `/restaurant`).
- [ ] Categories: create "Pratos" with PT+EN names → listed.
- [ ] Products: try to create a product with only an English name → the create
      button stays disabled / the API refuses (PT is the base language).
- [ ] Create "Bitoque" at `9,50`, category "Pratos", allergens gluten+eggs,
      **Portuguese name only** → created (EN/ES/FR optional).
- [ ] Edit "Bitoque" → **Carregar imagem**: upload a JPEG/PNG < 5 MB → thumbnail
      appears in the list. A 6 MB file or a PDF is rejected.
- [ ] Tables: create table number `1`, label `Mesa 1` → floor card with QR code
      and URL ("Ver QR").
- [ ] Branding: change primary color and welcome message → saved.
- [ ] Settings: pause ordering ("Pausar pedidos") and write a pause message.

## 4. Public QR flow (paused + first-order confirmation)

Use a phone or a ~390px viewport for the whole section.

- [ ] Open the table URL (`/t/<token>`) in a **private window** (no login).
- [ ] Branding colors, welcome message, "Mesa 1" chip and the product photo
      appear; no horizontal scrolling.
- [ ] Paused banner is visible; the cart submit button is disabled with an
      explanation. Re-enable orders in Settings → banner gone after reload.
- [ ] Language switcher shows the enabled languages; switching changes product
      names and allergen labels.
- [ ] Add 2× Bitoque with an item note; open the cart; add an order note; submit.
- [ ] The screen shows "Pedido recebido", Mesa 1, "Pedido #N" and the state
      "A aguardar confirmação" (first order from this browser → pending).
- [ ] Press back/refresh and resubmit the same cart — no duplicate order
      appears in the dashboard (idempotency), and the waiting state survives a
      page reload.
- [ ] Visit `/t/not-a-real-token` → friendly invalid QR page.
- [ ] Deactivate the table in the dashboard → its URL shows the friendly
      inactive page; reactivate it.

## 5. Reception & kitchen flow

- [ ] As owner (or staff) on `/restaurant/orders`: the order appears in the
      violet **Receção · por confirmar** section within ~8s — NOT in the
      kitchen columns.
- [ ] Press **Confirmar** → the order moves to **Novo** in the kitchen board
      and shows "Pedido #N" + "sessão desde HH:MM".
- [ ] On the customer's phone: within ~5s the state becomes "Confirmado".
- [ ] Same phone: order again → the new order goes **directly to Novo**
      (no pending step).
- [ ] Open the same QR URL in a **second private window** and order → that
      order is pending again (per-device authorization).
- [ ] Press **Rejeitar** on it → it disappears from pending; the second
      window shows "Pedido não confirmado". Nothing reaches the kitchen.
- [ ] Move the confirmed order new → preparing → ready → delivered; buttons
      disable while saving (no double updates).
- [ ] Filters: "Hoje", "Últimas 24 h", "Todos" and a custom date/time range all
      work and persist in the URL after refresh; delivered/rejected orders sit
      in the collapsed history, not the kitchen board.
- [ ] Log in as the staff user: orders + tables are visible and updates work;
      the nav shows Pedidos + Mesas + Menu.

## 6. Table session close

- [ ] `/restaurant/tables`: Mesa 1 shows "Ocupada", session opened time and
      order counts.
- [ ] Press **Fechar sessão** with an undelivered order → warning about open
      orders; confirm → session closes.
- [ ] Mesa 1 now shows "Livre"; the old orders remain in the history filter.
- [ ] The first phone orders again → **pending_confirmation** again (its
      authorization was revoked with the session).

## 7. Translations CSV flow

- [ ] `/restaurant/translations` → **Download translation CSV** → file contains the
      product with its IDs, price and allergens.
- [ ] Edit the CSV: fill `name_es`/`description_es`. Import it → preview shows
      rows found, matched IDs and fields to update.
- [ ] Commit → success message.
- [ ] Public menu in Spanish shows the new translation.
- [ ] Edit the CSV again and corrupt one `product_id` (e.g. flip a digit) →
      preview marks the row invalid and commit is blocked unless "skip invalid
      rows" is checked.

## 8. Suspension & isolation

- [ ] As admin, suspend the restaurant → its `/t/<token>` page shows
      "Menu indisponível" and POSTing an order returns 409.
- [ ] Reactivate it → menu works again.
- [ ] Create a second restaurant B with its own owner. Log in as owner A and try
      to update one of B's products via the API
      (`POST /api/restaurant/products/<id-of-B>/update`) → 404, nothing changes.
- [ ] As owner A, try to confirm one of B's orders / close one of B's sessions
      via the API → 404, nothing changes.
- [ ] Owner A's dashboard never lists B's data anywhere.

## 9. Health

- [ ] `GET /api/health` returns `{ "status": "ok", ... }` and nothing sensitive.
