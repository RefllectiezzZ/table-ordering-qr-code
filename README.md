# table-ordering-qr-code

Multi-tenant QR table ordering SaaS for small restaurants.

Customers scan a QR code on their table, see the restaurant's branded
multilingual menu (PT/EN/ES/FR), and submit an order straight to the kitchen —
no account, no app, no online payments. Restaurants manage menus, tables/QR
codes, branding and live orders in a private dashboard. A platform admin
manages the restaurants themselves.

## Tech stack

- [Next.js](https://nextjs.org) App Router + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com): Postgres (with Row Level Security), Auth
- Zod for input validation, Vitest for unit tests

## Quick start (local)

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` **in filename order** — either:
   - `supabase link && supabase db push` (Supabase CLI), or
   - paste each file into the Dashboard SQL editor and run it.
3. Optional but recommended: run `supabase/seed.sql` for the demo restaurant
   ("Demo Brunch", with two demo QR tokens used by the landing page).

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in (Dashboard → Settings → API):

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role/secret key — **server-only, never expose** |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |

### 3. First platform admin

1. Dashboard → Authentication → Users → **Add user** (email + password, auto-confirm).
2. SQL editor:

```sql
insert into public.profiles (id, email, full_name, role)
values ('<auth-user-uuid>', '<email>', 'Platform Admin', 'platform_admin');
```

### 4. Run

```bash
npm install
npm run dev
```

- `http://localhost:3000` — landing page
- `/login` → `/admin` (platform admin) — create a restaurant, add its owner
  user, activate it
- log in as the owner → `/restaurant` — build the menu, create tables, print QR codes
- open a table QR URL (`/t/<token>`) in a private window — order as a customer
- demo menu (after seeding): `/t/demo-mesa-1-k3v9q2x8w7z4`

The full step-by-step checklist lives in
[`docs/testing/smoke-test.md`](docs/testing/smoke-test.md).

## Validation

```bash
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/product/overview.md`](docs/product/overview.md) | product, roles, flows, scope |
| [`docs/architecture/tenant-model.md`](docs/architecture/tenant-model.md) | multi-tenant model, QR token resolution |
| [`docs/security/guardrails.md`](docs/security/guardrails.md) | security invariants |
| [`docs/development/workflow.md`](docs/development/workflow.md) | PR rules, validation |
| [`docs/launch/launch-gates.md`](docs/launch/launch-gates.md) | pre-launch checklist |
| [`docs/testing/smoke-test.md`](docs/testing/smoke-test.md) | manual E2E smoke test |
| [`docs/imports/translation-csv.md`](docs/imports/translation-csv.md) | translation CSV contract |
| [`docs/known-limitations.md`](docs/known-limitations.md) | honest gaps & follow-ups |
| `docs/legal/` | terms / privacy / allergen disclaimer drafts |

## Project structure

```
supabase/migrations/   versioned SQL (schema, RLS, allergen seed)
supabase/seed.sql      local demo data (Demo Brunch)
src/app                pages + API route handlers (App Router)
src/components         UI (ui primitives, public-menu, restaurant, admin)
src/lib                supabase clients, security, csv, validation, money, i18n
src/server             server-only services (public menu/orders, translations)
src/types              database row types + public DTOs
docs/                  product, architecture, security, testing, legal docs
```

## Security model (short version)

- Every business table is scoped by `restaurant_id` and protected by RLS.
- The anon role has **no** table access; the public menu and public order
  creation run through server-only code that resolves the QR token first.
- All mutations are POST route handlers validated with zod; prices, roles,
  restaurant/table ids are never trusted from the client.
- The service-role key is only imported in `server-only` modules.

Details: [`docs/security/guardrails.md`](docs/security/guardrails.md).
