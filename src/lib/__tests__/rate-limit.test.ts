import { beforeEach, describe, expect, it } from "vitest";
import {
  PUBLIC_ORDER_RATE_LIMIT,
  PUBLIC_ORDER_RATE_WINDOW_MS,
  checkRateLimit,
  getClientIp,
  resetRateLimiter,
} from "@/lib/security/rate-limit";

const T0 = 1_750_000_000_000;

beforeEach(() => {
  resetRateLimiter();
});

describe("checkRateLimit", () => {
  it("allows requests under the threshold", () => {
    for (let i = 0; i < PUBLIC_ORDER_RATE_LIMIT; i += 1) {
      const result = checkRateLimit("ip:token", { now: T0 + i * 100 });
      expect(result.allowed, `request ${i + 1}`).toBe(true);
      expect(result.retryAfterSeconds).toBe(0);
    }
  });

  it("blocks requests over the threshold with a Retry-After hint", () => {
    for (let i = 0; i < PUBLIC_ORDER_RATE_LIMIT; i += 1) {
      checkRateLimit("ip:token", { now: T0 + i });
    }
    const blocked = checkRateLimit("ip:token", { now: T0 + 1000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(
      Math.ceil(PUBLIC_ORDER_RATE_WINDOW_MS / 1000),
    );
  });

  it("keys are independent per table token", () => {
    for (let i = 0; i < PUBLIC_ORDER_RATE_LIMIT; i += 1) {
      checkRateLimit("1.2.3.4:table-a", { now: T0 });
    }
    expect(checkRateLimit("1.2.3.4:table-a", { now: T0 }).allowed).toBe(false);
    expect(checkRateLimit("1.2.3.4:table-b", { now: T0 }).allowed).toBe(true);
  });

  it("keys are independent per IP", () => {
    for (let i = 0; i < PUBLIC_ORDER_RATE_LIMIT; i += 1) {
      checkRateLimit("1.2.3.4:table-a", { now: T0 });
    }
    expect(checkRateLimit("1.2.3.4:table-a", { now: T0 }).allowed).toBe(false);
    expect(checkRateLimit("5.6.7.8:table-a", { now: T0 }).allowed).toBe(true);
  });

  it("slides the window: old hits expire", () => {
    for (let i = 0; i < PUBLIC_ORDER_RATE_LIMIT; i += 1) {
      checkRateLimit("ip:token", { now: T0 });
    }
    expect(checkRateLimit("ip:token", { now: T0 + 1 }).allowed).toBe(false);
    // Just past the window the budget is available again.
    const later = T0 + PUBLIC_ORDER_RATE_WINDOW_MS + 1;
    expect(checkRateLimit("ip:token", { now: later }).allowed).toBe(true);
  });

  it("respects custom limits", () => {
    expect(checkRateLimit("k", { limit: 2, now: T0 }).allowed).toBe(true);
    expect(checkRateLimit("k", { limit: 2, now: T0 }).allowed).toBe(true);
    expect(checkRateLimit("k", { limit: 2, now: T0 }).allowed).toBe(false);
  });

  it("never blocks a realistic idempotent retry pattern", () => {
    // A flaky connection: the same cart submitted 5 times over 10 seconds.
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit("ip:token", { now: T0 + i * 2000 }).allowed).toBe(true);
    }
  });
});

describe("getClientIp", () => {
  function requestWithHeaders(headers: Record<string, string>): Request {
    return new Request("https://app.example.com/api/public/orders", {
      method: "POST",
      headers,
    });
  }

  it("uses the first x-forwarded-for entry", () => {
    const request = requestWithHeaders({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const request = requestWithHeaders({ "x-real-ip": "198.51.100.9" });
    expect(getClientIp(request)).toBe("198.51.100.9");
  });

  it("falls back to 'unknown' when no headers are present", () => {
    expect(getClientIp(requestWithHeaders({}))).toBe("unknown");
  });
});
