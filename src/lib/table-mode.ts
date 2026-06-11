/**
 * Table/session operating modes derived from restaurant security settings.
 *
 * secure             -> confirmation ON + sessions ON (recommended)
 * fast_with_sessions -> confirmation OFF + sessions ON
 * simple             -> confirmation OFF + sessions OFF
 */

export type TableSecurityMode = "secure" | "fast_with_sessions" | "simple";

export function tableSecurityMode(
  requireOrderConfirmation: boolean,
  enableTableSessions: boolean,
): TableSecurityMode {
  if (requireOrderConfirmation && enableTableSessions) return "secure";
  if (!requireOrderConfirmation && enableTableSessions) return "fast_with_sessions";
  return "simple";
}

/** True when both first-order confirmation and table sessions are enabled. */
export function isEnhancedSecurity(
  requireOrderConfirmation: boolean,
  enableTableSessions: boolean,
): boolean {
  return requireOrderConfirmation && enableTableSessions;
}

/**
 * @deprecated Use tableSecurityMode() === "fast_with_sessions" instead.
 * Kept for gradual migration of call sites that only checked confirmation.
 */
export function isAutomaticTableMode(requireOrderConfirmation: boolean): boolean {
  return !requireOrderConfirmation;
}

/** Rejects confirmation without sessions — mirrored by the DB check constraint. */
export function isValidTableSecuritySettings(
  requireOrderConfirmation: boolean,
  enableTableSessions: boolean,
): boolean {
  return !(requireOrderConfirmation && !enableTableSessions);
}
