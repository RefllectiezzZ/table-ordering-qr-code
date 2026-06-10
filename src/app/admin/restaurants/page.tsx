import {
  AdminRestaurantsManager,
  type AdminRestaurantListItem,
} from "@/components/admin/restaurants-manager";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
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
  const t = ADMIN_STRINGS[await getAppLanguage()];
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
        <h1 className="text-xl font-bold text-slate-900">{t.restaurantsTitle}</h1>
        <p className="text-sm text-slate-500">{t.restaurantsSubtitle}</p>
      </div>
      <AdminRestaurantsManager restaurants={restaurants} />
    </div>
  );
}
