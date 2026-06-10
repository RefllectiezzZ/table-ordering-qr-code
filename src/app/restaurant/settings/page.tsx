import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OpeningHoursForm,
  type OpeningHoursDayValue,
} from "@/components/restaurant/opening-hours-form";
import { OrdersAvailabilityForm } from "@/components/restaurant/orders-availability-form";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { evaluateOpeningHours, formatTimeHHMM } from "@/lib/opening-hours";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchOpeningHours } from "@/server/opening-hours";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const [{ data: restaurant }, openingHours] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "name, slug, status, default_language, enabled_languages, accepts_orders, paused_message, timezone, created_at",
      )
      .eq("id", session.restaurantId)
      .maybeSingle<
        Pick<
          RestaurantRow,
          | "name"
          | "slug"
          | "status"
          | "default_language"
          | "enabled_languages"
          | "accepts_orders"
          | "paused_message"
          | "timezone"
          | "created_at"
        >
      >(),
    fetchOpeningHours(supabase, session.restaurantId),
  ]);

  if (!restaurant) {
    return <div className="p-6 text-sm text-slate-500">Restaurante não encontrado.</div>;
  }

  const opening = evaluateOpeningHours(openingHours, new Date(), restaurant.timezone);

  const initialDays: OpeningHoursDayValue[] = openingHours.map((day) => ({
    weekday: day.weekday,
    isClosed: day.isClosed,
    opensAt: formatTimeHHMM(day.opensAt) ?? "09:00",
    closesAt: formatTimeHHMM(day.closesAt) ?? "22:00",
    notes: day.notes ?? "",
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Definições</h1>
        <p className="text-sm text-slate-500">
          Disponibilidade de pedidos, horário de funcionamento e informação do restaurante.
          Nome, slug e estado são geridos pela administração da plataforma.
        </p>
      </div>

      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Disponibilidade de pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersAvailabilityForm
              initialAcceptsOrders={restaurant.accepts_orders}
              initialPausedMessage={restaurant.paused_message}
            />
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Restaurante</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium text-slate-900">{restaurant.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Slug</dt>
                <dd className="font-mono text-xs text-slate-700">{restaurant.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Estado</dt>
                <dd>
                  <Badge tone={restaurant.status === "active" ? "green" : "yellow"}>
                    {restaurant.status === "active"
                      ? "Ativo"
                      : restaurant.status === "suspended"
                        ? "Suspenso"
                        : "Rascunho"}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Idioma base</dt>
                <dd className="font-medium text-slate-900">
                  {LANGUAGE_LABELS[restaurant.default_language]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Idiomas ativos</dt>
                <dd className="font-medium text-slate-900">
                  {restaurant.enabled_languages.map((l) => l.toUpperCase()).join(", ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Fuso horário</dt>
                <dd className="font-medium text-slate-900">{restaurant.timezone}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <Link href="/restaurant/branding">
                <Button variant="outline" size="sm">
                  Editar marca & idiomas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Horário de funcionamento</CardTitle>
            {opening.configured ? (
              <Badge tone={opening.isOpenNow ? "green" : "yellow"}>
                {opening.isOpenNow ? "Aberto agora" : "Fechado agora"}
              </Badge>
            ) : (
              <Badge tone="neutral">Horário não configurado</Badge>
            )}
          </CardHeader>
          <CardContent>
            <OpeningHoursForm initialDays={initialDays} configured={opening.configured} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
