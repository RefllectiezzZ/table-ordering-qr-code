import QRCode from "qrcode";
import { TablesManager, type TableData } from "@/components/restaurant/tables-manager";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchTableFloorState } from "@/server/dashboard-orders";
import type { TableStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesas" };

interface TableQueryRow {
  id: string;
  table_number: string;
  label: string | null;
  public_token: string;
  status: TableStatus;
  created_at: string;
}

/**
 * Operational floor view + QR management. Staff and owners see table/session
 * state and can open/close sessions; QR creation and deactivation stay
 * owner-only (enforced again by the API guards and RLS).
 */
export default async function TablesPage() {
  const session = await requireRestaurantUser();
  const isOwner = session.profile.role === "restaurant_owner";
  const supabase = await createServerSupabaseClient();

  const [{ data }, floorState, restaurantRow] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, table_number, label, public_token, status, created_at")
      .eq("restaurant_id", session.restaurantId)
      .order("created_at", { ascending: true }),
    fetchTableFloorState(supabase, session.restaurantId),
    supabase
      .from("restaurants")
      .select("require_order_confirmation, enable_table_sessions")
      .eq("id", session.restaurantId)
      .maybeSingle<{
        require_order_confirmation: boolean;
        enable_table_sessions: boolean;
      }>(),
  ]);

  const requireOrderConfirmation = restaurantRow.data?.require_order_confirmation ?? true;
  const enableTableSessions = restaurantRow.data?.enable_table_sessions ?? true;

  const appUrl = getAppBaseUrl();

  // QR codes are rendered server-side (PNG data URLs) so the page needs no
  // client-side QR library and tokens stay out of third-party services.
  const tables: TableData[] = await Promise.all(
    ((data ?? []) as TableQueryRow[]).map(async (table) => {
      const url = `${appUrl}/t/${table.public_token}`;
      const floor = floorState.get(table.id);
      return {
        id: table.id,
        tableNumber: table.table_number,
        label: table.label,
        status: table.status,
        url,
        qrDataUrl: await QRCode.toDataURL(url, { width: 280, margin: 1 }),
        openSessionId: floor?.openSessionId ?? null,
        sessionOpenedAt: floor?.sessionOpenedAt ?? null,
        openOrderCount: floor?.openOrderCount ?? 0,
        pendingCount: floor?.pendingCount ?? 0,
        sessionOrderCount: floor?.sessionOrderCount ?? 0,
        latestOrderAt: floor?.latestOrderAt ?? null,
      };
    }),
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Mesas</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          {enableTableSessions
            ? requireOrderConfirmation
              ? "Estado operacional de cada mesa. Abra a sessão quando chegam clientes e feche quando saem — o próximo grupo volta a precisar de confirmação no primeiro pedido. Os QR codes são fixos e podem ser impressos."
              : "Estado operacional de cada mesa. Modo rápido com sessões: os pedidos entram diretamente na cozinha, mas continuam agrupados para conta e fecho da mesa. Os QR codes são fixos e podem ser impressos."
            : "Estado operacional de cada mesa. Sem sessões de mesa: os pedidos entram individualmente e não existe conta agrupada. Os QR codes são fixos e podem ser impressos."}
        </p>
      </div>
      <TablesManager
        tables={tables}
        isOwner={isOwner}
        requireOrderConfirmation={requireOrderConfirmation}
        enableTableSessions={enableTableSessions}
      />
    </div>
  );
}
