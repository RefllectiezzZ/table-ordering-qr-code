import type { OrderStatus } from "@/types/database";

/** Order statuses that trigger kitchen/staff new-order alerts. */
export const ALERTABLE_ORDER_STATUSES: OrderStatus[] = ["new", "pending_confirmation"];

export interface OrderIdCarrier {
  id: string;
  status: OrderStatus;
}

/**
 * Returns IDs of orders that are newly alertable compared to a previous snapshot.
 * On first load (`isInitialLoad`), returns empty — existing orders must not alert.
 */
export function detectNewAlertableOrderIds(
  previousIds: ReadonlySet<string>,
  currentOrders: readonly OrderIdCarrier[],
  isInitialLoad: boolean,
): string[] {
  if (isInitialLoad) return [];

  const fresh: string[] = [];
  for (const order of currentOrders) {
    if (!ALERTABLE_ORDER_STATUSES.includes(order.status)) continue;
    if (previousIds.has(order.id)) continue;
    fresh.push(order.id);
  }
  return fresh;
}

/** Whether any of the given IDs are new since the last alert cycle. */
export function shouldPlayNewOrderSound(
  newIds: readonly string[],
  alreadyAlertedIds: ReadonlySet<string>,
): boolean {
  return newIds.some((id) => !alreadyAlertedIds.has(id));
}
