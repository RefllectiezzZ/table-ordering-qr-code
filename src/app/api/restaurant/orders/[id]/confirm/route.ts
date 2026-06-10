import { NextResponse } from "next/server";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { logAudit } from "@/server/audit";
import { ensureOpenSession } from "@/server/table-sessions";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Staff confirms a pending_confirmation order:
 *
 *  1. the order must belong to the member's restaurant (read through the
 *     user-scoped client, so RLS re-checks the tenant),
 *  2. an open table session is found or created for the order's table
 *     (race-safe via the partial unique index),
 *  3. the order is attached to the session and becomes "new" (kitchen-ready).
 *
 * The browser authorization for the customer's device is NOT created here:
 * it is issued lazily by the public status poll, so the raw token only ever
 * travels to the device that placed the order.
 *
 * The status+session write uses the service-role client because the
 * authenticated role's column grant on orders is intentionally limited to
 * `status`; every id written here was first validated against the member's
 * own restaurant.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: order } = await auth.supabase
    .from("orders")
    .select("id, status, table_id, restaurant_id")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string; status: OrderStatus; table_id: string; restaurant_id: string }>();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending_confirmation") {
    return NextResponse.json(
      { error: "Only orders pending confirmation can be confirmed" },
      { status: 409 },
    );
  }

  const service = createServiceRoleSupabaseClient();

  const session = await ensureOpenSession(
    service,
    auth.restaurantId!,
    order.table_id,
    auth.userId,
  );
  if (!session) {
    return NextResponse.json({ error: "Could not open the table session" }, { status: 500 });
  }

  const { error: updateError } = await service
    .from("orders")
    .update({ status: "new", table_session_id: session.id })
    .eq("id", order.id)
    .eq("restaurant_id", auth.restaurantId!)
    .eq("status", "pending_confirmation");

  if (updateError) {
    console.error("order_confirm_failed", updateError.code);
    return NextResponse.json({ error: "Could not confirm the order" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "order.confirmed",
    entityType: "order",
    entityId: order.id,
    metadata: { table_session_id: session.id },
  });

  return NextResponse.json({
    order: { id: order.id, status: "new", table_session_id: session.id },
  });
}
