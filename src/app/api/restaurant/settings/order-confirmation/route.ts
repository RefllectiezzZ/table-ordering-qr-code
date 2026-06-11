import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { orderConfirmationSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** Owner toggles whether first orders from new devices require staff confirmation. */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, orderConfirmationSchema);
  if (!parsed.ok) return parsed.response;

  const { error } = await auth.supabase
    .from("restaurants")
    .update({ require_order_confirmation: parsed.data.require_order_confirmation })
    .eq("id", auth.restaurantId!);

  if (error) {
    console.error("order_confirmation_update_failed", error.code);
    return NextResponse.json({ error: "Could not update the setting" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: parsed.data.require_order_confirmation
      ? "order_confirmation.enabled"
      : "order_confirmation.disabled",
    entityType: "restaurant",
    entityId: auth.restaurantId,
  });

  return NextResponse.json({
    require_order_confirmation: parsed.data.require_order_confirmation,
  });
}
