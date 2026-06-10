# table-ordering-qr-code

Multi-tenant QR table ordering SaaS for small restaurants.

Customers scan a printed QR code on their table, see the restaurant's branded
multilingual menu (PT/EN/ES/FR) and submit an order — no account, no app, no
online payments. Because QR codes are fixed, the **first order from an unknown
browser waits for staff confirmation** before reaching the kitchen; confirming
it opens a **table session** and authorizes that device for direct ordering
until staff close the session. Restaurants manage menus (Portuguese base
language + optional translations), product photos, tables/QR codes, branding,
order availability and live orders in a private dashboard. A platform admin
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

   This includes `..._product_images_storage.sql`, which creates the
   **`product-images` storage bucket** (public read, 5 MB, JPEG/PNG/WebP).
   Uploads only ever go through the server-side route handler; do not add
   anon/authenticated write policies to the bucket.
3. Optional but recommended: run `supabase/seed.sql` for the demo restaurant
   ("Demo Brunch", with two fixed demo QR tokens for **local testing only** —
   the public landing page does not link to them).

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally (plain http). Also used for the post-signout redirect and QR URLs; set it to the real https URL in production. |

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
- demo menu for local testing (after seeding): `/t/demo-mesa-1-k3v9q2x8w7z4`

The full step-by-step checklist lives in
[`docs/testing/smoke-test.md`](docs/testing/smoke-test.md).

## Validation

Run before every push:

```bash
npm run lint        # ESLint (eslint-config-next + TypeScript rules)
npm test            # Vitest unit tests
npm run build       # production build incl. type checking
npm audit           # all dependencies
npm audit --omit=dev  # production dependencies only
```

Notes on `npm audit`:

- `npm audit --omit=dev` is the more meaningful signal: it focuses on
  dependencies that ship with the production server, ignoring dev-only
  tooling.
- A **known transitive advisory may remain**: `next` pins an older `postcss`
  internally (GHSA-qx2v-qp2m-jg93, moderate). It is only used at build time on
  this project's own CSS, the fix is not yet in a stable Next release, and the
  only automated "fix" is a breaking downgrade. Status and reasoning:
  `docs/known-limitations.md` (section "Dependency / audit status").
- **Never run `npm audit fix --force` blindly** — here it would downgrade
  Next.js to a 6-major-versions-older release and break the app.

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
