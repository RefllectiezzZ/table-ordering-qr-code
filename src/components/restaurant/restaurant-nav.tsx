"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const OWNER_LINKS = [
  { href: "/restaurant/orders", label: "Pedidos" },
  { href: "/restaurant/tables", label: "Mesas & QR" },
  { href: "/restaurant/menu", label: "Menu" },
  { href: "/restaurant/categories", label: "Categorias" },
  { href: "/restaurant/products", label: "Produtos" },
  { href: "/restaurant/translations", label: "Traduções" },
  { href: "/restaurant/branding", label: "Marca" },
  { href: "/restaurant/settings", label: "Definições" },
];

const STAFF_LINKS = [
  { href: "/restaurant/orders", label: "Pedidos" },
  { href: "/restaurant/tables", label: "Mesas" },
  { href: "/restaurant/menu", label: "Menu" },
];

export function RestaurantNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const links = isOwner ? OWNER_LINKS : STAFF_LINKS;

  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:py-2">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
