import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export interface SessionProfile {
  userId: string;
  email: string | null;
  profile: ProfileRow;
}

/**
 * Resolves the current authenticated user AND their application profile.
 * Returns null when there is no valid session or no profile row.
 *
 * Roles always come from the profiles table (server-side), never from
 * client-provided data or user_metadata.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as ProfileRow,
  };
}

/** Page guard: any authenticated user with a profile. */
export async function requireUser(): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  return session;
}

/** Page guard: platform_admin only. */
export async function requirePlatformAdmin(): Promise<SessionProfile> {
  const session = await requireUser();
  if (session.profile.role !== "platform_admin") {
    redirect(session.profile.restaurant_id ? "/restaurant" : "/login");
  }
  return session;
}

/**
 * Page guard: restaurant_owner or restaurant_staff with a restaurant_id.
 * Returns the session; the caller must scope ALL queries by
 * session.profile.restaurant_id.
 */
export async function requireRestaurantUser(): Promise<SessionProfile & { restaurantId: string }> {
  const session = await requireUser();
  const { role, restaurant_id } = session.profile;
  if (role === "platform_admin") redirect("/admin");
  if ((role !== "restaurant_owner" && role !== "restaurant_staff") || !restaurant_id) {
    redirect("/login");
  }
  return { ...session, restaurantId: restaurant_id };
}

/** Page guard: restaurant_owner only. */
export async function requireRestaurantOwner(): Promise<SessionProfile & { restaurantId: string }> {
  const session = await requireRestaurantUser();
  if (session.profile.role !== "restaurant_owner") redirect("/restaurant");
  return session;
}

/** Alias matching the spec naming: staff or owner of a restaurant. */
export const requireRestaurantStaffOrOwner = requireRestaurantUser;
