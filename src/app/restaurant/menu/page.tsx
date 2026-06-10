import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentsToEuro } from "@/lib/money";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Menu" };

interface CategoryOverviewRow {
  id: string;
  sort_order: number;
  is_active: boolean;
  menu_category_translations: { language: Language; name: string }[];
}

interface ProductOverviewRow {
  id: string;
  category_id: string | null;
  price_cents: number;
  is_active: boolean;
  is_available: boolean;
  menu_product_translations: { language: Language; name: string }[];
}

export default async function MenuOverviewPage() {
  const session = await requireRestaurantUser();
  const isOwner = session.profile.role === "restaurant_owner";
  const supabase = await createServerSupabaseClient();

  const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, sort_order, is_active, menu_category_translations(language, name)")
      .eq("restaurant_id", session.restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_products")
      .select(
        "id, category_id, price_cents, is_active, is_available, menu_product_translations(language, name)",
      )
      .eq("restaurant_id", session.restaurantId)
      .order("sort_order", { ascending: true }),
  ]);

  const categories = (categoriesData ?? []) as CategoryOverviewRow[];
  const products = (productsData ?? []) as ProductOverviewRow[];

  const nameOf = (translations: { language: Language; name: string }[]) =>
    translations.find((t) => t.language === "pt")?.name ?? translations[0]?.name ?? "—";

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Menu overview</h1>
          <p className="text-sm text-slate-500">
            {categories.length} categories · {products.length} products
          </p>
        </div>
        {isOwner ? (
          <div className="flex gap-2">
            <Link href="/restaurant/categories">
              <Button variant="outline" size="sm">
                Manage categories
              </Button>
            </Link>
            <Link href="/restaurant/products">
              <Button size="sm">Manage products</Button>
            </Link>
          </div>
        ) : null}
      </div>

      {categories.length === 0 && products.length === 0 ? (
        <EmptyState
          title="The menu is empty"
          description={
            isOwner
              ? "Start by creating categories, then add products to them."
              : "The owner has not added menu items yet."
          }
          action={
            isOwner ? (
              <Link href="/restaurant/categories">
                <Button>Create first category</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid max-w-4xl gap-4">
          {categories.map((category) => {
            const categoryProducts = products.filter((p) => p.category_id === category.id);
            return (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <CardTitle>{nameOf(category.menu_category_translations)}</CardTitle>
                  <Badge tone={category.is_active ? "green" : "neutral"}>
                    {category.is_active ? "active" : "inactive"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {categoryProducts.length} product{categoryProducts.length === 1 ? "" : "s"}
                  </span>
                </CardHeader>
                <CardContent>
                  {categoryProducts.length === 0 ? (
                    <p className="text-sm text-slate-400">No products in this category.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {categoryProducts.map((product) => (
                        <li
                          key={product.id}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            {nameOf(product.menu_product_translations)}
                            {!product.is_active ? <Badge>inactive</Badge> : null}
                            {!product.is_available ? (
                              <Badge tone="yellow">unavailable</Badge>
                            ) : null}
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatCentsToEuro(product.price_cents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {products.some((p) => p.category_id === null) ? (
            <Card>
              <CardHeader>
                <CardTitle>Without category</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {products
                    .filter((p) => p.category_id === null)
                    .map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span>{nameOf(product.menu_product_translations)}</span>
                        <span className="font-medium text-slate-700">
                          {formatCentsToEuro(product.price_cents)}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
