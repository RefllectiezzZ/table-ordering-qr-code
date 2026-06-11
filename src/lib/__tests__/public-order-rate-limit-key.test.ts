import { describe, expect, it } from "vitest";
import {
  derivePublicOrderKeyHash,
  isRateLimitExceeded,
  normalizeClientIp,
  RATE_LIMIT_PER_KEY_PER_MINUTE,
  RATE_LIMIT_PER_TABLE_PER_10_MIN,
} from "@/lib/security/public-order-rate-limit-key";

describe("derivePublicOrderKeyHash", () => {
  it("does not return the raw IP", () => {
    const hash = derivePublicOrderKeyHash({
      restaurantId: "r1",
      tableId: "t1",
      clientIp: "203.0.113.7",
      bucketStartUnix: 1_750_000_000,
      secret: "test-secret",
    });
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces stable hashes for the same input", () => {
    const input = {
      restaurantId: "r1",
      tableId: "t1",
      clientIp: "203.0.113.7",
      bucketStartUnix: 1_750_000_000,
      secret: "test-secret",
    };
    expect(derivePublicOrderKeyHash(input)).toBe(derivePublicOrderKeyHash(input));
  });

  it("differs when IP changes", () => {
    const base = {
      restaurantId: "r1",
      tableId: "t1",
      bucketStartUnix: 1_750_000_000,
      secret: "test-secret",
    };
    expect(
      derivePublicOrderKeyHash({ ...base, clientIp: "1.2.3.4" }),
    ).not.toBe(derivePublicOrderKeyHash({ ...base, clientIp: "5.6.7.8" }));
  });
});

describe("normalizeClientIp", () => {
  it("returns unknown for empty input", () => {
    expect(normalizeClientIp("")).toBe("unknown");
  });
});

describe("isRateLimitExceeded", () => {
  it("allows under per-key limit", () => {
    expect(isRateLimitExceeded(RATE_LIMIT_PER_KEY_PER_MINUTE - 1, 0)).toEqual({
      exceeded: false,
      reason: null,
    });
  });

  it("blocks at per-key limit", () => {
    expect(isRateLimitExceeded(RATE_LIMIT_PER_KEY_PER_MINUTE, 0)).toEqual({
      exceeded: true,
      reason: "per_key",
    });
  });

  it("blocks at per-table limit", () => {
    expect(isRateLimitExceeded(0, RATE_LIMIT_PER_TABLE_PER_10_MIN)).toEqual({
      exceeded: true,
      reason: "per_table",
    });
  });
});
