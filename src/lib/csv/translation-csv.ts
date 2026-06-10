import { parseCsv } from "@/lib/csv/parse";
import { serializeCsv } from "@/lib/csv/serialize";
import { centsToEuroString } from "@/lib/money";
import { LANGUAGES, type Language } from "@/types/database";

/**
 * Stable CSV contract for the translation export/import workflow.
 * Documented in docs/imports/translation-csv.md — change both together.
 *
 * Rules:
 *  - product_id / category_id identify rows and must not be edited.
 *  - price and allergens are EXPORT-ONLY context columns; they are ignored on
 *    import (prices and allergen codes are never updated via translation CSV).
 *  - Translations are matched strictly by ID, never by name.
 */
export const TRANSLATION_CSV_COLUMNS = [
  "product_id",
  "category_id",
  "category_pt",
  "name_pt",
  "description_pt",
  "price",
  "allergens",
  "name_en",
  "description_en",
  "category_en",
  "name_es",
  "description_es",
  "category_es",
  "name_fr",
  "description_fr",
  "category_fr",
] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TranslationExportProduct {
  id: string;
  categoryId: string | null;
  priceCents: number;
  allergenCodes: string[];
  translations: Partial<Record<Language, { name: string; description: string | null }>>;
}

export type CategoryTranslationsById = Record<string, Partial<Record<Language, string>>>;

/** Builds the export CSV (header + one row per product). */
export function buildTranslationCsv(
  products: TranslationExportProduct[],
  categoryTranslations: CategoryTranslationsById,
): string {
  const rows: string[][] = [[...TRANSLATION_CSV_COLUMNS]];

  for (const product of products) {
    const categoryNames = product.categoryId
      ? (categoryTranslations[product.categoryId] ?? {})
      : {};
    const t = (lang: Language) => product.translations[lang];

    rows.push([
      product.id,
      product.categoryId ?? "",
      categoryNames.pt ?? "",
      t("pt")?.name ?? "",
      t("pt")?.description ?? "",
      centsToEuroString(product.priceCents),
      product.allergenCodes.join("|"),
      t("en")?.name ?? "",
      t("en")?.description ?? "",
      categoryNames.en ?? "",
      t("es")?.name ?? "",
      t("es")?.description ?? "",
      categoryNames.es ?? "",
      t("fr")?.name ?? "",
      t("fr")?.description ?? "",
      categoryNames.fr ?? "",
    ]);
  }

  return serializeCsv(rows);
}

export interface ParsedTranslationRow {
  /** 1-based data row number, excluding the header row. */
  rowNumber: number;
  raw: Record<string, string>;
  productId: string;
  categoryId: string | null;
  productTranslations: Partial<Record<Language, { name: string; description: string | null }>>;
  categoryTranslations: Partial<Record<Language, string>>;
  errors: string[];
  warnings: string[];
}

export type ParseTranslationCsvResult =
  | { ok: false; errors: string[] }
  | { ok: true; rows: ParsedTranslationRow[] };

/**
 * Parses + normalizes an uploaded translation CSV. Column order does not
 * matter (columns are matched by header name); all expected columns must be
 * present. Database matching/authorization happens later in the preview
 * route — this function is pure.
 */
export function parseTranslationCsv(text: string): ParseTranslationCsvResult {
  const grid = parseCsv(text);
  if (grid.length === 0) {
    return { ok: false, errors: ["The file is empty."] };
  }

  const header = grid[0].map((h) => h.trim().toLowerCase());
  const missingColumns = TRANSLATION_CSV_COLUMNS.filter((col) => !header.includes(col));
  if (missingColumns.length > 0) {
    return {
      ok: false,
      errors: [`Missing required columns: ${missingColumns.join(", ")}`],
    };
  }

  const columnIndex = new Map<string, number>();
  header.forEach((name, idx) => {
    if (!columnIndex.has(name)) columnIndex.set(name, idx);
  });

  if (grid.length === 1) {
    return { ok: false, errors: ["The file has a header but no data rows."] };
  }

  const rows: ParsedTranslationRow[] = [];

  for (let r = 1; r < grid.length; r += 1) {
    const cells = grid[r];
    const get = (col: string) => (cells[columnIndex.get(col)!] ?? "").trim();

    const raw: Record<string, string> = {};
    for (const col of TRANSLATION_CSV_COLUMNS) raw[col] = get(col);

    const errors: string[] = [];
    const warnings: string[] = [];

    const productId = get("product_id");
    if (!productId) {
      errors.push("product_id is empty.");
    } else if (!UUID_REGEX.test(productId)) {
      errors.push(`product_id "${productId}" is not a valid UUID.`);
    }

    const categoryIdRaw = get("category_id");
    let categoryId: string | null = null;
    if (categoryIdRaw) {
      if (UUID_REGEX.test(categoryIdRaw)) {
        categoryId = categoryIdRaw;
      } else {
        errors.push(`category_id "${categoryIdRaw}" is not a valid UUID.`);
      }
    }

    const productTranslations: ParsedTranslationRow["productTranslations"] = {};
    const categoryTranslations: ParsedTranslationRow["categoryTranslations"] = {};

    for (const lang of LANGUAGES) {
      const name = get(`name_${lang}`);
      const description = get(`description_${lang}`);
      if (name) {
        productTranslations[lang] = {
          name,
          description: description || null,
        };
      } else if (description) {
        warnings.push(
          `Language "${lang}": description provided without a name — language skipped.`,
        );
      }

      const categoryName = get(`category_${lang}`);
      if (categoryName) {
        if (categoryId) {
          categoryTranslations[lang] = categoryName;
        } else {
          warnings.push(
            `Language "${lang}": category name provided but category_id is empty — ignored.`,
          );
        }
      }
    }

    if (Object.keys(productTranslations).length === 0) {
      errors.push("Row has no product name in any language — nothing to import.");
    }

    rows.push({
      rowNumber: r,
      raw,
      productId,
      categoryId,
      productTranslations,
      categoryTranslations,
      errors,
      warnings,
    });
  }

  return { ok: true, rows };
}
