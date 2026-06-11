import { describe, expect, it } from "vitest";
import {
  detectNewAlertableOrderIds,
  shouldPlayNewOrderSound,
} from "@/lib/orders-alerts";

const orders = [
  { id: "a", status: "new" as const },
  { id: "b", status: "pending_confirmation" as const },
  { id: "c", status: "preparing" as const },
];

describe("detectNewAlertableOrderIds", () => {
  it("returns empty on initial load even when orders are alertable", () => {
    expect(detectNewAlertableOrderIds(new Set(), orders, true)).toEqual([]);
  });

  it("detects new alertable IDs after initial load", () => {
    const previous = new Set(["a"]);
    expect(detectNewAlertableOrderIds(previous, orders, false)).toEqual(["b"]);
  });

  it("does not alert for preparing/delivered statuses", () => {
    const previous = new Set(["a", "b"]);
    expect(detectNewAlertableOrderIds(previous, orders, false)).toEqual([]);
  });

  it("does not re-alert the same IDs on repeated polls", () => {
    const previous = new Set(["a", "b"]);
    expect(detectNewAlertableOrderIds(previous, orders, false)).toEqual([]);
  });
});

describe("shouldPlayNewOrderSound", () => {
  it("plays when there is a new ID not yet sounded", () => {
    expect(shouldPlayNewOrderSound(["x"], new Set())).toBe(true);
  });

  it("does not play when all IDs were already sounded", () => {
    expect(shouldPlayNewOrderSound(["x"], new Set(["x"]))).toBe(false);
  });
});
