import {
  ProductsManager,
  type ProductCategoryOption,
  type ProductData,
} from "@/components/restaurant/products-manager";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

interface ProductQueryRow {
  id: string;
  category_id: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
  allergen_codes: string[];
  dietary_tags: string[];
  menu_product_translations: { language: Language; name: string; description: string | null }[];
}

interface CategoryQueryRow {
  id: string;
  menu_category_translations: { language: Language; name: string }[];
}

export default async function ProductsPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("menu_products")
      .select(
        "id, category_id, price_cents, image_url, is_available, is_active, sort_order, allergen_codes, dietary_tags, menu_product_translations(language, name, description)",
      )
      .eq("restaurant_id", session.restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_categories")
      .select("id, menu_category_translations(language, name)")
      .eq("restaurant_id", session.restaurantId)
      .order("sort_order", { ascending: true }),
  ]);

  const products: ProductData[] = ((productsData ?? []) as ProductQueryRow[]).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    allergenCodes: row.allergen_codes,
    dietaryTags: row.dietary_tags,
    translations: Object.fromEntries(
      row.menu_product_translations.map((t) => [
        t.language,
        { name: t.name, description: t.description ?? "" },
      ]),
    ),
  }));

  const categories: ProductCategoryOption[] = ((categoriesData ?? []) as CategoryQueryRow[]).map(
    (row) => ({
      id: row.id,
      name:
        row.menu_category_translations.find((t) => t.language === "pt")?.name ??
        row.menu_category_translations[0]?.name ??
        "—",
    }),
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Produtos</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          O português é o idioma base e é obrigatório; English, Español e Français são traduções
          opcionais. Os alérgenos usam os 14 códigos estáveis da UE e são traduzidos
          automaticamente no menu público.
        </p>
      </div>
      <ProductsManager products={products} categories={categories} />
    </div>
  );
}
