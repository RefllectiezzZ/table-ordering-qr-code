/**
 * Table/session UI mode derived from require_order_confirmation.
 *
 * Confirmation ON  -> staff manually open/close sessions (safer against saved QR).
 * Confirmation OFF -> sessions are created automatically on incoming orders.
 */
export function isAutomaticTableMode(requireOrderConfirmation: boolean): boolean {
  return !requireOrderConfirmation;
}
