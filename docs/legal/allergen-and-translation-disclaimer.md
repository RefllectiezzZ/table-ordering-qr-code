# Allergen & Translation Disclaimer — DRAFT

> Draft document, not legal advice. Must be reviewed by a qualified
> professional before commercial launch. The live version is rendered at
> `/allergen-disclaimer`; keep both in sync.

## Allergens

The platform can display the 14 allergens regulated in the EU (Regulation (EU)
No 1169/2011, Annex II): gluten, crustaceans, eggs, fish, peanuts, soybeans,
milk, tree nuts, celery, mustard, sesame, sulphur dioxide/sulphites, lupin,
molluscs.

Key points that must always remain true in product and copy:

1. Allergen information is **provided and validated by each restaurant** — the
   platform supplies the vocabulary (stable codes + translations), not the facts.
2. Cross-contamination can never be fully excluded in kitchens.
3. **Customers with allergies or intolerances must confirm with restaurant
   staff before ordering and before consuming.** This warning is shown on every
   public menu, in the menu's language.

Allergen **codes** are stable identifiers (`gluten`, `milk`, …) stored on
products; they are never free-translated, and the translation CSV import
ignores the allergen column entirely.

## Translations

- Menu translations (PT/EN/ES/FR) may be produced manually or with AI
  assistance through the CSV export/import workflow.
- The restaurant must review and approve translations before publishing
  (the import flow forces an explicit preview + commit).
- If a translation is unclear or contradictory, the restaurant's
  default-language version and staff confirmation prevail.

## Platform position

The platform is a software provider. Menu accuracy, allergen accuracy and
translation accuracy are the restaurant's responsibility (mirrored in the
Terms, section 2).
