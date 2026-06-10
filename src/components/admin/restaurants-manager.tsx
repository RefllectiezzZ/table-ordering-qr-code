"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import {
  ADMIN_RESTAURANT_FILTERS,
  type AdminRestaurantsFilter,
} from "@/lib/admin-restaurants-filter";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import type { AdminStrings } from "@/lib/i18n/app";
import { cn, formatDateTime, slugify } from "@/lib/utils";
import { LANGUAGES, type Language, type RestaurantStatus } from "@/types/database";

export type AdminHoursToday =
  | { kind: "not_configured" }
  | { kind: "closed" }
  | { kind: "open"; opensAt: string; closesAt: string };

export interface AdminRestaurantListItem {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  acceptsOrders: boolean;
  createdAt: string;
  hoursToday: AdminHoursToday;
}

const STATUS_TONE: Record<RestaurantStatus, "green" | "yellow" | "neutral"> = {
  active: "green",
  suspended: "yellow",
  draft: "neutral",
};

export function AdminRestaurantsManager({
  restaurants,
  counts,
  filter,
  t,
}: {
  restaurants: AdminRestaurantListItem[];
  counts: Record<AdminRestaurantsFilter, number>;
  filter: AdminRestaurantsFilter;
  t: AdminStrings;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("pt");
  const { run, pending, error } = useApiAction();

  const statusLabel: Record<RestaurantStatus, string> = {
    active: t.active,
    suspended: t.suspended,
    draft: t.draft,
  };

  const filterLabel: Record<AdminRestaurantsFilter, string> = {
    all: t.filterAll,
    active: t.active,
    suspended: t.suspended,
    draft: t.draft,
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run("/api/admin/restaurants/create", {
      name: name.trim(),
      slug: slug.trim() || undefined,
      default_language: defaultLanguage,
    });
    if (ok) {
      setName("");
      setSlug("");
      setShowCreate(false);
    }
  }

  async function setStatus(id: string, status: RestaurantStatus) {
    await run(`/api/admin/restaurants/${id}/status`, { status });
  }

  function hoursTodayLabel(hours: AdminHoursToday): string {
    switch (hours.kind) {
      case "open":
        return `${t.openToday} ${hours.opensAt}–${hours.closesAt}`;
      case "closed":
        return t.closedToday;
      case "not_configured":
        return t.hoursNotConfigured;
    }
  }

  return (
    <div className="space-y-4">
      {/* Status filter pills: the selection lives in the URL query string so
          refreshes and shared links keep the same view. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.status}>
        {ADMIN_RESTAURANT_FILTERS.map((value) => {
          const active = filter === value;
          return (
            <Link
              key={value}
              href={value === "all" ? "/admin/restaurants" : `/admin/restaurants?status=${value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              {filterLabel[value]}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[value]}
              </span>
            </Link>
          );
        })}
      </div>

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <Label htmlFor="r-name">{t.name}</Label>
                <Input
                  id="r-name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="w-56">
                <Label htmlFor="r-slug">{t.slug}</Label>
                <Input
                  id="r-slug"
                  maxLength={60}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
              <div className="w-40">
                <Label htmlFor="r-lang">Default language</Label>
                <Select
                  id="r-lang"
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as Language)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={pending || !name.trim()}>
                {pending ? "Creating…" : "Create restaurant"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <div className="w-full">
                <FieldError message={error} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreate(true)}>Create restaurant</Button>
      )}

      {restaurants.length === 0 ? (
        <EmptyState title={t.emptyFilterTitle} description={t.emptyFilterDescription} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t.name}</th>
                  <th className="px-4 py-3">{t.slug}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3">{t.orders}</th>
                  <th className="px-4 py-3">{t.hoursToday}</th>
                  <th className="px-4 py-3">{t.created}</th>
                  <th className="px-4 py-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/admin/restaurants/${restaurant.id}`}
                        className="hover:underline"
                      >
                        {restaurant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {restaurant.slug}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[restaurant.status]}>
                        {statusLabel[restaurant.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={restaurant.acceptsOrders ? "green" : "yellow"}>
                        {restaurant.acceptsOrders ? t.acceptingOrders : t.ordersPaused}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {hoursTodayLabel(restaurant.hoursToday)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(restaurant.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {restaurant.status !== "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setStatus(restaurant.id, "active")}
                          >
                            {t.activate}
                          </Button>
                        ) : null}
                        {restaurant.status !== "suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setStatus(restaurant.id, "suspended")}
                          >
                            {t.suspend}
                          </Button>
                        ) : null}
                        <Link href={`/admin/restaurants/${restaurant.id}`}>
                          <Button size="sm" variant="ghost">
                            {t.details}
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
