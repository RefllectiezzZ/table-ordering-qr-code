import { CLOSED_ORDER_STATUSES, OPEN_ORDER_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/types/database";

/**
 * URL-persisted filters for the restaurant orders page.
 *
 * Board tabs (kitchen / staff / history) live in `view`. Time windows live in
 * `range`. Dates travel as full ISO-8601 instants for custom ranges.
 */

export const ORDER_BOARD_VIEWS = ["kitchen", "staff", "history"] as const;
export type OrderBoardView = (typeof ORDER_BOARD_VIEWS)[number];

export const ORDER_RANGE_VIEWS = ["open", "today", "24h", "all", "custom"] as const;
export type OrderRangeView = (typeof ORDER_RANGE_VIEWS)[number];

/** @deprecated Legacy combined views — mapped for old bookmarked URLs. */
export const LEGACY_ORDER_VIEWS = ["open", "pending", "today", "24h", "all", "custom"] as const;
export type LegacyOrdersView = (typeof LEGACY_ORDER_VIEWS)[number];

export interface OrdersFilter {
  board: OrderBoardView;
  range: OrderRangeView;
  /** Validated ISO instants (only set for the custom range). */
  fromIso: string | null;
  toIso: string | null;
}

export const DEFAULT_ORDERS_FILTER: OrdersFilter = {
  board: "kitchen",
  range: "open",
  fromIso: null,
  toIso: null,
};

const LEGACY_VIEW_MAP: Record<
  LegacyOrdersView,
  Pick<OrdersFilter, "board" | "range">
> = {
  open: { board: "kitchen", range: "open" },
  pending: { board: "staff", range: "open" },
  today: { board: "kitchen", range: "today" },
  "24h": { board: "kitchen", range: "24h" },
  all: { board: "kitchen", range: "all" },
  custom: { board: "kitchen", range: "custom" },
};

/** Statuses fetched for each board tab. */
export function statusesForBoard(board: OrderBoardView): OrderStatus[] {
  switch (board) {
    case "kitchen":
      return [...OPEN_ORDER_STATUSES];
    case "staff":
      return ["pending_confirmation", "rejected", "cancelled"];
    case "history":
      return [...CLOSED_ORDER_STATUSES];
  }
}

/** @deprecated Use statusesForBoard — kept for tests migrating from the old API. */
export function statusesForView(view: LegacyOrdersView | OrderBoardView): OrderStatus[] | null {
  if ((ORDER_BOARD_VIEWS as readonly string[]).includes(view)) {
    return statusesForBoard(view as OrderBoardView);
  }
  switch (view as LegacyOrdersView) {
    case "open":
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
  const now = Date.now();
  if (ms < now - 5 * 365 * 24 * 60 * 60 * 1000) return null;
  if (ms > now + 24 * 60 * 60 * 1000) return null;
  return new Date(ms).toISOString();
}

/**
 * Parses query params into a safe filter. Unknown views fall back to kitchen;
 * invalid dates are dropped; inverted/oversized ranges are normalized.
 */
export function parseOrdersFilter(params: {
  view?: string | string[];
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): OrdersFilter {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const rawView = first(params.view);
  const rawRange = first(params.range);
  let fromIso = parseIsoInstant(first(params.from));
  let toIso = parseIsoInstant(first(params.to));

  let board: OrderBoardView = DEFAULT_ORDERS_FILTER.board;
  let range: OrderRangeView = DEFAULT_ORDERS_FILTER.range;

  if (rawView && (ORDER_BOARD_VIEWS as readonly string[]).includes(rawView)) {
    board = rawView as OrderBoardView;
  } else if (rawView && (LEGACY_ORDER_VIEWS as readonly string[]).includes(rawView)) {
    const mapped = LEGACY_VIEW_MAP[rawView as LegacyOrdersView];
    board = mapped.board;
    range = mapped.range;
  }

  if (rawRange && (ORDER_RANGE_VIEWS as readonly string[]).includes(rawRange)) {
    range = rawRange as OrderRangeView;
  }

  if (range === "custom" && !fromIso && !toIso) {
    range = "open";
  }
  if (range !== "custom") {
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

  return { board, range, fromIso, toIso };
}

/** Builds the query string fragment for polling / navigation. */
export function ordersFilterQueryString(filter: OrdersFilter): string {
  const params = new URLSearchParams();
  if (filter.board !== "kitchen") params.set("view", filter.board);
  if (filter.range !== "open") params.set("range", filter.range);
  if (filter.range === "custom") {
    if (filter.fromIso) params.set("from", filter.fromIso);
    if (filter.toIso) params.set("to", filter.toIso);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Time floor applied per range (UTC instants). "today" uses the Europe/Lisbon
 * day start: the product targets restaurants in Portugal and the kitchen's
 * notion of "today" should follow the local clock, not UTC.
 */
export function rangeTimeFloor(range: OrderRangeView, now: Date = new Date()): string | null {
  switch (range) {
    case "today":
      return startOfDayInTimeZone(now, "Europe/Lisbon").toISOString();
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

/** @deprecated Use rangeTimeFloor */
export function viewTimeFloor(view: LegacyOrdersView | OrderRangeView, now: Date = new Date()): string | null {
  if ((ORDER_RANGE_VIEWS as readonly string[]).includes(view)) {
    return rangeTimeFloor(view as OrderRangeView, now);
  }
  if (view === "today" || view === "24h") {
    return rangeTimeFloor(view, now);
  }
  return null;
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
