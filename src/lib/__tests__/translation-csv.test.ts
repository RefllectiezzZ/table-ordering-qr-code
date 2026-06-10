import { describe, expect, it } from "vitest";
import {
  TRANSLATION_CSV_COLUMNS,
  buildTranslationCsv,
  parseTranslationCsv,
} from "@/lib/csv/translation-csv";

const PRODUCT_ID = "44444444-4444-4444-8444-444444444401";
const CATEGORY_ID = "33333333-3333-4333-8333-333333333301";

function exportFixture() {
  return buildTranslationCsv(
    [
      {
        id: PRODUCT_ID,
        categoryId: CATEGORY_ID,
        priceCents: 350,
        allergenCodes: ["gluten", "milk"],
        translations: {
          pt: { name: "Croissant de Nutella", description: "Croissant folhado." },
          en: { name: "Nutella Croissant", description: null },
        },
      },
    ],
    { [CATEGORY_ID]: { pt: "Croissants", en: "Croissants" } },
  );
}

describe("buildTranslationCsv", () => {
  it("emits the documented header in order", () => {
    const header = exportFixture().split("\r\n")[0];
    expect(header).toBe(TRANSLATION_CSV_COLUMNS.join(","));
  });

  it("includes price as a decimal string and allergens as stable codes", () => {
    const csv = exportFixture();
    expect(csv).toContain("3.50");
    expect(csv).toContain("gluten|milk");
  });
});

describe("parseTranslationCsv", () => {
  it("round-trips an exported file", () => {
    const result = parseTranslationCsv(exportFixture());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.productId).toBe(PRODUCT_ID);
    expect(row.categoryId).toBe(CATEGORY_ID);
    expect(row.productTranslations.pt?.name).toBe("Croissant de Nutella");
    expect(row.productTranslations.en?.name).toBe("Nutella Croissant");
    expect(row.categoryTranslations.pt).toBe("Croissants");
    expect(row.errors).toEqual([]);
  });

  it("accepts reordered columns (matched by name)", () => {
    const reordered =
      "name_pt,product_id,category_id,category_pt,description_pt,price,allergens,name_en,description_en,category_en,name_es,description_es,category_es,name_fr,description_fr,category_fr\n" +
      `Bolo,${PRODUCT_ID},,,,,,,,,,,,,,`;
    const result = parseTranslationCsv(reordered);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].productTranslations.pt?.name).toBe("Bolo");
  });

  it("rejects files with missing columns", () => {
    const result = parseTranslationCsv("product_id,name_pt\nabc,Bolo");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("Missing required columns");
  });

  it("rejects empty files and header-only files", () => {
    expect(parseTranslationCsv("").ok).toBe(false);
    expect(parseTranslationCsv(TRANSLATION_CSV_COLUMNS.join(",")).ok).toBe(false);
  });

  it("flags rows with invalid product ids", () => {
    const csv =
      TRANSLATION_CSV_COLUMNS.join(",") + "\n" + "not-a-uuid,,,Bolo,,,,,,,,,,,,";
    const result = parseTranslationCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].errors.some((e) => e.includes("not a valid UUID"))).toBe(true);
  });

  it("flags rows without any translated name", () => {
    const csv = TRANSLATION_CSV_COLUMNS.join(",") + "\n" + `${PRODUCT_ID},,,,,,,,,,,,,,,`;
    const result = parseTranslationCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].errors.some((e) => e.includes("no product name"))).toBe(true);
  });

  it("warns when a description is provided without a name", () => {
    const csv =
      TRANSLATION_CSV_COLUMNS.join(",") +
      "\n" +
      `${PRODUCT_ID},,,Bolo,,,,,Only description EN,,,,,,,`;
    const result = parseTranslationCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.rows[0];
    expect(row.productTranslations.pt?.name).toBe("Bolo");
    expect(row.productTranslations.en).toBeUndefined();
    expect(row.warnings.some((w) => w.includes('"en"'))).toBe(true);
  });

  it("ignores category names when category_id is missing", () => {
    const csv =
      TRANSLATION_CSV_COLUMNS.join(",") + "\n" + `${PRODUCT_ID},,Croissants,Bolo,,,,,,,,,,,,`;
    const result = parseTranslationCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].categoryTranslations).toEqual({});
    expect(result.rows[0].warnings.length).toBeGreaterThan(0);
  });
});
