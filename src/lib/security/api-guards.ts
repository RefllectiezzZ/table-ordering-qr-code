import "server-only";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface ApiAuthContext {
  ok: true;
  supabase: SupabaseServerClient;
  userId: string;
  profile: ProfileRow;
  /** Non-null for restaurant guards. */
  restaurantId: string | null;
}

export interface ApiAuthFailure {
  ok: false;
  response: NextResponse;
}

export type ApiAuthResult = ApiAuthContext | ApiAuthFailure;

function unauthorized(): ApiAuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

function forbidden(): ApiAuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}

async function getApiSession(): Promise<ApiAuthResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return unauthorized();

  return {
    ok: true,
    supabase,
    userId: user.id,
    profile: profile as ProfileRow,
    restaurantId: (profile as ProfileRow).restaurant_id,
  };
}

/** API guard: platform_admin only. */
export async function requireApiPlatformAdmin(): Promise<ApiAuthResult> {
  const session = await getApiSession();
  if (!session.ok) return session;
  if (session.profile.role !== "platform_admin") return forbidden();
  return session;
}

/** API guard: restaurant owner or staff. restaurantId is guaranteed non-null. */
export async function requireApiRestaurantMember(): Promise<ApiAuthResult> {
  const session = await getApiSession();
  if (!session.ok) return session;
  const { role, restaurant_id } = session.profile;
  if ((role !== "restaurant_owner" && role !== "restaurant_staff") || !restaurant_id) {
    return forbidden();
  }
  return session;
}

/** API guard: restaurant owner only. restaurantId is guaranteed non-null. */
export async function requireApiRestaurantOwner(): Promise<ApiAuthResult> {
  const session = await getApiSession();
  if (!session.ok) return session;
  if (session.profile.role !== "restaurant_owner" || !session.profile.restaurant_id) {
    return forbidden();
  }
  return session;
}
