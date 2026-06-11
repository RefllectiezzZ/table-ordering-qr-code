import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TableOrder — QR ordering for restaurants",
    template: "%s | TableOrder",
  },
  description:
    "Menu QR, pedidos à mesa e painel de cozinha para restaurantes. QR table ordering with branded digital menus and a live kitchen board.",
  applicationName: "TableOrder",
  appleWebApp: {
    capable: true,
    title: "TableOrder",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover lets the public menu pad around the iOS home indicator.
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dev tunnels (e.g. Cursor port forwarding) and some mobile browser tooling
    // inject attributes on <html>/<body> before React hydrates (__gcrremoteframetoken
    // and similar). That mismatch is outside app control — suppress only here so
    // real component-level hydration bugs are still surfaced.
    <html lang="pt" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
