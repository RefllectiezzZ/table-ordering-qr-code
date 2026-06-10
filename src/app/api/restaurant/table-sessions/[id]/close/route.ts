import { NextResponse } from "next/server";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { tableSessionCloseSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { closeTableSession } from "@/server/table-sessions";

export const dynamic = "force-dynamic";

/**
 * Staff closes a table session when the customers leave:
 *
 *  - the session must belong to the member's restaurant and be open,
 *  - if it still has open orders (new/preparing/ready), the close is blocked
 *    with a 409 + counts unless force=true (the UI shows the warning and asks
 *    for explicit confirmation — documented behavior),
 *  - closing revokes every browser authorization granted during the session,
 *    so saved QR links must go through staff confirmation again,
 *  - orders are never deleted; history stays intact.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, tableSessionCloseSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  // Read through the user-scoped client: RLS re-checks the tenant.
  const { data: session } = await auth.supabase
    .from("table_sessions")
    .select("id, status, table_id")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string; status: string; table_id: string }>();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return NextResponse.json({ error: "Session is already closed" }, { status: 409 });
  }

  const { count: openOrders } = await auth.supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", auth.restaurantId!)
    .eq("table_session_id", session.id)
    .in("status", ["new", "preparing", "ready"]);

  if ((openOrders ?? 0) > 0 && !parsed.data.force) {
    return NextResponse.json(
      {
        error: "session_has_open_orders",
        message:
          "This table still has orders that are not delivered or cancelled.",
        open_orders: openOrders ?? 0,
      },
      { status: 409 },
    );
  }

  const service = createServiceRoleSupabaseClient();
  const result = await closeTableSession(service, auth.restaurantId!, session.id, auth.userId);
  if (!result.ok) {
    return NextResponse.json({ error: "Could not close the session" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "table_session.closed",
    entityType: "table_session",
    entityId: session.id,
    metadata: {
      table_id: session.table_id,
      revoked_tokens: result.revokedTokens,
      forced: parsed.data.force,
      open_orders_at_close: openOrders ?? 0,
    },
  });

  return NextResponse.json({
    session: { id: session.id, status: "closed" },
    revoked_tokens: result.revokedTokens,
  });
}
