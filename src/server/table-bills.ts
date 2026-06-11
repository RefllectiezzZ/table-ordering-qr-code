import "server-only";

import { orderShortCode, orderDisplayNumber } from "@/lib/orders";
import { BILLABLE_ORDER_STATUSES } from "@/lib/table-bill-statuses";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language, OrderStatus } from "@/types/database";

export { BILLABLE_ORDER_STATUSES };

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface TableBillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  itemNote: string | null;
}

export interface TableBillOrder {
  id: string;
  shortCode: string;
  displayNumber: string;
  orderNumber: number | null;
  status: OrderStatus;
  createdAt: string;
  totalCents: number;
  items: TableBillItem[];
}

export interface TableBillPayload {
  tableId: string;
  tableNumber: string;
  tableLabel: string | null;
  sessionId: string;
  sessionOpenedAt: string;
  orders: TableBillOrder[];
  totalCents: number;
}

export type FetchActiveTableBillResult =
  | { ok: true; bill: TableBillPayload }
  | { ok: true; empty: true; tableId: string; tableNumber: string; tableLabel: string | null }
  | { ok: false; code: "table_not_found" | "sessions_disabled" };

interface OrderQueryRow {
  id: string;
  status: OrderStatus;
  order_number: number | null;
  created_at: string;
  order_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    item_note: string | null;
    menu_products: {
      menu_product_translations: { language: Language; name: string }[];
    } | null;
  }[];
}

/**
 * Loads the active table bill for reception/staff. Totals are computed from
 * stored order_items.unit_price_cents — never from current product prices.
 */
export async function fetchActiveTableBill(
  supabase: SupabaseServerClient,
  restaurantId: string,
  tableId: string,
  defaultLanguage: Language = "pt",
): Promise<FetchActiveTableBillResult> {
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, label, restaurant_id")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle<{
      id: string;
      table_number: string;
      label: string | null;
      restaurant_id: string;
    }>();

  if (!table) {
    return { ok: false, code: "table_not_found" };
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("enable_table_sessions")
    .eq("id", restaurantId)
    .maybeSingle<{ enable_table_sessions: boolean }>();

  if (!restaurant?.enable_table_sessions) {
    return { ok: false, code: "sessions_disabled" };
  }

  const { data: session } = await supabase
    .from("table_sessions")
    .select("id, opened_at")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", tableId)
    .eq("status", "open")
    .maybeSingle<{ id: string; opened_at: string }>();

  if (!session) {
    return {
      ok: true,
      empty: true,
      tableId: table.id,
      tableNumber: table.table_number,
      tableLabel: table.label,
    };
  }

  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      `id, status, order_number, created_at,
       order_items(id, product_id, quantity, unit_price_cents, item_note,
         menu_products(menu_product_translations(language, name)))`,
    )
    .eq("restaurant_id", restaurantId)
    .eq("table_session_id", session.id)
    .in("status", BILLABLE_ORDER_STATUSES)
    .order("created_at", { ascending: true });

  const orders: TableBillOrder[] = ((ordersData ?? []) as unknown as OrderQueryRow[]).map(
    (order) => {
      const items: TableBillItem[] = order.order_items.map((item) => {
        const translations = item.menu_products?.menu_product_translations ?? [];
        const name =
          translations.find((t) => t.language === defaultLanguage)?.name ??
          translations[0]?.name ??
          "(produto sem nome)";
        const lineTotalCents = item.quantity * item.unit_price_cents;
        return {
          id: item.id,
          productId: item.product_id,
          productName: name,
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          lineTotalCents,
          itemNote: item.item_note,
        };
      });

      const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

      return {
        id: order.id,
        shortCode: orderShortCode(order.id),
        displayNumber: orderDisplayNumber(order.order_number, order.id),
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        totalCents,
        items,
      };
    },
  );

  const totalCents = orders.reduce((sum, order) => sum + order.totalCents, 0);

  return {
    ok: true,
    bill: {
      tableId: table.id,
      tableNumber: table.table_number,
      tableLabel: table.label,
      sessionId: session.id,
      sessionOpenedAt: session.opened_at,
      orders,
      totalCents,
    },
  };
}
