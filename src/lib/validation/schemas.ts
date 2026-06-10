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

const productTranslationsSchema = z
  .object({
    pt: productTranslationSchema.optional(),
    en: productTranslationSchema.optional(),
    es: productTranslationSchema.optional(),
    fr: productTranslationSchema.optional(),
  })
  .refine((t) => Object.values(t).some(Boolean), {
    message: "Provide a name in at least one language.",
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

// ---------------------------------------------------------------------------
// Restaurant: orders
// ---------------------------------------------------------------------------
export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

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

export const adminUserCreateSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(8).max(72),
  full_name: optionalShortText(100),
  role: z.enum(["restaurant_owner", "restaurant_staff"]),
  restaurant_id: z.uuid(),
});
