# Tenant Model

## The core rule

> A user from restaurant A must never read, write, update, delete or infer data
> from restaurant B. A public QR token must resolve to exactly one table and
> exactly one restaurant.

## restaurant_id scoping

Every private/business entity carries (directly or via its parent) a
`restaurant_id`:

- direct: `restaurant_tables`, `menu_categories`, `menu_products`, `orders`,
  `table_sessions`, `table_session_access_tokens`, `audit_logs`,
  `import_batches`, `profiles` (for restaurant roles)
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

## Table sessions and browser authorizations

Printed QR codes are fixed, so order intake is protected by an operational
layer instead of rotating codes:

```
table_sessions            one OPEN session ("tab") per table at a time
                          (partial unique index on table_id WHERE status='open')
table_session_access_tokens
                          hashed browser authorizations, scoped to
                          (restaurant_id, table_id, table_session_id)
```

- An order submitted **without** a valid browser authorization starts as
  `pending_confirmation` and never appears as kitchen-ready.
- Staff confirm the order; confirmation finds/creates the table's open session
  and attaches the order to it.
- The ordering device then receives one raw authorization token through the
  public status poll, authenticated by its own `client_order_token`. Only the
  SHA-256 hash is stored. Subsequent orders from that device go straight to
  `new` while the session stays open and the token has not expired (8h cap).
- Closing the session revokes every authorization granted during it; the next
  customers at the same printed QR go through confirmation again. Closed
  sessions and their orders remain in history and never mix with the current
  occupation.
- Sessions are readable (SELECT) by the restaurant's members and platform
  admins only. All writes — open, close, attach, token issuance/revocation —
  happen in server-only route handlers after membership validation; there are
  **no** INSERT/UPDATE policies for the authenticated role, and the access
  token table has no policies at all (service-role only, not even readable by
  staff).

## Public vs private data

Public (served via `/t/[token]`, `POST /api/public/orders` and
`GET /api/public/orders/status` only):

- restaurant branding fields (name, logo/cover URLs, colors, welcome message,
  languages, accepts-orders flag + pause message), table number/label,
  **active** categories + translations, **active** products +
  translations/prices/allergens/images, created order summary (short code,
  per-restaurant order number, status, total), and — exactly once, to the
  device that placed the confirmed order — the session authorization token.

Private (never exposed publicly):

- staff/user data, other tables' tokens, other restaurants' anything, audit logs,
  import batches, internal settings, full order history, table session
  internals (ids/opened_by/notes), access-token hashes.

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
