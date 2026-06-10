import {
  buildTranslationCsv,
  type CategoryTranslationsById,
  type TranslationExportProduct,
} from "@/lib/csv/translation-csv";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

interface ProductExportRow {
  id: string;
  category_id: string | null;
  price_cents: number;
  allergen_codes: string[];
  menu_product_translations: { language: Language; name: string; description: string | null }[];
}

interface CategoryExportRow {
  id: string;
  menu_category_translations: { language: Language; name: string }[];
}

/** Builds the multi-language translation CSV for a restaurant. */
export async function buildRestaurantTranslationCsv(
  supabase: ServerClient,
  restaurantId: string,
): Promise<string> {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("menu_products")
      .select(
        "id, category_id, price_cents, allergen_codes, menu_product_translations(language, name, description)",
      )
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_categories")
      .select("id, menu_category_translations(language, name)")
      .eq("restaurant_id", restaurantId),
  ]);

  const exportProducts: TranslationExportProduct[] = (
    (products ?? []) as unknown as ProductExportRow[]
  ).map((p) => {
    const translations: TranslationExportProduct["translations"] = {};
    for (const t of p.menu_product_translations) {
      translations[t.language] = { name: t.name, description: t.description };
    }
    return {
      id: p.id,
      categoryId: p.category_id,
      priceCents: p.price_cents,
      allergenCodes: p.allergen_codes,
      translations,
    };
  });

  const categoryTranslations: CategoryTranslationsById = {};
  for (const c of (categories ?? []) as unknown as CategoryExportRow[]) {
    const names: Partial<Record<Language, string>> = {};
    for (const t of c.menu_category_translations) names[t.language] = t.name;
    categoryTranslations[c.id] = names;
  }

  return buildTranslationCsv(exportProducts, categoryTranslations);
}
