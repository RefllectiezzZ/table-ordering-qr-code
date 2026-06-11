import { OrdersBoard } from "@/components/restaurant/orders-board";
import { parseOrdersFilter } from "@/lib/orders-filters";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchDashboardOrders } from "@/server/dashboard-orders";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pedidos" };

export default async function RestaurantOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; range?: string; from?: string; to?: string }>;
}) {
  const session = await requireRestaurantUser();
  const supabase = await createServerSupabaseClient();

  // Filters live in the URL so a refresh keeps the selection; they are
  // re-validated here before touching any query.
  const filter = parseOrdersFilter(await searchParams);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("default_language")
    .eq("id", session.restaurantId)
    .maybeSingle<{ default_language: Language }>();

  const orders = await fetchDashboardOrders(
    supabase,
    session.restaurantId,
    restaurant?.default_language ?? "pt",
    filter,
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-sm text-slate-500">
          Atualiza automaticamente. Use Cozinha para preparar pedidos confirmados e Staff
          para confirmar ou rejeitar primeiros pedidos.
        </p>
      </div>
      {/* Keyed by filter: changing filters remounts the board with fresh server data. */}
      <OrdersBoard
        key={`${filter.board}:${filter.range}:${filter.fromIso ?? ""}:${filter.toIso ?? ""}`}
        initialOrders={orders}
        initialFilter={filter}
      />
    </div>
  );
}
