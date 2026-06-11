import { describe, expect, it } from "vitest";
import {
  adminBrandingUpdateSchema,
  orderConfirmationSchema,
  ordersCleanupSchema,
} from "@/lib/validation/schemas";

describe("orderConfirmationSchema", () => {
  it("accepts boolean toggle values", () => {
    expect(orderConfirmationSchema.parse({ require_order_confirmation: true })).toEqual({
      require_order_confirmation: true,
    });
    expect(orderConfirmationSchema.parse({ require_order_confirmation: false })).toEqual({
      require_order_confirmation: false,
    });
  });

  it("rejects non-boolean values", () => {
    expect(() =>
      orderConfirmationSchema.parse({ require_order_confirmation: "yes" }),
    ).toThrow();
  });
});

describe("ordersCleanupSchema", () => {
  it("accepts retention days at or above minimum 30", () => {
    expect(ordersCleanupSchema.parse({ retention_days: 30 })).toEqual({ retention_days: 30 });
    expect(ordersCleanupSchema.parse({ retention_days: 90 })).toEqual({ retention_days: 90 });
  });

  it("rejects retention below 30 days", () => {
    expect(() => ordersCleanupSchema.parse({ retention_days: 14 })).toThrow();
    expect(() => ordersCleanupSchema.parse({ retention_days: 7 })).toThrow();
  });
});

describe("adminBrandingUpdateSchema background fields", () => {
  it("validates background enums and opacity range", () => {
    const parsed = adminBrandingUpdateSchema.parse({
      public_menu_background_mode: "pattern",
      public_menu_background_position: "bottom",
      public_menu_background_overlay: "dark",
      public_menu_background_overlay_opacity: 30,
      public_menu_surface_style: "paper",
      public_menu_background_image_url: "https://cdn.example.com/bg.png",
    });
    expect(parsed.public_menu_background_mode).toBe("pattern");
    expect(parsed.public_menu_background_overlay_opacity).toBe(30);
  });

  it("rejects invalid overlay opacity", () => {
    expect(() =>
      adminBrandingUpdateSchema.parse({ public_menu_background_overlay_opacity: 95 }),
    ).toThrow();
  });
});
