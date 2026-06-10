# Privacy Policy — DRAFT

> Draft document, not legal advice. Must be reviewed by a qualified
> professional before commercial launch. The live version is rendered at
> `/privacy`; keep both in sync.

## 1. Scope

Covers data handled by the TableOrder platform for three audiences: public
customers, restaurant users (owners/staff), platform administrators.

## 2. Customers (no account)

Public customers do not create accounts and are not asked for name, phone or
email. A submitted order stores:

- the table it belongs to (resolved from the QR token);
- ordered items and quantities;
- optional free-text notes written by the customer;
- a random technical token used to prevent duplicate submissions;
- timestamps and order status.

Customers should not write personal data into order notes; notes are for
preparation instructions. Restaurants see notes only for their own orders.

## 3. Restaurant users

Accounts store: email, optional full name, application role
(owner/staff/admin), restaurant membership, timestamps. Authentication is
provided by Supabase Auth; passwords are stored only by Supabase, hashed.

## 4. Audit logs

Administrative/mutation actions may be recorded with: acting user id,
restaurant id, action name, entity type/id and minimal structured metadata.
No secrets and no customer notes are stored in audit logs.

## 5. Service providers (processors)

- **Supabase** — database, authentication, (future) file storage
- **Vercel** — application hosting (planned for production)
- **Cloudflare** — DNS/CDN (planned for production)

## 6. Data retention — DRAFT DEFAULTS (to be finalised before paid launch)

| Data | Default |
| --- | --- |
| Orders & order items | 12 months, then delete or anonymise |
| Audit logs | 12 months |
| Restaurant user accounts | life of the restaurant's subscription |
| CSV import batches/rows | 90 days |

## 7. Data subject rights

Depending on jurisdiction (e.g. GDPR), users may have rights of access,
rectification, erasure, restriction and portability. Contact details for
requests will be published before commercial launch.

## 8. Security measures

Tenant isolation via Postgres Row Level Security; administrative keys
restricted to server-side use; TLS in transit; no payment card data processed.

---

Open items before launch: controller identity & contact, DPO need assessment,
lawful bases per processing activity, international transfer analysis, cookie
notice (currently only auth cookies are used), final retention numbers.
