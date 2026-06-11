"use client";

import { LANGUAGE_LABELS, type PublicMenuStrings } from "@/lib/i18n";
import type { PublicMenuHeroStyle, PublicMenuTemplateTokens } from "@/lib/public-menu/templates";
import { readableTextColor } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/database";
import type { PublicMenuData } from "@/types/public-menu";
import type { ActiveOrder } from "./utils";

interface PublicMenuHeroProps {
  restaurant: PublicMenuData["restaurant"];
  tableDisplay: string;
  opening: PublicMenuData["opening"];
  closedBySchedule: boolean;
  paused: boolean;
  pausedMessage: string | null;
  sessionEnded: boolean;
  activeOrder: ActiveOrder | null;
  showStatusChip: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onViewStatus: () => void;
  t: PublicMenuStrings;
  tokens: PublicMenuTemplateTokens;
  heroStyle: PublicMenuHeroStyle;
  primary: string;
  onPrimary: string;
  secondary: string;
  headerGradient: string;
  todayHoursLabel: string | null;
  orderRef: string;
}

export function PublicMenuHero({
  restaurant,
  tableDisplay,
  opening,
  closedBySchedule,
  paused,
  pausedMessage,
  sessionEnded,
  activeOrder,
  showStatusChip,
  language,
  onLanguageChange,
  onViewStatus,
  t,
  tokens,
  heroStyle,
  primary,
  onPrimary,
  headerGradient,
  todayHoursLabel,
  orderRef,
}: PublicMenuHeroProps) {
  const immersive = heroStyle === "immersive_cover";
  const compact = heroStyle === "compact_card";
  const split = heroStyle === "split_brand";

  const coverHeight = immersive
    ? "h-56 sm:h-72"
    : compact
      ? "h-24 sm:h-28"
      : tokens.heroHeight;

  return (
    <header className="relative">
      {restaurant.coverImageUrl ? (
        <div className={cn("relative w-full", coverHeight)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restaurant.coverImageUrl}
            alt=""
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                tokens.heroOverlay !== "none"
                  ? tokens.heroOverlay
                  : "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
            }}
          />
        </div>
      ) : (
        <div className={cn("relative w-full", coverHeight)} style={{ background: headerGradient }}>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                tokens.isDark
                  ? "radial-gradient(100% 80% at 90% -10%, rgba(250,250,249,0.08), transparent 55%)"
                  : "radial-gradient(120% 80% at 85% -20%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(80% 60% at 10% 110%, rgba(0,0,0,0.12), transparent 55%)",
            }}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-lg px-4">
        <div
          className={cn(
            "fade-in-up relative",
            compact ? "-mt-8" : split ? "-mt-10" : "-mt-14",
            split ? "rounded-2xl" : "rounded-3xl",
            compact ? "p-3" : "p-4",
            heroStyle === "editorial" && "shadow-lg",
          )}
          style={{
            backgroundColor: tokens.identityCardBg,
            border: `1px solid ${tokens.identityCardBorder}`,
            boxShadow: tokens.isDark ? "0 12px 40px rgba(0,0,0,0.35)" : undefined,
          }}
        >
          <div className={cn("flex items-center gap-3.5", split && "flex-col text-center sm:flex-row sm:text-left")}>
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className={cn(
                  "shrink-0 rounded-2xl border object-cover shadow-sm",
                  compact ? "h-12 w-12" : "h-16 w-16",
                )}
                style={{ borderColor: tokens.surfaceBorder, backgroundColor: tokens.surface }}
              />
            ) : (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-2xl font-extrabold shadow-sm",
                  compact ? "h-12 w-12 text-xl" : "h-16 w-16 text-2xl",
                )}
                style={{ background: headerGradient, color: onPrimary }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1
                className={cn(
                  "truncate font-extrabold tracking-tight",
                  compact ? "text-lg" : "text-xl",
                )}
                style={{ color: tokens.textPrimary }}
              >
                {restaurant.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: primary, color: onPrimary }}
                >
                  {tableDisplay}
                </span>
                {opening.configured ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      closedBySchedule
                        ? tokens.isDark
                          ? "bg-stone-800 text-stone-400"
                          : "bg-slate-100 text-slate-600"
                        : tokens.isDark
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-emerald-100 text-emerald-800",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        closedBySchedule
                          ? "bg-slate-400"
                          : tokens.isDark
                            ? "bg-emerald-400"
                            : "bg-emerald-500",
                      )}
                    />
                    {closedBySchedule ? t.closedNow : t.openNow}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {restaurant.welcomeMessage ? (
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: tokens.textSecondary }}
            >
              {restaurant.welcomeMessage}
            </p>
          ) : null}
          {todayHoursLabel ? (
            <p className="mt-2 text-xs" style={{ color: tokens.textMuted }}>
              {t.todayHours}: {todayHoursLabel}
            </p>
          ) : null}
        </div>

        {restaurant.enabledLanguages.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Language">
            {restaurant.enabledLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                aria-pressed={language === lang}
                className={cn(
                  "min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                  language !== lang &&
                    (tokens.isDark
                      ? "border-stone-700 bg-stone-900/50 text-stone-300"
                      : "border-slate-300 bg-white text-slate-600"),
                )}
                style={
                  language === lang
                    ? { backgroundColor: primary, color: readableTextColor(primary) }
                    : {}
                }
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        ) : null}

        {paused ? (
          <Banner className={tokens.bannerPaused}>
            <p className="font-semibold">{t.ordersPausedBanner}</p>
            {pausedMessage ? <p className="mt-0.5 opacity-90">{pausedMessage}</p> : null}
          </Banner>
        ) : closedBySchedule ? (
          <Banner className={tokens.bannerClosed}>
            <p className="font-semibold">{t.closedBanner}</p>
            <p className="mt-0.5 opacity-80">
              {t.closedSubmit}
              {todayHoursLabel ? ` ${t.todayHours}: ${todayHoursLabel}.` : ""}
            </p>
          </Banner>
        ) : null}

        {sessionEnded ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border p-3.5 text-sm leading-relaxed",
              tokens.isDark ? "border-stone-700 bg-stone-900/60 text-stone-300" : "border-slate-200 bg-slate-50 text-slate-700",
            )}
          >
            {t.sessionEndedNotice}
          </div>
        ) : null}

        {activeOrder && showStatusChip ? (
          <button
            type="button"
            onClick={onViewStatus}
            className={cn(
              "mt-4 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md",
              tokens.isDark ? "border-stone-700 bg-stone-900/80" : "border-slate-200 bg-white",
            )}
          >
            <span className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
              {t.orderNumber} {orderRef}
            </span>
            <OrderStatusBadge status={activeOrder.status} t={t} />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function Banner({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={cn("fade-in-up mt-4 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm leading-relaxed", className)}
    >
      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current opacity-60" />
      <div>{children}</div>
    </div>
  );
}

function OrderStatusBadge({
  status,
  t,
}: {
  status: ActiveOrder["status"];
  t: PublicMenuStrings;
}) {
  const labels: Record<string, string> = {
    pending_confirmation: t.statusPending,
    rejected: t.statusRejected,
  };
  const label = labels[status] ?? t.statusConfirmed;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "pending_confirmation" && "animate-pulse bg-violet-100 text-violet-800",
        status === "rejected" && "bg-red-100 text-red-800",
        status !== "pending_confirmation" &&
          status !== "rejected" &&
          "bg-emerald-100 text-emerald-800",
      )}
    >
      {label}
    </span>
  );
}
