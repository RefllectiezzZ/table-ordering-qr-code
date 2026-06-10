import { CLOSED_ORDER_STATUSES, OPEN_ORDER_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/types/database";

/**
 * URL-persisted filters for the restaurant orders page.
 *
 * The client writes filters into the query string; the server re-parses them
 * here with strict validation before they reach any database query. Dates
 * travel as full ISO-8601 instants (the browser converts the staff member's
 * local date/time inputs), so no timezone guessing happens server-side.
 */

export const ORDER_VIEWS = ["open", "pending", "today", "24h", "all", "custom"] as const;
export type OrdersView = (typeof ORDER_VIEWS)[number];

export interface OrdersFilter {
  view: OrdersView;
  /** Validated ISO instants (only set for the custom view). */
  fromIso: string | null;
  toIso: string | null;
}

export const DEFAULT_ORDERS_FILTER: OrdersFilter = {
  view: "open",
  fromIso: null,
  toIso: null,
};

/** Statuses fetched for each view; null = no status restriction. */
export function statusesForView(view: OrdersView): OrderStatus[] | null {
  switch (view) {
    case "open":
      // Kitchen default: confirmed open orders + the pending queue (rendered
      // in its own reception section, never as kitchen-ready).
      return ["pending_confirmation", ...OPEN_ORDER_STATUSES];
    case "pending":
      return ["pending_confirmation"];
    default:
      return null;
  }
}

const MAX_RANGE_DAYS = 92;

/** Strictly parses an ISO-8601 instant; returns null for anything dubious. */
export function parseIsoInstant(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return null;
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  // Reject absurd values (keeps indexes happy, avoids year-9999 abuse).
  const now = Date.now();
  if (ms < now - 5 * 365 * 24 * 60 * 60 * 1000) return null;
  if (ms > now + 24 * 60 * 60 * 1000) return null;
  return new Date(ms).toISOString();
}

/**
 * Parses query params into a safe filter. Unknown views fall back to the
 * kitchen default; invalid dates are dropped; inverted/oversized ranges are
 * normalized.
 */
export function parseOrdersFilter(params: {
  view?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): OrdersFilter {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const rawView = first(params.view);
  let fromIso = parseIsoInstant(first(params.from));
  let toIso = parseIsoInstant(first(params.to));

  let view: OrdersView =
    rawView && (ORDER_VIEWS as readonly string[]).includes(rawView)
      ? (rawView as OrdersView)
      : "open";

  if (view === "custom" && !fromIso && !toIso) view = "open";
  if (view !== "custom") {
    fromIso = null;
    toIso = null;
  }

  if (fromIso && toIso && Date.parse(fromIso) > Date.parse(toIso)) {
    [fromIso, toIso] = [toIso, fromIso];
  }
  if (fromIso && toIso) {
    const spanMs = Date.parse(toIso) - Date.parse(fromIso);
    if (spanMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      fromIso = new Date(Date.parse(toIso) - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  return { view, fromIso, toIso };
}

/**
 * Time floor applied per view (UTC instants). "today" uses the Europe/Lisbon
 * day start: the product targets restaurants in Portugal and the kitchen's
 * notion of "today" should follow the local clock, not UTC.
 */
export function viewTimeFloor(view: OrdersView, now: Date = new Date()): string | null {
  switch (view) {
    case "today":
      return startOfDayInTimeZone(now, "Europe/Lisbon").toISOString();
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

/**
 * UTC instant of midnight (00:00) of `now`'s calendar day in `timeZone`.
 * Two-pass offset correction handles DST safely without any tz library.
 */
export function startOfDayInTimeZone(now: Date, timeZone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const partsOf = (date: Date) => {
    const map: Record<string, number> = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== "literal") map[part.type] = Number(part.value);
    }
    return map;
  };

  const today = partsOf(now);
  // First guess: local midnight equals UTC midnight.
  let guess = new Date(Date.UTC(today.year, today.month - 1, today.day, 0, 0, 0, 0));
  for (let i = 0; i < 3; i += 1) {
    const seen = partsOf(guess);
    const wantMs = Date.UTC(today.year, today.month - 1, today.day, 0, 0);
    const seenMs = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour % 24, seen.minute);
    const diff = seenMs - wantMs;
    if (diff === 0) break;
    guess = new Date(guess.getTime() - diff);
  }
  return guess;
}

/** True when an order status belongs to the history (low-prominence) bucket. */
export function isClosedStatus(status: OrderStatus): boolean {
  return (CLOSED_ORDER_STATUSES as string[]).includes(status);
}
