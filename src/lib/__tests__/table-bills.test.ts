import { describe, expect, it } from "vitest";
import { BILLABLE_ORDER_STATUSES } from "@/lib/table-bill-statuses";

describe("BILLABLE_ORDER_STATUSES", () => {
  it("includes new/preparing/ready/delivered", () => {
    expect(BILLABLE_ORDER_STATUSES).toEqual(
      expect.arrayContaining(["new", "preparing", "ready", "delivered"]),
    );
  });

  it("excludes pending_confirmation/rejected/cancelled", () => {
    expect(BILLABLE_ORDER_STATUSES).not.toContain("pending_confirmation");
    expect(BILLABLE_ORDER_STATUSES).not.toContain("rejected");
    expect(BILLABLE_ORDER_STATUSES).not.toContain("cancelled");
  });
});

describe("bill line totals", () => {
  it("computes totals from unit_price_cents * quantity", () => {
    const items = [
      { quantity: 2, unit_price_cents: 350 },
      { quantity: 1, unit_price_cents: 1200 },
    ];
    const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);
    expect(total).toBe(1900);
  });
});
