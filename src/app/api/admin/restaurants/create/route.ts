import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { slugify } from "@/lib/utils";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { adminRestaurantCreateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, adminRestaurantCreateSchema);
  if (!parsed.ok) return parsed.response;

  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  if (!slug) {
    return NextResponse.json({ error: "Could not derive a slug from the name" }, { status: 400 });
  }

  const { data: restaurant, error } = await auth.supabase
    .from("restaurants")
    .insert({
      name: parsed.data.name,
      slug,
      status: "draft",
      default_language: parsed.data.default_language,
    })
    .select("id, slug")
    .single<{ id: string; slug: string }>();

  if (error || !restaurant) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    console.error("admin_restaurant_create_failed", error?.code);
    return NextResponse.json({ error: "Could not create the restaurant" }, { status: 500 });
  }

  await logAudit({
    restaurantId: restaurant.id,
    actorUserId: auth.userId,
    action: "restaurant.created",
    entityType: "restaurant",
    entityId: restaurant.id,
    metadata: { slug: restaurant.slug },
  });

  return NextResponse.json({ restaurant: { id: restaurant.id } }, { status: 201 });
}
