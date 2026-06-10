import "server-only";

import {
  parseTranslationCsv,
  type ParsedTranslationRow,
} from "@/lib/csv/translation-csv";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import { LANGUAGES, type ImportRowStatus, type Language } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface PreviewRowResult {
  rowNumber: number;
  productId: string;
  categoryId: string | null;
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  /** Human-readable list of fields that the commit would update. */
  updates: string[];
}

export interface PreviewSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  matchedProducts: number;
  matchedCategories: number;
  unknownProductIds: string[];
  unknownCategoryIds: string[];
}

export type PreviewResult =
  | { ok: false; status: number; errors: string[] }
  | { ok: true; batchId: string; summary: PreviewSummary; rows: PreviewRowResult[] };

interface NormalizedRowData {
  product_id: string;
  category_id: string | null;
  product_translations: Partial<Record<Language, { name: string; description: string | null }>>;
  category_translations: Partial<Record<Language, string>>;
  [key: string]: unknown;
}

/**
 * Validates an uploaded translation CSV against the owner's restaurant and
 * stages it as an import_batch in "preview" status. Nothing is written to the
 * menu until an explicit commit.
 *
 * All queries run on the user-scoped client, so RLS guarantees the owner can
 * only ever match and update their own restaurant's data.
 */
export async function previewTranslationImport(
  supabase: SupabaseServerClient,
  restaurantId: string,
  userId: string,
  csvContent: string,
  filename: string | null,
): Promise<PreviewResult> {
  const parsed = parseTranslationCsv(csvContent);
  if (!parsed.ok) {
    return { ok: false, status: 400, errors: parsed.errors };
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("menu_products").select("id, category_id").eq("restaurant_id", restaurantId),
    supabase.from("menu_categories").select("id").eq("restaurant_id", restaurantId),
  ]);

  const productCategoryById = new Map(
    ((products ?? []) as { id: string; category_id: string | null }[]).map((p) => [
      p.id,
      p.category_id,
    ]),
  );
  const categoryIds = new Set(((categories ?? []) as { id: string }[]).map((c) => c.id));

  const unknownProductIds = new Set<string>();
  const unknownCategoryIds = new Set<string>();
  const matchedProducts = new Set<string>();
  const matchedCategories = new Set<string>();

  const evaluated = parsed.rows.map((row) => {
    const errors = [...row.errors];
    const warnings = [...row.warnings];
    const updates: string[] = [];

    if (row.productId && !errors.some((e) => e.includes("product_id"))) {
      if (!productCategoryById.has(row.productId)) {
        errors.push(`product_id ${row.productId} does not exist in this restaurant.`);
        unknownProductIds.add(row.productId);
      } else {
        matchedProducts.add(row.productId);
        for (const lang of LANGUAGES) {
          const t = row.productTranslations[lang];
          if (t) {
            updates.push(`name_${lang}`);
            if (t.description) updates.push(`description_${lang}`);
          }
        }
      }
    }

    if (row.categoryId) {
      if (!categoryIds.has(row.categoryId)) {
        errors.push(`category_id ${row.categoryId} does not exist in this restaurant.`);
        unknownCategoryIds.add(row.categoryId);
      } else {
        matchedCategories.add(row.categoryId);
        const currentCategory = row.productId
          ? productCategoryById.get(row.productId)
          : undefined;
        if (currentCategory !== undefined && currentCategory !== row.categoryId) {
          warnings.push(
            "category_id differs from the product's current category; category translations are applied to the category in the CSV.",
          );
        }
        for (const lang of LANGUAGES) {
          if (row.categoryTranslations[lang]) updates.push(`category_${lang}`);
        }
      }
    }

    const status: ImportRowStatus =
      errors.length > 0 ? "invalid" : warnings.length > 0 ? "warning" : "valid";

    return { row, status, errors, warnings, updates };
  });

  const summary: PreviewSummary = {
    totalRows: evaluated.length,
    validRows: evaluated.filter((e) => e.status === "valid").length,
    warningRows: evaluated.filter((e) => e.status === "warning").length,
    invalidRows: evaluated.filter((e) => e.status === "invalid").length,
    matchedProducts: matchedProducts.size,
    matchedCategories: matchedCategories.size,
    unknownProductIds: [...unknownProductIds],
    unknownCategoryIds: [...unknownCategoryIds],
  };

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      restaurant_id: restaurantId,
      type: "translation_import",
      status: "preview",
      original_filename: filename,
      summary,
      created_by: userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (batchError || !batch) {
    console.error("translation_preview_batch_failed", batchError?.code);
    return { ok: false, status: 500, errors: ["Could not create the import batch."] };
  }

  const { error: rowsError } = await supabase.from("import_rows").insert(
    evaluated.map(({ row, status, errors, warnings }) => ({
      import_batch_id: batch.id,
      row_number: row.rowNumber,
      raw_data: row.raw,
      normalized_data: normalizeRow(row),
      status,
      errors: [...errors, ...warnings.map((w) => `warning: ${w}`)],
    })),
  );

  if (rowsError) {
    await supabase.from("import_batches").delete().eq("id", batch.id);
    console.error("translation_preview_rows_failed", rowsError.code);
    return { ok: false, status: 500, errors: ["Could not store the import rows."] };
  }

  return {
    ok: true,
    batchId: batch.id,
    summary,
    rows: evaluated.map(({ row, status, errors, warnings, updates }) => ({
      rowNumber: row.rowNumber,
      productId: row.productId,
      categoryId: row.categoryId,
      status,
      errors,
      warnings,
      updates,
    })),
  };
}

function normalizeRow(row: ParsedTranslationRow): NormalizedRowData {
  return {
    product_id: row.productId,
    category_id: row.categoryId,
    product_translations: row.productTranslations,
    category_translations: row.categoryTranslations,
  };
}

export type CommitResult =
  | { ok: false; status: number; code: string; message: string }
  | {
      ok: true;
      productTranslationsUpserted: number;
      categoryTranslationsUpserted: number;
      skippedRows: number;
    };

/**
 * Commits a previously previewed batch. Blocked if invalid rows exist unless
 * the caller explicitly opts into skipping them. Upserts run on the
 * user-scoped client, so RLS re-verifies that every product/category belongs
 * to the owner's restaurant — a tampered batch cannot cross tenants.
 */
export async function commitTranslationImport(
  supabase: SupabaseServerClient,
  restaurantId: string,
  batchId: string,
  skipUnknown: boolean,
): Promise<CommitResult> {
  const { data: batch } = await supabase
    .from("import_batches")
    .select("id, restaurant_id, type, status")
    .eq("id", batchId)
    .maybeSingle<{ id: string; restaurant_id: string; type: string; status: string }>();

  if (!batch || batch.restaurant_id !== restaurantId) {
    return { ok: false, status: 404, code: "batch_not_found", message: "Import batch not found." };
  }
  if (batch.type !== "translation_import") {
    return { ok: false, status: 409, code: "wrong_batch_type", message: "Not a translation import batch." };
  }
  if (batch.status !== "preview") {
    return {
      ok: false,
      status: 409,
      code: "batch_not_in_preview",
      message: `Batch is "${batch.status}" — only batches in preview can be committed.`,
    };
  }

  const { data: rows } = await supabase
    .from("import_rows")
    .select("row_number, status, normalized_data")
    .eq("import_batch_id", batchId)
    .order("row_number", { ascending: true });

  const importRows = (rows ?? []) as {
    row_number: number;
    status: ImportRowStatus;
    normalized_data: NormalizedRowData;
  }[];

  const invalidCount = importRows.filter((r) => r.status === "invalid").length;
  if (invalidCount > 0 && !skipUnknown) {
    return {
      ok: false,
      status: 409,
      code: "has_invalid_rows",
      message: `${invalidCount} row(s) are invalid. Fix the CSV or explicitly choose to skip invalid rows.`,
    };
  }

  const productUpserts: {
    product_id: string;
    language: Language;
    name: string;
    description: string | null;
    reviewed_by_restaurant: boolean;
  }[] = [];
  const categoryUpsertsByKey = new Map<
    string,
    { category_id: string; language: Language; name: string }
  >();

  let skippedRows = 0;
  for (const row of importRows) {
    if (row.status === "invalid") {
      skippedRows += 1;
      continue;
    }
    const normalized = row.normalized_data;
    for (const lang of LANGUAGES) {
      const t = normalized.product_translations?.[lang];
      if (t?.name) {
        productUpserts.push({
          product_id: normalized.product_id,
          language: lang,
          name: t.name,
          description: t.description ?? null,
          reviewed_by_restaurant: true,
        });
      }
      const categoryName = normalized.category_translations?.[lang];
      if (categoryName && normalized.category_id) {
        categoryUpsertsByKey.set(`${normalized.category_id}:${lang}`, {
          category_id: normalized.category_id,
          language: lang,
          name: categoryName,
        });
      }
    }
  }

  if (productUpserts.length > 0) {
    const { error } = await supabase
      .from("menu_product_translations")
      .upsert(productUpserts, { onConflict: "product_id,language" });
    if (error) {
      console.error("translation_commit_products_failed", error.code);
      return {
        ok: false,
        status: 500,
        code: "commit_failed",
        message: "Could not write product translations.",
      };
    }
  }

  const categoryUpserts = [...categoryUpsertsByKey.values()];
  if (categoryUpserts.length > 0) {
    const { error } = await supabase
      .from("menu_category_translations")
      .upsert(categoryUpserts, { onConflict: "category_id,language" });
    if (error) {
      console.error("translation_commit_categories_failed", error.code);
      return {
        ok: false,
        status: 500,
        code: "commit_failed",
        message: "Could not write category translations.",
      };
    }
  }

  await supabase
    .from("import_batches")
    .update({
      status: "committed",
      committed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  return {
    ok: true,
    productTranslationsUpserted: productUpserts.length,
    categoryTranslationsUpserted: categoryUpserts.length,
    skippedRows,
  };
}
