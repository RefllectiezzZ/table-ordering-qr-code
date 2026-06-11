import { describe, expect, it } from "vitest";
import {
  getPublicMenuTemplateTokens,
  PUBLIC_MENU_TEMPLATES,
  resolvePublicMenuTheme,
} from "@/lib/public-menu/templates";

describe("resolvePublicMenuTheme", () => {
  it("falls back to brunch_editorial defaults for missing or invalid values", () => {
    const theme = resolvePublicMenuTheme({});
    expect(theme.template).toBe("brunch_editorial");
    expect(theme.density).toBe("comfortable");
    expect(theme.cardStyle).toBe("image_right");
    expect(theme.showImages).toBe(true);
  });

  it("falls back safely for invalid enum strings", () => {
    const theme = resolvePublicMenuTheme({
      public_menu_template: "hacked_template",
      public_menu_density: "huge",
      public_menu_card_style: "image_everywhere",
    });
    expect(theme.template).toBe("brunch_editorial");
    expect(theme.density).toBe("comfortable");
    expect(theme.cardStyle).toBe("image_right");
  });

  it("accepts valid template settings", () => {
    const theme = resolvePublicMenuTheme({
      public_menu_template: "fine_dining_dark",
      public_menu_density: "spacious",
      public_menu_cart_style: "bottom_bar",
      public_menu_show_images: false,
    });
    expect(theme.template).toBe("fine_dining_dark");
    expect(theme.density).toBe("spacious");
    expect(theme.cartStyle).toBe("bottom_bar");
    expect(theme.showImages).toBe(false);
  });
});

describe("getPublicMenuTemplateTokens", () => {
  it("returns dark tokens for fine_dining_dark", () => {
    const settings = resolvePublicMenuTheme({ public_menu_template: "fine_dining_dark" });
    const tokens = getPublicMenuTemplateTokens(settings);
    expect(tokens.isDark).toBe(true);
    expect(tokens.placeholderStyle).toBe("fine_dining");
  });

  it("returns distinct tokens per template", () => {
    const brunch = getPublicMenuTemplateTokens(
      resolvePublicMenuTheme({ public_menu_template: "brunch_editorial" }),
    );
    const street = getPublicMenuTemplateTokens(
      resolvePublicMenuTheme({ public_menu_template: "street_food_bold" }),
    );
    expect(brunch.pageBackground).not.toBe(street.pageBackground);
    expect(brunch.placeholderStyle).not.toBe(street.placeholderStyle);
  });

  it("covers every allowed template without throwing", () => {
    for (const template of PUBLIC_MENU_TEMPLATES) {
      const tokens = getPublicMenuTemplateTokens(
        resolvePublicMenuTheme({ public_menu_template: template }),
      );
      expect(tokens.pageBackground.length).toBeGreaterThan(0);
    }
  });
});
