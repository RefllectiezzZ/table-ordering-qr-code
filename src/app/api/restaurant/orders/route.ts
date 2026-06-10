import { NextResponse } from "next/server";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { fetchDashboardOrders } from "@/server/dashboard-orders";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

/** Polled by the kitchen order board. Scoped to the member's restaurant. */
export async function GET() {
  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("default_language")
    .eq("id", auth.restaurantId!)
    .maybeSingle<{ default_language: Language }>();

  const orders = await fetchDashboardOrders(
    auth.supabase,
    auth.restaurantId!,
    restaurant?.default_language ?? "pt",
  );

  return NextResponse.json(
    { orders },
    { headers: { "Cache-Control": "no-store" } },
  );
}
