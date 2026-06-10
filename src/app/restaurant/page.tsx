import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { evaluateOpeningHours } from "@/lib/opening-hours";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchOpeningHours } from "@/server/opening-hours";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Painel" };

/**
 * Operational landing page for staff and owners: what needs attention right
 * now (pending confirmations, open orders, occupied tables) plus the current
 * availability status (pause switch + opening hours).
 */
export default async function RestaurantHomePage() {
  const session = await requireRestaurantUser();
  const isOwner = session.profile.role === "restaurant_owner";
  const supabase = await createServerSupabaseClient();

  const [{ data: restaurant }, openingHours, pending, open, sessions] = await Promise.all([
    supabase
      .from("restaurants")
      .select("name, status, accepts_orders, timezone")
      .eq("id", session.restaurantId)
      .maybeSingle<Pick<RestaurantRow, "name" | "status" | "accepts_orders" | "timezone">>(),
    fetchOpeningHours(supabase, session.restaurantId),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", session.restaurantId)
      .eq("status", "pending_confirmation"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", session.restaurantId)
      .in("status", ["new", "preparing", "ready"]),
    supabase
      .from("table_sessions")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", session.restaurantId)
      .eq("status", "open"),
  ]);

  const opening = evaluateOpeningHours(
    openingHours,
    new Date(),
    restaurant?.timezone ?? "Europe/Lisbon",
  );

  const stats = [
    {
      label: "Por confirmar",
      value: pending.count ?? 0,
      href: "/restaurant/orders?view=pending",
      accent: (pending.count ?? 0) > 0 ? "text-violet-700" : "text-slate-900",
    },
    {
      label: "Pedidos em curso",
      value: open.count ?? 0,
      href: "/restaurant/orders",
      accent: "text-slate-900",
    },
    {
      label: "Mesas com sessão aberta",
      value: sessions.count ?? 0,
      href: "/restaurant/tables",
      accent: "text-slate-900",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {restaurant?.name ?? "Painel"}
          </h1>
          <p className="text-sm text-slate-500">Resumo operacional de agora.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={restaurant?.accepts_orders ? "green" : "yellow"}>
            {restaurant?.accepts_orders ? "A aceitar pedidos" : "Pedidos em pausa"}
          </Badge>
          {opening.configured ? (
            <Badge tone={opening.isOpenNow ? "green" : "neutral"}>
              {opening.isOpenNow ? "Aberto agora" : "Fechado agora"}
            </Badge>
          ) : (
            <Badge tone="neutral">Horário não configurado</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardContent>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className={`mt-1 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid max-w-4xl gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-slate-900">Horário de hoje</p>
            <p className="mt-1 text-sm text-slate-600">
              {!opening.configured
                ? "Horário não configurado. Os clientes podem pedir a qualquer hora."
                : opening.today?.isClosed || !opening.today?.opensAt
                  ? "Fechado hoje."
                  : `${opening.today.opensAt}–${opening.today.closesAt}`}
            </p>
            {isOwner ? (
              <div className="mt-3">
                <Link href="/restaurant/settings">
                  <Button variant="outline" size="sm">
                    Gerir horário
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                O horário é gerido pelo responsável do restaurante.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-slate-900">Atalhos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/restaurant/orders">
                <Button size="sm">Pedidos</Button>
              </Link>
              <Link href="/restaurant/tables">
                <Button variant="outline" size="sm">
                  Mesas & QR
                </Button>
              </Link>
              <Link href="/restaurant/menu">
                <Button variant="outline" size="sm">
                  Menu
                </Button>
              </Link>
              {isOwner ? (
                <Link href="/restaurant/settings">
                  <Button variant="outline" size="sm">
                    Definições
                  </Button>
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
