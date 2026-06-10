import "server-only";

import {
  SESSION_TOKEN_TTL_HOURS,
  generateSessionAccessToken,
  hashSessionToken,
  isValidSessionTokenFormat,
} from "@/lib/security/session-tokens";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>;

/**
 * Table session service (server-only, service-role).
 *
 * SECURITY: none of these helpers check who is calling. Every caller (route
 * handler) MUST have already verified that the table/session/order belongs to
 * the authenticated member's restaurant, or — for the public paths — must
 * pass ids resolved from the QR token. All queries here are additionally
 * scoped by restaurant_id as a second line of defense.
 */

export interface OpenSessionRow {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: string;
  opened_at: string;
}

/** Returns the table's open session, or null. */
export async function findOpenSession(
  supabase: ServiceClient,
  restaurantId: string,
  tableId: string,
): Promise<OpenSessionRow | null> {
  const { data } = await supabase
    .from("table_sessions")
    .select("id, restaurant_id, table_id, status, opened_at")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", tableId)
    .eq("status", "open")
    .maybeSingle<OpenSessionRow>();
  return data ?? null;
}

/**
 * Returns the table's open session, creating one when none exists.
 * Race-safe: the partial unique index (one open session per table) turns a
 * concurrent double-create into a unique violation, after which the winner's
 * row is fetched and returned.
 */
export async function ensureOpenSession(
  supabase: ServiceClient,
  restaurantId: string,
  tableId: string,
  openedBy: string | null,
): Promise<OpenSessionRow | null> {
  const existing = await findOpenSession(supabase, restaurantId, tableId);
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      status: "open",
      opened_by: openedBy,
    })
    .select("id, restaurant_id, table_id, status, opened_at")
    .single<OpenSessionRow>();

  if (created) return created;
  if (error?.code === "23505") {
    // Lost the race against another opener — return the winner.
    return findOpenSession(supabase, restaurantId, tableId);
  }
  console.error("table_session_create_failed", error?.code);
  return null;
}

export interface CloseSessionResult {
  ok: boolean;
  revokedTokens: number;
}

/**
 * Closes a session and revokes every browser authorization granted during it.
 * Orders are untouched: history stays intact, and the kitchen views already
 * exclude closed-session orders through their status/time filters.
 */
export async function closeTableSession(
  supabase: ServiceClient,
  restaurantId: string,
  sessionId: string,
  closedBy: string | null,
): Promise<CloseSessionResult> {
  const closedAt = new Date().toISOString();

  const { error: sessionError } = await supabase
    .from("table_sessions")
    .update({ status: "closed", closed_at: closedAt, closed_by: closedBy })
    .eq("id", sessionId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "open");

  if (sessionError) {
    console.error("table_session_close_failed", sessionError.code);
    return { ok: false, revokedTokens: 0 };
  }

  const { data: revoked, error: revokeError } = await supabase
    .from("table_session_access_tokens")
    .update({ status: "revoked", revoked_at: closedAt })
    .eq("table_session_id", sessionId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .select("id");

  if (revokeError) {
    // The session is already closed (orders can no longer ride on it via the
    // open-session check), but log the failed revocation for follow-up.
    console.error("table_session_revoke_tokens_failed", revokeError.code);
  }

  return { ok: true, revokedTokens: revoked?.length ?? 0 };
}

export interface ValidSessionToken {
  sessionId: string;
  tokenId: string;
}

/**
 * Validates a raw browser authorization token for a specific restaurant +
 * table. Returns the open session it authorizes, or null. Constant behavior
 * for every failure mode (unknown, revoked, expired, wrong table): the caller
 * just treats the order as unauthorized.
 */
export async function validateSessionToken(
  supabase: ServiceClient,
  restaurantId: string,
  tableId: string,
  rawToken: string,
): Promise<ValidSessionToken | null> {
  if (!isValidSessionTokenFormat(rawToken)) return null;

  const tokenHash = await hashSessionToken(rawToken);
  const { data: token } = await supabase
    .from("table_session_access_tokens")
    .select("id, table_session_id, status, expires_at, table_id, restaurant_id")
    .eq("token_hash", tokenHash)
    .eq("restaurant_id", restaurantId)
    .eq("table_id", tableId)
    .eq("status", "active")
    .maybeSingle<{
      id: string;
      table_session_id: string;
      status: string;
      expires_at: string | null;
      table_id: string;
      restaurant_id: string;
    }>();

  if (!token) return null;

  if (token.expires_at && Date.parse(token.expires_at) < Date.now()) {
    await supabase
      .from("table_session_access_tokens")
      .update({ status: "expired" })
      .eq("id", token.id);
    return null;
  }

  const { data: session } = await supabase
    .from("table_sessions")
    .select("id, status")
    .eq("id", token.table_session_id)
    .eq("restaurant_id", restaurantId)
    .eq("status", "open")
    .maybeSingle<{ id: string; status: string }>();

  if (!session) return null;

  // Best-effort usage timestamp; failure must not block the order.
  await supabase
    .from("table_session_access_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return { sessionId: session.id, tokenId: token.id };
}

/**
 * Issues the browser authorization for a confirmed order, exactly once.
 *
 * Called from the public status poll: the device that placed the order (it
 * alone knows the client_order_token) learns the raw token on its first poll
 * after confirmation. The unique index on source_order_id guarantees a
 * second issuance attempt (concurrent polls, replays) returns null instead
 * of a second token.
 */
export async function issueSessionTokenForOrder(
  supabase: ServiceClient,
  order: { id: string; restaurant_id: string; table_id: string; table_session_id: string },
): Promise<string | null> {
  const rawToken = generateSessionAccessToken();
  const tokenHash = await hashSessionToken(rawToken);
  const expiresAt = new Date(
    Date.now() + SESSION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("table_session_access_tokens").insert({
    restaurant_id: order.restaurant_id,
    table_id: order.table_id,
    table_session_id: order.table_session_id,
    token_hash: tokenHash,
    status: "active",
    source_order_id: order.id,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code !== "23505") {
      console.error("session_token_issue_failed", error.code);
    }
    return null;
  }
  return rawToken;
}
