import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminRestaurantDetail,
  type AdminRestaurantUser,
} from "@/components/admin/restaurant-detail";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const [tables, products, categories, orders24h, { data: usersData }] = await Promise.all([
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
  ]);

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
