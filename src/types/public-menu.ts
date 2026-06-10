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
}

export interface PublicTableInfo {
  tableNumber: string;
  label: string | null;
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
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
}
