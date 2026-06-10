import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { productCreateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { LANGUAGES } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, productCreateSchema);
  if (!parsed.ok) return parsed.response;

  // A category id from the client is only accepted if it belongs to the
  // owner's restaurant.
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

  const { data: product, error } = await auth.supabase
    .from("menu_products")
    .insert({
      restaurant_id: auth.restaurantId!,
      category_id: parsed.data.category_id,
      price_cents: parsed.data.price_cents,
      image_url: parsed.data.image_url,
      is_available: parsed.data.is_available,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
      allergen_codes: parsed.data.allergen_codes,
      dietary_tags: parsed.data.dietary_tags,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !product) {
    console.error("product_create_failed", error?.code);
    return NextResponse.json({ error: "Could not create the product" }, { status: 500 });
  }

  const translations = LANGUAGES.flatMap((lang) => {
    const t = parsed.data.translations[lang];
    return t
      ? [{ product_id: product.id, language: lang, name: t.name, description: t.description }]
      : [];
  });

  if (translations.length > 0) {
    const { error: translationError } = await auth.supabase
      .from("menu_product_translations")
      .insert(translations);
    if (translationError) {
      await auth.supabase.from("menu_products").delete().eq("id", product.id);
      console.error("product_translations_failed", translationError.code);
      return NextResponse.json({ error: "Could not save translations" }, { status: 500 });
    }
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "product.created",
    entityType: "menu_product",
    entityId: product.id,
  });

  return NextResponse.json({ product: { id: product.id } }, { status: 201 });
}
