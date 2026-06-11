import { describe, expect, it } from "vitest";
import {
  buildPublicMenuPageShellStyles,
  resolvePublicMenuBackground,
} from "@/lib/public-menu/background";
import {
  getPublicMenuTemplateTokens,
  resolvePublicMenuTheme,
} from "@/lib/public-menu/templates";

describe("resolvePublicMenuBackground", () => {
  it("falls back to safe defaults for missing values", () => {
    const bg = resolvePublicMenuBackground({});
    expect(bg.mode).toBe("cover");
    expect(bg.overlay).toBe("light");
    expect(bg.overlayOpacity).toBe(60);
    expect(bg.surfaceStyle).toBe("solid");
    expect(bg.imageUrl).toBeNull();
  });

  it("rejects invalid enum strings", () => {
    const bg = resolvePublicMenuBackground({
      public_menu_background_mode: "fullscreen_video",
      public_menu_background_overlay: "rainbow",
      public_menu_background_overlay_opacity: 200,
    });
    expect(bg.mode).toBe("cover");
    expect(bg.overlay).toBe("light");
    expect(bg.overlayOpacity).toBe(90);
  });

  it("accepts valid background settings", () => {
    const bg = resolvePublicMenuBackground({
      public_menu_background_image_url: "https://cdn.example.com/bg.webp",
      public_menu_background_mode: "blurred_cover",
      public_menu_background_position: "top",
      public_menu_background_overlay: "brand_tint",
      public_menu_background_overlay_opacity: 40,
      public_menu_surface_style: "glass",
    });
    expect(bg.imageUrl).toBe("https://cdn.example.com/bg.webp");
    expect(bg.mode).toBe("blurred_cover");
    expect(bg.surfaceStyle).toBe("glass");
  });
});

describe("buildPublicMenuPageShellStyles", () => {
  it("returns template background only when no image is set", () => {
    const theme = resolvePublicMenuTheme({ public_menu_template: "modern_cafe" });
    const tokens = getPublicMenuTemplateTokens(theme);
    const bg = resolvePublicMenuBackground({});
    const shell = buildPublicMenuPageShellStyles(tokens.pageBackground, bg, "#b45309");
    expect(shell.root.background).toBe(tokens.pageBackground);
    expect(shell.backdrop).toBeUndefined();
    expect(shell.overlay).toBeUndefined();
  });

  it("layers image backdrop and overlay when configured", () => {
    const theme = resolvePublicMenuTheme({ public_menu_template: "brunch_editorial" });
    const tokens = getPublicMenuTemplateTokens(theme);
    const bg = resolvePublicMenuBackground({
      public_menu_background_image_url: "https://cdn.example.com/cafe.jpg",
      public_menu_background_mode: "cover",
      public_menu_background_overlay: "cream",
      public_menu_background_overlay_opacity: 50,
    });
    const shell = buildPublicMenuPageShellStyles(tokens.pageBackground, bg, "#b45309");
    expect(shell.backdrop?.backgroundImage).toContain("cafe.jpg");
    expect(shell.overlay?.background).toContain("rgba");
  });
});
