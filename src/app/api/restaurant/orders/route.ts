import { NextResponse } from "next/server";
import { parseOrdersFilter } from "@/lib/orders-filters";
import { requireApiRestaurantMember } from "@/lib/security/api-guards";
import { fetchDashboardOrders } from "@/server/dashboard-orders";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Polled by the kitchen order board. Scoped to the member's restaurant; the
 * view/date filters arrive as query params and are strictly re-validated
 * server-side (restaurant_id is NEVER taken from the client).
 */
export async function GET(request: Request) {
  const auth = await requireApiRestaurantMember();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const filter = parseOrdersFilter({
    view: url.searchParams.get("view") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("default_language")
    .eq("id", auth.restaurantId!)
    .maybeSingle<{ default_language: Language }>();

  const orders = await fetchDashboardOrders(
    auth.supabase,
    auth.restaurantId!,
    restaurant?.default_language ?? "pt",
    filter,
  );

  return NextResponse.json(
    { orders, filter },
    { headers: { "Cache-Control": "no-store" } },
  );
}
