import "server-only";

import { orderShortCode } from "@/lib/orders";
import {
  rangeTimeFloor,
  statusesForBoard,
  type OrdersFilter,
} from "@/lib/orders-filters";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language, OrderStatus } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface DashboardOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  itemNote: string | null;
}

export interface DashboardOrder {
  id: string;
  shortCode: string;
  orderNumber: number | null;
  status: OrderStatus;
  customerNote: string | null;
  createdAt: string;
  tableNumber: string;
  tableLabel: string | null;
  tableSessionId: string | null;
  sessionOpenedAt: string | null;
  sessionStatus: string | null;
  totalCents: number;
  items: DashboardOrderItem[];
}

interface OrderQueryRow {
  id: string;
  status: OrderStatus;
  order_number: number | null;
  customer_note: string | null;
  created_at: string;
  table_session_id: string | null;
  restaurant_tables: { table_number: string; label: string | null } | null;
  table_sessions: { opened_at: string; status: string } | null;
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
 * Loads the order board for one restaurant, applying the (already validated)
 * date/status filter. Runs on the user-scoped client, so RLS enforces tenant
 * isolation on top of the explicit restaurant_id filter.
 */
export async function fetchDashboardOrders(
  supabase: SupabaseServerClient,
  restaurantId: string,
  defaultLanguage: Language,
  filter: OrdersFilter,
): Promise<DashboardOrder[]> {
  let query = supabase
    .from("orders")
    .select(
      `id, status, order_number, customer_note, created_at, table_session_id,
       restaurant_tables(table_number, label),
       table_sessions(opened_at, status),
       order_items(id, product_id, quantity, unit_price_cents, item_note,
         menu_products(menu_product_translations(language, name)))`,
    )
    .eq("restaurant_id", restaurantId);

  query = query.in("status", statusesForBoard(filter.board));

  if (filter.range === "custom") {
    if (filter.fromIso) query = query.gte("created_at", filter.fromIso);
    if (filter.toIso) query = query.lte("created_at", filter.toIso);
  } else {
    const floor = rangeTimeFloor(filter.range);
    if (floor) query = query.gte("created_at", floor);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(200);

  return ((data ?? []) as unknown as OrderQueryRow[]).map((order) => {
    const items: DashboardOrderItem[] = order.order_items.map((item) => {
      const translations = item.menu_products?.menu_product_translations ?? [];
      const name =
        translations.find((t) => t.language === defaultLanguage)?.name ??
        translations[0]?.name ??
        "(produto sem nome)";
      return {
        id: item.id,
        productId: item.product_id,
        productName: name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        itemNote: item.item_note,
      };
    });

    return {
      id: order.id,
      shortCode: orderShortCode(order.id),
      orderNumber: order.order_number,
      status: order.status,
      customerNote: order.customer_note,
      createdAt: order.created_at,
      tableNumber: order.restaurant_tables?.table_number ?? "?",
      tableLabel: order.restaurant_tables?.label ?? null,
      tableSessionId: order.table_session_id,
      sessionOpenedAt: order.table_sessions?.opened_at ?? null,
      sessionStatus: order.table_sessions?.status ?? null,
      totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
      items,
    };
  });
}

export interface TableFloorEntry {
  tableId: string;
  openSessionId: string | null;
  sessionOpenedAt: string | null;
  openOrderCount: number;
  pendingCount: number;
  sessionOrderCount: number;
  latestOrderAt: string | null;
}

/**
 * Aggregates per-table operational state for the floor view: open session,
 * open/pending order counts and the latest order time. All queries are
 * restaurant-scoped and RLS-protected.
 */
export async function fetchTableFloorState(
  supabase: SupabaseServerClient,
  restaurantId: string,
): Promise<Map<string, TableFloorEntry>> {
  const [{ data: sessionsData }, { data: ordersData }] = await Promise.all([
    supabase
      .from("table_sessions")
      .select("id, table_id, opened_at")
      .eq("restaurant_id", restaurantId)
      .eq("status", "open"),
    supabase
      .from("orders")
      .select("id, table_id, table_session_id, status, created_at")
      .eq("restaurant_id", restaurantId)
      .in("status", ["pending_confirmation", "new", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const sessions = (sessionsData ?? []) as { id: string; table_id: string; opened_at: string }[];
  const orders = (ordersData ?? []) as {
    id: string;
    table_id: string;
    table_session_id: string | null;
    status: OrderStatus;
    created_at: string;
  }[];

  const byTable = new Map<string, TableFloorEntry>();
  const entryFor = (tableId: string): TableFloorEntry => {
    let entry = byTable.get(tableId);
    if (!entry) {
      entry = {
        tableId,
        openSessionId: null,
        sessionOpenedAt: null,
        openOrderCount: 0,
        pendingCount: 0,
        sessionOrderCount: 0,
        latestOrderAt: null,
      };
      byTable.set(tableId, entry);
    }
    return entry;
  };

  for (const session of sessions) {
    const entry = entryFor(session.table_id);
    entry.openSessionId = session.id;
    entry.sessionOpenedAt = session.opened_at;
  }

  for (const order of orders) {
    const entry = entryFor(order.table_id);
    if (order.status === "pending_confirmation") {
      entry.pendingCount += 1;
    } else {
      entry.openOrderCount += 1;
    }
    if (!entry.latestOrderAt || order.created_at > entry.latestOrderAt) {
      entry.latestOrderAt = order.created_at;
    }
  }

  // Total orders attached to each CURRENT open session (any status), counted
  // separately so totals never mix in past sessions.
  const openSessionIds = sessions.map((s) => s.id);
  if (openSessionIds.length > 0) {
    const { data: sessionOrdersData } = await supabase
      .from("orders")
      .select("id, table_id, table_session_id, created_at")
      .eq("restaurant_id", restaurantId)
      .in("table_session_id", openSessionIds);

    for (const order of (sessionOrdersData ?? []) as {
      id: string;
      table_id: string;
      table_session_id: string;
      created_at: string;
    }[]) {
      const entry = entryFor(order.table_id);
      entry.sessionOrderCount += 1;
      if (!entry.latestOrderAt || order.created_at > entry.latestOrderAt) {
        entry.latestOrderAt = order.created_at;
      }
    }
  }

  return byTable;
}
