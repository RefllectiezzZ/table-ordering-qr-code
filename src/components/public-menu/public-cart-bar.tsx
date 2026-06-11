"use client";

import { formatCentsToEuro } from "@/lib/money";
import type { PublicMenuCartStyle, PublicMenuTemplateTokens } from "@/lib/public-menu/templates";
import { readableTextColor } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/database";

interface PublicCartBarProps {
  cartCount: number;
  cartTotal: number;
  tableDisplay: string;
  language: Language;
  viewCartLabel: string;
  tokens: PublicMenuTemplateTokens;
  cartStyle: PublicMenuCartStyle;
  primary: string;
  onViewCart: () => void;
}

export function PublicCartBar({
  cartCount,
  cartTotal,
  tableDisplay,
  language,
  viewCartLabel,
  tokens,
  cartStyle,
  primary,
  onViewCart,
}: PublicCartBarProps) {
  const onPrimary = readableTextColor(primary);

  if (cartStyle === "bottom_bar") {
    return (
      <div
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t"
        style={{
          backgroundColor: tokens.cartBarBg,
          borderColor: tokens.surfaceBorder,
        }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs" style={{ color: tokens.cartBarSubtext }}>
              {cartCount} · {tableDisplay}
            </p>
            <p className="text-lg font-extrabold" style={{ color: tokens.cartBarText }}>
              {formatCentsToEuro(cartTotal, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={onViewCart}
            className="min-h-12 shrink-0 rounded-lg px-6 py-2.5 text-sm font-bold"
            style={{ backgroundColor: primary, color: onPrimary }}
          >
            {viewCartLabel} ({cartCount})
          </button>
        </div>
      </div>
    );
  }

  if (cartStyle === "drawer_card") {
    return (
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4">
        <div
          className="fade-in-up mx-auto mb-3 w-full max-w-lg rounded-t-3xl border px-4 py-4 shadow-2xl"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.surfaceBorder,
            boxShadow: tokens.surfaceShadow,
          }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300/60" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs" style={{ color: tokens.textMuted }}>
                {cartCount} · {tableDisplay}
              </p>
              <p className="text-xl font-extrabold" style={{ color: tokens.textPrimary }}>
                {formatCentsToEuro(cartTotal, language)}
              </p>
            </div>
            <button
              type="button"
              onClick={onViewCart}
              className="min-h-12 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-md"
              style={{ backgroundColor: primary, color: onPrimary }}
            >
              {viewCartLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // floating_glass (default)
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4">
      <div
        className={cn(
          "fade-in-up mx-auto mb-3 flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl px-4 py-3 backdrop-blur-xl",
          tokens.isDark ? "border border-stone-700/50" : "border border-white/10",
        )}
        style={{
          backgroundColor: tokens.cartBarBg,
          boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
        }}
      >
        <div className="min-w-0">
          <p className="truncate text-xs" style={{ color: tokens.cartBarSubtext }}>
            {cartCount} · {tableDisplay}
          </p>
          <p className="text-lg font-extrabold" style={{ color: tokens.cartBarText }}>
            {formatCentsToEuro(cartTotal, language)}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewCart}
          className="min-h-12 shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
          style={{ backgroundColor: primary, color: onPrimary }}
        >
          {viewCartLabel} ({cartCount})
        </button>
      </div>
    </div>
  );
}
