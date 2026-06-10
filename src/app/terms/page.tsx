import { LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service (Draft)">
      <section>
        <h2>1. The service</h2>
        <p>
          TableOrder (&quot;the Platform&quot;) provides software that lets restaurants publish a
          digital menu accessible via QR codes and receive orders placed by customers at their
          tables. The Platform is a technology provider only: it displays menus and transmits
          orders between customers and restaurants.
        </p>
      </section>
      <section>
        <h2>2. Restaurant responsibility</h2>
        <p>Each restaurant using the Platform is solely responsible for:</p>
        <ul>
          <li>the accuracy of its menu, including product names and descriptions;</li>
          <li>prices and their updates;</li>
          <li>product availability;</li>
          <li>allergen and ingredient information;</li>
          <li>the accuracy of translations it publishes;</li>
          <li>preparing and delivering the orders it accepts.</li>
        </ul>
      </section>
      <section>
        <h2>3. No online payments</h2>
        <p>
          The Platform does not process online payments in this version. All payments are settled
          directly between the customer and the restaurant, at the restaurant, by the means the
          restaurant accepts.
        </p>
      </section>
      <section>
        <h2>4. Customer use</h2>
        <p>
          Customers do not need an account. By submitting an order through a table QR code, the
          customer asks the restaurant to prepare the selected items for that table. Orders are
          requests; the restaurant may decline or cancel an order (for example, if a product runs
          out).
        </p>
      </section>
      <section>
        <h2>5. Allergens</h2>
        <p>
          Allergen information shown on menus is provided and validated by each restaurant.
          Customers with food allergies or intolerances must always confirm directly with the
          restaurant staff before consuming. See the{" "}
          <a href="/allergen-disclaimer" className="text-sky-700 underline">
            allergen disclaimer
          </a>
          .
        </p>
      </section>
      <section>
        <h2>6. Translations</h2>
        <p>
          Menu translations may be produced manually or with AI assistance through a CSV
          workflow. Restaurants must review and approve translations before publishing them. The
          Platform is not liable for translation errors in restaurant-published content.
        </p>
      </section>
      <section>
        <h2>7. Acceptable use</h2>
        <p>
          Restaurant accounts must keep credentials confidential and may only access data of
          their own restaurant. Attempting to access other tenants&apos; data, abusing public
          endpoints or disrupting the service is prohibited and may lead to suspension.
        </p>
      </section>
      <section>
        <h2>8. Suspension and termination</h2>
        <p>
          The Platform operator may suspend a restaurant for breach of these terms. While
          suspended, the restaurant&apos;s public menu and ordering are unavailable.
        </p>
      </section>
      <section>
        <h2>9. Liability</h2>
        <p>
          To the maximum extent permitted by law, the Platform is provided &quot;as is&quot;
          during this MVP phase, without warranties of uninterrupted availability. The Platform
          operator is not a party to the sale between restaurant and customer.
        </p>
      </section>
      <section>
        <h2>10. Changes</h2>
        <p>
          These draft terms will be finalised, versioned and dated before commercial launch.
          Material changes will be communicated to restaurants.
        </p>
      </section>
    </LegalPage>
  );
}
