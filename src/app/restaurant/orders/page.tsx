import { OrdersBoard } from "@/components/restaurant/orders-board";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchDashboardOrders } from "@/server/dashboard-orders";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

export default async function RestaurantOrdersPage() {
  const session = await requireRestaurantUser();
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("default_language")
    .eq("id", session.restaurantId)
    .maybeSingle<{ default_language: Language }>();

  const orders = await fetchDashboardOrders(
    supabase,
    session.restaurantId,
    restaurant?.default_language ?? "pt",
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">
          Live board for the kitchen — refreshes automatically every few seconds.
        </p>
      </div>
      <OrdersBoard initialOrders={orders} />
    </div>
  );
}
