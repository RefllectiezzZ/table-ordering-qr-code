import { createHmac } from "node:crypto";

/** Accepted order attempts per client key per 60-second bucket. */
export const RATE_LIMIT_PER_KEY_PER_MINUTE = 8;

/** Accepted order attempts per table per 10-minute window. */
export const RATE_LIMIT_PER_TABLE_PER_10_MIN = 30;

export const RATE_LIMIT_KEY_BUCKET_SECONDS = 60;
export const RATE_LIMIT_TABLE_WINDOW_SECONDS = 600;

export interface RateLimitKeyInput {
  restaurantId: string;
  tableId: string;
  clientIp: string;
  bucketStartUnix: number;
  secret: string;
}

/**
 * Derives a one-way HMAC key for rate limiting. The raw IP never leaves this
 * function's stack as a stored value — only the hash is persisted.
 */
export function derivePublicOrderKeyHash(input: RateLimitKeyInput): string {
  const normalizedIp = normalizeClientIp(input.clientIp);
  const payload = [
    input.restaurantId,
    input.tableId,
    normalizedIp,
    String(input.bucketStartUnix),
  ].join(":");
  return createHmac("sha256", input.secret).update(payload).digest("hex");
}

export function normalizeClientIp(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return "unknown";
  return trimmed.toLowerCase();
}

export function floorToBucketStart(unixSeconds: number, bucketSeconds: number): number {
  return Math.floor(unixSeconds / bucketSeconds) * bucketSeconds;
}

export function bucketStartIso(unixSeconds: number, bucketSeconds: number): string {
  return new Date(floorToBucketStart(unixSeconds, bucketSeconds) * 1000).toISOString();
}

/**
 * Pure decision: whether counts exceed configured limits.
 */
export function isRateLimitExceeded(
  keyAcceptedInBucket: number,
  tableAcceptedInWindow: number,
): { exceeded: boolean; reason: "per_key" | "per_table" | null } {
  if (keyAcceptedInBucket >= RATE_LIMIT_PER_KEY_PER_MINUTE) {
    return { exceeded: true, reason: "per_key" };
  }
  if (tableAcceptedInWindow >= RATE_LIMIT_PER_TABLE_PER_10_MIN) {
    return { exceeded: true, reason: "per_table" };
  }
  return { exceeded: false, reason: null };
}
