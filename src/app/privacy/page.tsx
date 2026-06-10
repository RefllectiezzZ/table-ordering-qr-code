import { LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy (Draft)">
      <section>
        <h2>1. Who we are</h2>
        <p>
          TableOrder provides QR table-ordering software for restaurants. This draft policy
          describes what data the Platform handles for customers, restaurant users and platform
          administrators.
        </p>
      </section>
      <section>
        <h2>2. Customers (no account needed)</h2>
        <p>
          Public customers do not create accounts and are not asked for their name, phone number
          or email. When a customer submits an order, the Platform stores:
        </p>
        <ul>
          <li>the table the order belongs to (via the QR token);</li>
          <li>the ordered items and quantities;</li>
          <li>optional free-text notes written by the customer;</li>
          <li>a random technical token used to avoid duplicate submissions;</li>
          <li>timestamps and order status.</li>
        </ul>
        <p>
          Customers should avoid writing personal data (names, phone numbers, health details) in
          order notes — notes are meant for preparation instructions only.
        </p>
      </section>
      <section>
        <h2>3. Restaurant users</h2>
        <p>
          Restaurant owners and staff have accounts with email address, optional full name, an
          application role and the restaurant they belong to. Authentication is provided by
          Supabase Auth; passwords are stored only by Supabase in hashed form.
        </p>
      </section>
      <section>
        <h2>4. Service providers</h2>
        <ul>
          <li>Supabase — database, authentication and (future) file storage;</li>
          <li>Vercel — application hosting (planned for production);</li>
          <li>Cloudflare — DNS/CDN (planned for production).</li>
        </ul>
      </section>
      <section>
        <h2>5. Data retention (draft defaults — to be finalised)</h2>
        <ul>
          <li>Orders and order items: retained for operational history; targeted default of 12 months, then deletion or anonymisation.</li>
          <li>Audit logs: 12 months.</li>
          <li>Restaurant user accounts: for the life of the restaurant&apos;s subscription.</li>
          <li>Import batches (CSV staging data): 90 days.</li>
        </ul>
        <p>These defaults must be confirmed before paid launch.</p>
      </section>
      <section>
        <h2>6. Your rights</h2>
        <p>
          Depending on your jurisdiction (e.g. GDPR in the EU), you may have rights of access,
          rectification and erasure. Requests can be addressed to the platform operator; contact
          details will be published before commercial launch.
        </p>
      </section>
      <section>
        <h2>7. Security</h2>
        <p>
          Data is isolated per restaurant using Postgres Row Level Security. Administrative
          credentials are restricted to server-side use. No payment card data is processed in
          this version.
        </p>
      </section>
      <section>
        <h2>8. Status of this document</h2>
        <p>
          This is a draft for the MVP phase, not legal advice, and must be reviewed by a
          qualified professional before production use.
        </p>
      </section>
    </LegalPage>
  );
}
