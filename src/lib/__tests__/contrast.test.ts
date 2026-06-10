import { describe, expect, it } from "vitest";
import {
  isVeryLightColor,
  parseHexColor,
  readableTextColor,
  relativeLuminance,
  safeAccentColor,
} from "@/lib/theme/contrast";

describe("parseHexColor", () => {
  it("parses #rrggbb and #rgb", () => {
    expect(parseHexColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor("1a2b3c")).toEqual({ r: 26, g: 43, b: 60 });
  });

  it("returns null for invalid input", () => {
    expect(parseHexColor("")).toBeNull();
    expect(parseHexColor("#12345")).toBeNull();
    expect(parseHexColor("red")).toBeNull();
    expect(parseHexColor("#zzzzzz")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("orders black < mid < white", () => {
    const black = relativeLuminance({ r: 0, g: 0, b: 0 });
    const mid = relativeLuminance({ r: 128, g: 128, b: 128 });
    const white = relativeLuminance({ r: 255, g: 255, b: 255 });
    expect(black).toBe(0);
    expect(white).toBeCloseTo(1);
    expect(mid).toBeGreaterThan(black);
    expect(mid).toBeLessThan(white);
  });
});

describe("readableTextColor", () => {
  it("uses white text on dark backgrounds", () => {
    expect(readableTextColor("#111827")).toBe("#ffffff");
    expect(readableTextColor("#b45309")).toBe("#ffffff");
    expect(readableTextColor("#000000")).toBe("#ffffff");
  });

  it("uses dark text on light backgrounds", () => {
    expect(readableTextColor("#ffffff")).toBe("#0f172a");
    expect(readableTextColor("#fef3c7")).toBe("#0f172a");
    expect(readableTextColor("#fbbf24")).toBe("#0f172a");
  });

  it("falls back to white for unparseable colors", () => {
    expect(readableTextColor("not-a-color")).toBe("#ffffff");
  });
});

describe("safeAccentColor", () => {
  it("keeps dark brand colors", () => {
    expect(safeAccentColor("#b45309")).toBe("#b45309");
  });

  it("replaces very light brand colors with a readable neutral", () => {
    expect(safeAccentColor("#ffffff")).toBe("#0f172a");
    expect(safeAccentColor("#fffbeb")).toBe("#0f172a");
    expect(isVeryLightColor("#fffbeb")).toBe(true);
  });
});
