import type { CSSProperties } from "react";
import type { PublicMenuTemplateTokens } from "@/lib/public-menu/templates";

/**
 * Safe public menu background atmosphere settings.
 * Only validated URLs and enum values become CSS — no raw admin HTML/CSS.
 */

export const PUBLIC_MENU_BACKGROUND_MODES = [
  "cover",
  "repeat",
  "pattern",
  "blurred_cover",
] as const;
export type PublicMenuBackgroundMode = (typeof PUBLIC_MENU_BACKGROUND_MODES)[number];

export const PUBLIC_MENU_BACKGROUND_POSITIONS = ["center", "top", "bottom"] as const;
export type PublicMenuBackgroundPosition = (typeof PUBLIC_MENU_BACKGROUND_POSITIONS)[number];

export const PUBLIC_MENU_BACKGROUND_OVERLAYS = [
  "none",
  "light",
  "dark",
  "brand_tint",
  "cream",
] as const;
export type PublicMenuBackgroundOverlay = (typeof PUBLIC_MENU_BACKGROUND_OVERLAYS)[number];

export const PUBLIC_MENU_SURFACE_STYLES = [
  "solid",
  "glass",
  "paper",
  "dark_translucent",
] as const;
export type PublicMenuSurfaceStyle = (typeof PUBLIC_MENU_SURFACE_STYLES)[number];

export interface PublicMenuBackgroundSettings {
  imageUrl: string | null;
  mode: PublicMenuBackgroundMode;
  position: PublicMenuBackgroundPosition;
  overlay: PublicMenuBackgroundOverlay;
  overlayOpacity: number;
  surfaceStyle: PublicMenuSurfaceStyle;
}

function isAllowed<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function clampOpacity(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 60;
  return Math.min(90, Math.max(0, Math.round(n)));
}

/** Normalizes raw DB values with safe fallbacks. */
export function resolvePublicMenuBackground(input: Partial<{
  public_menu_background_image_url: string | null;
  public_menu_background_mode: string | null;
  public_menu_background_position: string | null;
  public_menu_background_overlay: string | null;
  public_menu_background_overlay_opacity: number | null;
  public_menu_surface_style: string | null;
}>): PublicMenuBackgroundSettings {
  return {
    imageUrl: input.public_menu_background_image_url?.trim() || null,
    mode: isAllowed(input.public_menu_background_mode, PUBLIC_MENU_BACKGROUND_MODES)
      ? input.public_menu_background_mode
      : "cover",
    position: isAllowed(input.public_menu_background_position, PUBLIC_MENU_BACKGROUND_POSITIONS)
      ? input.public_menu_background_position
      : "center",
    overlay: isAllowed(input.public_menu_background_overlay, PUBLIC_MENU_BACKGROUND_OVERLAYS)
      ? input.public_menu_background_overlay
      : "light",
    overlayOpacity: clampOpacity(input.public_menu_background_overlay_opacity),
    surfaceStyle: isAllowed(input.public_menu_surface_style, PUBLIC_MENU_SURFACE_STYLES)
      ? input.public_menu_surface_style
      : "solid",
  };
}

function overlayColor(
  overlay: PublicMenuBackgroundOverlay,
  primaryColor: string,
  opacity: number,
): string | null {
  if (overlay === "none" || opacity <= 0) return null;
  const alpha = opacity / 100;
  switch (overlay) {
    case "light":
      return `rgba(255, 255, 255, ${alpha})`;
    case "dark":
      return `rgba(15, 23, 42, ${alpha})`;
    case "cream":
      return `rgba(255, 251, 235, ${alpha})`;
    case "brand_tint": {
      const hex = primaryColor.replace("#", "");
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return `rgba(180, 83, 9, ${alpha * 0.35})`;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`;
    }
    default:
      return null;
  }
}

function backgroundPosition(position: PublicMenuBackgroundPosition): string {
  switch (position) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    default:
      return "center center";
  }
}

export interface PublicMenuPageShellStyles {
  /** Applied to the root main element. */
  root: CSSProperties;
  /** Full-bleed background layer (image + template fallback). */
  backdrop?: CSSProperties;
  /** Tint overlay on top of the backdrop. */
  overlay?: CSSProperties;
}

/**
 * Builds safe inline styles for the public menu page shell.
 * Template pageBackground is always the base; an admin image layers on top.
 */
export function buildPublicMenuPageShellStyles(
  templateBackground: string,
  background: PublicMenuBackgroundSettings,
  primaryColor: string,
): PublicMenuPageShellStyles {
  const root: CSSProperties = {
    position: "relative",
    isolation: "isolate",
    background: templateBackground,
  };

  if (!background.imageUrl) {
    return { root };
  }

  const safeUrl = background.imageUrl.replace(/"/g, "%22");
  const pos = backgroundPosition(background.position);

  let backdrop: CSSProperties;
  switch (background.mode) {
    case "repeat":
      backdrop = {
        backgroundImage: `url("${safeUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        backgroundPosition: pos,
      };
      break;
    case "pattern":
      backdrop = {
        backgroundImage: `url("${safeUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "280px",
        backgroundPosition: pos,
      };
      break;
    case "blurred_cover":
      backdrop = {
        backgroundImage: `url("${safeUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: pos,
        filter: "blur(18px) saturate(1.1)",
        transform: "scale(1.08)",
      };
      break;
    case "cover":
    default:
      backdrop = {
        backgroundImage: `url("${safeUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: pos,
        backgroundRepeat: "no-repeat",
      };
      break;
  }

  const overlayTint = overlayColor(background.overlay, primaryColor, background.overlayOpacity);
  const overlay = overlayTint
    ? { background: overlayTint }
    : undefined;

  return { root, backdrop, overlay };
}

/** Adjusts template surface tokens for the selected surface style. */
export function applySurfaceStyleToTokens(
  tokens: PublicMenuTemplateTokens,
  surfaceStyle: PublicMenuSurfaceStyle,
  isDark: boolean,
): PublicMenuTemplateTokens {
  const next = { ...tokens };

  switch (surfaceStyle) {
    case "glass":
      next.surface = isDark ? "rgba(28, 25, 23, 0.72)" : "rgba(255, 255, 255, 0.82)";
      next.surfaceBorder = isDark ? "rgba(250, 250, 249, 0.14)" : "rgba(255, 255, 255, 0.65)";
      next.surfaceShadow = isDark
        ? "0 8px 32px rgba(0,0,0,0.35)"
        : "0 8px 32px rgba(15, 23, 42, 0.08)";
      next.identityCardBg = isDark ? "rgba(28, 25, 23, 0.78)" : "rgba(255, 255, 255, 0.88)";
      next.identityCardBorder = isDark
        ? "rgba(250, 250, 249, 0.12)"
        : "rgba(255, 255, 255, 0.7)";
      next.categoryRailBg = isDark ? "rgba(12, 10, 9, 0.75)" : "rgba(255, 255, 255, 0.82)";
      next.cartBarBg = isDark ? "rgba(12, 10, 9, 0.88)" : "rgba(255, 255, 255, 0.92)";
      break;
    case "paper":
      next.surface = isDark ? "rgba(41, 37, 36, 0.94)" : "#fffdf8";
      next.surfaceBorder = isDark ? "rgba(214, 211, 209, 0.15)" : "rgba(120, 53, 15, 0.08)";
      next.surfaceShadow = "0 10px 30px rgba(120, 53, 15, 0.1)";
      next.identityCardBg = isDark ? "rgba(41, 37, 36, 0.96)" : "#fffdf8";
      next.identityCardBorder = isDark
        ? "rgba(214, 211, 209, 0.12)"
        : "rgba(120, 53, 15, 0.1)";
      break;
    case "dark_translucent":
      next.surface = "rgba(15, 23, 42, 0.82)";
      next.surfaceBorder = "rgba(248, 250, 252, 0.1)";
      next.surfaceShadow = "0 12px 40px rgba(0,0,0,0.4)";
      next.identityCardBg = "rgba(15, 23, 42, 0.88)";
      next.identityCardBorder = "rgba(248, 250, 252, 0.1)";
      next.categoryRailBg = "rgba(15, 23, 42, 0.85)";
      next.textPrimary = "#f8fafc";
      next.textSecondary = "#cbd5e1";
      next.textMuted = "#94a3b8";
      next.isDark = true;
      break;
    case "solid":
    default:
      break;
  }

  return next;
}
