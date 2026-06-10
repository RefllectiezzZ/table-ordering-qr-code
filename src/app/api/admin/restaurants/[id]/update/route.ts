import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { adminRestaurantUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, adminRestaurantUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  const fieldUpdates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) fieldUpdates.name = parsed.data.name;
  if (parsed.data.slug !== undefined) fieldUpdates.slug = parsed.data.slug;
  if (parsed.data.default_language !== undefined) {
    fieldUpdates.default_language = parsed.data.default_language;
  }

  if (Object.keys(fieldUpdates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: restaurant, error } = await auth.supabase
    .from("restaurants")
    .update(fieldUpdates)
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    console.error("admin_restaurant_update_failed", error.code);
    return NextResponse.json({ error: "Could not update the restaurant" }, { status: 500 });
  }
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  await logAudit({
    restaurantId: restaurant.id,
    actorUserId: auth.userId,
    action: "restaurant.updated",
    entityType: "restaurant",
    entityId: restaurant.id,
    metadata: { fields: Object.keys(fieldUpdates) },
  });

  return NextResponse.json({ restaurant: { id: restaurant.id } });
}
