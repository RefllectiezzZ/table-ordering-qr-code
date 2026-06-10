/**
 * Opening hours evaluation, shared by the dashboard, the admin area and the
 * public order flow.
 *
 * Model (MVP):
 *   * one interval per weekday (0 = Sunday ... 6 = Saturday) or a closed day,
 *   * overnight intervals supported: closesAt <= opensAt means the interval
 *     spills past midnight into the NEXT day (e.g. 18:00 -> 02:00),
 *   * no rows configured at all = "not configured" -> orders stay allowed,
 *   * evaluation happens in the restaurant's IANA timezone (default
 *     Europe/Lisbon); the customer's device clock is never trusted.
 *
 * Pure functions, unit-tested, no database access.
 */

export const DEFAULT_RESTAURANT_TIMEZONE = "Europe/Lisbon";

export interface OpeningHourDay {
  /** 0 = Sunday ... 6 = Saturday (matches Date#getDay). */
  weekday: number;
  isClosed: boolean;
  /** "HH:MM" or "HH:MM:SS". Null only for closed days. */
  opensAt: string | null;
  closesAt: string | null;
  notes?: string | null;
}

export interface LocalClock {
  /** 0 = Sunday ... 6 = Saturday in the target timezone. */
  weekday: number;
  /** Minutes since local midnight (0..1439). */
  minutes: number;
}

export interface OpeningEvaluation {
  /** True when at least one weekday row exists. */
  configured: boolean;
  /** Always true while not configured (orders stay allowed). */
  isOpenNow: boolean;
  /** Today's schedule; null when not configured. */
  today: { isClosed: boolean; opensAt: string | null; closesAt: string | null } | null;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Parses "HH:MM" / "HH:MM:SS" into minutes since midnight; null if invalid. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Normalizes "HH:MM:SS" / "HH:MM" to "HH:MM" for display; null if invalid. */
export function formatTimeHHMM(value: string | null | undefined): string | null {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return null;
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Weekday + minutes-since-midnight of `now` in the given timezone. Falls back
 * to Europe/Lisbon when the timezone string is unknown to the runtime.
 */
export function localClock(now: Date, timeZone: string): LocalClock {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: DEFAULT_RESTAURANT_TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }

  let weekday = 0;
  let hour = 0;
  let minute = 0;
  for (const part of formatter.formatToParts(now)) {
    if (part.type === "weekday") weekday = WEEKDAY_INDEX[part.value] ?? 0;
    // "h23" still reports "24" for midnight in some runtimes; normalize.
    if (part.type === "hour") hour = Number(part.value) % 24;
    if (part.type === "minute") minute = Number(part.value);
  }
  return { weekday, minutes: hour * 60 + minute };
}

function dayByWeekday(
  hours: OpeningHourDay[],
  weekday: number,
): OpeningHourDay | undefined {
  return hours.find((day) => day.weekday === weekday);
}

/**
 * Whether the schedule is open at the given local clock. Boundary semantics:
 * open at exactly opensAt (inclusive), closed at exactly closesAt (exclusive),
 * i.e. the interval is [opensAt, closesAt).
 */
export function isOpenAtClock(hours: OpeningHourDay[], clock: LocalClock): boolean {
  const today = dayByWeekday(hours, clock.weekday);
  if (today && !today.isClosed) {
    const opens = parseTimeToMinutes(today.opensAt);
    const closes = parseTimeToMinutes(today.closesAt);
    if (opens !== null && closes !== null) {
      if (opens < closes) {
        if (clock.minutes >= opens && clock.minutes < closes) return true;
      } else {
        // Overnight: open from opensAt until midnight (spill handled below
        // from the next day's perspective).
        if (clock.minutes >= opens) return true;
      }
    }
  }

  // Yesterday's overnight interval can spill into the early hours of today.
  const yesterday = dayByWeekday(hours, (clock.weekday + 6) % 7);
  if (yesterday && !yesterday.isClosed) {
    const opens = parseTimeToMinutes(yesterday.opensAt);
    const closes = parseTimeToMinutes(yesterday.closesAt);
    if (opens !== null && closes !== null && closes <= opens && clock.minutes < closes) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates the configured schedule at `now` in the restaurant's timezone.
 * An empty schedule means "not configured": orders stay allowed and only the
 * dashboard/admin surfaces show a notice.
 */
export function evaluateOpeningHours(
  hours: OpeningHourDay[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_RESTAURANT_TIMEZONE,
): OpeningEvaluation {
  if (hours.length === 0) {
    return { configured: false, isOpenNow: true, today: null };
  }

  const clock = localClock(now, timeZone);
  const today = dayByWeekday(hours, clock.weekday);

  return {
    configured: true,
    isOpenNow: isOpenAtClock(hours, clock),
    today: today
      ? {
          isClosed: today.isClosed,
          opensAt: formatTimeHHMM(today.opensAt),
          closesAt: formatTimeHHMM(today.closesAt),
        }
      : // Day without a row on a configured schedule counts as closed.
        { isClosed: true, opensAt: null, closesAt: null },
  };
}

/**
 * Compact "today" summary for dashboard/admin lists:
 *   "09:00–22:00" | "closed" | "not_configured"
 */
export type TodaySummary =
  | { kind: "not_configured" }
  | { kind: "closed" }
  | { kind: "open"; opensAt: string; closesAt: string };

export function summarizeToday(
  hours: OpeningHourDay[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_RESTAURANT_TIMEZONE,
): TodaySummary {
  const evaluation = evaluateOpeningHours(hours, now, timeZone);
  if (!evaluation.configured || !evaluation.today) return { kind: "not_configured" };
  if (evaluation.today.isClosed || !evaluation.today.opensAt || !evaluation.today.closesAt) {
    return { kind: "closed" };
  }
  return {
    kind: "open",
    opensAt: evaluation.today.opensAt,
    closesAt: evaluation.today.closesAt,
  };
}

/** Maps a DB row shape (snake_case) to the evaluation shape. */
export function openingHourFromRow(row: {
  weekday: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
  notes?: string | null;
}): OpeningHourDay {
  return {
    weekday: row.weekday,
    isClosed: row.is_closed,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    notes: row.notes ?? null,
  };
}
