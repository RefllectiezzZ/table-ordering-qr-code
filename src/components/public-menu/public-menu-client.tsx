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
  const { restaurant, table, categories } = data;
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

  const t = PUBLIC_MENU_STRINGS[language];

  // Theme with contrast guardrails: brand colors never make text unreadable.
  const primary = restaurant.primaryColor;
  const onPrimary = readableTextColor(primary);
  const accent = safeAccentColor(primary);
  const headerGradient = `linear-gradient(135deg, ${primary}, ${restaurant.secondaryColor ?? primary})`;

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
    if (cart.length === 0 || submitting) return;
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

  return (
    <main
      className="min-h-screen flex-1 pb-32"
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
          <div className="relative h-40 w-full sm:h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-28 w-full sm:h-32" style={{ background: headerGradient }} />
        )}
        <div className="mx-auto w-full max-w-lg px-4">
          <div className="-mt-10 flex items-end gap-3">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white text-3xl font-bold shadow-lg"
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 pb-1.5">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">
                {restaurant.name}
              </h1>
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                {tableDisplay}
              </span>
            </div>
          </div>
          {restaurant.welcomeMessage ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {restaurant.welcomeMessage}
            </p>
          ) : null}

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
                      : "border-slate-300 bg-white text-slate-600",
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

          {/* Ordering paused banner */}
          {paused ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
              <p className="font-semibold">{t.ordersPausedBanner}</p>
              {pausedMessage ? <p className="mt-0.5">{pausedMessage}</p> : null}
            </div>
          ) : null}

          {/* Session ended notice */}
          {sessionEnded ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
              {t.sessionEndedNotice}
            </div>
          ) : null}

          {/* Active order chip (menu/cart views) */}
          {activeOrder && view !== "status" ? (
            <button
              type="button"
              onClick={() => setView("status")}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
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
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold" style={{ color: accent }}>
              {t.cart}
            </h2>
            {cart.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
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
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">
                            {formatCentsToEuro(product.priceCents, language)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`${t.remove} / -`}
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-700 active:bg-slate-100"
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
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-700 active:bg-slate-100"
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
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                    className="min-h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
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
                ) : null}
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting || paused}
                  className="mt-4 min-h-12 w-full rounded-2xl px-4 py-3 text-base font-bold shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{ backgroundColor: primary, color: onPrimary }}
                >
                  {submitting ? t.submitting : t.submitOrder}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-3 min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              {t.closeCart}
            </button>
          </section>
        ) : (
          <section className="mt-6">
            {categories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
                {t.emptyMenu}
              </p>
            ) : (
              <>
                {/* Category quick-nav */}
                <nav className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`#cat-${category.id}`}
                      className="min-h-9 shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {category.translations[language]?.name ??
                        category.translations[restaurant.defaultLanguage]?.name ??
                        "—"}
                    </a>
                  ))}
                </nav>

                {categories.map((category) => (
                  <div key={category.id} id={`cat-${category.id}`} className="mb-8 scroll-mt-4">
                    <h2 className="mb-3 text-lg font-extrabold tracking-tight" style={{ color: accent }}>
                      {category.translations[language]?.name ??
                        category.translations[restaurant.defaultLanguage]?.name ??
                        "—"}
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
                              "overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow",
                              !product.isAvailable && "opacity-60",
                            )}
                          >
                            <div className="flex gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-bold leading-snug text-slate-900">
                                  {name}
                                </p>
                                {description ? (
                                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    {description}
                                  </p>
                                ) : null}
                                {product.allergenCodes.length > 0 ? (
                                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                                    {t.allergens}:{" "}
                                    {product.allergenCodes
                                      .map((code) => getAllergenName(code, language))
                                      .join(", ")}
                                  </p>
                                ) : null}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <span className="text-base font-extrabold" style={{ color: accent }}>
                                    {formatCentsToEuro(product.priceCents, language)}
                                  </span>
                                  {product.isAvailable ? (
                                    <button
                                      type="button"
                                      onClick={() => addToCart(product.id)}
                                      className="min-h-10 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95"
                                      style={{ backgroundColor: primary, color: onPrimary }}
                                    >
                                      {t.addToCart}
                                    </button>
                                  ) : (
                                    <span className="inline-block rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-500">
                                      {t.unavailable}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  loading="lazy"
                                  className="h-24 w-24 shrink-0 rounded-xl object-cover"
                                />
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </>
            )}
            <div className="mb-4 mt-2 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
              <span aria-hidden className="text-base leading-none">
                ⚠️
              </span>
              <p className="text-xs leading-relaxed text-amber-900">{t.allergenDisclaimer}</p>
            </div>
          </section>
        )}
      </div>

      {/* Sticky cart bar (with iOS safe-area padding) */}
      {view === "menu" && cartCount > 0 ? (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">
                {cartCount} · {tableDisplay}
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {formatCentsToEuro(cartTotal, language)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("cart")}
              className="min-h-12 rounded-2xl px-6 py-2.5 text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
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

  return (
    <section
      className={cn(
        "mt-8 rounded-3xl border p-8 text-center shadow-sm",
        isPending && "border-violet-200 bg-violet-50",
        isRejected && "border-red-200 bg-red-50",
        !isPending && !isRejected && "border-emerald-200 bg-emerald-50",
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white",
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

      <div className="mx-auto mt-5 max-w-xs space-y-1.5 rounded-2xl bg-white/80 p-4 text-sm">
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
        className="mt-6 min-h-11 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm"
        style={{ backgroundColor: primary, color: onPrimary }}
      >
        {isRejected || isPending ? t.backToMenu : t.newOrder}
      </button>
    </section>
  );
}
