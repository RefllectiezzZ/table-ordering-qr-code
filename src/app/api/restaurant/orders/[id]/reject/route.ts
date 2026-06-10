import { NextResponse } from "next/server";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { logAudit } from "@/server/audit";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Staff rejects a pending_confirmation order (e.g. nobody is sitting at the
 * table). The order becomes "rejected" (terminal): it never reaches the
 * kitchen and no browser authorization is granted to the submitting device.
 *
 * Uses the user-scoped client: only the status column changes, which the
 * authenticated role's column grant allows, and RLS re-checks the tenant.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: order } = await auth.supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string; status: OrderStatus }>();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending_confirmation") {
    return NextResponse.json(
      { error: "Only orders pending confirmation can be rejected" },
      { status: 409 },
    );
  }

  const { error } = await auth.supabase
    .from("orders")
    .update({ status: "rejected" })
    .eq("id", order.id)
    .eq("restaurant_id", auth.restaurantId!);

  if (error) {
    console.error("order_reject_failed", error.code);
    return NextResponse.json({ error: "Could not reject the order" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "order.rejected",
    entityType: "order",
    entityId: order.id,
  });

  return NextResponse.json({ order: { id: order.id, status: "rejected" } });
}
