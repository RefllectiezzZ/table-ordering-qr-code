import { describe, expect, it } from "vitest";
import { centsToEuroString, formatCentsToEuro, parseEuroToCents } from "@/lib/money";

describe("parseEuroToCents", () => {
  it("parses plain integers", () => {
    expect(parseEuroToCents("12")).toBe(1200);
    expect(parseEuroToCents("0")).toBe(0);
  });

  it("parses dot decimals", () => {
    expect(parseEuroToCents("3.50")).toBe(350);
    expect(parseEuroToCents("3.5")).toBe(350);
    expect(parseEuroToCents("0.99")).toBe(99);
  });

  it("parses comma decimals (PT style)", () => {
    expect(parseEuroToCents("3,50")).toBe(350);
    expect(parseEuroToCents("12,05")).toBe(1205);
  });

  it("parses mixed thousands separators", () => {
    expect(parseEuroToCents("1.234,56")).toBe(123456);
    expect(parseEuroToCents("1,234.56")).toBe(123456);
  });

  it("tolerates euro signs and spaces", () => {
    expect(parseEuroToCents(" 3,50 € ")).toBe(350);
    expect(parseEuroToCents("€12.00")).toBe(1200);
  });

  it("rejects invalid input", () => {
    expect(parseEuroToCents("")).toBeNull();
    expect(parseEuroToCents("abc")).toBeNull();
    expect(parseEuroToCents("3.555")).toBeNull();
    expect(parseEuroToCents("-5")).toBeNull();
    expect(parseEuroToCents("3,5,0")).toBeNull();
    expect(parseEuroToCents("1.2.3")).toBeNull();
  });
});

describe("centsToEuroString", () => {
  it("round-trips with parseEuroToCents", () => {
    for (const cents of [0, 1, 99, 100, 350, 1205, 123456]) {
      expect(parseEuroToCents(centsToEuroString(cents))).toBe(cents);
    }
  });
});

describe("formatCentsToEuro", () => {
  it("formats as EUR currency", () => {
    const formatted = formatCentsToEuro(350, "en");
    expect(formatted).toContain("3.50");
    expect(formatted).toContain("€");
  });

  it("formats Portuguese style", () => {
    const formatted = formatCentsToEuro(350, "pt");
    expect(formatted).toContain("3,50");
  });
});
