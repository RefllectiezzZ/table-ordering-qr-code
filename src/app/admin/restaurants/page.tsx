import {
  AdminRestaurantsManager,
  type AdminHoursToday,
  type AdminRestaurantListItem,
} from "@/components/admin/restaurants-manager";
import {
  parseAdminRestaurantsFilter,
  type AdminRestaurantsFilter,
} from "@/lib/admin-restaurants-filter";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { openingHourFromRow, summarizeToday } from "@/lib/opening-hours";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Restaurants" };

interface RestaurantListRow {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  accepts_orders: boolean;
  timezone: string;
  created_at: string;
}

interface OpeningHoursRow {
  restaurant_id: string;
  weekday: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
}

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requirePlatformAdmin();
  const t = ADMIN_STRINGS[await getAppLanguage()];
  const supabase = await createServerSupabaseClient();

  // The filter lives in the URL (?status=active) and is re-validated here
  // before it touches anything. Data is admin-scoped by the page guard + RLS.
  const filter = parseAdminRestaurantsFilter((await searchParams).status);

  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, status, accepts_orders, timezone, created_at")
    .order("created_at", { ascending: false });

  const allRestaurants = (data ?? []) as RestaurantListRow[];

  const counts: Record<AdminRestaurantsFilter, number> = {
    all: allRestaurants.length,
    active: allRestaurants.filter((r) => r.status === "active").length,
    suspended: allRestaurants.filter((r) => r.status === "suspended").length,
    draft: allRestaurants.filter((r) => r.status === "draft").length,
  };

  const filtered =
    filter === "all"
      ? allRestaurants
      : allRestaurants.filter((restaurant) => restaurant.status === filter);

  // One query for the opening hours of every listed restaurant; summarized
  // per restaurant in its own timezone.
  const hoursByRestaurant = new Map<string, OpeningHoursRow[]>();
  if (filtered.length > 0) {
    const { data: hoursData } = await supabase
      .from("restaurant_opening_hours")
      .select("restaurant_id, weekday, is_closed, opens_at, closes_at")
      .in(
        "restaurant_id",
        filtered.map((restaurant) => restaurant.id),
      );
    for (const row of (hoursData ?? []) as OpeningHoursRow[]) {
      const list = hoursByRestaurant.get(row.restaurant_id) ?? [];
      list.push(row);
      hoursByRestaurant.set(row.restaurant_id, list);
    }
  }

  const now = new Date();
  const restaurants: AdminRestaurantListItem[] = filtered.map((row) => {
    const hours = (hoursByRestaurant.get(row.id) ?? []).map(openingHourFromRow);
    const summary = summarizeToday(hours, now, row.timezone);
    const hoursToday: AdminHoursToday =
      summary.kind === "open"
        ? { kind: "open", opensAt: summary.opensAt, closesAt: summary.closesAt }
        : { kind: summary.kind };
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      acceptsOrders: row.accepts_orders,
      createdAt: row.created_at,
      hoursToday,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t.restaurantsTitle}</h1>
        <p className="text-sm text-slate-500">{t.restaurantsSubtitle}</p>
      </div>
      <AdminRestaurantsManager
        restaurants={restaurants}
        counts={counts}
        filter={filter}
        t={t}
      />
    </div>
  );
}
