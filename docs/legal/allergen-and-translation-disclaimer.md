# Allergen and Translation Notice (draft)

> Working draft, not legal advice. It must be reviewed by a qualified
> professional before commercial launch. The live versions are rendered at
> `/allergen-disclaimer` in Portuguese and English; keep this file and the
> page in sync.

## Allergens

Menus on this platform can flag the 14 allergens that require declaration in
the European Union (Regulation (EU) No 1169/2011, Annex II): gluten,
crustaceans, eggs, fish, peanuts, soybeans, milk, tree nuts, celery, mustard,
sesame, sulphur dioxide and sulphites, lupin and molluscs.

Points that must always remain true in both product and copy:

1. Allergen information is entered and validated by each restaurant. The
   platform supplies the vocabulary (stable codes plus translations), not the
   facts about any dish.
2. Kitchens handle many ingredients at once; cross-contamination can never be
   fully ruled out.
3. Anyone with a food allergy or intolerance must check directly with the
   restaurant staff before ordering and before consuming. This warning is
   shown on every public menu, in the menu's language.

Allergen codes are stable identifiers (`gluten`, `milk`, and so on) stored on
products. They are never free-translated; display names come from a fixed
PT/EN/ES/FR table, and the translation CSV import ignores the allergen column
entirely.

## Translations

Menu translations (Portuguese, English, Spanish and French) may be prepared
manually or with the help of external tools, through the CSV export and
import flow with preview and explicit confirmation. The restaurant is
responsible for reviewing and approving translations before publishing them.
If a translation seems unclear or contradictory, the restaurant's
base-language version and the staff's confirmation prevail.

## Status

Draft for the MVP phase. It must be reviewed by a qualified professional
before commercial launch.
