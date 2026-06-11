import { NextResponse } from "next/server";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { logAudit } from "@/server/audit";
import { ensureOpenSession } from "@/server/table-sessions";

export const dynamic = "force-dynamic";

/**
 * Staff manually opens a table session (e.g. customers were seated before
 * ordering). Idempotent: when the table already has an open session, that
 * session is returned. The table must belong to the member's restaurant.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: table } = await auth.supabase
    .from("restaurant_tables")
    .select("id, status")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string; status: string }>();

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("enable_table_sessions")
    .eq("id", auth.restaurantId!)
    .maybeSingle<{ enable_table_sessions: boolean }>();

  if (!restaurant?.enable_table_sessions) {
    return NextResponse.json({ error: "Table sessions are disabled" }, { status: 409 });
  }

  const service = createServiceRoleSupabaseClient();
  const session = await ensureOpenSession(service, auth.restaurantId!, table.id, auth.userId);
  if (!session) {
    return NextResponse.json({ error: "Could not open the session" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "table_session.opened",
    entityType: "table_session",
    entityId: session.id,
    metadata: { table_id: table.id },
  });

  return NextResponse.json({
    session: { id: session.id, status: session.status, opened_at: session.opened_at },
  });
}
