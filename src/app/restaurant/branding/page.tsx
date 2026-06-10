import { BrandingForm } from "@/components/restaurant/branding-form";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Branding" };

export default async function BrandingPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "logo_url, cover_image_url, primary_color, secondary_color, background_color, welcome_message, default_language, enabled_languages",
    )
    .eq("id", session.restaurantId)
    .maybeSingle<
      Pick<
        RestaurantRow,
        | "logo_url"
        | "cover_image_url"
        | "primary_color"
        | "secondary_color"
        | "background_color"
        | "welcome_message"
        | "default_language"
        | "enabled_languages"
      >
    >();

  if (!restaurant) {
    return <div className="p-6 text-sm text-slate-500">Restaurant not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Branding</h1>
        <p className="text-sm text-slate-500">
          Customise how your public QR menu looks. Image uploads are a follow-up; for now use
          hosted image URLs.
        </p>
      </div>
      <BrandingForm
        initial={{
          logoUrl: restaurant.logo_url ?? "",
          coverImageUrl: restaurant.cover_image_url ?? "",
          primaryColor: restaurant.primary_color,
          backgroundColor: restaurant.background_color,
          welcomeMessage: restaurant.welcome_message ?? "",
          defaultLanguage: restaurant.default_language,
          enabledLanguages: restaurant.enabled_languages,
        }}
      />
    </div>
  );
}
