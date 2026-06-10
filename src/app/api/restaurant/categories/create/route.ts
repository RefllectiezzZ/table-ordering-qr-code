import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { categoryCreateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { LANGUAGES } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, categoryCreateSchema);
  if (!parsed.ok) return parsed.response;

  const { data: category, error } = await auth.supabase
    .from("menu_categories")
    .insert({
      restaurant_id: auth.restaurantId!,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !category) {
    console.error("category_create_failed", error?.code);
    return NextResponse.json({ error: "Could not create the category" }, { status: 500 });
  }

  const translations = LANGUAGES.flatMap((lang) => {
    const name = parsed.data.translations[lang];
    return name ? [{ category_id: category.id, language: lang, name }] : [];
  });

  if (translations.length > 0) {
    const { error: translationError } = await auth.supabase
      .from("menu_category_translations")
      .insert(translations);
    if (translationError) {
      await auth.supabase.from("menu_categories").delete().eq("id", category.id);
      console.error("category_translations_failed", translationError.code);
      return NextResponse.json({ error: "Could not save translations" }, { status: 500 });
    }
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "category.created",
    entityType: "menu_category",
    entityId: category.id,
  });

  return NextResponse.json({ category: { id: category.id } }, { status: 201 });
}
