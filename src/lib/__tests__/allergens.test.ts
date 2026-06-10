import { describe, expect, it } from "vitest";
import {
  ALLERGEN_CODES,
  ALLERGEN_NAMES,
  getAllergenName,
  isKnownAllergenCode,
} from "@/lib/allergens";
import { LANGUAGES } from "@/types/database";

describe("allergen reference data", () => {
  it("contains exactly the 14 EU allergens", () => {
    expect(ALLERGEN_CODES).toHaveLength(14);
    expect(ALLERGEN_CODES).toContain("gluten");
    expect(ALLERGEN_CODES).toContain("molluscs");
  });

  it("has a non-empty translation for every code in every language", () => {
    for (const code of ALLERGEN_CODES) {
      for (const lang of LANGUAGES) {
        expect(ALLERGEN_NAMES[code][lang].length).toBeGreaterThan(0);
      }
    }
  });
});

describe("getAllergenName", () => {
  it("translates known codes", () => {
    expect(getAllergenName("milk", "pt")).toBe("Leite");
    expect(getAllergenName("milk", "en")).toBe("Milk");
    expect(getAllergenName("milk", "es")).toBe("Leche");
    expect(getAllergenName("milk", "fr")).toBe("Lait");
  });

  it("falls back to the raw code for unknown values", () => {
    expect(getAllergenName("unknown-thing", "en")).toBe("unknown-thing");
  });
});

describe("isKnownAllergenCode", () => {
  it("accepts known codes and rejects unknown ones", () => {
    expect(isKnownAllergenCode("gluten")).toBe(true);
    expect(isKnownAllergenCode("Gluten")).toBe(false);
    expect(isKnownAllergenCode("sugar")).toBe(false);
  });
});
