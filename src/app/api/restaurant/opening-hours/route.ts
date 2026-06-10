import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { openingHoursUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/**
 * Owner saves the weekly opening hours. The restaurant is always the owner's
 * own (derived from the authenticated profile, never from the body) and the
 * write runs on the user-scoped client, so RLS enforces both the role and the
 * tenant again at the database level. Staff get 403 from the guard.
 */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, openingHoursUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const rows = parsed.data.days.map((day) => ({
    restaurant_id: auth.restaurantId!,
    weekday: day.weekday,
    is_closed: day.is_closed,
    opens_at: day.is_closed ? null : day.opens_at,
    closes_at: day.is_closed ? null : day.closes_at,
    notes: day.notes,
  }));

  const { error } = await auth.supabase
    .from("restaurant_opening_hours")
    .upsert(rows, { onConflict: "restaurant_id,weekday" });

  if (error) {
    console.error("opening_hours_update_failed", error.code);
    return NextResponse.json(
      { error: "Could not save the opening hours" },
      { status: 500 },
    );
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "opening_hours.updated",
    entityType: "restaurant",
    entityId: auth.restaurantId,
    metadata: {
      days: rows.map((row) => ({
        weekday: row.weekday,
        is_closed: row.is_closed,
        opens_at: row.opens_at,
        closes_at: row.closes_at,
      })),
    },
  });

  return NextResponse.json({ saved: true });
}
