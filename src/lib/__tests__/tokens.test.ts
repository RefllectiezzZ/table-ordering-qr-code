import { describe, expect, it } from "vitest";
import {
  TABLE_TOKEN_LENGTH,
  generateClientOrderToken,
  generateTableToken,
  isValidPublicTokenFormat,
} from "@/lib/security/tokens";

describe("generateTableToken", () => {
  it("generates tokens of the expected length", () => {
    expect(generateTableToken()).toHaveLength(TABLE_TOKEN_LENGTH);
  });

  it("only uses URL-safe characters", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateTableToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("does not repeat tokens (sample of 1000)", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      tokens.add(generateTableToken());
    }
    expect(tokens.size).toBe(1000);
  });
});

describe("isValidPublicTokenFormat", () => {
  it("accepts generated tokens", () => {
    expect(isValidPublicTokenFormat(generateTableToken())).toBe(true);
  });

  it("accepts the demo seed tokens", () => {
    expect(isValidPublicTokenFormat("demo-mesa-1-k3v9q2x8w7z4")).toBe(true);
  });

  it("rejects junk", () => {
    expect(isValidPublicTokenFormat("")).toBe(false);
    expect(isValidPublicTokenFormat("short")).toBe(false);
    expect(isValidPublicTokenFormat("has spaces in it")).toBe(false);
    expect(isValidPublicTokenFormat("contains/slash-and-more")).toBe(false);
    expect(isValidPublicTokenFormat("x".repeat(65))).toBe(false);
    expect(isValidPublicTokenFormat("'; drop table orders; --")).toBe(false);
  });
});

describe("generateClientOrderToken", () => {
  it("generates unique UUID-shaped tokens", () => {
    const token = generateClientOrderToken();
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(generateClientOrderToken()).not.toBe(token);
  });
});
