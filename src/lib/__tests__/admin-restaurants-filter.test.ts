import { describe, expect, it } from "vitest";
import {
  ADMIN_RESTAURANT_FILTERS,
  parseAdminRestaurantsFilter,
} from "@/lib/admin-restaurants-filter";

describe("parseAdminRestaurantsFilter", () => {
  it("accepts every known filter", () => {
    for (const filter of ADMIN_RESTAURANT_FILTERS) {
      expect(parseAdminRestaurantsFilter(filter)).toBe(filter);
    }
  });

  it("falls back to all for unknown/missing values", () => {
    expect(parseAdminRestaurantsFilter(undefined)).toBe("all");
    expect(parseAdminRestaurantsFilter(null)).toBe("all");
    expect(parseAdminRestaurantsFilter("")).toBe("all");
    expect(parseAdminRestaurantsFilter("garbage")).toBe("all");
    expect(parseAdminRestaurantsFilter("ACTIVE")).toBe("all");
  });

  it("uses the first value when the param repeats", () => {
    expect(parseAdminRestaurantsFilter(["suspended", "active"])).toBe("suspended");
    expect(parseAdminRestaurantsFilter(["nope", "active"])).toBe("all");
  });
});
