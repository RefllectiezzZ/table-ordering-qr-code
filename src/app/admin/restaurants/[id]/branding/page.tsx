import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBrandingForm } from "@/components/admin/admin-branding-form";
import { Badge } from "@/components/ui/badge";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import {
  resolvePublicMenuTheme,
  type PublicMenuBackgroundStyle,
  type PublicMenuCardStyle,
  type PublicMenuCartStyle,
  type PublicMenuDensity,
  type PublicMenuHeroStyle,
  type PublicMenuTemplate,
} from "@/lib/public-menu/templates";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Language, RestaurantRow, RestaurantTableRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Restaurant branding" };

export default async function AdminRestaurantBrandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const lang = await getAppLanguage();
  const t = ADMIN_STRINGS[lang];
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("public_token")
    .eq("restaurant_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Pick<RestaurantTableRow, "public_token">>();

  const theme = resolvePublicMenuTheme({
    public_menu_template: restaurant.public_menu_template,
    public_menu_density: restaurant.public_menu_density,
    public_menu_card_style: restaurant.public_menu_card_style,
    public_menu_hero_style: restaurant.public_menu_hero_style,
    public_menu_background_style: restaurant.public_menu_background_style,
    public_menu_cart_style: restaurant.public_menu_cart_style,
    public_menu_show_images: restaurant.public_menu_show_images,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/restaurants/${restaurant.id}`}
          className="text-xs text-slate-500 hover:underline"
        >
          {t.backToRestaurant}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{t.brandingTitle}</h1>
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
          <span className="text-sm text-slate-500">{restaurant.name}</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{t.brandingSubtitle}</p>
      </div>

      <AdminBrandingForm
        restaurantId={restaurant.id}
        previewToken={table?.public_token ?? null}
        labels={t}
        initial={{
          logoUrl: restaurant.logo_url ?? "",
          coverImageUrl: restaurant.cover_image_url ?? "",
          primaryColor: restaurant.primary_color,
          secondaryColor: restaurant.secondary_color ?? "",
          backgroundColor: restaurant.background_color,
          welcomeMessage: restaurant.welcome_message ?? "",
          defaultLanguage: restaurant.default_language as Language,
          enabledLanguages: restaurant.enabled_languages as Language[],
          publicMenuTemplate: theme.template as PublicMenuTemplate,
          publicMenuDensity: theme.density as PublicMenuDensity,
          publicMenuCardStyle: theme.cardStyle as PublicMenuCardStyle,
          publicMenuHeroStyle: theme.heroStyle as PublicMenuHeroStyle,
          publicMenuBackgroundStyle: theme.backgroundStyle as PublicMenuBackgroundStyle,
          publicMenuCartStyle: theme.cartStyle as PublicMenuCartStyle,
          publicMenuShowImages: theme.showImages,
        }}
      />
    </div>
  );
}
