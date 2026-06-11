import type { PublicMenuStrings } from "@/lib/i18n";
import type { Language, OrderStatus } from "@/types/database";
import type { PublicProduct } from "@/types/public-menu";

export interface CartLine {
  productId: string;
  quantity: number;
  itemNote: string;
}

export interface ActiveOrder {
  shortCode: string;
  orderNumber: number | null;
  status: OrderStatus;
  totalCents: number | null;
}

export type PublicMenuView = "menu" | "cart" | "status";

export const POLL_INTERVAL_MS = 5000;
/** Slower poll when the tab is hidden — resumes immediately on visibility. */
export const POLL_INTERVAL_HIDDEN_MS = 15000;
export const POLLABLE_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "new",
  "preparing",
  "ready",
];

export const PROGRESS_STATUSES: OrderStatus[] = ["new", "preparing", "ready", "delivered"];

export function sessionStorageKey(token: string) {
  return `tableorder.session.${token}`;
}

export function lastOrderStorageKey(token: string) {
  return `tableorder.lastorder.${token}`;
}

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — flow still works without session persistence.
  }
}

export function pickName(
  translations: PublicProduct["translations"],
  language: Language,
  fallback: Language,
): { name: string; description: string | null } {
  return (
    translations[language] ??
    translations[fallback] ??
    Object.values(translations)[0] ?? { name: "—", description: null }
  );
}

export function statusLabel(status: OrderStatus, t: PublicMenuStrings): string {
  switch (status) {
    case "pending_confirmation":
      return t.statusPending;
    case "new":
      return t.statusConfirmed;
    case "preparing":
      return t.statusPreparing;
    case "ready":
      return t.statusReady;
    case "delivered":
      return t.statusDelivered;
    case "rejected":
      return t.statusRejected;
    case "cancelled":
      return t.statusCancelled;
  }
}
