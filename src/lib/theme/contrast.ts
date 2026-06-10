/**
 * Contrast guardrails for restaurant theming.
 *
 * Restaurants pick arbitrary brand colors; the public menu must stay readable
 * no matter what. These helpers pick black/white text for a given background
 * using WCAG relative luminance, so a very light primary color never renders
 * white-on-white buttons (and vice versa).
 *
 * Pure functions, unit-tested, no DOM access.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses #rgb or #rrggbb. Returns null for anything else (never throws). */
export function parseHexColor(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }
  return null;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/**
 * Picks a readable text color (near-black or white) for the given background.
 * Unparseable input falls back to white text, matching the dark default
 * primary color (#111827).
 */
export function readableTextColor(backgroundHex: string): "#ffffff" | "#0f172a" {
  const rgb = parseHexColor(backgroundHex);
  if (!rgb) return "#ffffff";
  // 0.45 (rather than the midpoint 0.5) biases towards white text, which
  // reads better on mid-tone brand colors.
  return relativeLuminance(rgb) > 0.45 ? "#0f172a" : "#ffffff";
}

/** True when the color is too light to work as a tinted accent on white. */
export function isVeryLightColor(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) > 0.82;
}

/**
 * Brand color safe to use for text/accents on a light background: very light
 * brand colors fall back to a dark neutral so prices and headings stay
 * readable.
 */
export function safeAccentColor(brandHex: string): string {
  return isVeryLightColor(brandHex) ? "#0f172a" : brandHex;
}
