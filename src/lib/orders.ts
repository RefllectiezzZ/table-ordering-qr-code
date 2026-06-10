import type { OrderStatus } from "@/types/database";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "new",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
  "rejected",
];

/** Statuses still requiring kitchen attention. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];

/** Terminal statuses shown in history, never on the kitchen board. */
export const CLOSED_ORDER_STATUSES: OrderStatus[] = ["delivered", "cancelled", "rejected"];

/**
 * Allowed status transitions for the generic status endpoint. Forward kitchen
 * flow plus cancellation; delivered/cancelled/rejected are terminal.
 *
 * pending_confirmation has NO generic transitions on purpose: it can only
 * leave that state through the dedicated confirm/reject endpoints, which also
 * handle table-session attachment and browser authorization. This prevents a
 * plain status update from skipping the confirmation flow.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: [],
  new: ["preparing", "ready", "delivered", "cancelled"],
  preparing: ["ready", "delivered", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(value);
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

/** Harmless short display code derived from the order id (public-safe). */
export function orderShortCode(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

/** Kitchen-facing display number: "#104", falling back to the short code. */
export function orderDisplayNumber(
  orderNumber: number | null,
  orderId: string,
): string {
  return orderNumber !== null ? `#${orderNumber}` : `#${orderShortCode(orderId)}`;
}
