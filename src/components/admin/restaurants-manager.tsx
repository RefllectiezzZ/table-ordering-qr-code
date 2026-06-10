"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { formatDateTime, slugify } from "@/lib/utils";
import { LANGUAGES, type Language, type RestaurantStatus } from "@/types/database";

export interface AdminRestaurantListItem {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  createdAt: string;
}

const STATUS_TONE: Record<RestaurantStatus, "green" | "yellow" | "neutral"> = {
  active: "green",
  suspended: "yellow",
  draft: "neutral",
};

export function AdminRestaurantsManager({
  restaurants,
}: {
  restaurants: AdminRestaurantListItem[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("pt");
  const { run, pending, error } = useApiAction();

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

  return (
    <div className="space-y-4">
      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <Label htmlFor="r-name">Name</Label>
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
                <Label htmlFor="r-slug">Slug</Label>
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
        <EmptyState
          title="No restaurants yet"
          description="Create the first restaurant to get started."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
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
                      <Badge tone={STATUS_TONE[restaurant.status]}>{restaurant.status}</Badge>
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
                            Activate
                          </Button>
                        ) : null}
                        {restaurant.status !== "suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setStatus(restaurant.id, "suspended")}
                          >
                            Suspend
                          </Button>
                        ) : null}
                        <Link href={`/admin/restaurants/${restaurant.id}`}>
                          <Button size="sm" variant="ghost">
                            Details
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
