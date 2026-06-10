"use client";

import type { PublicMenuStrings } from "@/lib/i18n";
import { formatCentsToEuro } from "@/lib/money";
import type { PublicMenuTemplateTokens } from "@/lib/public-menu/templates";
import { readableTextColor } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/database";
import type { PublicProduct } from "@/types/public-menu";
import type { ActiveOrder, CartLine } from "./utils";
import { pickName, PROGRESS_STATUSES, statusLabel } from "./utils";

interface PublicOrderStatusProps {
  t: PublicMenuStrings;
  language: Language;
  order: ActiveOrder;
  orderRef: string;
  tableDisplay: string;
  primary: string;
  tokens: PublicMenuTemplateTokens;
  onBackToMenu: () => void;
}

export function PublicOrderStatus({
  t,
  language,
  order,
  orderRef,
  tableDisplay,
  primary,
  tokens,
  onBackToMenu,
}: PublicOrderStatusProps) {
  const onPrimary = readableTextColor(primary);
  const isPending = order.status === "pending_confirmation";
  const isRejected = order.status === "rejected" || order.status === "cancelled";
  const progressIndex = PROGRESS_STATUSES.indexOf(order.status);

  return (
    <section
      className={cn(
        "fade-in-up mt-8 rounded-3xl border p-8 text-center",
        isPending && (tokens.isDark ? "border-violet-900/50 bg-violet-950/40" : tokens.statusPendingBg),
        isRejected && "border-red-200 bg-red-50",
        !isPending && !isRejected && (tokens.isDark ? tokens.statusConfirmedBg : tokens.statusConfirmedBg),
      )}
      style={{ boxShadow: tokens.surfaceShadow !== "none" ? tokens.surfaceShadow : undefined }}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-sm",
          isPending && "motion-safe:animate-pulse bg-violet-500",
          isRejected && "bg-red-500",
          !isPending && !isRejected && "bg-emerald-600",
        )}
      >
        {isPending ? "◷" : isRejected ? "✕" : "✓"}
      </div>

      <h2
        className={cn(
          "text-lg font-extrabold",
          isPending && (tokens.isDark ? "text-violet-200" : "text-violet-900"),
          isRejected && "text-red-900",
          !isPending && !isRejected && (tokens.isDark ? "text-emerald-200" : "text-emerald-900"),
        )}
      >
        {isPending ? t.pendingTitle : isRejected ? t.rejectedTitle : t.confirmedTitle}
      </h2>
      <p
        className={cn(
          "mt-1 text-sm",
          isPending && (tokens.isDark ? "text-violet-300" : "text-violet-800"),
          isRejected && "text-red-800",
          !isPending && !isRejected && (tokens.isDark ? "text-emerald-300" : "text-emerald-800"),
        )}
      >
        {isPending ? t.pendingBody : isRejected ? t.rejectedBody : t.confirmedBody}
      </p>

      {progressIndex >= 0 ? (
        <div
          className="mx-auto mt-5 flex max-w-xs items-center gap-1.5"
          role="img"
          aria-label={statusLabel(order.status, t)}
        >
          {PROGRESS_STATUSES.map((status, index) => (
            <span
              key={status}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= progressIndex
                  ? tokens.isDark
                    ? "bg-emerald-500"
                    : "bg-emerald-600"
                  : tokens.isDark
                    ? "bg-stone-700"
                    : "bg-emerald-200",
              )}
            />
          ))}
        </div>
      ) : null}

      <div
        className="mx-auto mt-5 max-w-xs space-y-1.5 rounded-2xl p-4 text-sm"
        style={{
          backgroundColor: tokens.isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.85)",
          color: tokens.textSecondary,
        }}
      >
        <p className="font-bold" style={{ color: tokens.textPrimary }}>
          {tableDisplay}
        </p>
        <p className="font-semibold">
          {t.orderNumber} {orderRef}
        </p>
        <p>
          {t.orderStatusLabel}: <strong>{statusLabel(order.status, t)}</strong>
        </p>
        {order.totalCents !== null ? (
          <p>
            {t.total}: {formatCentsToEuro(order.totalCents, language)}
          </p>
        ) : null}
      </div>

      {isPending ? (
        <p className={cn("mt-4 text-xs", tokens.isDark ? "text-violet-400" : "text-violet-700")}>
          {t.pendingHint}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onBackToMenu}
        className="mt-6 min-h-11 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
        style={{ backgroundColor: primary, color: onPrimary }}
      >
        {isRejected || isPending ? t.backToMenu : t.newOrder}
      </button>
    </section>
  );
}

interface PublicCartViewProps {
  cart: CartLine[];
  productById: Map<string, PublicProduct>;
  language: Language;
  defaultLanguage: Language;
  orderNote: string;
  cartTotal: number;
  submitting: boolean;
  submitBlocked: boolean;
  submitError: string | null;
  paused: boolean;
  closedBySchedule: boolean;
  t: PublicMenuStrings;
  tokens: PublicMenuTemplateTokens;
  primary: string;
  accent: string;
  onOrderNoteChange: (note: string) => void;
  onChangeQuantity: (productId: string, delta: number) => void;
  onSetItemNote: (productId: string, note: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PublicCartView({
  cart,
  productById,
  language,
  defaultLanguage,
  orderNote,
  cartTotal,
  submitting,
  submitBlocked,
  submitError,
  paused,
  closedBySchedule,
  t,
  tokens,
  primary,
  accent,
  onOrderNoteChange,
  onChangeQuantity,
  onSetItemNote,
  onSubmit,
  onClose,
}: PublicCartViewProps) {
  const onPrimary = readableTextColor(primary);

  return (
    <section className="fade-in-up mt-6">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight" style={{ color: accent }}>
        {t.cart}
      </h2>
      {cart.length === 0 ? (
        <p
          className="rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{
            borderColor: tokens.surfaceBorder,
            color: tokens.textMuted,
            backgroundColor: tokens.isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
          }}
        >
          {t.emptyCart}
        </p>
      ) : (
        <ul className="space-y-3">
          {cart.map((line) => {
            const product = productById.get(line.productId);
            if (!product) return null;
            const { name } = pickName(product.translations, language, defaultLanguage);
            return (
              <li
                key={line.productId}
                className={cn("rounded-2xl border p-4", tokens.cardRadius)}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.surfaceBorder,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: tokens.textMuted }}>
                      {formatCentsToEuro(product.priceCents, language)}
                      {line.quantity > 1 ? (
                        <span className="ml-1.5 font-semibold" style={{ color: accent }}>
                          · {formatCentsToEuro(product.priceCents * line.quantity, language)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`${t.remove} / -`}
                      onClick={() => onChangeQuantity(line.productId, -1)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border text-lg",
                        tokens.isDark ? "border-stone-600 text-stone-300" : "border-slate-300 text-slate-700",
                      )}
                    >
                      −
                    </button>
                    <span
                      className="w-7 text-center text-sm font-bold"
                      style={{ color: tokens.textPrimary }}
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => onChangeQuantity(line.productId, 1)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border text-lg",
                        tokens.isDark ? "border-stone-600 text-stone-300" : "border-slate-300 text-slate-700",
                      )}
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={line.itemNote}
                  maxLength={300}
                  onChange={(e) => onSetItemNote(line.productId, e.target.value)}
                  placeholder={t.itemNotePlaceholder}
                  className={cn(
                    "mt-3 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none",
                    tokens.isDark
                      ? "border-stone-700 bg-stone-900 text-stone-100 placeholder:text-stone-500"
                      : "border-slate-200 bg-white text-slate-900",
                  )}
                />
              </li>
            );
          })}
        </ul>
      )}

      {cart.length > 0 ? (
        <>
          <label className="mt-4 block">
            <span
              className="mb-1 block text-xs font-medium"
              style={{ color: tokens.textSecondary }}
            >
              {t.orderNoteLabel}
            </span>
            <textarea
              value={orderNote}
              maxLength={500}
              onChange={(e) => onOrderNoteChange(e.target.value)}
              placeholder={t.orderNotePlaceholder}
              className={cn(
                "min-h-16 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none",
                tokens.isDark
                  ? "border-stone-700 bg-stone-900 text-stone-100"
                  : "border-slate-200 bg-white",
              )}
            />
          </label>
          <div
            className={cn("mt-4 flex items-center justify-between rounded-2xl border p-4", tokens.cardRadius)}
            style={{ backgroundColor: tokens.surface, borderColor: tokens.surfaceBorder }}
          >
            <span className="text-sm font-semibold" style={{ color: tokens.textSecondary }}>
              {t.total}
            </span>
            <span className="text-xl font-extrabold" style={{ color: accent }}>
              {formatCentsToEuro(cartTotal, language)}
            </span>
          </div>
          {submitError ? (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>
          ) : null}
          {paused ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {t.ordersPausedSubmit}
            </p>
          ) : closedBySchedule ? (
            <p
              className={cn(
                "mt-3 rounded-xl p-3 text-sm",
                tokens.isDark ? "bg-stone-800 text-stone-300" : "bg-slate-100 text-slate-700",
              )}
            >
              {t.closedSubmit}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || submitBlocked}
            className={cn(
              "mt-4 flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-base font-bold transition-transform active:scale-[0.99] disabled:opacity-50",
              tokens.ctaRadius,
              tokens.ctaShadow,
            )}
            style={{ backgroundColor: primary, color: onPrimary }}
          >
            {submitting ? (
              <>
                <span
                  aria-hidden
                  className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                />
                {t.submitting}
              </>
            ) : (
              t.submitOrder
            )}
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className={cn(
          "mt-3 min-h-11 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium",
          tokens.isDark
            ? "border-stone-700 bg-stone-900 text-stone-300"
            : "border-slate-300 bg-white text-slate-700",
        )}
      >
        {t.closeCart}
      </button>
    </section>
  );
}
