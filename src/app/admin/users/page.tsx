import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users" };

const ROLE_LABEL: Record<ProfileRow["role"], string> = {
  platform_admin: "Platform admin",
  restaurant_owner: "Owner",
  restaurant_staff: "Staff",
};

export default async function AdminUsersPage() {
  await requirePlatformAdmin();
  const t = ADMIN_STRINGS[await getAppLanguage()];
  const supabase = await createServerSupabaseClient();

  const [{ data: profilesData }, { data: restaurantsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, restaurant_id, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("restaurants").select("id, name"),
  ]);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const restaurantNameById = new Map(
    ((restaurantsData ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t.usersTitle}</h1>
        <p className="max-w-2xl text-sm text-slate-500">{t.usersSubtitle}</p>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          title="No profiles yet"
          description="Create your first platform admin via the Supabase dashboard and the SQL snippet in the README."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t.user}</th>
                  <th className="px-4 py-3">{t.role}</th>
                  <th className="px-4 py-3">{t.restaurant}</th>
                  <th className="px-4 py-3">{t.created}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">
                        {profile.full_name ?? profile.email ?? profile.id}
                      </span>
                      {profile.email ? (
                        <span className="ml-2 text-xs text-slate-400">{profile.email}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          profile.role === "platform_admin"
                            ? "purple"
                            : profile.role === "restaurant_owner"
                              ? "blue"
                              : "neutral"
                        }
                      >
                        {ROLE_LABEL[profile.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {profile.restaurant_id ? (
                        <Link
                          href={`/admin/restaurants/${profile.restaurant_id}`}
                          className="text-sky-700 hover:underline"
                        >
                          {restaurantNameById.get(profile.restaurant_id) ?? profile.restaurant_id}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(profile.created_at)}
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
