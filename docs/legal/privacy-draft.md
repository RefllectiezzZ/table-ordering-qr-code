# Privacy Policy (draft)

> Working draft, not legal advice. It must be reviewed by a qualified
> professional before commercial launch. The live versions are rendered at
> `/privacy` in Portuguese and English; keep this file and the page in sync.

## 1. Scope

TableOrder provides QR table-ordering software for restaurants. This draft
covers the data handled for three audiences: restaurant customers, restaurant
users (owners and staff) and platform administrators, during an MVP phase
aimed at restaurants in Portugal and the European Union.

## 2. Customers (no account)

People ordering through a QR code do not create accounts and are not asked for
a name, phone number or email. A submitted order stores:

- the table the order belongs to (resolved from the QR token);
- the ordered items and quantities;
- optional free-text notes written by the customer;
- random technical tokens used to avoid duplicate submissions and to authorize
  follow-up orders from the same browser during the same table session (only
  hashes of authorization tokens are stored server-side);
- timestamps and order status.

Customers are asked not to write personal data (names, phone numbers, health
details) into order notes; notes exist for preparation instructions only.
Restaurants see notes only for their own orders.

## 3. Restaurant users

Accounts store: email address, optional full name, an application role
(owner, staff or platform admin), restaurant membership and timestamps.
Authentication is handled by Supabase Auth; passwords are stored only by
Supabase, in hashed form.

## 4. Service providers

- Supabase: database, authentication and product image storage.
- Vercel: application hosting (planned for production).
- Cloudflare: DNS and CDN (planned for production).

## 5. Data retention (working defaults, to be confirmed before paid launch)

- Orders and order items: operational history; 12-month target, then deletion
  or anonymisation.
- Audit logs: 12 months.
- Restaurant user accounts: for as long as the relationship with the
  restaurant lasts.
- CSV import batches: 90 days.
- Table-session browser authorizations: expire within hours and are revoked
  when the table session closes.

## 6. Rights

Depending on the jurisdiction, including the GDPR in the European Union,
people may have rights of access, rectification and erasure. Requests can be
addressed to the platform operator; contact details will be published before
commercial launch. This document is not a statement of full GDPR compliance; a
compliance review is planned before any paid launch.

## 7. Security

Each restaurant's data is isolated using Postgres Row Level Security.
Administrative credentials are restricted to server-side use. This version
does not process payment card data.

## 8. Status

Draft for the MVP phase. Not legal advice. It must be reviewed by a qualified
professional before production use.
