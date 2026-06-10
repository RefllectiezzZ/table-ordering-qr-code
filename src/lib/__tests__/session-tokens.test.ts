import { describe, expect, it } from "vitest";
import {
  SESSION_TOKEN_LENGTH,
  generateSessionAccessToken,
  hashSessionToken,
  isValidSessionTokenFormat,
} from "@/lib/security/session-tokens";

describe("generateSessionAccessToken", () => {
  it("generates URL-safe tokens of the expected length", () => {
    const token = generateSessionAccessToken();
    expect(token).toHaveLength(SESSION_TOKEN_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSessionAccessToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("isValidSessionTokenFormat", () => {
  it("accepts generated tokens", () => {
    expect(isValidSessionTokenFormat(generateSessionAccessToken())).toBe(true);
  });

  it("rejects junk", () => {
    expect(isValidSessionTokenFormat("")).toBe(false);
    expect(isValidSessionTokenFormat("short")).toBe(false);
    expect(isValidSessionTokenFormat("has spaces ".repeat(5))).toBe(false);
    expect(isValidSessionTokenFormat("a".repeat(65))).toBe(false);
    expect(isValidSessionTokenFormat("<script>".repeat(6))).toBe(false);
  });
});

describe("hashSessionToken", () => {
  it("returns a stable 64-char hex SHA-256", async () => {
    const hash1 = await hashSessionToken("test-token-value-test-token-value");
    const hash2 = await hashSessionToken("test-token-value-test-token-value");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different tokens", async () => {
    const a = await hashSessionToken(generateSessionAccessToken());
    const b = await hashSessionToken(generateSessionAccessToken());
    expect(a).not.toBe(b);
  });
});
