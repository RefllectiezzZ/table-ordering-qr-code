import { LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Allergen & Translation Disclaimer" };

export default function AllergenDisclaimerPage() {
  return (
    <LegalPage title="Allergen & Translation Disclaimer (Draft)">
      <section>
        <h2>Allergen information</h2>
        <p>
          Menus on this platform can display the 14 allergens regulated in the EU (Regulation
          (EU) No 1169/2011): gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, tree
          nuts, celery, mustard, sesame, sulphites, lupin and molluscs.
        </p>
        <ul>
          <li>
            Allergen information is provided and validated by each restaurant — not by the
            Platform.
          </li>
          <li>
            Kitchens handle multiple ingredients; cross-contamination can never be fully
            excluded.
          </li>
          <li>
            <strong>
              If you have a food allergy or intolerance, always confirm directly with the
              restaurant staff before ordering and before consuming.
            </strong>
          </li>
        </ul>
      </section>
      <section>
        <h2>Translations</h2>
        <p>
          Menu translations (Portuguese, English, Spanish, French) may be prepared manually or
          with AI assistance through a CSV review workflow. The restaurant is responsible for
          reviewing and approving translations before publishing. If a translation seems unclear
          or contradictory, the restaurant&apos;s default-language version and the restaurant
          staff&apos;s confirmation prevail.
        </p>
      </section>
      <section>
        <h2>Status of this document</h2>
        <p>
          Draft for the MVP phase — to be reviewed by a qualified professional before commercial
          launch.
        </p>
      </section>
    </LegalPage>
  );
}
