import { describe, expect, it } from "vitest";
import { tableSecuritySchema } from "@/lib/validation/schemas";

describe("tableSecuritySchema", () => {
  it("accepts require_order_confirmation false + enable_table_sessions false", () => {
    expect(
      tableSecuritySchema.parse({
        require_order_confirmation: false,
        enable_table_sessions: false,
      }),
    ).toEqual({
      require_order_confirmation: false,
      enable_table_sessions: false,
    });
  });

  it("accepts require_order_confirmation false + enable_table_sessions true", () => {
    expect(
      tableSecuritySchema.parse({
        require_order_confirmation: false,
        enable_table_sessions: true,
      }),
    ).toEqual({
      require_order_confirmation: false,
      enable_table_sessions: true,
    });
  });

  it("accepts require_order_confirmation true + enable_table_sessions true", () => {
    expect(
      tableSecuritySchema.parse({
        require_order_confirmation: true,
        enable_table_sessions: true,
      }),
    ).toEqual({
      require_order_confirmation: true,
      enable_table_sessions: true,
    });
  });

  it("rejects require_order_confirmation true + enable_table_sessions false", () => {
    expect(() =>
      tableSecuritySchema.parse({
        require_order_confirmation: true,
        enable_table_sessions: false,
      }),
    ).toThrow();
  });
});
