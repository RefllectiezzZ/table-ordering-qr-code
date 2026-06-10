import "server-only";

import { orderShortCode } from "@/lib/orders";
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
  status: OrderStatus;
  customerNote: string | null;
  createdAt: string;
  tableNumber: string;
  tableLabel: string | null;
  totalCents: number;
  items: DashboardOrderItem[];
}

interface OrderQueryRow {
  id: string;
  status: OrderStatus;
  customer_note: string | null;
  created_at: string;
  restaurant_tables: { table_number: string; label: string | null } | null;
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
 * Loads the kitchen order board for one restaurant: every open order plus
 * everything from the last 24 hours. Runs on the user-scoped client, so RLS
 * enforces tenant isolation on top of the explicit restaurant_id filter.
 */
export async function fetchDashboardOrders(
  supabase: SupabaseServerClient,
  restaurantId: string,
  defaultLanguage: Language,
): Promise<DashboardOrder[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, customer_note, created_at,
       restaurant_tables(table_number, label),
       order_items(id, product_id, quantity, unit_price_cents, item_note,
         menu_products(menu_product_translations(language, name)))`,
    )
    .eq("restaurant_id", restaurantId)
    .or(`status.in.(new,preparing,ready),created_at.gte.${since}`)
    .order("created_at", { ascending: false })
    .limit(200);

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
      status: order.status,
      customerNote: order.customer_note,
      createdAt: order.created_at,
      tableNumber: order.restaurant_tables?.table_number ?? "?",
      tableLabel: order.restaurant_tables?.label ?? null,
      totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
      items,
    };
  });
}
