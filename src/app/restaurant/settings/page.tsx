import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug, status, default_language, enabled_languages, created_at")
    .eq("id", session.restaurantId)
    .maybeSingle<
      Pick<
        RestaurantRow,
        "name" | "slug" | "status" | "default_language" | "enabled_languages" | "created_at"
      >
    >();

  if (!restaurant) {
    return <div className="p-6 text-sm text-slate-500">Restaurant not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Basic information about your restaurant. Name, slug and status are managed by the
          platform administrator.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{restaurant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Slug</dt>
              <dd className="font-mono text-xs text-slate-700">{restaurant.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge tone={restaurant.status === "active" ? "green" : "yellow"}>
                  {restaurant.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Default language</dt>
              <dd className="font-medium text-slate-900">
                {LANGUAGE_LABELS[restaurant.default_language]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Enabled languages</dt>
              <dd className="font-medium text-slate-900">
                {restaurant.enabled_languages.map((l) => l.toUpperCase()).join(", ")}
              </dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <Link href="/restaurant/branding">
              <Button variant="outline" size="sm">
                Edit branding & languages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
