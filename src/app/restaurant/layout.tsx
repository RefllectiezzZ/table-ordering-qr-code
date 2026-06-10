import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantNav } from "@/components/restaurant/restaurant-nav";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantRow } from "@/types/database";

// Tenant-scoped area: always rendered per-request, never statically cached.
export const dynamic = "force-dynamic";

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRestaurantUser();
  const isOwner = session.profile.role === "restaurant_owner";

  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, status")
    .eq("id", session.restaurantId)
    .maybeSingle<Pick<RestaurantRow, "id" | "name" | "status">>();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50 lg:flex-row">
      <aside className="shrink-0 border-b border-slate-200 bg-white lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <div>
            <Link href="/restaurant" className="text-sm font-bold text-slate-900">
              {restaurant?.name ?? "Restaurant"}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={restaurant?.status === "active" ? "green" : "yellow"}>
                {restaurant?.status ?? "?"}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {isOwner ? "Responsável" : "Equipa"}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="lg:hidden">
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
        <RestaurantNav isOwner={isOwner} />
        <div className="hidden px-5 py-4 lg:block">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
