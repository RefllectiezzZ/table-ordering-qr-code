import type { MetadataRoute } from "next";

/**
 * Basic Progressive Web App manifest: install metadata, theme and icon.
 * Deliberately NO service worker / offline caching — order submission must
 * always hit the live server (see docs/known-limitations.md).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TableOrder — Pedidos à mesa por QR",
    short_name: "TableOrder",
    description:
      "Menu QR, pedidos à mesa e painel de cozinha para restaurantes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
