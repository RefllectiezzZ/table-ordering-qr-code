# Tenant Model

## The core rule

> A user from restaurant A must never read, write, update, delete or infer data
> from restaurant B. A public QR token must resolve to exactly one table and
> exactly one restaurant.

## restaurant_id scoping

Every private/business entity carries (directly or via its parent) a
`restaurant_id`:

- direct: `restaurant_tables`, `menu_categories`, `menu_products`, `orders`,
  `audit_logs`, `import_batches`, `profiles` (for restaurant roles)
- via parent: `menu_category_translations` (→ category), `menu_product_translations`
  (→ product), `order_items` (→ order), `import_rows` (→ batch)

The server **never** accepts a `restaurant_id` from the client:

- For authenticated dashboard/API calls, the scope comes from the session profile
  (`profiles.restaurant_id`), loaded server-side.
- For public requests, the scope comes from resolving the QR token.

On top of the explicit filters, **Row Level Security re-enforces the same scoping
at the database level**, so a bug in application code cannot cross tenants when
using the user-scoped client.

## QR token → table → restaurant

```
qr public_token ──> restaurant_tables.id ──> restaurants.id
```

- `restaurant_tables.public_token` is unique, generated server-side with
  `crypto.getRandomValues` (32 chars from a 64-char URL-safe alphabet ≈ 192 bits).
- The public route is `GET /t/[token]`. There are no predictable public URLs like
  `/restaurant/<slug>/table/<n>` for ordering; the UI may *display* "Mesa 7" but the
  URL only ever carries the token.
- Tokens are never reused or reassigned. Deactivating a table immediately blocks
  menu access and ordering for its token.

## Public vs private data

Public (served via `/t/[token]` and `POST /api/public/orders` only):

- restaurant branding fields (name, logo/cover URLs, colors, welcome message,
  languages), table number/label, **active** categories + translations,
  **active** products + translations/prices/allergens, created order summary
  (short code, status, total).

Private (never exposed publicly):

- staff/user data, other tables' tokens, other restaurants' anything, audit logs,
  import batches, internal settings, full order history.

The anon Postgres role has **no table access at all**. Public reads/writes are
performed by server-only code using the service-role client with an explicit,
minimal field selection after token resolution (see
`src/server/public-menu.ts` and `src/server/public-orders.ts`).

## Role model

`profiles` (1 row per auth user) carries the role:

- `platform_admin` — `restaurant_id IS NULL` (enforced by a CHECK constraint)
- `restaurant_owner` / `restaurant_staff` — `restaurant_id NOT NULL` (same CHECK)

One user belongs to at most one restaurant. The optional `restaurant_users`
join table from the original design was intentionally **not** created: profiles
are sufficient for the MVP's "exactly one restaurant per user" rule, and one
table fewer means one policy surface fewer. If multi-restaurant users are ever
needed, introduce `restaurant_users` then.

Roles are read from `profiles` on the server (`src/lib/security/guards.ts`) —
never from client input, never from user-editable `user_metadata`.

## Enforcement layers

1. **Proxy** (`src/proxy.ts`): unauthenticated requests to `/admin`, `/restaurant`,
   `/dashboard` are redirected to `/login` (JWT validated via `getClaims()`).
2. **Guards** (`requirePlatformAdmin`, `requireRestaurantUser`, …): layouts/pages
   and API routes re-check the role and derive the restaurant scope.
3. **Explicit query filters**: every tenant query filters by the derived
   `restaurant_id`.
4. **RLS policies**: the database independently enforces the same rules for the
   user-scoped clients (defense in depth).
