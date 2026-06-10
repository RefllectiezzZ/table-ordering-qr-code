import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { adminUserCreateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

/**
 * Minimal, safe restaurant-user creation (owner/staff) by a platform admin.
 *
 * Intentionally NOT a full invitation flow (no emails, no magic links) —
 * that is documented as a follow-up. The admin sets an initial password and
 * shares it out-of-band; the user can change it later.
 *
 * The password is only forwarded to Supabase Auth. It is never logged and
 * never stored by the app.
 */
export async function POST(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, adminUserCreateSchema);
  if (!parsed.ok) return parsed.response;

  // Validate the target restaurant with the admin's RLS-scoped client.
  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("id")
    .eq("id", parsed.data.restaurant_id)
    .maybeSingle<{ id: string }>();
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const serviceClient = createServiceRoleSupabaseClient();

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const conflict = createError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: conflict ? "A user with this email already exists" : "Could not create the user" },
      { status: conflict ? 409 : 500 },
    );
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: created.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    restaurant_id: parsed.data.restaurant_id,
  });

  if (profileError) {
    // Roll back the auth user so we never leave an account without a profile.
    await serviceClient.auth.admin.deleteUser(created.user.id);
    console.error("admin_user_profile_failed", profileError.code);
    return NextResponse.json({ error: "Could not create the user profile" }, { status: 500 });
  }

  await logAudit({
    restaurantId: parsed.data.restaurant_id,
    actorUserId: auth.userId,
    action: "user.created",
    entityType: "profile",
    entityId: created.user.id,
    metadata: { role: parsed.data.role },
  });

  return NextResponse.json({ user: { id: created.user.id } }, { status: 201 });
}
