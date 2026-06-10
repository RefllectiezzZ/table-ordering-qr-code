import type { Language } from "@/types/database";

/**
 * The 14 EU-regulated allergens (Regulation (EU) No 1169/2011, Annex II).
 * Codes are stable identifiers and are stored as-is on
 * menu_products.allergen_codes — they are NEVER free-translated.
 *
 * Display names must stay in sync with
 * supabase/migrations/20260610000003_seed_allergens.sql.
 */

export const ALLERGEN_CODES = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulfites",
  "lupin",
  "molluscs",
] as const;

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const ALLERGEN_NAMES: Record<AllergenCode, Record<Language, string>> = {
  gluten: { pt: "Glúten", en: "Gluten", es: "Gluten", fr: "Gluten" },
  crustaceans: { pt: "Crustáceos", en: "Crustaceans", es: "Crustáceos", fr: "Crustacés" },
  eggs: { pt: "Ovos", en: "Eggs", es: "Huevos", fr: "Œufs" },
  fish: { pt: "Peixe", en: "Fish", es: "Pescado", fr: "Poisson" },
  peanuts: { pt: "Amendoins", en: "Peanuts", es: "Cacahuetes", fr: "Arachides" },
  soy: { pt: "Soja", en: "Soybeans", es: "Soja", fr: "Soja" },
  milk: { pt: "Leite", en: "Milk", es: "Leche", fr: "Lait" },
  nuts: {
    pt: "Frutos de casca rija",
    en: "Tree nuts",
    es: "Frutos de cáscara",
    fr: "Fruits à coque",
  },
  celery: { pt: "Aipo", en: "Celery", es: "Apio", fr: "Céleri" },
  mustard: { pt: "Mostarda", en: "Mustard", es: "Mostaza", fr: "Moutarde" },
  sesame: {
    pt: "Sementes de sésamo",
    en: "Sesame seeds",
    es: "Granos de sésamo",
    fr: "Graines de sésame",
  },
  sulfites: {
    pt: "Dióxido de enxofre e sulfitos",
    en: "Sulphur dioxide and sulphites",
    es: "Dióxido de azufre y sulfitos",
    fr: "Anhydride sulfureux et sulfites",
  },
  lupin: { pt: "Tremoço", en: "Lupin", es: "Altramuces", fr: "Lupin" },
  molluscs: { pt: "Moluscos", en: "Molluscs", es: "Moluscos", fr: "Mollusques" },
};

export function isKnownAllergenCode(code: string): code is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(code);
}

/** Returns the localized allergen name, falling back to the raw code. */
export function getAllergenName(code: string, language: Language): string {
  if (isKnownAllergenCode(code)) {
    return ALLERGEN_NAMES[code][language];
  }
  return code;
}
