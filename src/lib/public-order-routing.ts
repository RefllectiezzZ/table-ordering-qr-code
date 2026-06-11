import type { OrderStatus } from "@/types/database";

export interface PublicOrderRoutingInput {
  enableTableSessions: boolean;
  requireOrderConfirmation: boolean;
  sessionTokenProvided: boolean;
  hasValidSessionToken: boolean;
  /** Open session id from token validation or ensureOpenSession. */
  resolvedSessionId: string | null;
}

export interface PublicOrderRoutingResult {
  tableSessionId: string | null;
  initialStatus: OrderStatus;
  sessionEnded: boolean;
}

/**
 * Pure decision logic for public order session attachment and initial status.
 * The server resolves tokens and sessions before calling this helper.
 */
export function resolvePublicOrderRouting(
  input: PublicOrderRoutingInput,
): PublicOrderRoutingResult {
  if (!input.enableTableSessions) {
    return {
      tableSessionId: null,
      initialStatus: "new",
      sessionEnded: false,
    };
  }

  if (input.requireOrderConfirmation) {
    const tableSessionId = input.hasValidSessionToken ? input.resolvedSessionId : null;
    return {
      tableSessionId,
      initialStatus: tableSessionId ? "new" : "pending_confirmation",
      sessionEnded: publicOrderSessionEnded(
        input.enableTableSessions,
        input.requireOrderConfirmation,
        input.sessionTokenProvided,
        input.hasValidSessionToken,
      ),
    };
  }

  return {
    tableSessionId: input.resolvedSessionId,
    initialStatus: "new",
    sessionEnded: false,
  };
}

/**
 * Whether a stale browser token was sent but could not authorize the order.
 * Only meaningful when sessions and confirmation are both enabled.
 */
export function publicOrderSessionEnded(
  enableTableSessions: boolean,
  requireOrderConfirmation: boolean,
  sessionTokenProvided: boolean,
  hasValidSessionToken: boolean,
): boolean {
  return (
    enableTableSessions &&
    requireOrderConfirmation &&
    sessionTokenProvided &&
    !hasValidSessionToken
  );
}
