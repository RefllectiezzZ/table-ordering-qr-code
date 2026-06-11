import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { adminBrandingUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** Platform admin: update branding and public menu template settings for any restaurant. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const { id: restaurantId } = await context.params;

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, adminBrandingUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const d = parsed.data;
  const fieldUpdates: Record<string, unknown> = {};
  if (d.logo_url !== undefined) fieldUpdates.logo_url = d.logo_url;
  if (d.cover_image_url !== undefined) fieldUpdates.cover_image_url = d.cover_image_url;
  if (d.primary_color !== undefined) fieldUpdates.primary_color = d.primary_color;
  if (d.secondary_color !== undefined) fieldUpdates.secondary_color = d.secondary_color;
  if (d.background_color !== undefined) fieldUpdates.background_color = d.background_color;
  if (d.welcome_message !== undefined) fieldUpdates.welcome_message = d.welcome_message;
  if (d.default_language !== undefined) fieldUpdates.default_language = d.default_language;
  if (d.enabled_languages !== undefined) fieldUpdates.enabled_languages = d.enabled_languages;
  if (d.public_menu_template !== undefined) fieldUpdates.public_menu_template = d.public_menu_template;
  if (d.public_menu_density !== undefined) fieldUpdates.public_menu_density = d.public_menu_density;
  if (d.public_menu_card_style !== undefined) {
    fieldUpdates.public_menu_card_style = d.public_menu_card_style;
  }
  if (d.public_menu_hero_style !== undefined) fieldUpdates.public_menu_hero_style = d.public_menu_hero_style;
  if (d.public_menu_background_style !== undefined) {
    fieldUpdates.public_menu_background_style = d.public_menu_background_style;
  }
  if (d.public_menu_cart_style !== undefined) fieldUpdates.public_menu_cart_style = d.public_menu_cart_style;
  if (d.public_menu_show_images !== undefined) {
    fieldUpdates.public_menu_show_images = d.public_menu_show_images;
  }
  if (d.public_menu_background_image_url !== undefined) {
    fieldUpdates.public_menu_background_image_url = d.public_menu_background_image_url;
  }
  if (d.public_menu_background_mode !== undefined) {
    fieldUpdates.public_menu_background_mode = d.public_menu_background_mode;
  }
  if (d.public_menu_background_position !== undefined) {
    fieldUpdates.public_menu_background_position = d.public_menu_background_position;
  }
  if (d.public_menu_background_overlay !== undefined) {
    fieldUpdates.public_menu_background_overlay = d.public_menu_background_overlay;
  }
  if (d.public_menu_background_overlay_opacity !== undefined) {
    fieldUpdates.public_menu_background_overlay_opacity = d.public_menu_background_overlay_opacity;
  }
  if (d.public_menu_surface_style !== undefined) {
    fieldUpdates.public_menu_surface_style = d.public_menu_surface_style;
  }
  if (d.require_order_confirmation !== undefined) {
    fieldUpdates.require_order_confirmation = d.require_order_confirmation;
  }

  if (Object.keys(fieldUpdates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("restaurants")
    .update(fieldUpdates)
    .eq("id", restaurantId);

  if (error) {
    console.error("admin_branding_update_failed", error.code);
    return NextResponse.json({ error: "Could not update branding" }, { status: 500 });
  }

  await logAudit({
    restaurantId,
    actorUserId: auth.userId,
    action: "branding.updated",
    entityType: "restaurant",
    entityId: restaurantId,
    metadata: { fields: Object.keys(fieldUpdates), admin: true },
  });

  return NextResponse.json({ ok: true });
}
