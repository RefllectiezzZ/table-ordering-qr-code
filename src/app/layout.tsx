import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TableOrder — QR ordering for restaurants",
    template: "%s | TableOrder",
  },
  description:
    "Multi-tenant QR table ordering for small restaurants: branded digital menus, table QR codes and a live kitchen order board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
