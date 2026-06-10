import { NextResponse } from "next/server";
import { buildRestaurantTranslationCsv } from "@/lib/admin/translations-export";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** Platform admin: download translation CSV for a specific restaurant. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const { id: restaurantId } = await context.params;

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("id, name")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const csv = await buildRestaurantTranslationCsv(auth.supabase, restaurantId);
  const date = new Date().toISOString().slice(0, 10);

  await logAudit({
    restaurantId,
    actorUserId: auth.userId,
    action: "translations.exported",
    entityType: "restaurant",
    entityId: restaurantId,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="menu-translations-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
