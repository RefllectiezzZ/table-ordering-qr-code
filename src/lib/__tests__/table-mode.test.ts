import { describe, expect, it } from "vitest";
import { isAutomaticTableMode } from "@/lib/table-mode";

describe("isAutomaticTableMode", () => {
  it("is manual when confirmation is required", () => {
    expect(isAutomaticTableMode(true)).toBe(false);
  });

  it("is automatic when confirmation is disabled", () => {
    expect(isAutomaticTableMode(false)).toBe(true);
  });
});
