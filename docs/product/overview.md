# Product Overview

Multi-tenant QR table ordering SaaS for small restaurants.

## What it does

- The **platform owner/admin** manages restaurants (create, configure, suspend).
- Each **restaurant** gets a private dashboard with its own branded public QR menu,
  menu categories, products, translations (PT/EN/ES/FR), tables and QR tokens.
- Each **table** has a unique, non-guessable QR token.
- **Customers** scan a table's QR code, see only that restaurant's menu, add products
  to a cart and submit an order for that table — no account, no app.
- **First-order confirmation**: QR codes are printed and fixed, so the first
  order from an unknown browser starts as `pending_confirmation`. Staff confirm
  it (opening a **table session**), after which that device orders directly
  while the session stays open. Closing the session revokes the device
  authorizations; old orders stay in history.
- **Kitchen/staff** see incoming orders on a live board and move them through
  statuses: `new → preparing → ready → delivered` (or `cancelled`); pending
  orders live in a separate reception queue and can be confirmed or `rejected`.
- Restaurants can **pause ordering** (menu stays visible, submission blocked)
  and upload **product photos** shown on the public menu.

## Roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| `platform_admin` | All restaurants | Create/edit/suspend restaurants, manage restaurant users, view all data for support |
| `restaurant_owner` | Exactly one restaurant | Manage menu, categories, products, inline translations, tables/QR codes, branding (colors/languages), orders |
| `restaurant_staff` | Exactly one restaurant | View and update orders; read-only menu overview |
| `public_customer` | One table via QR token | View public menu, submit an order for that table |

Platform admins additionally manage **translation CSV import/export** and **public menu template/branding** presets per restaurant.

## Main flows

1. **Provisioning**: admin creates a restaurant (draft) → creates an owner user →
   activates the restaurant.
2. **Menu setup**: owner creates categories and products (price in EUR stored as
   cents, EU allergen codes, per-language names/descriptions).
3. **Tables**: owner creates tables; each gets a server-generated random token and a
   QR code pointing to `/t/[token]`. The tables page doubles as an operational
   floor view (free/occupied, open session, pending counts, open/close session).
4. **Ordering**: customer scans QR → `/t/[token]` resolves the token to exactly one
   table + restaurant → cart → `POST /api/public/orders` (idempotent). Without a
   valid browser authorization the order starts as `pending_confirmation`; the
   customer page polls its status and learns the authorization once staff
   confirm.
5. **Reception/kitchen**: owner/staff watch `/restaurant/orders` (polling board
   with URL-persisted date/status filters). Pending orders are confirmed or
   rejected in the reception section; confirmed orders flow
   `new → preparing → ready → delivered` (or `cancelled`), oldest first, with
   per-restaurant order numbers ("Pedido #104").
6. **Session close**: when customers leave, staff close the table session from
   the floor view; device authorizations are revoked and the next group starts
   with a fresh confirmation.
7. **Translations**: products are created in Portuguese (base language,
   required); EN/ES/FR are optional inline in the product form. Platform admin
   exports one multi-language CSV → translates offline → imports with preview →
   commits explicitly. See `docs/imports/translation-csv.md`.
8. **Public menu templates**: platform admin selects an internal visual template
   and layout options per restaurant at `/admin/restaurants/[id]/branding`. The
   public menu at `/t/[token]` renders the chosen preset with shared order logic.

## MVP scope

In scope:

- Supabase Auth (email/password), Postgres with RLS, multi-tenant isolation
- Public QR menu with branding, language switcher, cart, order submission
- Restaurant dashboard (orders, menu, categories, products, tables/QR, branding,
  settings)
- Admin dashboard (overview, restaurants CRUD + status, branding/templates,
  translation CSV, minimal user creation)
- Legal draft pages (terms, privacy, allergen disclaimer)
- Unit tests for security-critical pure logic

Out of scope (explicitly not implemented):

- Payments (Stripe, MB WAY), POS integration, printer integration
- Custom restaurant domains, Cloudflare/Vercel deployment setup
- Email routing, translation APIs, OpenAI/ChatGPT integration
- Loyalty, reservations, stock management beyond `is_available`
- Advanced analytics, mobile apps, complex invite flows
- Production-grade legal finalization
