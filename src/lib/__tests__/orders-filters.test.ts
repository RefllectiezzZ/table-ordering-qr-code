import { describe, expect, it } from "vitest";
import {
  ordersFilterQueryString,
  parseIsoInstant,
  parseOrdersFilter,
  startOfDayInTimeZone,
  statusesForBoard,
  rangeTimeFloor,
} from "@/lib/orders-filters";

describe("parseIsoInstant", () => {
  it("accepts a valid recent ISO instant", () => {
    const iso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(parseIsoInstant(iso)).toBe(iso);
  });

  it("rejects malformed values", () => {
    expect(parseIsoInstant("2026-06-10")).toBeNull();
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
  it("defaults to the kitchen board with open range", () => {
    expect(parseOrdersFilter({})).toEqual({
      board: "kitchen",
      range: "open",
      fromIso: null,
      toIso: null,
    });
    expect(parseOrdersFilter({ view: "garbage" }).board).toBe("kitchen");
  });

  it("parses kitchen and staff board views", () => {
    expect(parseOrdersFilter({ view: "kitchen" }).board).toBe("kitchen");
    expect(parseOrdersFilter({ view: "staff" }).board).toBe("staff");
    expect(parseOrdersFilter({ view: "history" }).board).toBe("history");
  });

  it("maps legacy pending view to staff board", () => {
    const filter = parseOrdersFilter({ view: "pending" });
    expect(filter.board).toBe("staff");
    expect(filter.range).toBe("open");
  });

  it("accepts range param alongside board view", () => {
    const filter = parseOrdersFilter({ view: "kitchen", range: "today" });
    expect(filter.board).toBe("kitchen");
    expect(filter.range).toBe("today");
    expect(filter.fromIso).toBeNull();
  });

  it("keeps validated custom ranges and normalizes inverted ones", () => {
    const early = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const late = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const filter = parseOrdersFilter({ range: "custom", from: late, to: early });
    expect(filter.range).toBe("custom");
    expect(filter.fromIso).toBe(early);
    expect(filter.toIso).toBe(late);
  });

  it("falls back to open range when custom has no valid dates", () => {
    expect(parseOrdersFilter({ range: "custom", from: "junk" }).range).toBe("open");
  });
});

describe("ordersFilterQueryString", () => {
  it("omits default kitchen/open params", () => {
    expect(ordersFilterQueryString({ board: "kitchen", range: "open", fromIso: null, toIso: null })).toBe("");
  });

  it("includes staff view in the query string", () => {
    expect(
      ordersFilterQueryString({ board: "staff", range: "open", fromIso: null, toIso: null }),
    ).toBe("?view=staff");
  });
});

describe("statusesForBoard", () => {
  it("kitchen excludes pending confirmation", () => {
    expect(statusesForBoard("kitchen")).toEqual(["new", "preparing", "ready"]);
  });

  it("staff focuses on pending confirmation", () => {
    expect(statusesForBoard("staff")).toContain("pending_confirmation");
    expect(statusesForBoard("staff")).not.toContain("new");
  });
});

describe("rangeTimeFloor", () => {
  it("returns a floor 24h back for the 24h range", () => {
    const now = new Date("2026-06-10T15:00:00Z");
    expect(rangeTimeFloor("24h", now)).toBe("2026-06-09T15:00:00.000Z");
  });

  it("returns null for the open range", () => {
    expect(rangeTimeFloor("open")).toBeNull();
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
});
