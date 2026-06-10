"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllergenName } from "@/lib/allergens";
import { LANGUAGE_LABELS, PUBLIC_MENU_STRINGS, type PublicMenuStrings } from "@/lib/i18n";
import { formatCentsToEuro } from "@/lib/money";
import { readableTextColor, safeAccentColor } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import type { Language, OrderStatus } from "@/types/database";
import type { PublicMenuData, PublicProduct } from "@/types/public-menu";

interface CartLine {
  productId: string;
  quantity: number;
  itemNote: string;
}

interface ActiveOrder {
  shortCode: string;
  orderNumber: number | null;
  status: OrderStatus;
  totalCents: number | null;
}

type View = "menu" | "cart" | "status";

const POLL_INTERVAL_MS = 5000;
const POLLABLE_STATUSES: OrderStatus[] = ["pending_confirmation", "new", "preparing", "ready"];

function sessionStorageKey(token: string) {
  return `tableorder.session.${token}`;
}
function lastOrderStorageKey(token: string) {
  return `tableorder.lastorder.${token}`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode) — the flow still works, the device
    // just needs staff confirmation again for each order.
  }
}

function pickName(
  translations: PublicProduct["translations"],
  language: Language,
  fallback: Language,
): { name: string; description: string | null } {
  return (
    translations[language] ??
    translations[fallback] ??
    Object.values(translations)[0] ?? { name: "—", description: null }
  );
}

function statusLabel(status: OrderStatus, t: PublicMenuStrings): string {
  switch (status) {
    case "pending_confirmation":
      return t.statusPending;
    case "new":
      return t.statusConfirmed;
    case "preparing":
      return t.statusPreparing;
    case "ready":
      return t.statusReady;
    case "delivered":
      return t.statusDelivered;
    case "rejected":
      return t.statusRejected;
    case "cancelled":
      return t.statusCancelled;
  }
}

export function PublicMenuClient({ data }: { data: PublicMenuData }) {
  const { restaurant, table, categories, opening } = data;
  const [language, setLanguage] = useState<Language>(restaurant.defaultLanguage);
  const [view, setView] = useState<View>("menu");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  // Idempotency token: one per "cart session". Retries of the same submit
  // reuse it; a new order after confirmation gets a fresh one.
  const [clientOrderToken, setClientOrderToken] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const activeOrderTokenRef = useRef<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [paused, setPaused] = useState(!restaurant.acceptsOrders);
  const [pausedMessage, setPausedMessage] = useState(restaurant.pausedMessage);
  // Opening hours come evaluated from the server (restaurant timezone). The
  // server also re-checks on submit; this state only drives the UI.
  const [closedBySchedule, setClosedBySchedule] = useState(
    opening.configured && !opening.isOpenNow,
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  );

  const t = PUBLIC_MENU_STRINGS[language];

  // Theme with contrast guardrails: brand colors never make text unreadable.
  const primary = restaurant.primaryColor;
  const onPrimary = readableTextColor(primary);
  const accent = safeAccentColor(primary);
  const secondary = restaurant.secondaryColor ?? primary;
  const headerGradient = `linear-gradient(140deg, ${primary} 0%, ${secondary} 100%)`;

  const productById = useMemo(() => {
    const map = new Map<string, PublicProduct>();
    for (const category of categories) {
      for (const product of category.products) map.set(product.id, product);
    }
    return map;
  }, [categories]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, line) => sum + line.quantity * (productById.get(line.productId)?.priceCents ?? 0),
    0,
  );

  // Order blocking precedence for messaging: paused > closed by schedule.
  const submitBlocked = paused || closedBySchedule;

  const todayHoursLabel =
    opening.configured && opening.today && !opening.today.isClosed && opening.today.opensAt
      ? `${opening.today.opensAt}–${opening.today.closesAt}`
      : null;

  const checkOrderStatus = useCallback(
    async (orderClientToken: string) => {
      try {
        const params = new URLSearchParams({
          table_token: data.token,
          client_order_token: orderClientToken,
        });
        const response = await fetch(`/api/public/orders/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (response.status === 404) {
          activeOrderTokenRef.current = null;
          writeStorage(lastOrderStorageKey(data.token), null);
          return;
        }
        if (!response.ok) return;
        const payload = (await response.json()) as {
          order: {
            short_code: string;
            order_number: number | null;
            status: OrderStatus;
          };
          session_token: string | null;
        };
        // The browser authorization travels here exactly once; keep it for
        // the rest of this table session.
        if (payload.session_token) {
          writeStorage(sessionStorageKey(data.token), payload.session_token);
          setSessionEnded(false);
        }
        setActiveOrder((current) => ({
          shortCode: payload.order.short_code,
          orderNumber: payload.order.order_number,
          status: payload.order.status,
          totalCents: current?.totalCents ?? null,
        }));
        if (!POLLABLE_STATUSES.includes(payload.order.status)) {
          writeStorage(lastOrderStorageKey(data.token), null);
        }
      } catch {
        // Network hiccup — the next poll retries.
      }
    },
    [data.token],
  );

  // Resume a previously submitted order after a reload (the waiting state
  // must survive accidental refreshes on mobile). Deferred to a timeout so
  // state updates happen outside the effect body itself.
  useEffect(() => {
    const stored = readStorage(lastOrderStorageKey(data.token));
    if (!stored) return;
    activeOrderTokenRef.current = stored;
    const timeout = setTimeout(() => void checkOrderStatus(stored), 0);
    return () => clearTimeout(timeout);
  }, [data.token, checkOrderStatus]);

  // Poll while the active order is still moving through the flow.
  useEffect(() => {
    if (!activeOrder || !POLLABLE_STATUSES.includes(activeOrder.status)) return;
    const orderToken = activeOrderTokenRef.current;
    if (!orderToken) return;
    const interval = setInterval(() => void checkOrderStatus(orderToken), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeOrder, checkOrderStatus]);

  // Scroll-spy for the sticky category rail: highlight the section closest
  // to the top of the viewport while browsing the menu.
  useEffect(() => {
    if (view !== "menu" || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveCategory(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-96px 0px -65% 0px" },
    );
    for (const category of categories) {
      const element = document.getElementById(`cat-${category.id}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [view, categories]);

  function addToCart(productId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(50, line.quantity + 1) }
            : line,
        );
      }
      return [...current, { productId, quantity: 1, itemNote: "" }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(50, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function setItemNote(productId: string, note: string) {
    setCart((current) =>
      current.map((line) => (line.productId === productId ? { ...line, itemNote: note } : line)),
    );
  }

  async function submitOrder() {
    if (cart.length === 0 || submitting || submitBlocked) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const sessionToken = readStorage(sessionStorageKey(data.token));
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_token: data.token,
          client_order_token: clientOrderToken,
          session_token: sessionToken ?? undefined,
          customer_note: orderNote.trim() || undefined,
          items: cart.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            item_note: line.itemNote.trim() || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        if (payload.error === "orders_paused") {
          setPaused(true);
          if (payload.message) setPausedMessage(payload.message);
          setSubmitError(payload.message ?? t.ordersPausedBanner);
        } else if (payload.error === "restaurant_closed") {
          // The server is the source of truth for opening hours: reflect it.
          setClosedBySchedule(true);
          setSubmitError(t.closedBanner);
        } else {
          setSubmitError(t.orderFailed);
        }
        return;
      }

      const payload = (await response.json()) as {
        order: {
          short_code: string;
          order_number: number | null;
          status: OrderStatus;
          total_cents: number;
        };
        session_ended?: boolean;
      };

      if (payload.session_ended) {
        // The stored authorization no longer works (session closed): drop it
        // and explain; this order went back to the confirmation queue.
        writeStorage(sessionStorageKey(data.token), null);
        setSessionEnded(true);
      }

      activeOrderTokenRef.current = clientOrderToken;
      writeStorage(lastOrderStorageKey(data.token), clientOrderToken);
      setActiveOrder({
        shortCode: payload.order.short_code,
        orderNumber: payload.order.order_number,
        status: payload.order.status,
        totalCents: payload.order.total_cents,
      });
      setCart([]);
      setOrderNote("");
      setClientOrderToken(crypto.randomUUID());
      setView("status");
    } catch {
      setSubmitError(t.orderFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const tableDisplay = table.label ?? `${t.table} ${table.tableNumber}`;
  const orderRef = activeOrder
    ? activeOrder.orderNumber !== null
      ? `#${activeOrder.orderNumber}`
      : `#${activeOrder.shortCode}`
    : "";

  function categoryName(category: (typeof categories)[number]): string {
    return (
      category.translations[language]?.name ??
      category.translations[restaurant.defaultLanguage]?.name ??
      "—"
    );
  }

  return (
    <main
      className="min-h-screen flex-1 overflow-x-hidden pb-36"
      style={
        {
          backgroundColor: restaurant.backgroundColor,
          "--brand-primary": primary,
        } as React.CSSProperties
      }
    >
      {/* Header / branding */}
      <header className="relative">
        {restaurant.coverImageUrl ? (
          <div className="relative h-44 w-full sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          </div>
        ) : (
          <div className="relative h-36 w-full sm:h-44" style={{ background: headerGradient }}>
            {/* Subtle texture so flat brand colors don't feel dull. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 80% at 85% -20%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(80% 60% at 10% 110%, rgba(0,0,0,0.18), transparent 55%)",
              }}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-lg px-4">
          {/* Identity card overlapping the cover */}
          <div className="fade-in-up relative -mt-14 rounded-3xl border border-black/5 bg-white p-4 shadow-lg shadow-black/5">
            <div className="flex items-center gap-3.5">
              {restaurant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-black/5 bg-white object-cover shadow-sm"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold shadow-sm"
                  style={{ background: headerGradient, color: onPrimary }}
                >
                  {restaurant.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">
                  {restaurant.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-100 text-emerald-800",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          closedBySchedule ? "bg-slate-400" : "bg-emerald-500",
                        )}
                      />
                      {closedBySchedule ? t.closedNow : t.openNow}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {restaurant.welcomeMessage ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {restaurant.welcomeMessage}
              </p>
            ) : null}
            {todayHoursLabel ? (
              <p className="mt-2 text-xs text-slate-400">
                {t.todayHours}: {todayHoursLabel}
              </p>
            ) : null}
          </div>

          {/* Language switcher */}
          {restaurant.enabledLanguages.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Language">
              {restaurant.enabledLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={cn(
                    "min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                    language === lang
                      ? "border-transparent shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                  )}
                  style={
                    language === lang ? { backgroundColor: primary, color: onPrimary } : {}
                  }
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          ) : null}

          {/* Availability banners (clearest message wins: paused > closed) */}
          {paused ? (
            <div className="fade-in-up mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <div>
                <p className="font-semibold">{t.ordersPausedBanner}</p>
                {pausedMessage ? <p className="mt-0.5">{pausedMessage}</p> : null}
              </div>
            </div>
          ) : closedBySchedule ? (
            <div className="fade-in-up mt-4 flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-700">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
              <div>
                <p className="font-semibold">{t.closedBanner}</p>
                <p className="mt-0.5 text-slate-500">
                  {t.closedSubmit}
                  {todayHoursLabel ? ` ${t.todayHours}: ${todayHoursLabel}.` : ""}
                </p>
              </div>
            </div>
          ) : null}

          {/* Session ended notice */}
          {sessionEnded ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
              {t.sessionEndedNotice}
            </div>
          ) : null}

          {/* Active order chip (menu/cart views) */}
          {activeOrder && view !== "status" ? (
            <button
              type="button"
              onClick={() => setView("status")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-sm font-semibold text-slate-900">
                {t.orderNumber} {orderRef}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  activeOrder.status === "pending_confirmation" &&
                    "animate-pulse bg-violet-100 text-violet-800",
                  activeOrder.status === "rejected" && "bg-red-100 text-red-800",
                  activeOrder.status !== "pending_confirmation" &&
                    activeOrder.status !== "rejected" &&
                    "bg-emerald-100 text-emerald-800",
                )}
              >
                {statusLabel(activeOrder.status, t)}
              </span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Sticky category rail */}
      {view === "menu" && categories.length > 1 ? (
        <nav className="sticky top-0 z-20 mt-5 border-b border-black/5 bg-white/85 backdrop-blur">
          <div className="scrollbar-none mx-auto flex w-full max-w-lg gap-2 overflow-x-auto px-4 py-2.5">
            {categories.map((category) => {
              const active = activeCategory === category.id;
              return (
                <a
                  key={category.id}
                  href={`#cat-${category.id}`}
                  onClick={() => setActiveCategory(category.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition-colors",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                  style={active ? { backgroundColor: primary, color: onPrimary } : {}}
                >
                  {categoryName(category)}
                </a>
              );
            })}
          </div>
        </nav>
      ) : null}

      <div className="mx-auto w-full max-w-lg px-4">
        {view === "status" && activeOrder ? (
          <OrderStatusPanel
            t={t}
            language={language}
            order={activeOrder}
            orderRef={orderRef}
            tableDisplay={tableDisplay}
            primary={primary}
            onPrimary={onPrimary}
            onBackToMenu={() => setView("menu")}
          />
        ) : view === "cart" ? (
          <section className="fade-in-up mt-6">
            <h2 className="mb-3 text-lg font-extrabold tracking-tight" style={{ color: accent }}>
              {t.cart}
            </h2>
            {cart.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
                {t.emptyCart}
              </p>
            ) : (
              <ul className="space-y-3">
                {cart.map((line) => {
                  const product = productById.get(line.productId);
                  if (!product) return null;
                  const { name } = pickName(
                    product.translations,
                    language,
                    restaurant.defaultLanguage,
                  );
                  return (
                    <li
                      key={line.productId}
                      className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
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
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-700 transition-colors active:bg-slate-100"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="+"
                            onClick={() => changeQuantity(line.productId, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-700 transition-colors active:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={line.itemNote}
                        maxLength={300}
                        onChange={(e) => setItemNote(line.productId, e.target.value)}
                        placeholder={t.itemNotePlaceholder}
                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            {cart.length > 0 ? (
              <>
                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    {t.orderNoteLabel}
                  </span>
                  <textarea
                    value={orderNote}
                    maxLength={500}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder={t.orderNotePlaceholder}
                    className="min-h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </label>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <span className="text-sm font-semibold text-slate-700">{t.total}</span>
                  <span className="text-xl font-extrabold" style={{ color: accent }}>
                    {formatCentsToEuro(cartTotal, language)}
                  </span>
                </div>
                {submitError ? (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                  </p>
                ) : null}
                {paused ? (
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    {t.ordersPausedSubmit}
                  </p>
                ) : closedBySchedule ? (
                  <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                    {t.closedSubmit}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting || submitBlocked}
                  className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-bold shadow-md transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{ backgroundColor: primary, color: onPrimary }}
                >
                  {submitting ? (
                    <>
                      <span
                        aria-hidden
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
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
              onClick={() => setView("menu")}
              className="mt-3 min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t.closeCart}
            </button>
          </section>
        ) : (
          <section className="mt-6">
            {categories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
                {t.emptyMenu}
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} id={`cat-${category.id}`} className="mb-8 scroll-mt-16">
                  <h2
                    className="mb-3 text-lg font-extrabold tracking-tight"
                    style={{ color: accent }}
                  >
                    {categoryName(category)}
                  </h2>
                  <ul className="space-y-3">
                    {category.products.map((product) => {
                      const { name, description } = pickName(
                        product.translations,
                        language,
                        restaurant.defaultLanguage,
                      );
                      return (
                        <li
                          key={product.id}
                          className={cn(
                            "overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md",
                            !product.isAvailable && "opacity-60",
                          )}
                        >
                          <div className="flex items-stretch">
                            <div className="min-w-0 flex-1 p-4">
                              <p className="text-[15px] font-bold leading-snug text-slate-900">
                                {name}
                              </p>
                              {description ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                  {description}
                                </p>
                              ) : null}
                              {product.allergenCodes.length > 0 ? (
                                <p className="mt-2 flex flex-wrap items-center gap-1">
                                  {product.allergenCodes.map((code) => (
                                    <span
                                      key={code}
                                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                                    >
                                      {getAllergenName(code, language)}
                                    </span>
                                  ))}
                                </p>
                              ) : null}
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span
                                  className="text-base font-extrabold"
                                  style={{ color: accent }}
                                >
                                  {formatCentsToEuro(product.priceCents, language)}
                                </span>
                                {product.isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(product.id)}
                                    className="min-h-10 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95"
                                    style={{ backgroundColor: primary, color: onPrimary }}
                                  >
                                    + {t.addToCart}
                                  </button>
                                ) : (
                                  <span className="inline-block rounded-full bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-500">
                                    {t.unavailable}
                                  </span>
                                )}
                              </div>
                            </div>
                            {product.imageUrl ? (
                              <div className="relative w-28 shrink-0 sm:w-32">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  loading="lazy"
                                  className={cn(
                                    "absolute inset-0 h-full w-full object-cover",
                                    !product.isAvailable && "grayscale",
                                  )}
                                />
                              </div>
                            ) : (
                              <div
                                aria-hidden
                                className="relative flex w-20 shrink-0 items-center justify-center sm:w-24"
                                style={{
                                  background: `linear-gradient(150deg, ${primary}14, ${secondary}2e)`,
                                }}
                              >
                                <span
                                  className="text-2xl font-extrabold opacity-30"
                                  style={{ color: accent }}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
            <div className="mb-4 mt-2 flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <p className="text-xs leading-relaxed text-amber-900">{t.allergenDisclaimer}</p>
            </div>
          </section>
        )}
      </div>

      {/* Floating cart bar (with iOS safe-area padding) */}
      {view === "menu" && cartCount > 0 ? (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4">
          <div className="fade-in-up mx-auto mb-3 flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-slate-900/95 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-400">
                {cartCount} · {tableDisplay}
              </p>
              <p className="text-lg font-extrabold text-white">
                {formatCentsToEuro(cartTotal, language)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("cart")}
              className="min-h-12 shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
              style={{ backgroundColor: primary, color: onPrimary }}
            >
              {t.viewCart} ({cartCount})
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/** Kitchen flow steps shown on the status panel once an order is confirmed. */
const PROGRESS_STATUSES: OrderStatus[] = ["new", "preparing", "ready", "delivered"];

function OrderStatusPanel({
  t,
  language,
  order,
  orderRef,
  tableDisplay,
  primary,
  onPrimary,
  onBackToMenu,
}: {
  t: PublicMenuStrings;
  language: Language;
  order: ActiveOrder;
  orderRef: string;
  tableDisplay: string;
  primary: string;
  onPrimary: string;
  onBackToMenu: () => void;
}) {
  const isPending = order.status === "pending_confirmation";
  const isRejected = order.status === "rejected" || order.status === "cancelled";
  const progressIndex = PROGRESS_STATUSES.indexOf(order.status);

  return (
    <section
      className={cn(
        "fade-in-up mt-8 rounded-3xl border p-8 text-center shadow-sm",
        isPending && "border-violet-200 bg-violet-50",
        isRejected && "border-red-200 bg-red-50",
        !isPending && !isRejected && "border-emerald-200 bg-emerald-50",
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-sm",
          isPending && "animate-pulse bg-violet-500",
          isRejected && "bg-red-500",
          !isPending && !isRejected && "bg-emerald-600",
        )}
      >
        {isPending ? "⏳" : isRejected ? "✕" : "✓"}
      </div>

      <h2
        className={cn(
          "text-lg font-extrabold",
          isPending && "text-violet-900",
          isRejected && "text-red-900",
          !isPending && !isRejected && "text-emerald-900",
        )}
      >
        {isPending ? t.pendingTitle : isRejected ? t.rejectedTitle : t.confirmedTitle}
      </h2>
      <p
        className={cn(
          "mt-1 text-sm",
          isPending && "text-violet-800",
          isRejected && "text-red-800",
          !isPending && !isRejected && "text-emerald-800",
        )}
      >
        {isPending ? t.pendingBody : isRejected ? t.rejectedBody : t.confirmedBody}
      </p>

      {/* Progress through the kitchen flow (confirmed orders only). */}
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
                index <= progressIndex ? "bg-emerald-600" : "bg-emerald-200",
              )}
            />
          ))}
        </div>
      ) : null}

      <div className="mx-auto mt-5 max-w-xs space-y-1.5 rounded-2xl bg-white/85 p-4 text-sm shadow-sm">
        <p className="font-bold text-slate-900">{tableDisplay}</p>
        <p className="font-semibold text-slate-700">
          {t.orderNumber} {orderRef}
        </p>
        <p className="text-slate-600">
          {t.orderStatusLabel}: <strong>{statusLabel(order.status, t)}</strong>
        </p>
        {order.totalCents !== null ? (
          <p className="text-slate-600">
            {t.total}: {formatCentsToEuro(order.totalCents, language)}
          </p>
        ) : null}
      </div>

      {isPending ? (
        <p className="mt-4 text-xs text-violet-700">{t.pendingHint}</p>
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
