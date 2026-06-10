/**
 * Hand-written row types for the database schema in supabase/migrations.
 * Keep in sync with the SQL migrations.
 */

export const LANGUAGES = ["pt", "en", "es", "fr"] as const;
export type Language = (typeof LANGUAGES)[number];

export type UserRole = "platform_admin" | "restaurant_owner" | "restaurant_staff";
export type RestaurantStatus = "active" | "suspended" | "draft";
export type TableStatus = "active" | "inactive";
export type OrderStatus =
  | "pending_confirmation"
  | "new"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "rejected";
export type TableSessionStatus = "open" | "closed" | "cancelled";
export type AccessTokenStatus = "active" | "revoked" | "expired";
export type ImportBatchType = "menu_import" | "translation_import";
export type ImportBatchStatus = "preview" | "committed" | "failed" | "cancelled";
export type ImportRowStatus = "valid" | "invalid" | "warning";

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  restaurant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
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
  /** IANA timezone used to evaluate opening hours (default Europe/Lisbon). */
  timezone: string;
  created_at: string;
  updated_at: string;
}

/** Weekday convention: 0 = Sunday ... 6 = Saturday (matches Date#getDay). */
export interface RestaurantOpeningHourRow {
  id: string;
  restaurant_id: string;
  weekday: number;
  is_closed: boolean;
  /** "HH:MM:SS" (Postgres time). Null only when is_closed. */
  opens_at: string | null;
  closes_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTableRow {
  id: string;
  restaurant_id: string;
  table_number: string;
  public_token: string;
  label: string | null;
  status: TableStatus;
  created_at: string;
  updated_at: string;
}

export interface MenuCategoryRow {
  id: string;
  restaurant_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategoryTranslationRow {
  id: string;
  category_id: string;
  language: Language;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface MenuProductRow {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
  allergen_codes: string[];
  dietary_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MenuProductTranslationRow {
  id: string;
  product_id: string;
  language: Language;
  name: string;
  description: string | null;
  auto_translated: boolean;
  reviewed_by_restaurant: boolean;
  created_at: string;
  updated_at: string;
}

export interface AllergenRow {
  code: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  name_fr: string;
}

export interface OrderRow {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_session_id: string | null;
  status: OrderStatus;
  order_number: number | null;
  customer_note: string | null;
  client_order_token: string;
  created_at: string;
  updated_at: string;
}

export interface TableSessionRow {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: TableSessionStatus;
  opened_at: string;
  closed_at: string | null;
  opened_by: string | null;
  closed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TableSessionAccessTokenRow {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_session_id: string;
  token_hash: string;
  status: AccessTokenStatus;
  source_order_id: string | null;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  item_note: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  restaurant_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ImportBatchRow {
  id: string;
  restaurant_id: string;
  type: ImportBatchType;
  status: ImportBatchStatus;
  original_filename: string | null;
  summary: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  committed_at: string | null;
}

export interface ImportRowRow {
  id: string;
  import_batch_id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown>;
  status: ImportRowStatus;
  errors: string[];
  created_at: string;
}
