/**
 * URL-persisted status filter for /admin/restaurants. The value travels in
 * the query string (?status=active) and is strictly re-validated server-side
 * before being applied to already admin-scoped data.
 */

export const ADMIN_RESTAURANT_FILTERS = ["all", "active", "suspended", "draft"] as const;
export type AdminRestaurantsFilter = (typeof ADMIN_RESTAURANT_FILTERS)[number];

export const DEFAULT_ADMIN_RESTAURANTS_FILTER: AdminRestaurantsFilter = "all";

/** Unknown/missing values fall back to "all"; arrays use the first entry. */
export function parseAdminRestaurantsFilter(
  value: string | string[] | undefined | null,
): AdminRestaurantsFilter {
  const first = Array.isArray(value) ? value[0] : value;
  return (ADMIN_RESTAURANT_FILTERS as readonly string[]).includes(first ?? "")
    ? (first as AdminRestaurantsFilter)
    : DEFAULT_ADMIN_RESTAURANTS_FILTER;
}
