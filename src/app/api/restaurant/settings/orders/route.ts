import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { ordersAvailabilitySchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/**
 * Owner toggles whether the restaurant currently accepts public orders, with
 * an optional message shown on the QR menu while ordering is paused. The
 * public menu stays visible either way. Runs on the user-scoped client: RLS
 * only lets the owner update their own restaurant.
 */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, ordersAvailabilitySchema);
  if (!parsed.ok) return parsed.response;

  const { error } = await auth.supabase
    .from("restaurants")
    .update({
      accepts_orders: parsed.data.accepts_orders,
      paused_message: parsed.data.paused_message,
    })
    .eq("id", auth.restaurantId!);

  if (error) {
    console.error("orders_availability_update_failed", error.code);
    return NextResponse.json({ error: "Could not update the setting" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: parsed.data.accepts_orders ? "orders.resumed" : "orders.paused",
    entityType: "restaurant",
    entityId: auth.restaurantId,
  });

  return NextResponse.json({ accepts_orders: parsed.data.accepts_orders });
}
