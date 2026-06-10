import {
  AdminRestaurantsManager,
  type AdminRestaurantListItem,
} from "@/components/admin/restaurants-manager";
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
  created_at: string;
}

export default async function AdminRestaurantsPage() {
  await requirePlatformAdmin();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });

  const restaurants: AdminRestaurantListItem[] = ((data ?? []) as RestaurantListRow[]).map(
    (row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.created_at,
    }),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Restaurants</h1>
        <p className="text-sm text-slate-500">
          Create restaurants, open their detail page and control their status. New restaurants
          start as drafts — their public menu only works once activated.
        </p>
      </div>
      <AdminRestaurantsManager restaurants={restaurants} />
    </div>
  );
}
