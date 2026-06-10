import { describe, expect, it } from "vitest";
import {
  parseIsoInstant,
  parseOrdersFilter,
  startOfDayInTimeZone,
  statusesForView,
  viewTimeFloor,
} from "@/lib/orders-filters";

describe("parseIsoInstant", () => {
  it("accepts a valid recent ISO instant", () => {
    const iso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(parseIsoInstant(iso)).toBe(iso);
  });

  it("rejects malformed values", () => {
    expect(parseIsoInstant("2026-06-10")).toBeNull(); // date only
    expect(parseIsoInstant("not-a-date")).toBeNull();
    expect(parseIsoInstant("")).toBeNull();
    expect(parseIsoInstant(undefined)).toBeNull();
    expect(parseIsoInstant("2026-06-10T12:00:00.000Z; drop table")).toBeNull();
  });

  it("rejects absurd past/future values", () => {
    expect(parseIsoInstant("1990-01-01T00:00:00Z")).toBeNull();
    expect(parseIsoInstant("9999-01-01T00:00:00Z")).toBeNull();
  });
});

describe("parseOrdersFilter", () => {
  it("defaults to the kitchen view", () => {
    expect(parseOrdersFilter({})).toEqual({ view: "open", fromIso: null, toIso: null });
    expect(parseOrdersFilter({ view: "garbage" }).view).toBe("open");
  });

  it("accepts quick views and drops stray dates for them", () => {
    const from = new Date().toISOString();
    const filter = parseOrdersFilter({ view: "today", from });
    expect(filter.view).toBe("today");
    expect(filter.fromIso).toBeNull();
  });

  it("keeps validated custom ranges and normalizes inverted ones", () => {
    const early = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const late = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const filter = parseOrdersFilter({ view: "custom", from: late, to: early });
    expect(filter.view).toBe("custom");
    expect(filter.fromIso).toBe(early);
    expect(filter.toIso).toBe(late);
  });

  it("falls back to open when custom has no valid dates", () => {
    expect(parseOrdersFilter({ view: "custom", from: "junk" }).view).toBe("open");
  });

  it("takes the first value of repeated params", () => {
    expect(parseOrdersFilter({ view: ["pending", "all"] }).view).toBe("pending");
  });
});

describe("statusesForView", () => {
  it("includes the pending queue in the default kitchen view", () => {
    expect(statusesForView("open")).toEqual([
      "pending_confirmation",
      "new",
      "preparing",
      "ready",
    ]);
  });

  it("restricts the pending view", () => {
    expect(statusesForView("pending")).toEqual(["pending_confirmation"]);
  });

  it("does not restrict time-based or all views", () => {
    expect(statusesForView("today")).toBeNull();
    expect(statusesForView("24h")).toBeNull();
    expect(statusesForView("all")).toBeNull();
    expect(statusesForView("custom")).toBeNull();
  });
});

describe("viewTimeFloor", () => {
  it("returns a floor 24h back for the 24h view", () => {
    const now = new Date("2026-06-10T15:00:00Z");
    expect(viewTimeFloor("24h", now)).toBe("2026-06-09T15:00:00.000Z");
  });

  it("returns null for status-only views", () => {
    expect(viewTimeFloor("open")).toBeNull();
    expect(viewTimeFloor("pending")).toBeNull();
  });
});

describe("startOfDayInTimeZone", () => {
  it("computes Lisbon midnight in summer (UTC+1)", () => {
    const now = new Date("2026-06-10T15:00:00Z");
    const start = startOfDayInTimeZone(now, "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-06-09T23:00:00.000Z");
  });

  it("computes Lisbon midnight in winter (UTC+0)", () => {
    const now = new Date("2026-01-10T15:00:00Z");
    const start = startOfDayInTimeZone(now, "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-01-10T00:00:00.000Z");
  });

  it("handles timezones east of UTC", () => {
    // At 15:00Z it is exactly midnight (June 11) in Tokyo (UTC+9), so the
    // start of "today" there is that very instant.
    const now = new Date("2026-06-10T15:00:00Z");
    const start = startOfDayInTimeZone(now, "Asia/Tokyo");
    expect(start.toISOString()).toBe("2026-06-10T15:00:00.000Z");
  });
});
