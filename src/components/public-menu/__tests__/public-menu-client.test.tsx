import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { PublicMenuClient } from "@/components/public-menu/public-menu-client";
import type { PublicMenuData } from "@/types/public-menu";

/**
 * Server-render smoke tests for the public QR menu: the most important
 * customer-facing surface must render without crashing for the main
 * availability states, and the right banner/badge must be present.
 */

function menuData(overrides?: {
  acceptsOrders?: boolean;
  opening?: PublicMenuData["opening"];
}): PublicMenuData {
  return {
    token: "demo-mesa-1-k3v9q2x8w7z4",
    restaurant: {
      name: "Tasca do Rio",
      logoUrl: null,
      coverImageUrl: null,
      primaryColor: "#b45309",
      secondaryColor: "#7c2d12",
      backgroundColor: "#fffbeb",
      welcomeMessage: "Bem-vindo!",
      defaultLanguage: "pt",
      enabledLanguages: ["pt", "en", "es", "fr"],
      acceptsOrders: overrides?.acceptsOrders ?? true,
      pausedMessage: null,
      publicMenuTemplate: "brunch_editorial",
      publicMenuDensity: "comfortable",
      publicMenuCardStyle: "image_right",
      publicMenuHeroStyle: "editorial",
      publicMenuBackgroundStyle: "soft_gradient",
      publicMenuCartStyle: "floating_glass",
      publicMenuShowImages: true,
    },
    table: { tableNumber: "4", label: "Mesa 4" },
    opening:
      overrides?.opening ??
      ({
        configured: true,
        isOpenNow: true,
        today: { isClosed: false, opensAt: "09:00", closesAt: "22:00" },
      } satisfies PublicMenuData["opening"]),
    categories: [
      {
        id: "cat-1",
        sortOrder: 0,
        translations: { pt: { name: "Pratos" }, en: { name: "Dishes" } },
        products: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            priceCents: 1250,
            imageUrl: null,
            isAvailable: true,
            allergenCodes: ["gluten"],
            dietaryTags: [],
            sortOrder: 0,
            translations: {
              pt: { name: "Bacalhau à Brás", description: "Clássico de bacalhau." },
            },
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            priceCents: 700,
            imageUrl: null,
            isAvailable: false,
            allergenCodes: [],
            dietaryTags: [],
            sortOrder: 1,
            translations: { pt: { name: "Sopa do dia", description: null } },
          },
        ],
      },
    ],
  };
}

describe("PublicMenuClient (SSR smoke)", () => {
  it("renders an open restaurant with products, prices and the open badge", () => {
    const html = renderToString(<PublicMenuClient data={menuData()} />);
    expect(html).toContain("Tasca do Rio");
    expect(html).toContain("Mesa 4");
    expect(html).toContain("Bacalhau à Brás");
    expect(html).toContain("Aberto");
    expect(html).toContain("09:00–22:00");
    expect(html).toContain("Indisponível"); // unavailable product state
    expect(html).not.toContain("fora do horário");
  });

  it("renders the closed-by-schedule state with a disabled ordering message", () => {
    const html = renderToString(
      <PublicMenuClient
        data={menuData({
          opening: {
            configured: true,
            isOpenNow: false,
            today: { isClosed: false, opensAt: "18:00", closesAt: "23:00" },
          },
        })}
      />,
    );
    expect(html).toContain("Fechado");
    expect(html).toContain("O restaurante está fora do horário de funcionamento.");
  });

  it("shows the paused banner with precedence over the closed banner", () => {
    const html = renderToString(
      <PublicMenuClient
        data={menuData({
          acceptsOrders: false,
          opening: { configured: true, isOpenNow: false, today: null },
        })}
      />,
    );
    expect(html).toContain("O restaurante não está a aceitar pedidos neste momento.");
    expect(html).not.toContain("O restaurante está fora do horário de funcionamento.");
  });

  it("hides the open/closed badge when no schedule is configured", () => {
    const html = renderToString(
      <PublicMenuClient
        data={menuData({ opening: { configured: false, isOpenNow: true, today: null } })}
      />,
    );
    expect(html).toContain("Tasca do Rio");
    expect(html).not.toContain(">Aberto<");
    expect(html).not.toContain(">Fechado<");
  });

  it("renders fine_dining_dark template with dark data attribute", () => {
    const data = menuData();
    data.restaurant.publicMenuTemplate = "fine_dining_dark";
    data.restaurant.publicMenuBackgroundStyle = "dark_luxury";
    const html = renderToString(<PublicMenuClient data={data} />);
    expect(html).toContain('data-template="fine_dining_dark"');
    expect(html).toContain("Tasca do Rio");
  });

  it("renders with missing theme fields via safe fallbacks", () => {
    const data = menuData();
    // @ts-expect-error — simulate legacy payload without theme fields
    delete data.restaurant.publicMenuTemplate;
    const html = renderToString(<PublicMenuClient data={data} />);
    expect(html).toContain('data-template="brunch_editorial"');
  });
});
