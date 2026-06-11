import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isoHoursAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();
  const t = ADMIN_STRINGS[await getAppLanguage()];
  const supabase = await createServerSupabaseClient();

  const since24h = isoHoursAgo(24);

  const [total, active, suspended, recentOrders] = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspended"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h),
  ]);

  const stats = [
    { label: t.totalRestaurants, value: total.count ?? 0 },
    { label: t.activeRestaurants, value: active.count ?? 0 },
    { label: t.suspendedRestaurants, value: suspended.count ?? 0 },
    { label: t.ordersLast24h, value: recentOrders.count ?? 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t.overviewTitle}</h1>
        <p className="text-sm text-slate-500">{t.overviewSubtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/admin/restaurants" className="text-sm font-medium text-sky-700 hover:underline">
          {t.manageRestaurants}
        </Link>
        <Link href="/admin/maintenance" className="text-sm font-medium text-sky-700 hover:underline">
          {t.maintenance} →
        </Link>
      </div>
    </div>
  );
}
