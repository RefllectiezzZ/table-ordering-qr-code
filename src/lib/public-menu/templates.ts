/**
 * Safe internal template presets for the public QR menu (/t/[token]).
 * Each template defines visual tokens; order logic stays shared.
 */

export const PUBLIC_MENU_TEMPLATES = [
  "brunch_editorial",
  "fine_dining_dark",
  "modern_cafe",
  "street_food_bold",
  "minimal_clean",
] as const;

export type PublicMenuTemplate = (typeof PUBLIC_MENU_TEMPLATES)[number];

export const PUBLIC_MENU_DENSITIES = ["compact", "comfortable", "spacious"] as const;
export type PublicMenuDensity = (typeof PUBLIC_MENU_DENSITIES)[number];

export const PUBLIC_MENU_CARD_STYLES = [
  "image_right",
  "image_left",
  "image_top",
  "text_only_elegant",
] as const;
export type PublicMenuCardStyle = (typeof PUBLIC_MENU_CARD_STYLES)[number];

export const PUBLIC_MENU_HERO_STYLES = [
  "editorial",
  "immersive_cover",
  "compact_card",
  "split_brand",
] as const;
export type PublicMenuHeroStyle = (typeof PUBLIC_MENU_HERO_STYLES)[number];

export const PUBLIC_MENU_BACKGROUND_STYLES = [
  "soft_gradient",
  "paper_texture",
  "dark_luxury",
  "clean_white",
  "bold_blocks",
] as const;
export type PublicMenuBackgroundStyle = (typeof PUBLIC_MENU_BACKGROUND_STYLES)[number];

export const PUBLIC_MENU_CART_STYLES = ["floating_glass", "bottom_bar", "drawer_card"] as const;
export type PublicMenuCartStyle = (typeof PUBLIC_MENU_CART_STYLES)[number];

export interface PublicMenuThemeSettings {
  template: PublicMenuTemplate;
  density: PublicMenuDensity;
  cardStyle: PublicMenuCardStyle;
  heroStyle: PublicMenuHeroStyle;
  backgroundStyle: PublicMenuBackgroundStyle;
  cartStyle: PublicMenuCartStyle;
  showImages: boolean;
}

export interface PublicMenuTemplateTokens {
  /** Root page background (CSS value). */
  pageBackground: string;
  /** Text on the main surface. */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Card / panel surfaces. */
  surface: string;
  surfaceBorder: string;
  surfaceShadow: string;
  /** Category rail. */
  categoryRailBg: string;
  categoryPillInactive: string;
  categoryPillActiveShadow: string;
  /** Hero treatment hints. */
  heroOverlay: string;
  identityCardBg: string;
  identityCardBorder: string;
  /** Product card. */
  cardRadius: string;
  cardHoverShadow: string;
  priceWeight: string;
  ctaRadius: string;
  ctaShadow: string;
  placeholderStyle: "brunch" | "fine_dining" | "modern" | "street" | "minimal";
  /** Banner tones. */
  bannerClosed: string;
  bannerPaused: string;
  /** Cart bar. */
  cartBarBg: string;
  cartBarText: string;
  cartBarSubtext: string;
  /** Status panel. */
  statusPendingBg: string;
  statusConfirmedBg: string;
  /** Spacing scale keyed by density. */
  sectionGap: string;
  cardPadding: string;
  heroHeight: string;
  isDark: boolean;
}

const DENSITY_TOKENS: Record<
  PublicMenuDensity,
  Pick<PublicMenuTemplateTokens, "sectionGap" | "cardPadding" | "heroHeight">
> = {
  compact: { sectionGap: "mb-6", cardPadding: "p-3.5", heroHeight: "h-32 sm:h-40" },
  comfortable: { sectionGap: "mb-8", cardPadding: "p-4", heroHeight: "h-44 sm:h-56" },
  spacious: { sectionGap: "mb-10", cardPadding: "p-5", heroHeight: "h-48 sm:h-64" },
};

function baseTokens(
  template: PublicMenuTemplate,
  density: PublicMenuDensity,
): PublicMenuTemplateTokens {
  const d = DENSITY_TOKENS[density];

  switch (template) {
    case "fine_dining_dark":
      return {
        pageBackground:
          "linear-gradient(165deg, #0c0a09 0%, #1c1917 45%, #292524 100%)",
        textPrimary: "#fafaf9",
        textSecondary: "#d6d3d1",
        textMuted: "#a8a29e",
        surface: "rgba(28, 25, 23, 0.92)",
        surfaceBorder: "rgba(250, 250, 249, 0.08)",
        surfaceShadow: "0 8px 32px rgba(0,0,0,0.45)",
        categoryRailBg: "rgba(12, 10, 9, 0.88)",
        categoryPillInactive:
          "border border-stone-600/40 bg-stone-900/60 text-stone-300",
        categoryPillActiveShadow: "0 2px 12px rgba(0,0,0,0.4)",
        heroOverlay:
          "linear-gradient(to top, rgba(12,10,9,0.92) 0%, rgba(12,10,9,0.35) 55%, transparent 100%)",
        identityCardBg: "rgba(28, 25, 23, 0.95)",
        identityCardBorder: "rgba(214, 211, 209, 0.12)",
        cardRadius: "rounded-xl",
        cardHoverShadow: "hover:shadow-lg hover:shadow-black/30",
        priceWeight: "font-light tracking-wide",
        ctaRadius: "rounded-sm",
        ctaShadow: "shadow-md shadow-black/40",
        placeholderStyle: "fine_dining",
        bannerClosed: "border-stone-700 bg-stone-900/80 text-stone-200",
        bannerPaused: "border-amber-900/50 bg-amber-950/60 text-amber-100",
        cartBarBg: "rgba(12, 10, 9, 0.96)",
        cartBarText: "#fafaf9",
        cartBarSubtext: "#a8a29e",
        statusPendingBg: "border-stone-600 bg-stone-900/90",
        statusConfirmedBg: "border-emerald-900/50 bg-emerald-950/50",
        ...d,
        isDark: true,
      };
    case "modern_cafe":
      return {
        pageBackground: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        textMuted: "#94a3b8",
        surface: "#ffffff",
        surfaceBorder: "rgba(15, 23, 42, 0.06)",
        surfaceShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
        categoryRailBg: "rgba(255, 255, 255, 0.92)",
        categoryPillInactive: "border border-slate-200 bg-white text-slate-600",
        categoryPillActiveShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
        heroOverlay:
          "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)",
        identityCardBg: "#ffffff",
        identityCardBorder: "rgba(15, 23, 42, 0.06)",
        cardRadius: "rounded-2xl",
        cardHoverShadow: "hover:shadow-xl hover:shadow-slate-200/80",
        priceWeight: "font-bold",
        ctaRadius: "rounded-full",
        ctaShadow: "shadow-sm",
        placeholderStyle: "modern",
        bannerClosed: "border-slate-200 bg-slate-50 text-slate-700",
        bannerPaused: "border-amber-200 bg-amber-50 text-amber-900",
        cartBarBg: "#ffffff",
        cartBarText: "#0f172a",
        cartBarSubtext: "#64748b",
        statusPendingBg: "border-violet-200 bg-violet-50",
        statusConfirmedBg: "border-emerald-200 bg-emerald-50",
        ...d,
        isDark: false,
      };
    case "street_food_bold":
      return {
        pageBackground:
          "linear-gradient(135deg, #fef3c7 0%, #fff7ed 40%, #fef2f2 100%)",
        textPrimary: "#1c1917",
        textSecondary: "#44403c",
        textMuted: "#78716c",
        surface: "#ffffff",
        surfaceBorder: "rgba(28, 25, 23, 0.1)",
        surfaceShadow: "0 6px 0 rgba(28, 25, 23, 0.08)",
        categoryRailBg: "rgba(255, 251, 235, 0.95)",
        categoryPillInactive:
          "border-2 border-stone-900/15 bg-white text-stone-800 font-bold",
        categoryPillActiveShadow: "0 4px 0 rgba(0,0,0,0.15)",
        heroOverlay:
          "linear-gradient(to top, rgba(28,25,23,0.75) 0%, transparent 70%)",
        identityCardBg: "#ffffff",
        identityCardBorder: "2px solid rgba(28, 25, 23, 0.12)",
        cardRadius: "rounded-2xl",
        cardHoverShadow: "hover:-translate-y-0.5 hover:shadow-lg transition-transform",
        priceWeight: "font-black text-lg",
        ctaRadius: "rounded-xl",
        ctaShadow: "shadow-[0_4px_0_rgba(0,0,0,0.2)]",
        placeholderStyle: "street",
        bannerClosed: "border-stone-300 bg-stone-100 text-stone-800",
        bannerPaused: "border-orange-300 bg-orange-100 text-orange-950",
        cartBarBg: "#1c1917",
        cartBarText: "#ffffff",
        cartBarSubtext: "#d6d3d1",
        statusPendingBg: "border-orange-300 bg-orange-50",
        statusConfirmedBg: "border-lime-400 bg-lime-50",
        ...d,
        isDark: false,
      };
    case "minimal_clean":
      return {
        pageBackground: "#fafafa",
        textPrimary: "#171717",
        textSecondary: "#525252",
        textMuted: "#a3a3a3",
        surface: "#ffffff",
        surfaceBorder: "rgba(23, 23, 23, 0.06)",
        surfaceShadow: "none",
        categoryRailBg: "rgba(250, 250, 250, 0.95)",
        categoryPillInactive: "border-b-2 border-transparent text-neutral-500",
        categoryPillActiveShadow: "none",
        heroOverlay: "none",
        identityCardBg: "transparent",
        identityCardBorder: "transparent",
        cardRadius: "rounded-lg",
        cardHoverShadow: "",
        priceWeight: "font-semibold tabular-nums",
        ctaRadius: "rounded-md",
        ctaShadow: "",
        placeholderStyle: "minimal",
        bannerClosed: "border-neutral-200 bg-neutral-50 text-neutral-700",
        bannerPaused: "border-neutral-300 bg-neutral-100 text-neutral-800",
        cartBarBg: "#171717",
        cartBarText: "#fafafa",
        cartBarSubtext: "#a3a3a3",
        statusPendingBg: "border-neutral-300 bg-neutral-50",
        statusConfirmedBg: "border-neutral-300 bg-white",
        ...d,
        isDark: false,
      };
    case "brunch_editorial":
    default:
      return {
        pageBackground:
          "linear-gradient(165deg, #fffbeb 0%, #fef3c7 35%, #fff7ed 100%)",
        textPrimary: "#292524",
        textSecondary: "#57534e",
        textMuted: "#a8a29e",
        surface: "#ffffff",
        surfaceBorder: "rgba(41, 37, 36, 0.06)",
        surfaceShadow: "0 8px 30px rgba(120, 53, 15, 0.08)",
        categoryRailBg: "rgba(255, 251, 235, 0.9)",
        categoryPillInactive: "border border-amber-200/80 bg-white/90 text-stone-600",
        categoryPillActiveShadow: "0 2px 10px rgba(180, 83, 9, 0.25)",
        heroOverlay:
          "linear-gradient(to top, rgba(41,37,36,0.55) 0%, rgba(41,37,36,0.1) 50%, transparent 100%)",
        identityCardBg: "#ffffff",
        identityCardBorder: "rgba(41, 37, 36, 0.06)",
        cardRadius: "rounded-3xl",
        cardHoverShadow: "hover:shadow-xl hover:shadow-amber-900/10",
        priceWeight: "font-extrabold",
        ctaRadius: "rounded-full",
        ctaShadow: "shadow-md shadow-amber-900/15",
        placeholderStyle: "brunch",
        bannerClosed: "border-stone-200 bg-white/90 text-stone-700",
        bannerPaused: "border-amber-200 bg-amber-50 text-amber-900",
        cartBarBg: "rgba(41, 37, 36, 0.94)",
        cartBarText: "#fffbeb",
        cartBarSubtext: "#d6d3d1",
        statusPendingBg: "border-violet-200 bg-violet-50",
        statusConfirmedBg: "border-emerald-200 bg-emerald-50",
        ...d,
        isDark: false,
      };
  }
}

function isAllowed<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/** Normalizes raw DB values with safe fallbacks — public menu must never crash. */
export function resolvePublicMenuTheme(input: Partial<{
  public_menu_template: string | null;
  public_menu_density: string | null;
  public_menu_card_style: string | null;
  public_menu_hero_style: string | null;
  public_menu_background_style: string | null;
  public_menu_cart_style: string | null;
  public_menu_show_images: boolean | null;
}>): PublicMenuThemeSettings {
  const template = isAllowed(input.public_menu_template, PUBLIC_MENU_TEMPLATES)
    ? input.public_menu_template
    : "brunch_editorial";
  const density = isAllowed(input.public_menu_density, PUBLIC_MENU_DENSITIES)
    ? input.public_menu_density
    : "comfortable";
  const cardStyle = isAllowed(input.public_menu_card_style, PUBLIC_MENU_CARD_STYLES)
    ? input.public_menu_card_style
    : "image_right";
  const heroStyle = isAllowed(input.public_menu_hero_style, PUBLIC_MENU_HERO_STYLES)
    ? input.public_menu_hero_style
    : "editorial";
  const backgroundStyle = isAllowed(
    input.public_menu_background_style,
    PUBLIC_MENU_BACKGROUND_STYLES,
  )
    ? input.public_menu_background_style
    : "soft_gradient";
  const cartStyle = isAllowed(input.public_menu_cart_style, PUBLIC_MENU_CART_STYLES)
    ? input.public_menu_cart_style
    : "floating_glass";
  const showImages = input.public_menu_show_images !== false;

  return {
    template,
    density,
    cardStyle,
    heroStyle,
    backgroundStyle,
    cartStyle,
    showImages,
  };
}

export function getPublicMenuTemplateTokens(
  settings: PublicMenuThemeSettings,
): PublicMenuTemplateTokens {
  const tokens = baseTokens(settings.template, settings.density);

  // Background style overrides the page background within each template family.
  switch (settings.backgroundStyle) {
    case "dark_luxury":
      if (!tokens.isDark) {
        tokens.pageBackground =
          "linear-gradient(165deg, #18181b 0%, #27272a 50%, #3f3f46 100%)";
        tokens.textPrimary = "#fafafa";
        tokens.textSecondary = "#d4d4d8";
        tokens.textMuted = "#a1a1aa";
        tokens.surface = "rgba(39, 39, 42, 0.95)";
        tokens.isDark = true;
      }
      break;
    case "clean_white":
      tokens.pageBackground = "#ffffff";
      break;
    case "paper_texture":
      tokens.pageBackground =
        "linear-gradient(180deg, #faf8f5 0%, #f5f0e8 100%), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120,53,15,0.02) 2px, rgba(120,53,15,0.02) 4px)";
      break;
    case "bold_blocks":
      if (settings.template === "street_food_bold") {
        tokens.pageBackground =
          "linear-gradient(90deg, #fef08a 0%, #fef08a 33%, #fed7aa 33%, #fed7aa 66%, #fecaca 66%, #fecaca 100%)";
      }
      break;
    case "soft_gradient":
    default:
      break;
  }

  return tokens;
}

export const PUBLIC_MENU_TEMPLATE_LABELS: Record<
  PublicMenuTemplate,
  { en: string; pt: string; intent: string }
> = {
  brunch_editorial: {
    en: "Brunch editorial",
    pt: "Brunch editorial",
    intent: "Warm, magazine-like — cafés, bakeries, breakfast spots",
  },
  fine_dining_dark: {
    en: "Fine dining dark",
    pt: "Fine dining escuro",
    intent: "Dark luxury — premium restaurants, wine bars",
  },
  modern_cafe: {
    en: "Modern café",
    pt: "Café moderno",
    intent: "Clean and bright — casual lunch spots",
  },
  street_food_bold: {
    en: "Street food bold",
    pt: "Street food bold",
    intent: "Energetic blocks — burgers, tacos, pizza",
  },
  minimal_clean: {
    en: "Minimal clean",
    pt: "Minimal clean",
    intent: "Text-first clarity — simple menus without photos",
  },
};
