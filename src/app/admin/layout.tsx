import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { requirePlatformAdmin } from "@/lib/security/guards";

// Admin area: always per-request, never statically cached.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  const lang = await getAppLanguage();
  const t = ADMIN_STRINGS[lang];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold text-white">
              TableOrder <span className="font-normal text-slate-400">· {t.platformAdmin}</span>
            </Link>
            <AdminNav
              labels={{
                overview: t.overview,
                restaurants: t.restaurants,
                users: t.users,
                maintenance: t.maintenance,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle current={lang} variant="dark" />
            <form action="/auth/signout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:bg-slate-800"
              >
                {t.signOut}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
