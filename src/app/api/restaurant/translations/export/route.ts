import { NextResponse } from "next/server";
import {
  buildTranslationCsv,
  type CategoryTranslationsById,
  type TranslationExportProduct,
} from "@/lib/csv/translation-csv";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

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

/** Downloads the translation CSV for the owner's restaurant. */
export async function GET() {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const [{ data: products }, { data: categories }] = await Promise.all([
    auth.supabase
      .from("menu_products")
      .select(
        "id, category_id, price_cents, allergen_codes, menu_product_translations(language, name, description)",
      )
      .eq("restaurant_id", auth.restaurantId!)
      .order("sort_order", { ascending: true }),
    auth.supabase
      .from("menu_categories")
      .select("id, menu_category_translations(language, name)")
      .eq("restaurant_id", auth.restaurantId!),
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

  const csv = buildTranslationCsv(exportProducts, categoryTranslations);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="menu-translations-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
