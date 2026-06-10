import type { OrderStatus } from "@/types/database";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

/** Statuses still requiring kitchen attention. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];

/**
 * Allowed status transitions. Forward flow plus cancellation;
 * delivered/cancelled are terminal.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "ready", "delivered", "cancelled"],
  preparing: ["ready", "delivered", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
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
