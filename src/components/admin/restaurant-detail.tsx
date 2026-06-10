"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { LANGUAGES, type Language, type RestaurantStatus, type UserRole } from "@/types/database";

export interface AdminRestaurantUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
}

interface RestaurantBasics {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  defaultLanguage: Language;
}

export function AdminRestaurantDetail({
  restaurant,
  users,
}: {
  restaurant: RestaurantBasics;
  users: AdminRestaurantUser[];
}) {
  const [name, setName] = useState(restaurant.name);
  const [slug, setSlug] = useState(restaurant.slug);
  const [defaultLanguage, setDefaultLanguage] = useState<Language>(restaurant.defaultLanguage);
  const [savedBasics, setSavedBasics] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userRole, setUserRole] = useState<"restaurant_owner" | "restaurant_staff">(
    "restaurant_owner",
  );
  const [userCreated, setUserCreated] = useState<string | null>(null);

  const basicsAction = useApiAction();
  const statusAction = useApiAction();
  const userAction = useApiAction();

  async function saveBasics(e: React.FormEvent) {
    e.preventDefault();
    setSavedBasics(false);
    const ok = await basicsAction.run(`/api/admin/restaurants/${restaurant.id}/update`, {
      name: name.trim(),
      slug: slug.trim(),
      default_language: defaultLanguage,
    });
    if (ok) setSavedBasics(true);
  }

  async function setStatus(status: RestaurantStatus) {
    await statusAction.run(`/api/admin/restaurants/${restaurant.id}/status`, { status });
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUserCreated(null);
    const ok = await userAction.run("/api/admin/users/create", {
      email: userEmail.trim(),
      password: userPassword,
      full_name: userFullName.trim(),
      role: userRole,
      restaurant_id: restaurant.id,
    });
    if (ok) {
      setUserCreated(userEmail.trim());
      setUserEmail("");
      setUserPassword("");
      setUserFullName("");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveBasics} className="space-y-3">
            <div>
              <Label htmlFor="d-name">Name</Label>
              <Input
                id="d-name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="d-slug">Slug</Label>
              <Input
                id="d-slug"
                required
                maxLength={60}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="d-lang">Default language</Label>
              <Select
                id="d-lang"
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
            <FieldError message={basicsAction.error} />
            {savedBasics ? <p className="text-xs font-medium text-emerald-600">Saved.</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={basicsAction.pending}>
                {basicsAction.pending ? "Saving…" : "Save settings"}
              </Button>
              {restaurant.status !== "active" ? (
                <Button
                  variant="outline"
                  disabled={statusAction.pending}
                  onClick={() => setStatus("active")}
                >
                  Activate
                </Button>
              ) : null}
              {restaurant.status !== "suspended" ? (
                <Button
                  variant="outline"
                  disabled={statusAction.pending}
                  onClick={() => setStatus("suspended")}
                >
                  Suspend
                </Button>
              ) : null}
            </div>
            <FieldError message={statusAction.error} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-slate-400">No users attached to this restaurant yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium text-slate-900">
                      {user.fullName ?? user.email ?? user.id}
                    </span>
                    {user.email ? (
                      <span className="ml-2 text-xs text-slate-400">{user.email}</span>
                    ) : null}
                  </span>
                  <Badge tone={user.role === "restaurant_owner" ? "blue" : "neutral"}>
                    {user.role === "restaurant_owner" ? "owner" : "staff"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={createUser} className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-600">Add user (owner or staff)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="u-email">Email</Label>
                <Input
                  id="u-email"
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="u-password">Initial password</Label>
                <Input
                  id="u-password"
                  type="password"
                  required
                  minLength={8}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="u-name">Full name</Label>
                <Input
                  id="u-name"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="u-role">Role</Label>
                <Select
                  id="u-role"
                  value={userRole}
                  onChange={(e) =>
                    setUserRole(e.target.value as "restaurant_owner" | "restaurant_staff")
                  }
                >
                  <option value="restaurant_owner">Owner</option>
                  <option value="restaurant_staff">Staff</option>
                </Select>
              </div>
            </div>
            <FieldError message={userAction.error} />
            {userCreated ? (
              <p className="text-xs font-medium text-emerald-600">
                User {userCreated} created. Share the initial password through a secure channel.
              </p>
            ) : null}
            <Button type="submit" disabled={userAction.pending}>
              {userAction.pending ? "Creating…" : "Create user"}
            </Button>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Minimal flow for the MVP: the admin sets an initial password and shares it
              out-of-band. Email invitations and password-reset onboarding are documented
              follow-ups.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
