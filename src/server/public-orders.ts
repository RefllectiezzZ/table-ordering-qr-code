import "server-only";

import { evaluateOpeningHours } from "@/lib/opening-hours";
import { buildOrderItems, type OrderableProduct } from "@/lib/order-items";
import { OPEN_ORDER_STATUSES, orderShortCode } from "@/lib/orders";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { fetchOpeningHours } from "@/server/opening-hours";
import {
  issueSessionTokenForOrder,
  validateSessionToken,
} from "@/server/table-sessions";
import type { PublicOrderInput } from "@/lib/validation/schemas";
import type { OrderStatus } from "@/types/database";
import type { PublicOrderSummary } from "@/types/public-menu";

export type CreatePublicOrderResult =
  | {
      ok: true;
      order: PublicOrderSummary;
      deduplicated: boolean;
      /**
       * True when the client sent a session_token that no longer authorizes
       * orders (session closed / token expired). The order was still created
       * as pending_confirmation; the client should drop its stored token and
       * explain that the previous table session ended.
       */
      sessionEnded: boolean;
    }
  | {
      ok: false;
      status: number;
      code:
        | "invalid_token"
        | "table_inactive"
        | "restaurant_unavailable"
        | "orders_paused"
        | "restaurant_closed"
        | "unknown_product"
        | "unavailable_product"
        | "invalid_quantity"
        | "empty_order"
        | "internal_error";
      /** Optional restaurant-authored message (only for orders_paused). */
      message?: string | null;
    };

interface InsertedOrderRow {
  id: string;
  status: OrderStatus;
  order_number: number | null;
  created_at: string;
}

/**
 * Creates a public order from a QR token. Security invariants enforced here:
 *
 *  - restaurant and table are derived ONLY from the token (never from input),
 *  - suspended/draft restaurants and inactive tables are rejected,
 *  - paused restaurants (accepts_orders = false) reject new orders,
 *  - orders outside the configured opening hours are rejected server-side
 *    (restaurant_closed), evaluated in the restaurant's timezone; a
 *    restaurant without configured hours keeps accepting orders,
 *  - products must belong to the token's restaurant and be active+available,
 *  - unit prices are read from the database, never from the client,
 *  - (restaurant_id, client_order_token) is unique, so retries are idempotent,
 *  - a valid browser authorization (session_token) routes the order straight
 *    to the kitchen ("new") attached to the open table session; without one
 *    the order starts as "pending_confirmation" and is NEVER kitchen-ready
 *    until staff confirms it.
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
    .select("id, status, accepts_orders, paused_message, timezone")
    .eq("id", table.restaurant_id)
    .maybeSingle<{
      id: string;
      status: string;
      accepts_orders: boolean;
      paused_message: string | null;
      timezone: string;
    }>();

  if (!restaurant || restaurant.status !== "active") {
    return { ok: false, status: 409, code: "restaurant_unavailable" };
  }
  if (!restaurant.accepts_orders) {
    return {
      ok: false,
      status: 409,
      code: "orders_paused",
      message: restaurant.paused_message,
    };
  }

  // Opening hours: evaluated server-side in the restaurant's timezone. The
  // client's disabled button is cosmetic; this check is the real gate. A
  // restaurant with no configured schedule keeps accepting orders.
  const openingHours = await fetchOpeningHours(supabase, restaurant.id);
  const opening = evaluateOpeningHours(openingHours, new Date(), restaurant.timezone);
  if (opening.configured && !opening.isOpenNow) {
    return { ok: false, status: 409, code: "restaurant_closed" };
  }

  // Idempotency: if this client token was already used for this restaurant,
  // return the existing order instead of creating a duplicate.
  const existing = await findExistingOrder(supabase, restaurant.id, input.client_order_token);
  if (existing) return { ok: true, order: existing, deduplicated: true, sessionEnded: false };

  // Browser authorization: a valid token for an open session on THIS table
  // sends the order straight to the kitchen. Anything else (absent, expired,
  // revoked, wrong table) degrades to pending_confirmation.
  let tableSessionId: string | null = null;
  let sessionEnded = false;
  if (input.session_token) {
    const valid = await validateSessionToken(
      supabase,
      restaurant.id,
      table.id,
      input.session_token,
    );
    if (valid) {
      tableSessionId = valid.sessionId;
    } else {
      sessionEnded = true;
    }
  }
  const initialStatus: OrderStatus = tableSessionId ? "new" : "pending_confirmation";

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
      table_session_id: tableSessionId,
      status: initialStatus,
      customer_note: input.customer_note,
      client_order_token: input.client_order_token,
    })
    .select("id, status, order_number, created_at")
    .single<InsertedOrderRow>();

  if (orderError || !order) {
    // 23505 = unique violation -> a concurrent retry won the race; return it.
    if (orderError?.code === "23505") {
      const racedOrder = await findExistingOrder(
        supabase,
        restaurant.id,
        input.client_order_token,
      );
      if (racedOrder) {
        return { ok: true, order: racedOrder, deduplicated: true, sessionEnded: false };
      }
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
    sessionEnded,
    order: {
      orderId: order.id,
      shortCode: orderShortCode(order.id),
      orderNumber: order.order_number,
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
    .select(
      "id, status, order_number, created_at, order_items(quantity, unit_price_cents)",
    )
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
    orderNumber: existingOrder.order_number,
    status: existingOrder.status,
    totalCents,
    createdAt: existingOrder.created_at,
  };
}

export type PublicOrderStatusResult =
  | { ok: false; status: number; code: "invalid_token" | "order_not_found" }
  | {
      ok: true;
      order: {
        orderId: string;
        shortCode: string;
        orderNumber: number | null;
        status: OrderStatus;
      };
      /**
       * Raw browser authorization, present at most ONCE: on the first poll
       * after staff confirmed this device's first order. The device stores it
       * and sends it with subsequent orders during the same table session.
       */
      sessionToken: string | null;
    };

/**
 * Public order status poll for /t/[token].
 *
 * Authorization model: the caller must present BOTH the table's QR token and
 * the order's client_order_token. The client token is a random UUID generated
 * by the ordering device and known only to it, so only the device that placed
 * the order can read its status or receive the session authorization.
 */
export async function getPublicOrderStatus(
  tableToken: string,
  clientOrderToken: string,
): Promise<PublicOrderStatusResult> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, status")
    .eq("public_token", tableToken)
    .maybeSingle<{ id: string; restaurant_id: string; status: string }>();

  if (!table) return { ok: false, status: 404, code: "invalid_token" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, restaurant_id, table_id, table_session_id, status, order_number")
    .eq("restaurant_id", table.restaurant_id)
    .eq("client_order_token", clientOrderToken)
    .maybeSingle<{
      id: string;
      restaurant_id: string;
      table_id: string;
      table_session_id: string | null;
      status: OrderStatus;
      order_number: number | null;
    }>();

  // The order must belong to the same table the QR token points at.
  if (!order || order.table_id !== table.id) {
    return { ok: false, status: 404, code: "order_not_found" };
  }

  // Lazily issue the browser authorization the first time the device polls a
  // confirmed order that is attached to a still-open session. The raw token
  // is generated here and never persisted; replays get null.
  let sessionToken: string | null = null;
  const isConfirmedOpen = (OPEN_ORDER_STATUSES as string[]).includes(order.status);
  if (isConfirmedOpen && order.table_session_id) {
    const { data: session } = await supabase
      .from("table_sessions")
      .select("id, status")
      .eq("id", order.table_session_id)
      .eq("restaurant_id", order.restaurant_id)
      .eq("status", "open")
      .maybeSingle<{ id: string; status: string }>();

    if (session) {
      sessionToken = await issueSessionTokenForOrder(supabase, {
        id: order.id,
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        table_session_id: order.table_session_id,
      });
    }
  }

  return {
    ok: true,
    order: {
      orderId: order.id,
      shortCode: orderShortCode(order.id),
      orderNumber: order.order_number,
      status: order.status,
    },
    sessionToken,
  };
}
