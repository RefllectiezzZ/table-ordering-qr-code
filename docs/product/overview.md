# Product Overview

Multi-tenant QR table ordering SaaS for small restaurants.

## What it does

- The **platform owner/admin** manages restaurants (create, configure, suspend).
- Each **restaurant** gets a private dashboard with its own branded public QR menu,
  menu categories, products, translations (PT/EN/ES/FR), tables and QR tokens.
- Each **table** has a unique, non-guessable QR token.
- **Customers** scan a table's QR code, see only that restaurant's menu, add products
  to a cart and submit an order for that table — no account, no app.
- **Kitchen/staff** see incoming orders on a live board and move them through
  statuses: `new → preparing → ready → delivered` (or `cancelled`).

## Roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| `platform_admin` | All restaurants | Create/edit/suspend restaurants, manage restaurant users, view all data for support |
| `restaurant_owner` | Exactly one restaurant | Manage menu, categories, products, translations, tables/QR codes, branding, orders |
| `restaurant_staff` | Exactly one restaurant | View and update orders; read-only menu overview |
| `public_customer` | One table via QR token | View public menu, submit an order for that table |

## Main flows

1. **Provisioning**: admin creates a restaurant (draft) → creates an owner user →
   activates the restaurant.
2. **Menu setup**: owner creates categories and products (price in EUR stored as
   cents, EU allergen codes, per-language names/descriptions).
3. **Tables**: owner creates tables; each gets a server-generated random token and a
   QR code pointing to `/t/[token]`.
4. **Ordering**: customer scans QR → `/t/[token]` resolves the token to exactly one
   table + restaurant → cart → `POST /api/public/orders` (idempotent) → confirmation.
5. **Kitchen**: owner/staff watch `/restaurant/orders` (polling board) and update
   statuses through validated transitions.
6. **Translations**: owner exports CSV → translates offline → imports with preview →
   commits explicitly. See `docs/imports/translation-csv.md`.

## MVP scope

In scope:

- Supabase Auth (email/password), Postgres with RLS, multi-tenant isolation
- Public QR menu with branding, language switcher, cart, order submission
- Restaurant dashboard (orders, menu, categories, products, tables/QR, branding,
  translations CSV, settings)
- Admin dashboard (overview, restaurants CRUD + status, minimal user creation)
- Legal draft pages (terms, privacy, allergen disclaimer)
- Unit tests for security-critical pure logic

Out of scope (explicitly not implemented):

- Payments (Stripe, MB WAY), POS integration, printer integration
- Custom restaurant domains, Cloudflare/Vercel deployment setup
- Email routing, translation APIs, OpenAI/ChatGPT integration
- Loyalty, reservations, stock management beyond `is_available`
- Advanced analytics, mobile apps, complex invite flows
- Production-grade legal finalization
