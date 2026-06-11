import type { OrderStatus } from "@/types/database";

/** Statuses included in the table bill total. */
export const BILLABLE_ORDER_STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "delivered",
];
