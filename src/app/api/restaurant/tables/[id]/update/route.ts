import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { tableUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/**
 * Updates label/status of a table. The public_token is intentionally not
 * updatable — tokens are never reassigned or reused.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, tableUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;

  const { data: table } = await auth.supabase
    .from("restaurant_tables")
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId!)
    .maybeSingle<{ id: string }>();

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const fieldUpdates: Record<string, unknown> = {};
  if (parsed.data.label !== undefined) fieldUpdates.label = parsed.data.label;
  if (parsed.data.status !== undefined) fieldUpdates.status = parsed.data.status;

  if (Object.keys(fieldUpdates).length > 0) {
    const { error } = await auth.supabase
      .from("restaurant_tables")
      .update(fieldUpdates)
      .eq("id", table.id)
      .eq("restaurant_id", auth.restaurantId!);
    if (error) {
      console.error("table_update_failed", error.code);
      return NextResponse.json({ error: "Could not update the table" }, { status: 500 });
    }
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "table.updated",
    entityType: "restaurant_table",
    entityId: table.id,
    metadata: parsed.data.status ? { status: parsed.data.status } : {},
  });

  return NextResponse.json({ table: { id: table.id } });
}
