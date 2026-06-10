import "server-only";

import { buildOrderItems, type OrderableProduct } from "@/lib/order-items";
import { orderShortCode } from "@/lib/orders";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { PublicOrderInput } from "@/lib/validation/schemas";
import type { OrderStatus } from "@/types/database";
import type { PublicOrderSummary } from "@/types/public-menu";

export type CreatePublicOrderResult =
  | { ok: true; order: PublicOrderSummary; deduplicated: boolean }
  | {
      ok: false;
      status: number;
      code:
        | "invalid_token"
        | "table_inactive"
        | "restaurant_unavailable"
        | "unknown_product"
        | "unavailable_product"
        | "invalid_quantity"
        | "empty_order"
        | "internal_error";
    };

interface InsertedOrderRow {
  id: string;
  status: OrderStatus;
  created_at: string;
}

/**
 * Creates a public order from a QR token. Security invariants enforced here:
 *
 *  - restaurant and table are derived ONLY from the token (never from input),
 *  - suspended/draft restaurants and inactive tables are rejected,
 *  - products must belong to the token's restaurant and be active+available,
 *  - unit prices are read from the database, never from the client,
 *  - (restaurant_id, client_order_token) is unique, so retries are idempotent.
 */
export async function createPublicOrder(
  input: PublicOrderInput,
): Promise<CreatePublicOrderResult> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, status")
    .eq("public_token", input.table_token)
    .maybeSingle<{ id: string; restaurant_id: string; status: string }>();

  if (!table) return { ok: false, status: 404, code: "invalid_token" };
  if (table.status !== "active") return { ok: false, status: 409, code: "table_inactive" };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, status")
    .eq("id", table.restaurant_id)
    .maybeSingle<{ id: string; status: string }>();

  if (!restaurant || restaurant.status !== "active") {
    return { ok: false, status: 409, code: "restaurant_unavailable" };
  }

  // Idempotency: if this client token was already used for this restaurant,
  // return the existing order instead of creating a duplicate.
  const existing = await findExistingOrder(supabase, restaurant.id, input.client_order_token);
  if (existing) return { ok: true, order: existing, deduplicated: true };

  const productIds = [...new Set(input.items.map((item) => item.product_id))];
  const { data: products } = await supabase
    .from("menu_products")
    .select("id, restaurant_id, price_cents, is_active, is_available")
    .in("id", productIds)
    .eq("restaurant_id", restaurant.id);

  const built = buildOrderItems(
    input.items,
    (products ?? []) as OrderableProduct[],
    restaurant.id,
  );
  if (!built.ok) {
    return { ok: false, status: 422, code: built.code };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      status: "new",
      customer_note: input.customer_note,
      client_order_token: input.client_order_token,
    })
    .select("id, status, created_at")
    .single<InsertedOrderRow>();

  if (orderError || !order) {
    // 23505 = unique violation -> a concurrent retry won the race; return it.
    if (orderError?.code === "23505") {
      const racedOrder = await findExistingOrder(
        supabase,
        restaurant.id,
        input.client_order_token,
      );
      if (racedOrder) return { ok: true, order: racedOrder, deduplicated: true };
    }
    console.error("public_order_insert_failed", orderError?.code);
    return { ok: false, status: 500, code: "internal_error" };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    built.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      item_note: item.item_note,
    })),
  );

  if (itemsError) {
    // Best-effort rollback so a half-written order never reaches the kitchen.
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("public_order_items_insert_failed", itemsError.code);
    return { ok: false, status: 500, code: "internal_error" };
  }

  return {
    ok: true,
    deduplicated: false,
    order: {
      orderId: order.id,
      shortCode: orderShortCode(order.id),
      status: order.status,
      totalCents: built.totalCents,
      createdAt: order.created_at,
    },
  };
}

async function findExistingOrder(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  restaurantId: string,
  clientOrderToken: string,
): Promise<PublicOrderSummary | null> {
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, status, created_at, order_items(quantity, unit_price_cents)")
    .eq("restaurant_id", restaurantId)
    .eq("client_order_token", clientOrderToken)
    .maybeSingle<
      InsertedOrderRow & { order_items: { quantity: number; unit_price_cents: number }[] }
    >();

  if (!existingOrder) return null;

  const totalCents = existingOrder.order_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  );

  return {
    orderId: existingOrder.id,
    shortCode: orderShortCode(existingOrder.id),
    status: existingOrder.status,
    totalCents,
    createdAt: existingOrder.created_at,
  };
}
