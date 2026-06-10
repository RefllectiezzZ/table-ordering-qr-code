import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isoHoursAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();
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
    { label: "Total restaurants", value: total.count ?? 0 },
    { label: "Active restaurants", value: active.count ?? 0 },
    { label: "Suspended restaurants", value: suspended.count ?? 0 },
    { label: "Orders (last 24h)", value: recentOrders.count ?? 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Platform overview</h1>
        <p className="text-sm text-slate-500">Cross-tenant view for support and administration.</p>
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

      <div className="mt-6">
        <Link href="/admin/restaurants" className="text-sm font-medium text-sky-700 hover:underline">
          Manage restaurants →
        </Link>
      </div>
    </div>
  );
}
