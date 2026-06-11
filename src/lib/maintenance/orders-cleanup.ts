import { CLOSED_ORDER_STATUSES } from "@/lib/orders";

/** Terminal orders eligible for retention cleanup. Non-terminal orders are never deleted. */
export const CLEANUP_ORDER_STATUSES = CLOSED_ORDER_STATUSES;

export const MIN_RETENTION_DAYS = 30;

export const RETENTION_DAY_OPTIONS = [30, 60, 90] as const;

export type RetentionDays = (typeof RETENTION_DAY_OPTIONS)[number] | number;

export function isValidRetentionDays(days: number): boolean {
  return Number.isInteger(days) && days >= MIN_RETENTION_DAYS;
}

/** Cutoff timestamp: orders strictly older than this may be cleaned up. */
export function retentionCutoffIso(retentionDays: number, now: Date = new Date()): string {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}
