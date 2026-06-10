"use client";

import { useMemo, useState } from "react";
import { getAllergenName } from "@/lib/allergens";
import { LANGUAGE_LABELS, PUBLIC_MENU_STRINGS } from "@/lib/i18n";
import { formatCentsToEuro } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/database";
import type { PublicMenuData, PublicProduct } from "@/types/public-menu";

interface CartLine {
  productId: string;
  quantity: number;
  itemNote: string;
}

interface ConfirmedOrder {
  shortCode: string;
  status: string;
  totalCents: number;
}

type View = "menu" | "cart" | "confirmed";

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
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);

  const t = PUBLIC_MENU_STRINGS[language];

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
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_token: data.token,
          client_order_token: clientOrderToken,
          customer_note: orderNote.trim() || undefined,
          items: cart.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            item_note: line.itemNote.trim() || undefined,
          })),
        }),
      });

      if (!response.ok) {
        setSubmitError(t.orderFailed);
        return;
      }

      const payload = (await response.json()) as {
        order: { short_code: string; status: string; total_cents: number };
      };
      setConfirmed({
        shortCode: payload.order.short_code,
        status: payload.order.status,
        totalCents: payload.order.total_cents,
      });
      setView("confirmed");
    } catch {
      setSubmitError(t.orderFailed);
    } finally {
      setSubmitting(false);
    }
  }

  function startNewOrder() {
    setCart([]);
    setOrderNote("");
    setConfirmed(null);
    setClientOrderToken(crypto.randomUUID());
    setView("menu");
  }

  const tableDisplay = table.label ?? `${t.table} ${table.tableNumber}`;

  return (
    <main
      className="min-h-screen flex-1 pb-28"
      style={
        {
          backgroundColor: restaurant.backgroundColor,
          "--brand-primary": restaurant.primaryColor,
        } as React.CSSProperties
      }
    >
      {/* Header / branding */}
      <header className="relative">
        {restaurant.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt=""
            className="h-36 w-full object-cover sm:h-48"
          />
        ) : (
          <div className="h-20" style={{ backgroundColor: restaurant.primaryColor }} />
        )}
        <div className="mx-auto w-full max-w-lg px-4">
          <div className="-mt-8 flex items-end gap-3">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-16 w-16 rounded-xl border-2 border-white bg-white object-cover shadow"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white text-2xl font-bold text-white shadow"
                style={{ backgroundColor: restaurant.primaryColor }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-xl font-bold" style={{ color: restaurant.primaryColor }}>
                {restaurant.name}
              </h1>
              <p className="text-xs font-medium text-slate-500">{tableDisplay}</p>
            </div>
          </div>
          {restaurant.welcomeMessage ? (
            <p className="mt-3 text-sm text-slate-600">{restaurant.welcomeMessage}</p>
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
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    language === lang
                      ? "border-transparent text-white"
                      : "border-slate-300 bg-white text-slate-600",
                  )}
                  style={language === lang ? { backgroundColor: restaurant.primaryColor } : {}}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-4">
        {view === "confirmed" && confirmed ? (
          <section className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
              ✓
            </div>
            <h2 className="text-lg font-bold text-emerald-900">{t.orderReceivedTitle}</h2>
            <p className="mt-1 text-sm text-emerald-800">{t.orderReceivedBody}</p>
            <p className="mt-4 text-sm font-semibold text-emerald-900">
              {t.orderNumber} #{confirmed.shortCode}
            </p>
            <p className="text-sm text-emerald-800">
              {t.total}: {formatCentsToEuro(confirmed.totalCents, language)}
            </p>
            <button
              type="button"
              onClick={startNewOrder}
              className="mt-6 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: restaurant.primaryColor }}
            >
              {t.newOrder}
            </button>
          </section>
        ) : view === "cart" ? (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold" style={{ color: restaurant.primaryColor }}>
              {t.cart}
            </h2>
            {cart.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
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
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">
                            {formatCentsToEuro(product.priceCents, language)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`${t.remove} / -`}
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="+"
                            onClick={() => changeQuantity(line.productId, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700"
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
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
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
                    className="min-h-16 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-sm font-semibold text-slate-700">{t.total}</span>
                  <span className="text-lg font-bold" style={{ color: restaurant.primaryColor }}>
                    {formatCentsToEuro(cartTotal, language)}
                  </span>
                </div>
                {submitError ? (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting}
                  className="mt-4 w-full rounded-xl px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: restaurant.primaryColor }}
                >
                  {submitting ? t.submitting : t.submitOrder}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              {t.closeCart}
            </button>
          </section>
        ) : (
          <section className="mt-6">
            {categories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
                {t.emptyMenu}
              </p>
            ) : (
              <>
                {/* Category quick-nav */}
                <nav className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`#cat-${category.id}`}
                      className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {category.translations[language]?.name ??
                        category.translations[restaurant.defaultLanguage]?.name ??
                        "—"}
                    </a>
                  ))}
                </nav>

                {categories.map((category) => (
                  <div key={category.id} id={`cat-${category.id}`} className="mb-8 scroll-mt-4">
                    <h2
                      className="mb-3 text-base font-bold"
                      style={{ color: restaurant.primaryColor }}
                    >
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
                              "rounded-xl border border-slate-200 bg-white p-4",
                              !product.isAvailable && "opacity-60",
                            )}
                          >
                            <div className="flex gap-3">
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                                  <p className="shrink-0 text-sm font-bold text-slate-900">
                                    {formatCentsToEuro(product.priceCents, language)}
                                  </p>
                                </div>
                                {description ? (
                                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    {description}
                                  </p>
                                ) : null}
                                {product.allergenCodes.length > 0 ? (
                                  <p className="mt-2 text-[11px] text-slate-400">
                                    {t.allergens}:{" "}
                                    {product.allergenCodes
                                      .map((code) => getAllergenName(code, language))
                                      .join(", ")}
                                  </p>
                                ) : null}
                                <div className="mt-2.5">
                                  {product.isAvailable ? (
                                    <button
                                      type="button"
                                      onClick={() => addToCart(product.id)}
                                      className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white"
                                      style={{ backgroundColor: restaurant.primaryColor }}
                                    >
                                      {t.addToCart}
                                    </button>
                                  ) : (
                                    <span className="inline-block rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-500">
                                      {t.unavailable}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </>
            )}
            <p className="mb-4 mt-2 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
              {t.allergenDisclaimer}
            </p>
          </section>
        )}
      </div>

      {/* Sticky cart bar */}
      {view === "menu" && cartCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                {cartCount} × · {tableDisplay}
              </p>
              <p className="text-base font-bold text-slate-900">
                {formatCentsToEuro(cartTotal, language)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("cart")}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: restaurant.primaryColor }}
            >
              {t.viewCart}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
