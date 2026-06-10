import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { productUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { LANGUAGES } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, productUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  const { data: product } = await auth.supabase
    .from("menu_products")
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string }>();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (parsed.data.category_id) {
    const { data: category } = await auth.supabase
      .from("menu_categories")
      .select("id")
      .eq("id", parsed.data.category_id)
      .eq("restaurant_id", auth.restaurantId!)
      .maybeSingle();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const fieldUpdates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.category_id !== undefined) fieldUpdates.category_id = d.category_id;
  if (d.price_cents !== undefined) fieldUpdates.price_cents = d.price_cents;
  if (d.image_url !== undefined) fieldUpdates.image_url = d.image_url;
  if (d.is_available !== undefined) fieldUpdates.is_available = d.is_available;
  if (d.is_active !== undefined) fieldUpdates.is_active = d.is_active;
  if (d.sort_order !== undefined) fieldUpdates.sort_order = d.sort_order;
  if (d.allergen_codes !== undefined) fieldUpdates.allergen_codes = d.allergen_codes;
  if (d.dietary_tags !== undefined) fieldUpdates.dietary_tags = d.dietary_tags;

  if (Object.keys(fieldUpdates).length > 0) {
    const { error } = await auth.supabase
      .from("menu_products")
      .update(fieldUpdates)
      .eq("id", product.id)
      .eq("restaurant_id", auth.restaurantId!);
    if (error) {
      console.error("product_update_failed", error.code);
      return NextResponse.json({ error: "Could not update the product" }, { status: 500 });
    }
  }

  if (d.translations) {
    const upserts = LANGUAGES.flatMap((lang) => {
      const t = d.translations?.[lang];
      return t
        ? [{ product_id: product.id, language: lang, name: t.name, description: t.description }]
        : [];
    });
    if (upserts.length > 0) {
      const { error } = await auth.supabase
        .from("menu_product_translations")
        .upsert(upserts, { onConflict: "product_id,language" });
      if (error) {
        console.error("product_translations_update_failed", error.code);
        return NextResponse.json({ error: "Could not save translations" }, { status: 500 });
      }
    }
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "product.updated",
    entityType: "menu_product",
    entityId: product.id,
  });

  return NextResponse.json({ product: { id: product.id } });
}
