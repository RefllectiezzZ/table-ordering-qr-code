"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface AdminNavLabels {
  overview: string;
  restaurants: string;
  users: string;
  maintenance: string;
}

export function AdminNav({ labels }: { labels: AdminNavLabels }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: labels.overview, exact: true },
    { href: "/admin/restaurants", label: labels.restaurants, exact: false },
    { href: "/admin/users", label: labels.users, exact: false },
    { href: "/admin/maintenance", label: labels.maintenance, exact: false },
  ];

  return (
    <nav className="flex gap-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
