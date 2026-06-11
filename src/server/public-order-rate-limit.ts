import "server-only";

import { getClientIp } from "@/lib/security/rate-limit";
import {
  RATE_LIMIT_KEY_BUCKET_SECONDS,
  RATE_LIMIT_TABLE_WINDOW_SECONDS,
  bucketStartIso,
  derivePublicOrderKeyHash,
  floorToBucketStart,
  isRateLimitExceeded,
} from "@/lib/security/public-order-rate-limit-key";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export interface PublicOrderRateLimitInput {
  restaurantId: string;
  tableId: string;
  request: Request;
}

export type PublicOrderRateLimitResult =
  | { allowed: true }
  | { allowed: false; code: "rate_limited"; message: string };

function resolveRateLimitSecret(): string {
  const explicit = process.env.RATE_LIMIT_SECRET?.trim();
  if (explicit) return explicit;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback) return fallback;
  return "dev-rate-limit-fallback-not-for-production";
}

/**
 * Checks and records a public order attempt. Idempotent retries should call
 * this only when a new order will actually be created.
 */
export async function enforcePublicOrderRateLimit(
  ctx: PublicOrderRateLimitInput,
): Promise<PublicOrderRateLimitResult> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const bucketUnix = floorToBucketStart(nowUnix, RATE_LIMIT_KEY_BUCKET_SECONDS);
  const bucketStart = bucketStartIso(nowUnix, RATE_LIMIT_KEY_BUCKET_SECONDS);
  const clientIp = getClientIp(ctx.request);
  const secret = resolveRateLimitSecret();

  const keyHash = derivePublicOrderKeyHash({
    restaurantId: ctx.restaurantId,
    tableId: ctx.tableId,
    clientIp,
    bucketStartUnix: bucketUnix,
    secret,
  });

  const supabase = createServiceRoleSupabaseClient();
  const tableWindowStart = new Date(
    (nowUnix - RATE_LIMIT_TABLE_WINDOW_SECONDS) * 1000,
  ).toISOString();

  const [{ count: keyCount }, { count: tableCount }] = await Promise.all([
    supabase
      .from("public_order_attempts")
      .select("id", { count: "exact", head: true })
      .eq("key_hash", keyHash)
      .eq("bucket_start", bucketStart)
      .eq("accepted", true),
    supabase
      .from("public_order_attempts")
      .select("id", { count: "exact", head: true })
      .eq("table_id", ctx.tableId)
      .eq("accepted", true)
      .gte("created_at", tableWindowStart),
  ]);

  const decision = isRateLimitExceeded(keyCount ?? 0, tableCount ?? 0);

  if (decision.exceeded) {
    await supabase.from("public_order_attempts").insert({
      restaurant_id: ctx.restaurantId,
      table_id: ctx.tableId,
      key_hash: keyHash,
      bucket_start: bucketStart,
      accepted: false,
      reason: decision.reason,
    });

    console.warn("public_order_rate_limited", {
      restaurantId: ctx.restaurantId,
      tableId: ctx.tableId,
      reason: decision.reason,
    });

    return {
      allowed: false,
      code: "rate_limited",
      message: "Muitos pedidos em pouco tempo. Aguarde um momento e tente novamente.",
    };
  }

  await supabase.from("public_order_attempts").insert({
    restaurant_id: ctx.restaurantId,
    table_id: ctx.tableId,
    key_hash: keyHash,
    bucket_start: bucketStart,
    accepted: true,
    reason: null,
  });

  return { allowed: true };
}
