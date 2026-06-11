"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PUBLIC_MENU_STRINGS } from "@/lib/i18n";
import {
  applySurfaceStyleToTokens,
  buildPublicMenuPageShellStyles,
  resolvePublicMenuBackground,
} from "@/lib/public-menu/background";
import {
  getPublicMenuTemplateTokens,
  resolvePublicMenuTheme,
} from "@/lib/public-menu/templates";
import { readableTextColor, safeAccentColor } from "@/lib/theme/contrast";
import type { Language, OrderStatus } from "@/types/database";
import type { PublicMenuData } from "@/types/public-menu";
import { PublicCartBar } from "./public-cart-bar";
import { PublicMenuCategoryRail } from "./public-menu-category-rail";
import { PublicMenuHero } from "./public-menu-hero";
import { PublicCartView, PublicOrderStatus } from "./public-order-status";
import { PublicProductCard } from "./public-product-card";
import {
  lastOrderStorageKey,
  POLLABLE_STATUSES,
  POLL_INTERVAL_HIDDEN_MS,
  POLL_INTERVAL_MS,
  readStorage,
  sessionStorageKey,
  writeStorage,
  type ActiveOrder,
  type CartLine,
  type PublicMenuView,
} from "./utils";

export function PublicMenuClient({ data }: { data: PublicMenuData }) {
  const { restaurant, table, categories, opening } = data;

  const theme = resolvePublicMenuTheme({
    public_menu_template: restaurant.publicMenuTemplate,
    public_menu_density: restaurant.publicMenuDensity,
    public_menu_card_style: restaurant.publicMenuCardStyle,
    public_menu_hero_style: restaurant.publicMenuHeroStyle,
    public_menu_background_style: restaurant.publicMenuBackgroundStyle,
    public_menu_cart_style: restaurant.publicMenuCartStyle,
    public_menu_show_images: restaurant.publicMenuShowImages,
  });
  const baseTokens = getPublicMenuTemplateTokens(theme);
  const background = resolvePublicMenuBackground({
    public_menu_background_image_url: restaurant.publicMenuBackgroundImageUrl,
    public_menu_background_mode: restaurant.publicMenuBackgroundMode,
    public_menu_background_position: restaurant.publicMenuBackgroundPosition,
    public_menu_background_overlay: restaurant.publicMenuBackgroundOverlay,
    public_menu_background_overlay_opacity: restaurant.publicMenuBackgroundOverlayOpacity,
    public_menu_surface_style: restaurant.publicMenuSurfaceStyle,
  });
  const tokens = applySurfaceStyleToTokens(
    baseTokens,
    background.surfaceStyle,
    baseTokens.isDark,
  );
  const shellStyles = buildPublicMenuPageShellStyles(
    tokens.pageBackground,
    background,
    restaurant.primaryColor,
  );

  const [language, setLanguage] = useState<Language>(restaurant.defaultLanguage);
  const [view, setView] = useState<PublicMenuView>("menu");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  /** Idempotency token — ref only so SSR/hydration markup stays stable. */
  const clientOrderTokenRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const activeOrderTokenRef = useRef<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [paused, setPaused] = useState(!restaurant.acceptsOrders);
  const [pausedMessage, setPausedMessage] = useState(restaurant.pausedMessage);
  const [closedBySchedule, setClosedBySchedule] = useState(
    opening.configured && !opening.isOpenNow,
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  );

  const t = PUBLIC_MENU_STRINGS[language];
  const primary = restaurant.primaryColor;
  const onPrimary = readableTextColor(primary);
  const accent = safeAccentColor(primary);
  const secondary = restaurant.secondaryColor ?? primary;
  const headerGradient = `linear-gradient(140deg, ${primary} 0%, ${secondary} 100%)`;

  const productById = useMemo(() => {
    const map = new Map<string, (typeof categories)[number]["products"][number]>();
    for (const category of categories) {
      for (const product of category.products) map.set(product.id, product);
    }
    return map;
  }, [categories]);

  const cartQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) map.set(line.productId, line.quantity);
    return map;
  }, [cart]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, line) => sum + line.quantity * (productById.get(line.productId)?.priceCents ?? 0),
    0,
  );

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
          order: { short_code: string; order_number: number | null; status: OrderStatus };
          session_token: string | null;
        };
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
        // Network hiccup — next poll retries.
      }
    },
    [data.token],
  );

  useEffect(() => {
    clientOrderTokenRef.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    const stored = readStorage(lastOrderStorageKey(data.token));
    if (!stored) return;
    activeOrderTokenRef.current = stored;
    const timeout = setTimeout(() => void checkOrderStatus(stored), 0);
    return () => clearTimeout(timeout);
  }, [data.token, checkOrderStatus]);

  useEffect(() => {
    if (!activeOrder || !POLLABLE_STATUSES.includes(activeOrder.status)) return;
    const orderToken = activeOrderTokenRef.current;
    if (!orderToken) return;

    let interval: ReturnType<typeof setInterval>;
    const poll = () => void checkOrderStatus(orderToken);
    const schedule = () => {
      clearInterval(interval);
      const ms =
        typeof document !== "undefined" && document.hidden
          ? POLL_INTERVAL_HIDDEN_MS
          : POLL_INTERVAL_MS;
      interval = setInterval(poll, ms);
    };

    schedule();
    const onVisibility = () => {
      if (!document.hidden) void poll();
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeOrder, checkOrderStatus]);

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
      const orderToken = clientOrderTokenRef.current ?? crypto.randomUUID();
      clientOrderTokenRef.current = orderToken;
      const sessionToken = readStorage(sessionStorageKey(data.token));
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_token: data.token,
          client_order_token: orderToken,
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
        writeStorage(sessionStorageKey(data.token), null);
        setSessionEnded(true);
      }

      activeOrderTokenRef.current = orderToken;
      writeStorage(lastOrderStorageKey(data.token), orderToken);
      setActiveOrder({
        shortCode: payload.order.short_code,
        orderNumber: payload.order.order_number,
        status: payload.order.status,
        totalCents: payload.order.total_cents,
      });
      setCart([]);
      setOrderNote("");
      clientOrderTokenRef.current = crypto.randomUUID();
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

  const bottomPadding = view === "menu" && cartCount > 0 ? "pb-36" : "pb-8";

  return (
    <main
      className={`relative min-h-screen flex-1 overflow-x-hidden ${bottomPadding}`}
      style={shellStyles.root}
      data-template={theme.template}
    >
      {shellStyles.backdrop ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellStyles.backdrop}
        />
      ) : null}
      {shellStyles.overlay ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={shellStyles.overlay}
        />
      ) : null}
      <div className="relative z-0">
      <PublicMenuHero
        restaurant={restaurant}
        tableDisplay={tableDisplay}
        opening={opening}
        closedBySchedule={closedBySchedule}
        paused={paused}
        pausedMessage={pausedMessage}
        sessionEnded={sessionEnded}
        activeOrder={activeOrder}
        showStatusChip={view !== "status"}
        language={language}
        onLanguageChange={setLanguage}
        onViewStatus={() => setView("status")}
        t={t}
        tokens={tokens}
        heroStyle={theme.heroStyle}
        primary={primary}
        onPrimary={onPrimary}
        secondary={secondary}
        headerGradient={headerGradient}
        todayHoursLabel={todayHoursLabel}
        orderRef={orderRef}
      />

      {view === "menu" && categories.length > 1 ? (
        <PublicMenuCategoryRail
          categories={categories}
          activeCategory={activeCategory}
          categoryName={categoryName}
          primary={primary}
          tokens={tokens}
          onSelect={setActiveCategory}
        />
      ) : null}

      <div className="mx-auto w-full max-w-lg px-4">
        {view === "status" && activeOrder ? (
          <PublicOrderStatus
            t={t}
            language={language}
            order={activeOrder}
            orderRef={orderRef}
            tableDisplay={tableDisplay}
            primary={primary}
            tokens={tokens}
            onBackToMenu={() => setView("menu")}
          />
        ) : view === "cart" ? (
          <PublicCartView
            cart={cart}
            productById={productById}
            language={language}
            defaultLanguage={restaurant.defaultLanguage}
            orderNote={orderNote}
            cartTotal={cartTotal}
            submitting={submitting}
            submitBlocked={submitBlocked}
            submitError={submitError}
            paused={paused}
            closedBySchedule={closedBySchedule}
            t={t}
            tokens={tokens}
            primary={primary}
            accent={accent}
            onOrderNoteChange={setOrderNote}
            onChangeQuantity={changeQuantity}
            onSetItemNote={setItemNote}
            onSubmit={submitOrder}
            onClose={() => setView("menu")}
          />
        ) : (
          <section className="mt-6">
            {categories.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed p-8 text-center text-sm"
                style={{ borderColor: tokens.surfaceBorder, color: tokens.textMuted }}
              >
                {t.emptyMenu}
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  id={`cat-${category.id}`}
                  className={`${tokens.sectionGap} scroll-mt-16`}
                >
                  <h2
                    className="mb-3 text-lg font-extrabold tracking-tight"
                    style={{ color: accent }}
                  >
                    {categoryName(category)}
                  </h2>
                  <ul className="space-y-3">
                    {category.products.map((product) => (
                      <PublicProductCard
                        key={product.id}
                        product={product}
                        language={language}
                        defaultLanguage={restaurant.defaultLanguage}
                        cardStyle={theme.cardStyle}
                        showImages={theme.showImages}
                        tokens={tokens}
                        primary={primary}
                        onPrimary={onPrimary}
                        accent={accent}
                        secondary={secondary}
                        addLabel={t.addToCart}
                        unavailableLabel={t.unavailable}
                        inCartQty={cartQtyByProduct.get(product.id) ?? 0}
                        onAdd={() => addToCart(product.id)}
                        onIncrement={() => changeQuantity(product.id, 1)}
                        onDecrement={() => changeQuantity(product.id, -1)}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
            <div
              className={`mb-4 mt-2 flex items-start gap-2.5 rounded-2xl border p-3.5 ${
                tokens.isDark ? "border-amber-900/40 bg-amber-950/30" : "border-amber-100 bg-amber-50"
              }`}
            >
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  tokens.isDark ? "bg-amber-500" : "bg-amber-400"
                }`}
              />
              <p
                className={`text-xs leading-relaxed ${
                  tokens.isDark ? "text-amber-100" : "text-amber-900"
                }`}
              >
                {t.allergenDisclaimer}
              </p>
            </div>
          </section>
        )}
      </div>

      {view === "menu" && cartCount > 0 ? (
        <PublicCartBar
          cartCount={cartCount}
          cartTotal={cartTotal}
          tableDisplay={tableDisplay}
          language={language}
          viewCartLabel={t.viewCart}
          tokens={tokens}
          cartStyle={theme.cartStyle}
          primary={primary}
          onViewCart={() => setView("cart")}
        />
      ) : null}
      </div>
    </main>
  );
}
