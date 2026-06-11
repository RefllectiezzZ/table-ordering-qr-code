import { describe, expect, it } from "vitest";
import {
  CLEANUP_ORDER_STATUSES,
  isValidRetentionDays,
  retentionCutoffIso,
} from "@/lib/maintenance/orders-cleanup";

describe("orders retention cleanup helpers", () => {
  it("only includes terminal statuses", () => {
    expect(CLEANUP_ORDER_STATUSES).toEqual(["delivered", "cancelled", "rejected"]);
    expect(CLEANUP_ORDER_STATUSES).not.toContain("new");
    expect(CLEANUP_ORDER_STATUSES).not.toContain("pending_confirmation");
  });

  it("enforces minimum 30 retention days", () => {
    expect(isValidRetentionDays(30)).toBe(true);
    expect(isValidRetentionDays(60)).toBe(true);
    expect(isValidRetentionDays(29)).toBe(false);
    expect(isValidRetentionDays(7)).toBe(false);
  });

  it("computes cutoff strictly before now", () => {
    const now = new Date("2026-06-11T12:00:00.000Z");
    const cutoff = retentionCutoffIso(30, now);
    expect(cutoff).toBe("2026-05-12T12:00:00.000Z");
    expect(new Date(cutoff).getTime()).toBeLessThan(now.getTime());
  });
});
