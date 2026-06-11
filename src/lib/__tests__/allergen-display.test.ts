import { describe, expect, it } from "vitest";
import { PUBLIC_MENU_STRINGS } from "@/lib/i18n/public-menu";

describe("allergen display wording", () => {
  it("disclaimer appears in public menu strings", () => {
    expect(PUBLIC_MENU_STRINGS.pt.allergenDisclaimer).toContain("restaurante");
    expect(PUBLIC_MENU_STRINGS.pt.allergenDisclaimer).toContain("alergia");
  });

  it("missing allergens text does not say sem alergénios", () => {
    const text = PUBLIC_MENU_STRINGS.pt.allergensNotIndicated.toLowerCase();
    expect(text).not.toBe("sem alergénios");
    expect(text).not.toContain("sem alergénios");
    expect(text).toContain("informação");
  });
});
