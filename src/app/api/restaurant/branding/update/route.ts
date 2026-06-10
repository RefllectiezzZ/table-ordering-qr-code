import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { brandingUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, brandingUpdateSchema);
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

  if (Object.keys(fieldUpdates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("restaurants")
    .update(fieldUpdates)
    .eq("id", auth.restaurantId!);

  if (error) {
    console.error("branding_update_failed", error.code);
    return NextResponse.json({ error: "Could not update branding" }, { status: 500 });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "branding.updated",
    entityType: "restaurant",
    entityId: auth.restaurantId,
    metadata: { fields: Object.keys(fieldUpdates) },
  });

  return NextResponse.json({ ok: true });
}
