import { describe, expect, it } from "vitest";
import { buildOrderItems, type OrderableProduct } from "@/lib/order-items";

const RESTAURANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RESTAURANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const products: OrderableProduct[] = [
  {
    id: "p1",
    restaurant_id: RESTAURANT_A,
    price_cents: 350,
    is_active: true,
    is_available: true,
  },
  {
    id: "p2",
    restaurant_id: RESTAURANT_A,
    price_cents: 220,
    is_active: true,
    is_available: false,
  },
  {
    id: "p3",
    restaurant_id: RESTAURANT_A,
    price_cents: 650,
    is_active: false,
    is_available: true,
  },
  {
    id: "p-other-tenant",
    restaurant_id: RESTAURANT_B,
    price_cents: 100,
    is_active: true,
    is_available: true,
  },
];

describe("buildOrderItems", () => {
  it("prices items from the database rows, never from the request", () => {
    const result = buildOrderItems(
      [{ product_id: "p1", quantity: 2, item_note: " extra quente " }],
      products,
      RESTAURANT_A,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items[0].unit_price_cents).toBe(350);
    expect(result.items[0].item_note).toBe("extra quente");
    expect(result.totalCents).toBe(700);
  });

  it("rejects products that belong to another restaurant", () => {
    const result = buildOrderItems(
      [{ product_id: "p-other-tenant", quantity: 1 }],
      products,
      RESTAURANT_A,
    );
    expect(result).toEqual({ ok: false, code: "unknown_product" });
  });

  it("rejects unknown products", () => {
    const result = buildOrderItems([{ product_id: "ghost", quantity: 1 }], products, RESTAURANT_A);
    expect(result).toEqual({ ok: false, code: "unknown_product" });
  });

  it("rejects unavailable and inactive products", () => {
    expect(buildOrderItems([{ product_id: "p2", quantity: 1 }], products, RESTAURANT_A)).toEqual({
      ok: false,
      code: "unavailable_product",
    });
    expect(buildOrderItems([{ product_id: "p3", quantity: 1 }], products, RESTAURANT_A)).toEqual({
      ok: false,
      code: "unavailable_product",
    });
  });

  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, 51]) {
      expect(
        buildOrderItems([{ product_id: "p1", quantity }], products, RESTAURANT_A),
      ).toEqual({ ok: false, code: "invalid_quantity" });
    }
  });

  it("rejects empty orders", () => {
    expect(buildOrderItems([], products, RESTAURANT_A)).toEqual({
      ok: false,
      code: "empty_order",
    });
  });

  it("sums totals across multiple lines", () => {
    const result = buildOrderItems(
      [
        { product_id: "p1", quantity: 2 },
        { product_id: "p1", quantity: 1, item_note: "sem açúcar" },
      ],
      products,
      RESTAURANT_A,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalCents).toBe(1050);
    expect(result.items).toHaveLength(2);
  });
});
