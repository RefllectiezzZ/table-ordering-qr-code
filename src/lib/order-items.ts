/**
 * Pure order-building logic, extracted so the security-critical rules are
 * unit-testable without a database:
 *
 *  - every ordered product must belong to the token's restaurant,
 *  - inactive/unavailable products cannot be ordered,
 *  - unit prices ALWAYS come from the database rows, never from the client.
 */

export interface OrderableProduct {
  id: string;
  restaurant_id: string;
  price_cents: number;
  is_active: boolean;
  is_available: boolean;
}

export interface RequestedItem {
  product_id: string;
  quantity: number;
  item_note?: string | null;
}

export interface BuiltOrderItem {
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  item_note: string | null;
}

export type BuildOrderItemsResult =
  | { ok: true; items: BuiltOrderItem[]; totalCents: number }
  | { ok: false; code: "unknown_product" | "unavailable_product" | "invalid_quantity" | "empty_order" };

export function buildOrderItems(
  requested: RequestedItem[],
  products: OrderableProduct[],
  restaurantId: string,
): BuildOrderItemsResult {
  if (requested.length === 0) {
    return { ok: false, code: "empty_order" };
  }

  const productById = new Map(
    products.filter((p) => p.restaurant_id === restaurantId).map((p) => [p.id, p]),
  );

  const items: BuiltOrderItem[] = [];
  let totalCents = 0;

  for (const entry of requested) {
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0 || entry.quantity > 50) {
      return { ok: false, code: "invalid_quantity" };
    }

    const product = productById.get(entry.product_id);
    if (!product) {
      // Either does not exist or belongs to another restaurant — same answer,
      // so nothing can be inferred about other tenants.
      return { ok: false, code: "unknown_product" };
    }
    if (!product.is_active || !product.is_available) {
      return { ok: false, code: "unavailable_product" };
    }

    const item: BuiltOrderItem = {
      product_id: product.id,
      quantity: entry.quantity,
      unit_price_cents: product.price_cents,
      item_note: entry.item_note?.trim() ? entry.item_note.trim() : null,
    };
    items.push(item);
    totalCents += item.unit_price_cents * item.quantity;
  }

  return { ok: true, items, totalCents };
}
