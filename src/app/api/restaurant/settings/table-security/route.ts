import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { tableSecuritySchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** Owner updates table security mode: confirmation + optional table sessions. */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, tableSecuritySchema);
  if (!parsed.ok) return parsed.response;

  const { data: current } = await auth.supabase
    .from("restaurants")
    .select("require_order_confirmation, enable_table_sessions")
    .eq("id", auth.restaurantId!)
    .maybeSingle<{
      require_order_confirmation: boolean;
      enable_table_sessions: boolean;
    }>();

  const { error } = await auth.supabase
    .from("restaurants")
    .update({
      require_order_confirmation: parsed.data.require_order_confirmation,
      enable_table_sessions: parsed.data.enable_table_sessions,
    })
    .eq("id", auth.restaurantId!);

  if (error) {
    console.error("table_security_update_failed", error.code);
    return NextResponse.json({ error: "Could not update the settings" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "table_security.updated",
    entityType: "restaurant",
    entityId: auth.restaurantId,
    metadata: {
      previous: {
        require_order_confirmation: current?.require_order_confirmation ?? null,
        enable_table_sessions: current?.enable_table_sessions ?? null,
      },
      next: parsed.data,
    },
  });

  return NextResponse.json(parsed.data);
}
