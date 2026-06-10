import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminRestaurantDetail,
  type AdminRestaurantUser,
} from "@/components/admin/restaurant-detail";
import {
  evaluateOpeningHours,
  formatTimeHHMM,
  type OpeningHourDay,
} from "@/lib/opening-hours";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchOpeningHours } from "@/server/opening-hours";
import { isoHoursAgo } from "@/lib/utils";
import type { ProfileRow, RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Restaurant details" };

export default async function AdminRestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();

  const since24h = isoHoursAgo(24);

  const [tables, products, categories, orders24h, { data: usersData }, openingHours] =
    await Promise.all([
      supabase
        .from("restaurant_tables")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),
      supabase
        .from("menu_products")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),
      supabase
        .from("menu_categories")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id)
        .gte("created_at", since24h),
      supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: true }),
      fetchOpeningHours(supabase, id),
    ]);

  const opening = evaluateOpeningHours(openingHours, new Date(), restaurant.timezone);

  const users: AdminRestaurantUser[] = (
    (usersData ?? []) as Pick<ProfileRow, "id" | "email" | "full_name" | "role" | "created_at">[]
  ).map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
  }));

  const stats = [
    { label: "Tables", value: tables.count ?? 0 },
    { label: "Categories", value: categories.count ?? 0 },
    { label: "Products", value: products.count ?? 0 },
    { label: "Orders (24h)", value: orders24h.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/restaurants" className="text-xs text-slate-500 hover:underline">
          ← All restaurants
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
          <Badge
            tone={
              restaurant.status === "active"
                ? "green"
                : restaurant.status === "suspended"
                  ? "yellow"
                  : "neutral"
            }
          >
            {restaurant.status}
          </Badge>
          <span className="font-mono text-xs text-slate-400">{restaurant.slug}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminRestaurantDetail
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          status: restaurant.status,
          defaultLanguage: restaurant.default_language,
        }}
        users={users}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Opening hours</CardTitle>
          {opening.configured ? (
            <Badge tone={opening.isOpenNow ? "green" : "neutral"}>
              {opening.isOpenNow ? "Open now" : "Closed now"}
            </Badge>
          ) : (
            <Badge tone="neutral">Not configured</Badge>
          )}
        </CardHeader>
        <CardContent>
          <OpeningHoursSchedule hours={openingHours} timezone={restaurant.timezone} />
          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
            The schedule is managed by the restaurant owner in their dashboard settings. While
            closed, the public menu stays visible but order submission is blocked.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-slate-500">
          Menu, branding, tables and translations are managed by the restaurant owner in their own
          dashboard. Platform admins manage the restaurant lifecycle (status, slug, users) here.
        </CardContent>
      </Card>
    </div>
  );
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAY_LABELS: Record<number, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
  0: "Domingo",
};

function OpeningHoursSchedule({
  hours,
  timezone,
}: {
  hours: OpeningHourDay[];
  timezone: string;
}) {
  if (hours.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Horário não configurado. Os clientes podem enviar pedidos a qualquer hora.
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100 text-sm">
        {WEEKDAY_ORDER.map((weekday) => {
          const day = hours.find((entry) => entry.weekday === weekday);
          const closed = !day || day.isClosed;
          return (
            <li key={weekday} className="flex items-center justify-between gap-3 py-2">
              <span className="font-medium text-slate-700">{WEEKDAY_LABELS[weekday]}</span>
              <span className={closed ? "text-slate-400" : "font-medium text-slate-900"}>
                {closed
                  ? "Fechado"
                  : `${formatTimeHHMM(day.opensAt) ?? "?"}–${formatTimeHHMM(day.closesAt) ?? "?"}`}
                {day?.notes ? (
                  <span className="ml-2 text-xs font-normal text-slate-400">{day.notes}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-400">Timezone: {timezone}</p>
    </div>
  );
}
