import { CategoriesManager, type CategoryData } from "@/components/restaurant/categories-manager";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

interface CategoryQueryRow {
  id: string;
  sort_order: number;
  is_active: boolean;
  menu_category_translations: { language: Language; name: string }[];
}

export default async function CategoriesPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("menu_categories")
    .select("id, sort_order, is_active, menu_category_translations(language, name)")
    .eq("restaurant_id", session.restaurantId)
    .order("sort_order", { ascending: true });

  const categories: CategoryData[] = ((data ?? []) as CategoryQueryRow[]).map((row) => ({
    id: row.id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    names: Object.fromEntries(row.menu_category_translations.map((t) => [t.language, t.name])),
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500">
          Group your menu and translate category names into PT, EN, ES and FR.
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  );
}
