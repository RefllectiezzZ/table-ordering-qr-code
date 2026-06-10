import { describe, expect, it } from "vitest";
import {
  evaluateOpeningHours,
  formatTimeHHMM,
  isOpenAtClock,
  localClock,
  parseTimeToMinutes,
  summarizeToday,
  type OpeningHourDay,
} from "@/lib/opening-hours";

// 2026-06-10 is a Wednesday (weekday 3).
const WED_NOON_UTC = new Date("2026-06-10T12:00:00Z");

function day(
  weekday: number,
  opensAt: string | null,
  closesAt: string | null,
  isClosed = false,
): OpeningHourDay {
  return { weekday, isClosed, opensAt, closesAt };
}

describe("parseTimeToMinutes", () => {
  it("parses HH:MM and HH:MM:SS", () => {
    expect(parseTimeToMinutes("09:00")).toBe(540);
    expect(parseTimeToMinutes("09:30:00")).toBe(570);
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("rejects invalid values", () => {
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("9:00")).toBeNull();
    expect(parseTimeToMinutes("12:60")).toBeNull();
    expect(parseTimeToMinutes("")).toBeNull();
    expect(parseTimeToMinutes(null)).toBeNull();
    expect(parseTimeToMinutes("garbage")).toBeNull();
  });
});

describe("formatTimeHHMM", () => {
  it("normalizes Postgres time values for display", () => {
    expect(formatTimeHHMM("09:00:00")).toBe("09:00");
    expect(formatTimeHHMM("22:30")).toBe("22:30");
    expect(formatTimeHHMM(null)).toBeNull();
  });
});

describe("localClock", () => {
  it("converts an instant into the restaurant's local weekday/minutes", () => {
    // 12:00 UTC on a Wednesday in June = 13:00 in Europe/Lisbon (WEST).
    const clock = localClock(WED_NOON_UTC, "Europe/Lisbon");
    expect(clock.weekday).toBe(3);
    expect(clock.minutes).toBe(13 * 60);
  });

  it("crosses the date line correctly", () => {
    // 23:30 UTC Wednesday = 00:30 Thursday in Lisbon summer time.
    const clock = localClock(new Date("2026-06-10T23:30:00Z"), "Europe/Lisbon");
    expect(clock.weekday).toBe(4);
    expect(clock.minutes).toBe(30);
  });

  it("falls back to Europe/Lisbon for unknown timezones", () => {
    const clock = localClock(WED_NOON_UTC, "Not/AZone");
    expect(clock.weekday).toBe(3);
    expect(clock.minutes).toBe(13 * 60);
  });
});

describe("isOpenAtClock", () => {
  const schedule = [day(3, "09:00", "22:00")];

  it("is open inside the interval", () => {
    expect(isOpenAtClock(schedule, { weekday: 3, minutes: 12 * 60 })).toBe(true);
  });

  it("is open at exactly the opening time and closed at exactly closing", () => {
    expect(isOpenAtClock(schedule, { weekday: 3, minutes: 9 * 60 })).toBe(true);
    expect(isOpenAtClock(schedule, { weekday: 3, minutes: 22 * 60 })).toBe(false);
    expect(isOpenAtClock(schedule, { weekday: 3, minutes: 22 * 60 - 1 })).toBe(true);
  });

  it("is closed before opening and on other days without rows", () => {
    expect(isOpenAtClock(schedule, { weekday: 3, minutes: 8 * 60 })).toBe(false);
    expect(isOpenAtClock(schedule, { weekday: 4, minutes: 12 * 60 })).toBe(false);
  });

  it("is closed on an explicitly closed day", () => {
    const closedWednesday = [day(3, null, null, true)];
    expect(isOpenAtClock(closedWednesday, { weekday: 3, minutes: 12 * 60 })).toBe(false);
  });

  it("supports overnight intervals spilling into the next day", () => {
    // Friday 18:00 -> 02:00 (Saturday morning).
    const overnight = [day(5, "18:00", "02:00")];
    expect(isOpenAtClock(overnight, { weekday: 5, minutes: 19 * 60 })).toBe(true);
    expect(isOpenAtClock(overnight, { weekday: 5, minutes: 17 * 60 })).toBe(false);
    // Saturday 01:00 still counts as Friday's interval.
    expect(isOpenAtClock(overnight, { weekday: 6, minutes: 60 })).toBe(true);
    expect(isOpenAtClock(overnight, { weekday: 6, minutes: 2 * 60 })).toBe(false);
    expect(isOpenAtClock(overnight, { weekday: 6, minutes: 12 * 60 })).toBe(false);
  });

  it("overnight spill applies even when the next day is marked closed", () => {
    const schedule2 = [day(5, "18:00", "02:00"), day(6, null, null, true)];
    expect(isOpenAtClock(schedule2, { weekday: 6, minutes: 90 })).toBe(true);
    expect(isOpenAtClock(schedule2, { weekday: 6, minutes: 3 * 60 })).toBe(false);
  });
});

describe("evaluateOpeningHours", () => {
  it("treats an empty schedule as not configured and open", () => {
    const evaluation = evaluateOpeningHours([], WED_NOON_UTC, "Europe/Lisbon");
    expect(evaluation.configured).toBe(false);
    expect(evaluation.isOpenNow).toBe(true);
    expect(evaluation.today).toBeNull();
  });

  it("evaluates a configured schedule in the restaurant timezone", () => {
    // Lisbon local time is 13:00 -> open.
    const open = evaluateOpeningHours([day(3, "09:00", "22:00")], WED_NOON_UTC, "Europe/Lisbon");
    expect(open.configured).toBe(true);
    expect(open.isOpenNow).toBe(true);
    expect(open.today).toEqual({ isClosed: false, opensAt: "09:00", closesAt: "22:00" });

    const closed = evaluateOpeningHours(
      [day(3, "14:00", "22:00")],
      WED_NOON_UTC,
      "Europe/Lisbon",
    );
    expect(closed.isOpenNow).toBe(false);
  });

  it("treats a missing weekday row on a configured schedule as closed", () => {
    const evaluation = evaluateOpeningHours(
      [day(1, "09:00", "18:00")],
      WED_NOON_UTC,
      "Europe/Lisbon",
    );
    expect(evaluation.configured).toBe(true);
    expect(evaluation.isOpenNow).toBe(false);
    expect(evaluation.today).toEqual({ isClosed: true, opensAt: null, closesAt: null });
  });
});

describe("summarizeToday", () => {
  it("reports not configured / closed / open today", () => {
    expect(summarizeToday([], WED_NOON_UTC, "Europe/Lisbon")).toEqual({
      kind: "not_configured",
    });
    expect(
      summarizeToday([day(3, null, null, true)], WED_NOON_UTC, "Europe/Lisbon"),
    ).toEqual({ kind: "closed" });
    expect(
      summarizeToday([day(3, "09:00:00", "22:00:00")], WED_NOON_UTC, "Europe/Lisbon"),
    ).toEqual({ kind: "open", opensAt: "09:00", closesAt: "22:00" });
  });
});
