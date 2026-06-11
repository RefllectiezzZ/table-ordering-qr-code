import { describe, expect, it } from "vitest";
import {
  isAutomaticTableMode,
  isEnhancedSecurity,
  isValidTableSecuritySettings,
  tableSecurityMode,
} from "@/lib/table-mode";

describe("tableSecurityMode", () => {
  it("returns secure when confirmation and sessions are ON", () => {
    expect(tableSecurityMode(true, true)).toBe("secure");
  });

  it("returns fast_with_sessions when only sessions are ON", () => {
    expect(tableSecurityMode(false, true)).toBe("fast_with_sessions");
  });

  it("returns simple when both are OFF", () => {
    expect(tableSecurityMode(false, false)).toBe("simple");
  });
});

describe("isEnhancedSecurity", () => {
  it("is true only for secure mode", () => {
    expect(isEnhancedSecurity(true, true)).toBe(true);
    expect(isEnhancedSecurity(false, true)).toBe(false);
    expect(isEnhancedSecurity(false, false)).toBe(false);
  });
});

describe("isValidTableSecuritySettings", () => {
  it("rejects confirmation ON without sessions", () => {
    expect(isValidTableSecuritySettings(true, false)).toBe(false);
  });

  it("accepts all valid combinations", () => {
    expect(isValidTableSecuritySettings(true, true)).toBe(true);
    expect(isValidTableSecuritySettings(false, true)).toBe(true);
    expect(isValidTableSecuritySettings(false, false)).toBe(true);
  });
});

describe("isAutomaticTableMode", () => {
  it("is manual when confirmation is required", () => {
    expect(isAutomaticTableMode(true)).toBe(false);
  });

  it("is automatic when confirmation is disabled", () => {
    expect(isAutomaticTableMode(false)).toBe(true);
  });
});
