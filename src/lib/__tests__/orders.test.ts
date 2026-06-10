import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  canTransitionOrderStatus,
  isOrderStatus,
  nextStatuses,
  orderShortCode,
} from "@/lib/orders";

describe("order status transitions", () => {
  it("allows the forward kitchen flow", () => {
    expect(canTransitionOrderStatus("new", "preparing")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "ready")).toBe(true);
    expect(canTransitionOrderStatus("ready", "delivered")).toBe(true);
  });

  it("allows cancellation from open states", () => {
    expect(canTransitionOrderStatus("new", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("ready", "cancelled")).toBe(true);
  });

  it("treats delivered and cancelled as terminal", () => {
    for (const target of ORDER_STATUSES) {
      expect(canTransitionOrderStatus("delivered", target)).toBe(false);
      expect(canTransitionOrderStatus("cancelled", target)).toBe(false);
    }
  });

  it("does not allow going backwards", () => {
    expect(canTransitionOrderStatus("ready", "preparing")).toBe(false);
    expect(canTransitionOrderStatus("preparing", "new")).toBe(false);
  });

  it("exposes next statuses for the UI", () => {
    expect(nextStatuses("new")).toContain("preparing");
    expect(nextStatuses("delivered")).toEqual([]);
  });
});

describe("isOrderStatus", () => {
  it("validates status strings", () => {
    expect(isOrderStatus("new")).toBe(true);
    expect(isOrderStatus("NEW")).toBe(false);
    expect(isOrderStatus("shipped")).toBe(false);
  });
});

describe("orderShortCode", () => {
  it("derives a 6-char uppercase code", () => {
    expect(orderShortCode("a1b2c3d4-e5f6-4a0a-8b1c-d2e3f4a5b6c7")).toBe("A1B2C3");
  });
});
