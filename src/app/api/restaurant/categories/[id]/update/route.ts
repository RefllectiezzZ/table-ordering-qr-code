import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { categoryUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { LANGUAGES } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, categoryUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  const { data: category } = await auth.supabase
    .from("menu_categories")
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string }>();

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const fieldUpdates: Record<string, unknown> = {};
  if (parsed.data.sort_order !== undefined) fieldUpdates.sort_order = parsed.data.sort_order;
  if (parsed.data.is_active !== undefined) fieldUpdates.is_active = parsed.data.is_active;

  if (Object.keys(fieldUpdates).length > 0) {
    const { error } = await auth.supabase
      .from("menu_categories")
      .update(fieldUpdates)
      .eq("id", category.id)
      .eq("restaurant_id", auth.restaurantId!);
    if (error) {
      console.error("category_update_failed", error.code);
      return NextResponse.json({ error: "Could not update the category" }, { status: 500 });
    }
  }

  if (parsed.data.translations) {
    const upserts = LANGUAGES.flatMap((lang) => {
      const name = parsed.data.translations?.[lang];
      return name ? [{ category_id: category.id, language: lang, name }] : [];
    });
    if (upserts.length > 0) {
      const { error } = await auth.supabase
        .from("menu_category_translations")
        .upsert(upserts, { onConflict: "category_id,language" });
      if (error) {
        console.error("category_translations_update_failed", error.code);
        return NextResponse.json({ error: "Could not save translations" }, { status: 500 });
      }
    }
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "category.updated",
    entityType: "menu_category",
    entityId: category.id,
  });

  return NextResponse.json({ category: { id: category.id } });
}
