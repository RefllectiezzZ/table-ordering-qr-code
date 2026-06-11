"use client";

import { getAllergenName } from "@/lib/allergens";
import { formatCentsToEuro } from "@/lib/money";
import type {
  PublicMenuCardStyle,
  PublicMenuTemplateTokens,
} from "@/lib/public-menu/templates";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/database";
import type { PublicProduct } from "@/types/public-menu";
import { pickName } from "./utils";

interface PublicProductCardProps {
  product: PublicProduct;
  language: Language;
  defaultLanguage: Language;
  cardStyle: PublicMenuCardStyle;
  showImages: boolean;
  tokens: PublicMenuTemplateTokens;
  primary: string;
  onPrimary: string;
  accent: string;
  secondary: string;
  addLabel: string;
  unavailableLabel: string;
  inCartQty?: number;
  onAdd: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function PublicProductCard({
  product,
  language,
  defaultLanguage,
  cardStyle,
  showImages,
  tokens,
  primary,
  onPrimary,
  accent,
  secondary,
  addLabel,
  unavailableLabel,
  inCartQty = 0,
  onAdd,
  onIncrement,
  onDecrement,
}: PublicProductCardProps) {
  const { name, description } = pickName(product.translations, language, defaultLanguage);
  const effectiveCardStyle =
    !showImages || cardStyle === "text_only_elegant" ? "text_only_elegant" : cardStyle;

  const imageBlock = showImages ? (
    <ProductImage
      name={name}
      imageUrl={product.imageUrl}
      isAvailable={product.isAvailable}
      placeholderStyle={tokens.placeholderStyle}
      primary={primary}
      secondary={secondary}
      accent={accent}
      isDark={tokens.isDark}
    />
  ) : null;

  const content = (
    <div className={cn("min-w-0 flex-1", tokens.cardPadding)}>
      <p
        className="text-[15px] font-bold leading-snug"
        style={{ color: tokens.textPrimary }}
      >
        {name}
      </p>
      {description ? (
        <p
          className="mt-1 line-clamp-2 text-xs leading-relaxed"
          style={{ color: tokens.textSecondary }}
        >
          {description}
        </p>
      ) : null}
      {product.allergenCodes.length > 0 ? (
        <p className="mt-2 flex flex-wrap items-center gap-1">
          {product.allergenCodes.map((code) => (
            <span
              key={code}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                tokens.isDark ? "bg-stone-800 text-stone-400" : "bg-slate-100 text-slate-500",
              )}
            >
              {getAllergenName(code, language)}
            </span>
          ))}
        </p>
      ) : null}
      {product.dietaryTags.length > 0 ? (
        <p className="mt-1.5 flex flex-wrap gap-1">
          {product.dietaryTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${primary}18`, color: accent }}
            >
              {tag}
            </span>
          ))}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn("text-base", tokens.priceWeight)}
          style={{ color: accent }}
        >
          {formatCentsToEuro(product.priceCents, language)}
        </span>
        {product.isAvailable ? (
          inCartQty > 0 && onIncrement && onDecrement ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="-"
                onClick={onDecrement}
                className={cn(
                  "flex h-10 w-10 items-center justify-center text-lg transition-colors",
                  tokens.ctaRadius,
                  tokens.isDark
                    ? "border border-stone-600 text-stone-200"
                    : "border border-slate-300 text-slate-700",
                )}
              >
                −
              </button>
              <span
                className="w-7 text-center text-sm font-bold"
                style={{ color: tokens.textPrimary }}
              >
                {inCartQty}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={onIncrement}
                className={cn(
                  "flex h-10 w-10 items-center justify-center text-lg font-bold",
                  tokens.ctaRadius,
                  tokens.ctaShadow,
                )}
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                "min-h-10 px-4 py-2 text-sm font-bold transition-transform active:scale-95",
                tokens.ctaRadius,
                tokens.ctaShadow,
              )}
              style={{ backgroundColor: primary, color: onPrimary }}
            >
              + {addLabel}
            </button>
          )
        ) : (
          <span
            className={cn(
              "inline-block px-3.5 py-2 text-xs font-medium",
              tokens.ctaRadius,
              tokens.isDark ? "bg-stone-800 text-stone-500" : "bg-slate-100 text-slate-500",
            )}
          >
            {unavailableLabel}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <li
      className={cn(
        "overflow-hidden border transition-shadow",
        tokens.cardRadius,
        tokens.cardHoverShadow,
        !product.isAvailable && "opacity-60",
      )}
      style={{
        backgroundColor: tokens.surface,
        borderColor: tokens.surfaceBorder,
        boxShadow: tokens.surfaceShadow !== "none" ? tokens.surfaceShadow : undefined,
      }}
    >
      {effectiveCardStyle === "image_top" ? (
        <div>
          {imageBlock}
          {content}
        </div>
      ) : effectiveCardStyle === "image_left" ? (
        <div className="flex items-stretch">
          {imageBlock}
          {content}
        </div>
      ) : effectiveCardStyle === "text_only_elegant" ? (
        content
      ) : (
        <div className="flex items-stretch">
          {content}
          {imageBlock}
        </div>
      )}
    </li>
  );
}

function ProductImage({
  name,
  imageUrl,
  isAvailable,
  placeholderStyle,
  primary,
  secondary,
  accent,
  isDark,
}: {
  name: string;
  imageUrl: string | null;
  isAvailable: boolean;
  placeholderStyle: PublicMenuTemplateTokens["placeholderStyle"];
  primary: string;
  secondary: string;
  accent: string;
  isDark: boolean;
}) {
  if (imageUrl) {
    return (
      <div className="relative w-28 shrink-0 sm:w-32 self-stretch min-h-[5.5rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            !isAvailable && "grayscale",
          )}
        />
      </div>
    );
  }

  const initial = name.charAt(0).toUpperCase();

  switch (placeholderStyle) {
    case "fine_dining":
      return (
        <div
          aria-hidden
          className="relative flex w-24 shrink-0 items-center justify-center self-stretch sm:w-28"
          style={{
            background: "linear-gradient(160deg, #292524 0%, #1c1917 100%)",
            borderLeft: isDark ? "1px solid rgba(250,250,249,0.06)" : undefined,
          }}
        >
          <span
            className="text-xl font-light tracking-widest"
            style={{ color: "rgba(250,250,249,0.35)" }}
          >
            {initial}
          </span>
        </div>
      );
    case "street":
      return (
        <div
          aria-hidden
          className="relative flex w-24 shrink-0 items-center justify-center self-stretch overflow-hidden sm:w-28"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary || primary} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.08) 8px, rgba(0,0,0,0.08) 16px)",
            }}
          />
          <span className="relative text-2xl font-black text-white/90">{initial}</span>
        </div>
      );
    case "minimal":
      return (
        <div
          aria-hidden
          className="relative flex w-16 shrink-0 items-center justify-center self-stretch border-l"
          style={{ borderColor: `${primary}20` }}
        >
          <span className="text-sm font-light" style={{ color: `${accent}66` }}>
            {initial}
          </span>
        </div>
      );
    case "modern":
      return (
        <div
          aria-hidden
          className="relative flex w-24 shrink-0 items-center justify-center self-stretch sm:w-28"
          style={{ background: "#f1f5f9" }}
        >
          <span className="text-xl font-semibold text-slate-300">{initial}</span>
        </div>
      );
    case "brunch":
    default:
      return (
        <div
          aria-hidden
          className="relative flex w-24 shrink-0 items-center justify-center self-stretch sm:w-28"
          style={{
            background: `linear-gradient(150deg, ${primary}18, ${secondary || primary}30)`,
          }}
        >
          <span className="text-2xl font-extrabold opacity-40" style={{ color: accent }}>
            {initial}
          </span>
        </div>
      );
  }
}
