import "server-only";

import { evaluateOpeningHours } from "@/lib/opening-hours";
import { resolvePublicMenuBackground } from "@/lib/public-menu/background";
import { resolvePublicMenuTheme } from "@/lib/public-menu/templates";
import { isValidPublicTokenFormat } from "@/lib/security/tokens";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { fetchOpeningHours } from "@/server/opening-hours";
import type { Language } from "@/types/database";
import type {
  PublicCategory,
  PublicMenuResolution,
  PublicProduct,
} from "@/types/public-menu";

interface TableTokenRow {
  id: string;
  restaurant_id: string;
  table_number: string;
  label: string | null;
  status: string;
}

interface PublicRestaurantRow {
  id: string;
  name: string;
  status: string;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  background_color: string;
  welcome_message: string | null;
  default_language: Language;
  enabled_languages: Language[];
  accepts_orders: boolean;
  paused_message: string | null;
  timezone: string;
  public_menu_template: string;
  public_menu_density: string;
  public_menu_card_style: string;
  public_menu_hero_style: string;
  public_menu_background_style: string;
  public_menu_cart_style: string;
  public_menu_show_images: boolean;
  public_menu_background_image_url: string | null;
  public_menu_background_mode: string;
  public_menu_background_position: string;
  public_menu_background_overlay: string;
  public_menu_background_overlay_opacity: number;
  public_menu_surface_style: string;
}

/**
 * Resolves a public QR token into the sanitized menu payload for /t/[token].
 *
 * Uses the service-role client (anon has NO table access by design), so the
 * field selection here is the public API surface: only branding, table
 * number/label, active categories and active products with translations.
 * Never staff data, never other restaurants, never other tables' tokens.
 */
export async function resolvePublicMenu(token: string): Promise<PublicMenuResolution> {
  if (!isValidPublicTokenFormat(token)) {
    return { state: "invalid_token" };
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, table_number, label, status")
    .eq("public_token", token)
    .maybeSingle<TableTokenRow>();

  if (!table) return { state: "invalid_token" };
  if (table.status !== "active") return { state: "table_inactive" };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, name, status, logo_url, cover_image_url, primary_color, secondary_color, background_color, welcome_message, default_language, enabled_languages, accepts_orders, paused_message, timezone, public_menu_template, public_menu_density, public_menu_card_style, public_menu_hero_style, public_menu_background_style, public_menu_cart_style, public_menu_show_images, public_menu_background_image_url, public_menu_background_mode, public_menu_background_position, public_menu_background_overlay, public_menu_background_overlay_opacity, public_menu_surface_style",
    )
    .eq("id", table.restaurant_id)
    .maybeSingle<PublicRestaurantRow>();

  if (!restaurant) return { state: "invalid_token" };
  if (restaurant.status !== "active") return { state: "restaurant_unavailable" };

  const [{ data: categories }, { data: products }, openingHours] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, sort_order, menu_category_translations(language, name)")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_products")
      .select(
        "id, category_id, price_cents, image_url, is_available, sort_order, allergen_codes, dietary_tags, menu_product_translations(language, name, description)",
      )
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    fetchOpeningHours(supabase, restaurant.id),
  ]);

  // Opening status is evaluated server-side in the restaurant's timezone;
  // only the public-safe summary leaves this function.
  const opening = evaluateOpeningHours(openingHours, new Date(), restaurant.timezone);

  type CategoryQueryRow = {
    id: string;
    sort_order: number;
    menu_category_translations: { language: Language; name: string }[];
  };
  type ProductQueryRow = {
    id: string;
    category_id: string | null;
    price_cents: number;
    image_url: string | null;
    is_available: boolean;
    sort_order: number;
    allergen_codes: string[];
    dietary_tags: string[];
    menu_product_translations: {
      language: Language;
      name: string;
      description: string | null;
    }[];
  };

  const publicProducts = new Map<string | null, PublicProduct[]>();
  for (const product of (products ?? []) as ProductQueryRow[]) {
    const translations: PublicProduct["translations"] = {};
    for (const t of product.menu_product_translations) {
      translations[t.language] = { name: t.name, description: t.description };
    }
    const entry: PublicProduct = {
      id: product.id,
      priceCents: product.price_cents,
      imageUrl: product.image_url,
      isAvailable: product.is_available,
      allergenCodes: product.allergen_codes,
      dietaryTags: product.dietary_tags,
      sortOrder: product.sort_order,
      translations,
    };
    const list = publicProducts.get(product.category_id) ?? [];
    list.push(entry);
    publicProducts.set(product.category_id, list);
  }

  const publicCategories: PublicCategory[] = [];
  for (const category of (categories ?? []) as CategoryQueryRow[]) {
    const translations: PublicCategory["translations"] = {};
    for (const t of category.menu_category_translations) {
      translations[t.language] = { name: t.name };
    }
    publicCategories.push({
      id: category.id,
      sortOrder: category.sort_order,
      translations,
      products: publicProducts.get(category.id) ?? [],
    });
  }

  // Products without a category (category deleted/inactive) still show up in
  // a synthetic "uncategorized" bucket so the menu never silently loses items.
  const uncategorized = [
    ...(publicProducts.get(null) ?? []),
    ...[...publicProducts.entries()]
      .filter(
        ([categoryId]) =>
          categoryId !== null && !publicCategories.some((c) => c.id === categoryId),
      )
      .flatMap(([, list]) => list),
  ];
  if (uncategorized.length > 0) {
    publicCategories.push({
      id: "uncategorized",
      sortOrder: Number.MAX_SAFE_INTEGER,
      translations: {
        pt: { name: "Outros" },
        en: { name: "Other" },
        es: { name: "Otros" },
        fr: { name: "Autres" },
      },
      products: uncategorized,
    });
  }

  const enabledLanguages =
    restaurant.enabled_languages.length > 0
      ? restaurant.enabled_languages
      : [restaurant.default_language];

  const theme = resolvePublicMenuTheme({
    public_menu_template: restaurant.public_menu_template,
    public_menu_density: restaurant.public_menu_density,
    public_menu_card_style: restaurant.public_menu_card_style,
    public_menu_hero_style: restaurant.public_menu_hero_style,
    public_menu_background_style: restaurant.public_menu_background_style,
    public_menu_cart_style: restaurant.public_menu_cart_style,
    public_menu_show_images: restaurant.public_menu_show_images,
  });
  const background = resolvePublicMenuBackground({
    public_menu_background_image_url: restaurant.public_menu_background_image_url,
    public_menu_background_mode: restaurant.public_menu_background_mode,
    public_menu_background_position: restaurant.public_menu_background_position,
    public_menu_background_overlay: restaurant.public_menu_background_overlay,
    public_menu_background_overlay_opacity: restaurant.public_menu_background_overlay_opacity,
    public_menu_surface_style: restaurant.public_menu_surface_style,
  });

  return {
    state: "ok",
    data: {
      token,
      restaurant: {
        name: restaurant.name,
        logoUrl: restaurant.logo_url,
        coverImageUrl: restaurant.cover_image_url,
        primaryColor: restaurant.primary_color,
        secondaryColor: restaurant.secondary_color,
        backgroundColor: restaurant.background_color,
        welcomeMessage: restaurant.welcome_message,
        defaultLanguage: restaurant.default_language,
        enabledLanguages,
        acceptsOrders: restaurant.accepts_orders,
        pausedMessage: restaurant.paused_message,
        publicMenuTemplate: theme.template,
        publicMenuDensity: theme.density,
        publicMenuCardStyle: theme.cardStyle,
        publicMenuHeroStyle: theme.heroStyle,
        publicMenuBackgroundStyle: theme.backgroundStyle,
        publicMenuCartStyle: theme.cartStyle,
        publicMenuShowImages: theme.showImages,
        publicMenuBackgroundImageUrl: background.imageUrl,
        publicMenuBackgroundMode: background.mode,
        publicMenuBackgroundPosition: background.position,
        publicMenuBackgroundOverlay: background.overlay,
        publicMenuBackgroundOverlayOpacity: background.overlayOpacity,
        publicMenuSurfaceStyle: background.surfaceStyle,
      },
      table: {
        tableNumber: table.table_number,
        label: table.label,
      },
      opening: {
        configured: opening.configured,
        isOpenNow: opening.isOpenNow,
        today: opening.today,
      },
      categories: publicCategories.filter((c) => c.products.length > 0),
    },
  };
}
