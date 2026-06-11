import { z } from "zod";
import { ALLERGEN_CODES } from "@/lib/allergens";
import { ORDER_STATUSES } from "@/lib/orders";

/**
 * Zod schemas for every POST body. Server-side validation is mandatory:
 * restaurant_id, table_id, prices, roles and statuses are NEVER taken from
 * the client — they are derived from the session or the QR token.
 */

export const languageSchema = z.enum(["pt", "en", "es", "fr"]);

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #1a2b3c");

const optionalHttpUrl = z
  .union([z.literal(""), z.url().max(500).refine((u) => /^https?:\/\//.test(u), "Must be http(s)")])
  .optional()
  .transform((v) => (v ? v : null));

const optionalShortText = (max: number) =>
  z
    .union([z.literal(""), z.string().max(max)])
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

const translationNameSchema = z.string().trim().min(1).max(120);

/** Per-language name map; at least one language must be provided. */
const categoryTranslationsSchema = z
  .object({
    pt: translationNameSchema.optional(),
    en: translationNameSchema.optional(),
    es: translationNameSchema.optional(),
    fr: translationNameSchema.optional(),
  })
  .refine((t) => Object.values(t).some(Boolean), {
    message: "Provide a name in at least one language.",
  });

const productTranslationSchema = z.object({
  name: translationNameSchema,
  description: optionalShortText(600),
});

/**
 * Portuguese is the base language: every product must have a PT name. The
 * other languages are optional translations and never block creation.
 */
const productTranslationsSchema = z
  .object({
    pt: productTranslationSchema.optional(),
    en: productTranslationSchema.optional(),
    es: productTranslationSchema.optional(),
    fr: productTranslationSchema.optional(),
  })
  .refine((t) => Boolean(t.pt?.name?.trim()), {
    message: "O nome em português é obrigatório (idioma base).",
  });

// ---------------------------------------------------------------------------
// Public order submission
// ---------------------------------------------------------------------------
export const publicOrderSchema = z.object({
  table_token: z
    .string()
    .min(10)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/),
  client_order_token: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
  /**
   * Optional browser authorization token granted after staff confirmed this
   * device's first order. Validated server-side against the stored hash; a
   * missing or invalid token simply means the order starts as
   * pending_confirmation — never an information leak.
   */
  session_token: z
    .union([z.literal(""), z.string().min(32).max(64).regex(/^[A-Za-z0-9_-]+$/)])
    .optional()
    .transform((v) => (v ? v : null)),
  customer_note: optionalShortText(500),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: z.number().int().min(1).max(50),
        item_note: optionalShortText(300),
      }),
    )
    .min(1)
    .max(50),
});
export type PublicOrderInput = z.infer<typeof publicOrderSchema>;

/** Public order status poll (query params, re-validated as a schema). */
export const publicOrderStatusQuerySchema = z.object({
  table_token: z
    .string()
    .min(10)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/),
  client_order_token: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
});

// ---------------------------------------------------------------------------
// Restaurant: orders
// ---------------------------------------------------------------------------
export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

// ---------------------------------------------------------------------------
// Restaurant: table sessions
// ---------------------------------------------------------------------------
export const tableSessionCloseSchema = z.object({
  /**
   * Closing a session that still has open (not delivered/cancelled) orders is
   * blocked unless the staff member explicitly confirms with force=true after
   * seeing the warning.
   */
  force: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// Restaurant: order availability (pause ordering)
// ---------------------------------------------------------------------------
export const ordersAvailabilitySchema = z.object({
  accepts_orders: z.boolean(),
  paused_message: optionalShortText(300),
});

export const orderConfirmationSchema = z.object({
  require_order_confirmation: z.boolean(),
});

// ---------------------------------------------------------------------------
// Platform admin: order retention cleanup
// ---------------------------------------------------------------------------
export const ordersCleanupPreviewSchema = z.object({
  retention_days: z
    .number()
    .int()
    .min(30, "Minimum retention is 30 days"),
});

/** @deprecated Use ordersCleanupPreviewSchema — kept as alias for preview-only calls. */
export const ordersCleanupSchema = ordersCleanupPreviewSchema;

export const ORDERS_CLEANUP_CONFIRM_TEXT = "APAGAR PEDIDOS ANTIGOS" as const;

export const ordersCleanupExecuteSchema = ordersCleanupPreviewSchema.extend({
  confirm_text: z.literal(ORDERS_CLEANUP_CONFIRM_TEXT),
});

// ---------------------------------------------------------------------------
// Restaurant: opening hours
// One interval per weekday; closes_at <= opens_at means overnight (the
// interval spills into the next day). Times are validated server-side and
// evaluated in the restaurant's timezone — never on the client clock.
// ---------------------------------------------------------------------------
const timeHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM (24h).");

const optionalTimeHHMM = z
  .union([z.literal(""), z.null(), timeHHMM])
  .optional()
  .transform((v) => (v ? v : null));

const openingHourDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    is_closed: z.boolean(),
    opens_at: optionalTimeHHMM,
    closes_at: optionalTimeHHMM,
    notes: optionalShortText(200),
  })
  .refine(
    (d) =>
      d.is_closed ||
      (d.opens_at !== null && d.closes_at !== null && d.opens_at !== d.closes_at),
    {
      message:
        "Dias abertos precisam de hora de abertura e de fecho (diferentes entre si).",
    },
  );

export const openingHoursUpdateSchema = z
  .object({
    days: z.array(openingHourDaySchema).min(1).max(7),
  })
  .refine(
    (data) => new Set(data.days.map((d) => d.weekday)).size === data.days.length,
    { message: "Cada dia da semana só pode aparecer uma vez." },
  );
export type OpeningHoursUpdateInput = z.infer<typeof openingHoursUpdateSchema>;

// ---------------------------------------------------------------------------
// Restaurant: categories
// ---------------------------------------------------------------------------
export const categoryCreateSchema = z.object({
  sort_order: z.number().int().min(0).max(10000).optional().default(0),
  is_active: z.boolean().optional().default(true),
  translations: categoryTranslationsSchema,
});

export const categoryUpdateSchema = z.object({
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional(),
  translations: categoryTranslationsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Restaurant: products
// ---------------------------------------------------------------------------
const allergenCodesSchema = z
  .array(z.enum(ALLERGEN_CODES))
  .max(ALLERGEN_CODES.length)
  .optional()
  .default([]);

const dietaryTagsSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(10)
  .optional()
  .default([]);

export const productCreateSchema = z.object({
  category_id: z.uuid().nullable().optional().default(null),
  price_cents: z.number().int().min(0).max(100_000_000),
  image_url: optionalHttpUrl,
  is_available: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(10000).optional().default(0),
  allergen_codes: allergenCodesSchema,
  dietary_tags: dietaryTagsSchema,
  translations: productTranslationsSchema,
});

export const productUpdateSchema = z.object({
  category_id: z.uuid().nullable().optional(),
  price_cents: z.number().int().min(0).max(100_000_000).optional(),
  image_url: optionalHttpUrl,
  is_available: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  allergen_codes: z.array(z.enum(ALLERGEN_CODES)).max(ALLERGEN_CODES.length).optional(),
  dietary_tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  translations: productTranslationsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Restaurant: tables
// ---------------------------------------------------------------------------
export const tableCreateSchema = z.object({
  table_number: z.string().trim().min(1).max(20),
  label: optionalShortText(60),
});

export const tableUpdateSchema = z.object({
  label: optionalShortText(60),
  status: z.enum(["active", "inactive"]).optional(),
});

// ---------------------------------------------------------------------------
// Restaurant: branding
// ---------------------------------------------------------------------------
export const brandingUpdateSchema = z
  .object({
    logo_url: optionalHttpUrl,
    cover_image_url: optionalHttpUrl,
    primary_color: hexColorSchema.optional(),
    secondary_color: hexColorSchema.nullable().optional(),
    background_color: hexColorSchema.optional(),
    welcome_message: optionalShortText(300),
    default_language: languageSchema.optional(),
    enabled_languages: z.array(languageSchema).min(1).max(4).optional(),
  })
  .refine(
    (data) =>
      !data.enabled_languages ||
      !data.default_language ||
      data.enabled_languages.includes(data.default_language),
    { message: "The default language must be one of the enabled languages." },
  );

// ---------------------------------------------------------------------------
// Restaurant: translation imports
// ---------------------------------------------------------------------------
export const translationsPreviewSchema = z.object({
  filename: optionalShortText(200),
  csv_content: z.string().min(1).max(2_000_000),
});

export const translationsCommitSchema = z.object({
  batch_id: z.uuid(),
  skip_unknown: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// Admin: restaurants & users
// ---------------------------------------------------------------------------
export const adminRestaurantCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
    .min(2)
    .max(60)
    .optional(),
  default_language: languageSchema.optional().default("pt"),
});

export const adminRestaurantUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
    .min(2)
    .max(60)
    .optional(),
  default_language: languageSchema.optional(),
});

export const adminRestaurantStatusSchema = z.object({
  status: z.enum(["active", "suspended", "draft"]),
});

const publicMenuTemplateSchema = z.enum([
  "brunch_editorial",
  "fine_dining_dark",
  "modern_cafe",
  "street_food_bold",
  "minimal_clean",
]);
const publicMenuDensitySchema = z.enum(["compact", "comfortable", "spacious"]);
const publicMenuCardStyleSchema = z.enum([
  "image_right",
  "image_left",
  "image_top",
  "text_only_elegant",
]);
const publicMenuHeroStyleSchema = z.enum([
  "editorial",
  "immersive_cover",
  "compact_card",
  "split_brand",
]);
const publicMenuBackgroundStyleSchema = z.enum([
  "soft_gradient",
  "paper_texture",
  "dark_luxury",
  "clean_white",
  "bold_blocks",
]);
const publicMenuCartStyleSchema = z.enum(["floating_glass", "bottom_bar", "drawer_card"]);
const publicMenuBackgroundModeSchema = z.enum([
  "cover",
  "repeat",
  "pattern",
  "blurred_cover",
]);
const publicMenuBackgroundPositionSchema = z.enum(["center", "top", "bottom"]);
const publicMenuBackgroundOverlaySchema = z.enum([
  "none",
  "light",
  "dark",
  "brand_tint",
  "cream",
]);
const publicMenuSurfaceStyleSchema = z.enum([
  "solid",
  "glass",
  "paper",
  "dark_translucent",
]);

/** Platform admin branding + public menu template settings for any restaurant. */
export const adminBrandingUpdateSchema = z
  .object({
    logo_url: optionalHttpUrl,
    cover_image_url: optionalHttpUrl,
    primary_color: hexColorSchema.optional(),
    secondary_color: hexColorSchema.nullable().optional(),
    background_color: hexColorSchema.optional(),
    welcome_message: optionalShortText(300),
    default_language: languageSchema.optional(),
    enabled_languages: z.array(languageSchema).min(1).max(4).optional(),
    public_menu_template: publicMenuTemplateSchema.optional(),
    public_menu_density: publicMenuDensitySchema.optional(),
    public_menu_card_style: publicMenuCardStyleSchema.optional(),
    public_menu_hero_style: publicMenuHeroStyleSchema.optional(),
    public_menu_background_style: publicMenuBackgroundStyleSchema.optional(),
    public_menu_cart_style: publicMenuCartStyleSchema.optional(),
    public_menu_show_images: z.boolean().optional(),
    public_menu_background_image_url: optionalHttpUrl,
    public_menu_background_mode: publicMenuBackgroundModeSchema.optional(),
    public_menu_background_position: publicMenuBackgroundPositionSchema.optional(),
    public_menu_background_overlay: publicMenuBackgroundOverlaySchema.optional(),
    public_menu_background_overlay_opacity: z.number().int().min(0).max(90).optional(),
    public_menu_surface_style: publicMenuSurfaceStyleSchema.optional(),
    require_order_confirmation: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.enabled_languages ||
      !data.default_language ||
      data.enabled_languages.includes(data.default_language),
    { message: "The default language must be one of the enabled languages." },
  );

export const adminUserCreateSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(8).max(72),
  full_name: optionalShortText(100),
  role: z.enum(["restaurant_owner", "restaurant_staff"]),
  restaurant_id: z.uuid(),
});
