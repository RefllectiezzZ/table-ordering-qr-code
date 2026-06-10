import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { adminRestaurantStatusSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/**
 * Suspend / activate / draft a restaurant. Suspended restaurants immediately
 * stop serving their public menu and stop accepting public orders.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, adminRestaurantStatusSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  const { data: restaurant, error } = await auth.supabase
    .from("restaurants")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle<{ id: string; status: string }>();

  if (error) {
    console.error("admin_restaurant_status_failed", error.code);
    return NextResponse.json({ error: "Could not update the status" }, { status: 500 });
  }
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  await logAudit({
    restaurantId: restaurant.id,
    actorUserId: auth.userId,
    action: "restaurant.status_changed",
    entityType: "restaurant",
    entityId: restaurant.id,
    metadata: { status: restaurant.status },
  });

  return NextResponse.json({ restaurant });
}
