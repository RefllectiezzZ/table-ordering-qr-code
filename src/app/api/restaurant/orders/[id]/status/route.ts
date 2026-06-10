import { NextResponse } from "next/server";
import { canTransitionOrderStatus } from "@/lib/orders";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

/** Owner or staff update an order's status — own restaurant only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, orderStatusUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  // Scope by restaurant_id explicitly (RLS enforces it again underneath).
  const { data: order } = await auth.supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string; status: OrderStatus }>();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (order.status === nextStatus) {
    return NextResponse.json({ order: { id: order.id, status: order.status } });
  }
  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    return NextResponse.json(
      { error: `Cannot change status from "${order.status}" to "${nextStatus}"` },
      { status: 409 },
    );
  }

  const { error } = await auth.supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", order.id)
    .eq("restaurant_id", auth.restaurantId!);

  if (error) {
    console.error("order_status_update_failed", error.code);
    return NextResponse.json({ error: "Could not update the order" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "order.status_changed",
    entityType: "order",
    entityId: order.id,
    metadata: { from: order.status, to: nextStatus },
  });

  return NextResponse.json({ order: { id: order.id, status: nextStatus } });
}
