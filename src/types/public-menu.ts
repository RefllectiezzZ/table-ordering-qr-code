import type {
  PublicMenuBackgroundMode,
  PublicMenuBackgroundOverlay,
  PublicMenuBackgroundPosition,
  PublicMenuSurfaceStyle,
} from "@/lib/public-menu/background";
import type {
  PublicMenuBackgroundStyle,
  PublicMenuCardStyle,
  PublicMenuCartStyle,
  PublicMenuDensity,
  PublicMenuHeroStyle,
  PublicMenuTemplate,
} from "@/lib/public-menu/templates";
import type { Language, OrderStatus } from "@/types/database";

/**
 * Sanitized, public-safe data shapes served on /t/[token].
 * These must never contain staff data, tokens of other tables, internal
 * settings or anything belonging to another restaurant.
 */

export interface PublicRestaurantBranding {
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  backgroundColor: string;
  welcomeMessage: string | null;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  /** False while the restaurant has paused ordering (menu stays visible). */
  acceptsOrders: boolean;
  pausedMessage: string | null;
  /** Safe internal template preset (validated server-side). */
  publicMenuTemplate: PublicMenuTemplate;
  publicMenuDensity: PublicMenuDensity;
  publicMenuCardStyle: PublicMenuCardStyle;
  publicMenuHeroStyle: PublicMenuHeroStyle;
  publicMenuBackgroundStyle: PublicMenuBackgroundStyle;
  publicMenuCartStyle: PublicMenuCartStyle;
  publicMenuShowImages: boolean;
  /** Optional atmosphere background (does not override template colors). */
  publicMenuBackgroundImageUrl: string | null;
  publicMenuBackgroundMode: PublicMenuBackgroundMode;
  publicMenuBackgroundPosition: PublicMenuBackgroundPosition;
  publicMenuBackgroundOverlay: PublicMenuBackgroundOverlay;
  publicMenuBackgroundOverlayOpacity: number;
  publicMenuSurfaceStyle: PublicMenuSurfaceStyle;
}

export interface PublicTableInfo {
  tableNumber: string;
  label: string | null;
}

/**
 * Public-safe opening status, computed server-side in the restaurant's
 * timezone. Exposes only what the customer needs: whether ordering is open
 * right now and today's interval. "Not configured" is never surfaced to
 * customers (configured=false simply hides the badge and allows orders).
 */
export interface PublicOpeningInfo {
  configured: boolean;
  isOpenNow: boolean;
  today: { isClosed: boolean; opensAt: string | null; closesAt: string | null } | null;
}

export interface PublicProduct {
  id: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  allergenCodes: string[];
  dietaryTags: string[];
  sortOrder: number;
  translations: Partial<Record<Language, { name: string; description: string | null }>>;
}

export interface PublicCategory {
  id: string;
  sortOrder: number;
  translations: Partial<Record<Language, { name: string }>>;
  products: PublicProduct[];
}

export interface PublicMenuData {
  token: string;
  restaurant: PublicRestaurantBranding;
  table: PublicTableInfo;
  opening: PublicOpeningInfo;
  categories: PublicCategory[];
}

export type PublicMenuResolution =
  | { state: "ok"; data: PublicMenuData }
  | { state: "invalid_token" }
  | { state: "table_inactive" }
  | { state: "restaurant_unavailable" };

export interface PublicOrderSummary {
  orderId: string;
  shortCode: string;
  /** Kitchen-friendly per-restaurant number ("Pedido #104"). */
  orderNumber: number | null;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
}
