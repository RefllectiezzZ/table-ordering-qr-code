/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * LAUNCH-GATE BASELINE ONLY: state lives in the memory of a single Node.js
 * process. It resets on every deploy/restart and is NOT shared across
 * serverless instances or replicas, so it is best-effort abuse resistance for
 * MVP/pilot use. Before wider public launch, replace with a distributed
 * limiter (Redis/Upstash, or Vercel/Cloudflare edge rate limiting) — tracked
 * in docs/launch/launch-gates.md.
 *
 * Currently applied only to POST /api/public/orders, keyed by
 * "<client ip>:<table_token>". The default of 20 requests/minute is generous
 * enough that legitimate idempotent retries of the same client_order_token
 * are never blocked, while making bulk spam from one source impractical.
 *
 * Pure logic with no secrets, kept free of "server-only" so it can be
 * unit-tested; it is only ever imported from route handlers.
 */

export const PUBLIC_ORDER_RATE_LIMIT = 20;
export const PUBLIC_ORDER_RATE_WINDOW_MS = 60_000;

/** Stop tracking new keys beyond this many entries (memory safety valve). */
const MAX_TRACKED_KEYS = 10_000;

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
  /** Injectable clock for deterministic tests. */
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds the caller should wait before retrying (0 when allowed). */
  retryAfterSeconds: number;
}

const hitsByKey = new Map<string, number[]>();

/**
 * Records a hit for `key` and reports whether it stays within the sliding
 * window. Counting blocked requests as hits is intentional: a client that
 * keeps hammering keeps waiting.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const limit = options.limit ?? PUBLIC_ORDER_RATE_LIMIT;
  const windowMs = options.windowMs ?? PUBLIC_ORDER_RATE_WINDOW_MS;
  const now = options.now ?? Date.now();
  const windowStart = now - windowMs;

  let hits = hitsByKey.get(key);
  if (!hits) {
    if (hitsByKey.size >= MAX_TRACKED_KEYS) {
      pruneExpired(windowStart);
    }
    if (hitsByKey.size >= MAX_TRACKED_KEYS) {
      // Saturated even after pruning: fail open so a memory cap can never
      // turn into a denial of service for legitimate customers.
      return { allowed: true, retryAfterSeconds: 0 };
    }
    hits = [];
    hitsByKey.set(key, hits);
  }

  // Drop hits that left the window (array stays sorted oldest -> newest).
  let firstValid = 0;
  while (firstValid < hits.length && hits[firstValid] <= windowStart) firstValid += 1;
  if (firstValid > 0) hits.splice(0, firstValid);

  if (hits.length >= limit) {
    const retryAfterMs = hits[0] + windowMs - now;
    hits.push(now);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  hits.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
}

function pruneExpired(windowStart: number): void {
  for (const [key, hits] of hitsByKey) {
    if (hits.length === 0 || hits[hits.length - 1] <= windowStart) {
      hitsByKey.delete(key);
    }
  }
}

/** Test helper: clears all limiter state. */
export function resetRateLimiter(): void {
  hitsByKey.clear();
}

/**
 * Best-available client IP. Behind Vercel/Cloudflare the first
 * x-forwarded-for entry is set by the platform; locally it falls back to
 * "unknown" (all local traffic then shares one bucket, which is fine for dev).
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}
