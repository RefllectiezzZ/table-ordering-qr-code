import "server-only";

import { openingHourFromRow, type OpeningHourDay } from "@/lib/opening-hours";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>;

interface OpeningHoursQueryRow {
  weekday: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
  notes: string | null;
}

/**
 * Loads the configured opening hours for one restaurant, sorted by weekday.
 * Works with the user-scoped client (RLS enforces tenant access) and with the
 * service-role client (callers must pass an already-validated restaurantId).
 */
export async function fetchOpeningHours(
  supabase: ServerClient | ServiceClient,
  restaurantId: string,
): Promise<OpeningHourDay[]> {
  const { data } = await supabase
    .from("restaurant_opening_hours")
    .select("weekday, is_closed, opens_at, closes_at, notes")
    .eq("restaurant_id", restaurantId)
    .order("weekday", { ascending: true });

  return ((data ?? []) as OpeningHoursQueryRow[]).map(openingHourFromRow);
}
